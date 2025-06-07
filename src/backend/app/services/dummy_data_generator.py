import json
"""
ダミーデータ生成サービス
Phase 1用のリアルなダミーデータを生成
"""

import random
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict
from loguru import logger
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class DummyDataGenerator:
    """ダミーデータ生成クラス"""
    
    def __init__(self):
        self.landmarks = settings.LANDMARKS
        self.categories = {
            "観光": {
                "weight": 0.35,
                "subcategories": ["史跡", "神社仏閣", "公園", "博物館", "展望台"],
                "sentiment_base": 0.7,
                "intensity_base": 0.8
            },
            "グルメ": {
                "weight": 0.25,
                "subcategories": ["広島焼き", "お好み焼き", "カフェ", "居酒屋", "寿司"],
                "sentiment_base": 0.6,
                "intensity_base": 0.7
            },
            "イベント": {
                "weight": 0.15,
                "subcategories": ["フェスティバル", "コンサート", "スポーツ", "展示会"],
                "sentiment_base": 0.8,
                "intensity_base": 0.9
            },
            "ショッピング": {
                "weight": 0.15,
                "subcategories": ["お土産", "ファッション", "雑貨", "百貨店"],
                "sentiment_base": 0.5,
                "intensity_base": 0.6
            },
            "交通": {
                "weight": 0.1,
                "subcategories": ["駅", "バス停", "フェリー", "タクシー"],
                "sentiment_base": 0.2,
                "intensity_base": 0.4
            }
        }
        
        # サンプルテキスト
        self.text_templates = {
            "観光": [
                "{landmark}に来ました！景色が素晴らしいです",
                "{landmark}は本当に感動的。また来たいな",
                "初めての{landmark}、期待以上でした",
                "{landmark}の歴史を感じられて良かった",
                "{landmark}で写真をたくさん撮りました"
            ],
            "グルメ": [
                "{landmark}近くの{subcategory}が最高に美味しい！",
                "{subcategory}を食べに{landmark}エリアへ",
                "{landmark}周辺で{subcategory}を堪能",
                "今日は{landmark}で{subcategory}三昧",
                "{landmark}の{subcategory}は本当におすすめ"
            ],
            "イベント": [
                "{landmark}での{subcategory}楽しかった！",
                "今日の{landmark}は{subcategory}で大盛り上がり",
                "{landmark}の{subcategory}最高でした",
                "{subcategory}で{landmark}が賑わってる",
                "{landmark}{subcategory}に参加してきました"
            ],
            "ショッピング": [
                "{landmark}で{subcategory}をたくさん買った",
                "{landmark}の{subcategory}巡り楽しい",
                "{landmark}で素敵な{subcategory}を発見",
                "{subcategory}探しに{landmark}へ",
                "{landmark}で{subcategory}選びに夢中"
            ],
            "交通": [
                "{landmark}に到着、{subcategory}便利でした",
                "{subcategory}で{landmark}へ向かう",
                "{landmark}の{subcategory}は分かりやすい",
                "{subcategory}から{landmark}まで快適",
                "{landmark}アクセス良好、{subcategory}おすすめ"
            ]
        }
    
    async def generate_initial_data(self, days_back: int = 7, points_per_day: int = 200):
        """初期ダミーデータの生成"""
        
        logger.info(f"Starting dummy data generation: {days_back} days, {points_per_day} points/day")
        
        total_points = 0
        
        for day_offset in range(days_back):
            base_date = datetime.now() - timedelta(days=day_offset)
            
            # 1日分のポイント生成
            daily_points = await self._generate_daily_points(base_date, points_per_day)
            
            # バッチでデータベースに保存
            saved_count = await self._save_points_batch(daily_points)
            total_points += saved_count
            
            logger.info(f"Day -{day_offset}: Generated {saved_count} points")
        
        # ランドマークデータの生成
        await self._generate_landmark_data()
        
        logger.info(f"✅ Dummy data generation completed: {total_points} total points")
        return total_points
    
    async def _generate_daily_points(self, base_date: datetime, target_count: int) -> List[Dict]:
        """1日分のポイントデータを生成"""
        
        points = []
        
        for _ in range(target_count):
            # ランダムなランドマークを選択
            landmark_name = random.choice(list(self.landmarks.keys()))
            landmark_info = self.landmarks[landmark_name]
            
            # カテゴリをウェイトに基づいて選択
            category = self._select_weighted_category()
            category_info = self.categories[category]
            subcategory = random.choice(category_info["subcategories"])
            
            # 位置情報（ランドマーク周辺にランダム分布）
            lat_offset = random.gauss(0, 0.005)  # 約500m標準偏差
            lon_offset = random.gauss(0, 0.005)
            lat = landmark_info["lat"] + lat_offset
            lon = landmark_info["lon"] + lon_offset
            
            # 時間情報（1日内でランダム分布、時間帯による重み付き）
            hour_weights = self._get_hourly_weights(category)
            hour = self._select_weighted_hour(hour_weights)
            minute = random.randint(0, 59)
            
            timestamp = base_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            # 感情スコア生成
            sentiment_base = category_info["sentiment_base"]
            sentiment_score = max(-1.0, min(1.0, 
                sentiment_base + random.gauss(0, 0.3)
            ))
            
            # 強度計算（時間帯・カテゴリ・天候による補正）
            intensity = self._calculate_intensity(category_info, hour, landmark_name)
            
            # テキスト生成
            text_content = self._generate_text(category, subcategory, landmark_name)
            
            # ユーザータイプ
            user_type = random.choices(
                ["tourist", "local", "business"],
                weights=[0.6, 0.3, 0.1]
            )[0]
            
            point = {
                "timestamp": timestamp,
                "latitude": lat,
                "longitude": lon,
                "data_source": "dummy_sns",
                "category": category,
                "subcategory": subcategory,
                "sentiment_score": sentiment_score,
                "intensity": intensity,
                "text_content": text_content,
                "user_type": user_type,
                "metadata_json": json.dumps({
                    "landmark": landmark_name,
                    "generated_at": datetime.now().isoformat(),
                    "weather_factor": random.uniform(0.8, 1.2),
                    "event_factor": random.uniform(0.9, 1.1)
                })
            }
            
            points.append(point)
        
        return points
    
    def _select_weighted_category(self) -> str:
        """ウェイトに基づいてカテゴリを選択"""
        categories = list(self.categories.keys())
        weights = [self.categories[cat]["weight"] for cat in categories]
        return random.choices(categories, weights=weights)[0]
    
    def _get_hourly_weights(self, category: str) -> List[float]:
        """カテゴリ別の時間帯重み"""
        if category == "観光":
            # 10-17時がピーク
            weights = [0.1] * 24
            for h in range(10, 18):
                weights[h] = 1.0
            for h in range(8, 10):
                weights[h] = 0.5
            for h in range(18, 21):
                weights[h] = 0.7
        elif category == "グルメ":
            # 12-14時、18-21時がピーク
            weights = [0.1] * 24
            for h in range(12, 15):
                weights[h] = 1.0
            for h in range(18, 22):
                weights[h] = 1.2
            for h in range(15, 18):
                weights[h] = 0.3
        elif category == "イベント":
            # 19-22時がピーク
            weights = [0.1] * 24
            for h in range(19, 23):
                weights[h] = 1.0
            for h in range(14, 19):
                weights[h] = 0.6
        else:
            # その他は比較的均等
            weights = [0.5] * 24
            for h in range(9, 21):
                weights[h] = 1.0
        
        return weights
    
    def _select_weighted_hour(self, weights: List[float]) -> int:
        """重み付き時間選択"""
        return random.choices(range(24), weights=weights)[0]
    
    def _calculate_intensity(self, category_info: Dict, hour: int, landmark: str) -> float:
        """強度計算"""
        base_intensity = category_info["intensity_base"]
        
        # 時間帯補正
        if 10 <= hour <= 17:
            time_factor = 1.2
        elif 7 <= hour <= 9 or 18 <= hour <= 22:
            time_factor = 1.0
        else:
            time_factor = 0.3
        
        # ランドマーク補正
        landmark_factors = {
            "宮島": 1.3,
            "原爆ドーム": 1.2,
            "広島駅": 1.0,
            "マツダスタジアム": 1.1,
            "本通り商店街": 0.9
        }
        landmark_factor = landmark_factors.get(landmark, 1.0)
        
        # ランダム変動
        random_factor = random.uniform(0.7, 1.3)
        
        intensity = base_intensity * time_factor * landmark_factor * random_factor
        return max(0.1, min(2.0, intensity))
    
    def _generate_text(self, category: str, subcategory: str, landmark: str) -> str:
        """テキスト生成"""
        templates = self.text_templates.get(category, ["{landmark}にいます"])
        template = random.choice(templates)
        
        return template.format(
            landmark=landmark,
            subcategory=subcategory
        )
    
    async def _save_points_batch(self, points: List[Dict]) -> int:
        """ポイントデータをバッチで保存"""
        
        if not points:
            return 0
        
        query = text("""
        INSERT INTO heatmap_points (
            id, timestamp, location, data_source, category, subcategory,
            sentiment_score, intensity, text_content, user_type, metadata_json
        ) VALUES (
            gen_random_uuid(), :timestamp, ST_Point(:longitude, :latitude, 4326), :data_source,
            :category, :subcategory, :sentiment_score, :intensity,
            :text_content, :user_type, :metadata_json
        )
        """)
        
        try:
            # バッチでINSERT実行
            async with AsyncSessionLocal() as session:
                # execute_manyはSQLAlchemy 2.0では使用できないため、個別に実行
                for point in points:
                    await session.execute(query, point)
                await session.commit()
            return len(points)
            
        except Exception as e:
            logger.error(f"Failed to save points batch: {str(e)}")
            return 0
    
    async def _generate_landmark_data(self):
        """ランドマークデータの生成"""
        
        landmark_types = {
            "原爆ドーム": "historic_monument",
            "宮島": "tourist_attraction", 
            "広島駅": "transportation_hub",
            "マツダスタジアム": "sports_venue",
            "本通り商店街": "shopping_district"
        }
        
        query = text("""
        INSERT INTO landmark_data (
            id, name, landmark_type, location, description, is_benchmark, popularity_score
        ) VALUES (
            gen_random_uuid(), :name, :landmark_type, ST_Point(:longitude, :latitude, 4326),
            :description, :is_benchmark, :popularity_score
        ) ON CONFLICT DO NOTHING
        """)
        
        landmarks = []
        for name, coords in self.landmarks.items():
            landmark_data = {
                "name": name,
                "landmark_type": landmark_types.get(name, "tourist_attraction"),
                "longitude": coords["lon"],
                "latitude": coords["lat"],
                "description": f"広島県の主要観光地・施設: {name}",
                "is_benchmark": True,
                "popularity_score": random.uniform(0.7, 1.0)
            }
            landmarks.append(landmark_data)
        
        try:
            async with AsyncSessionLocal() as session:
                # 個別に実行
                for landmark in landmarks:
                    await session.execute(query, landmark)
                await session.commit()
            logger.info(f"✅ Landmark data saved: {len(landmarks)} landmarks")
        except Exception as e:
            logger.error(f"Failed to save landmark data: {str(e)}")
    
    async def generate_mobility_data(self, days_back: int = 7, flows_per_day: int = 500):
        """人流ダミーデータ生成"""
        flow_types = ["通勤", "観光", "買い物", "レジャー", "ビジネス"]
        transport_modes = ["徒歩", "自転車", "車", "バス", "電車", "タクシー"]
        age_groups = ["10-19", "20-29", "30-39", "40-49", "50-59", "60+"]
        
        areas = list(self.landmarks.keys())
        
        # 時間帯別の人流パターン
        hourly_patterns = {
            "通勤": [0.1, 0.1, 0.1, 0.2, 0.3, 0.8, 1.0, 0.9, 0.5, 0.3, 0.2, 0.2, 0.3, 0.3, 0.4, 0.6, 0.8, 1.0, 0.7, 0.4, 0.3, 0.2, 0.1, 0.1],
            "観光": [0.1, 0.1, 0.1, 0.1, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9, 1.0, 1.0, 0.9, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.1, 0.1],
            "買い物": [0.1, 0.1, 0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.7, 0.9, 1.0, 0.9, 0.8, 0.9, 1.0, 0.9, 0.8, 0.7, 0.5, 0.3, 0.2, 0.1, 0.1]
        }
        
        query = text("""
        INSERT INTO mobility_flows (
            id, timestamp, origin_location, destination_location,
            origin_area, destination_area, flow_count, flow_type,
            transport_mode, age_group, gender_ratio, tourist_ratio,
            hour_of_day, day_of_week, is_holiday, data_source,
            confidence, metadata_json
        ) VALUES (
            gen_random_uuid(), :timestamp,
            ST_Point(:origin_lon, :origin_lat, 4326),
            ST_Point(:dest_lon, :dest_lat, 4326),
            :origin_area, :destination_area, :flow_count, :flow_type,
            :transport_mode, :age_group, :gender_ratio, :tourist_ratio,
            :hour_of_day, :day_of_week, :is_holiday, :data_source,
            :confidence, :metadata_json
        )
        """)
        
        try:
            async with AsyncSessionLocal() as session:
                for day in range(days_back):
                    date = datetime.utcnow() - timedelta(days=day)
                    is_holiday = date.weekday() >= 5
                    
                    for _ in range(flows_per_day):
                        hour = random.randint(0, 23)
                        flow_type = random.choice(flow_types)
                        pattern = hourly_patterns.get(flow_type, hourly_patterns["観光"])
                        
                        # 起点と終点を選択
                        origin_area = random.choice(areas)
                        destination_area = random.choice([a for a in areas if a != origin_area])
                        
                        origin_coords = self.landmarks[origin_area]
                        dest_coords = self.landmarks[destination_area]
                        
                        # ランダムにオフセット
                        origin_lon = origin_coords["lon"] + random.uniform(-0.01, 0.01)
                        origin_lat = origin_coords["lat"] + random.uniform(-0.01, 0.01)
                        dest_lon = dest_coords["lon"] + random.uniform(-0.01, 0.01)
                        dest_lat = dest_coords["lat"] + random.uniform(-0.01, 0.01)
                        
                        flow_count = int(random.uniform(10, 500) * pattern[hour])
                        
                        flow_data = {
                            "timestamp": date.replace(hour=hour, minute=random.randint(0, 59)),
                            "origin_lon": origin_lon,
                            "origin_lat": origin_lat,
                            "dest_lon": dest_lon,
                            "dest_lat": dest_lat,
                            "origin_area": origin_area,
                            "destination_area": destination_area,
                            "flow_count": flow_count,
                            "flow_type": flow_type,
                            "transport_mode": random.choice(transport_modes),
                            "age_group": random.choice(age_groups),
                            "gender_ratio": random.uniform(0.3, 0.7),
                            "tourist_ratio": random.uniform(0.2, 0.8) if flow_type == "観光" else random.uniform(0, 0.3),
                            "hour_of_day": hour,
                            "day_of_week": date.weekday(),
                            "is_holiday": 1 if is_holiday else 0,
                            "data_source": "dummy_mobility",
                            "confidence": random.uniform(0.7, 1.0),
                            "metadata_json": json.dumps({
                                "generated_at": datetime.utcnow().isoformat()
                            })
                        }
                        
                        await session.execute(query, flow_data)
                
                await session.commit()
                logger.info(f"✅ Mobility data generated: {days_back * flows_per_day} flows")
        except Exception as e:
            logger.error(f"Failed to generate mobility data: {str(e)}")
    
    async def generate_accommodation_data(self, days_back: int = 7):
        """宿泊ダミーデータ生成"""
        facility_types = ["ホテル", "旅館", "ビジネスホテル", "民泊", "ゲストハウス"]
        
        # 各エリアの宿泊施設
        facilities = []
        for area, coords in self.landmarks.items():
            # エリアごとに3-5施設
            for i in range(random.randint(3, 5)):
                facilities.append({
                    "id": f"{area}_{i}",
                    "name": f"{area}エリア {random.choice(facility_types)}{i+1}",
                    "type": random.choice(facility_types),
                    "area": area,
                    "lon": coords["lon"] + random.uniform(-0.005, 0.005),
                    "lat": coords["lat"] + random.uniform(-0.005, 0.005),
                    "total_rooms": random.randint(20, 200)
                })
        
        query = text("""
        INSERT INTO accommodation_data (
            id, date, facility_id, facility_name, facility_type,
            location, area, total_rooms, occupied_rooms,
            occupancy_rate, total_guests, domestic_guests,
            foreign_guests, average_stay_days, average_price,
            price_index, data_source, metadata_json
        ) VALUES (
            gen_random_uuid(), :date, :facility_id, :facility_name,
            :facility_type, ST_Point(:lon, :lat, 4326), :area,
            :total_rooms, :occupied_rooms, :occupancy_rate,
            :total_guests, :domestic_guests, :foreign_guests,
            :average_stay_days, :average_price, :price_index,
            :data_source, :metadata_json
        )
        """)
        
        try:
            async with AsyncSessionLocal() as session:
                for day in range(days_back):
                    date = datetime.utcnow() - timedelta(days=day)
                    is_weekend = date.weekday() >= 5
                    
                    for facility in facilities:
                        # 週末は稼働率が高い
                        base_occupancy = 0.8 if is_weekend else 0.6
                        occupancy_rate = min(0.95, base_occupancy + random.uniform(-0.2, 0.2))
                        
                        occupied_rooms = int(facility["total_rooms"] * occupancy_rate)
                        total_guests = int(occupied_rooms * random.uniform(1.5, 2.5))
                        foreign_ratio = random.uniform(0.1, 0.4) if facility["area"] in ["原爆ドーム", "宮島"] else random.uniform(0.05, 0.2)
                        
                        acc_data = {
                            "date": date,
                            "facility_id": facility["id"],
                            "facility_name": facility["name"],
                            "facility_type": facility["type"],
                            "lon": facility["lon"],
                            "lat": facility["lat"],
                            "area": facility["area"],
                            "total_rooms": facility["total_rooms"],
                            "occupied_rooms": occupied_rooms,
                            "occupancy_rate": occupancy_rate,
                            "total_guests": total_guests,
                            "domestic_guests": int(total_guests * (1 - foreign_ratio)),
                            "foreign_guests": int(total_guests * foreign_ratio),
                            "average_stay_days": random.uniform(1.5, 3.5),
                            "average_price": random.uniform(8000, 25000),
                            "price_index": random.uniform(0.9, 1.2),
                            "data_source": "dummy_accommodation",
                            "metadata_json": json.dumps({
                                "generated_at": datetime.utcnow().isoformat()
                            })
                        }
                        
                        await session.execute(query, acc_data)
                
                await session.commit()
                logger.info(f"✅ Accommodation data generated: {len(facilities) * days_back} records")
        except Exception as e:
            logger.error(f"Failed to generate accommodation data: {str(e)}")
    
    async def generate_consumption_data(self, days_back: int = 7, stores_per_area: int = 20):
        """消費ダミーデータ生成"""
        store_categories = ["飲食", "物販", "サービス", "観光施設", "交通", "宿泊"]
        
        # 各エリアの店舗
        stores = []
        for area, coords in self.landmarks.items():
            for i in range(stores_per_area):
                category = random.choice(store_categories)
                stores.append({
                    "id": f"{area}_store_{i}",
                    "name": f"{area} {category}店舗{i+1}",
                    "category": category,
                    "area": area,
                    "lon": coords["lon"] + random.uniform(-0.01, 0.01),
                    "lat": coords["lat"] + random.uniform(-0.01, 0.01)
                })
        
        query = text("""
        INSERT INTO consumption_data (
            id, timestamp, store_id, store_name, store_category,
            location, area, transaction_count, total_amount,
            average_amount, tourist_ratio, age_distribution,
            payment_methods, category_breakdown, top_items,
            data_source, metadata_json
        ) VALUES (
            gen_random_uuid(), :timestamp, :store_id, :store_name,
            :store_category, ST_Point(:lon, :lat, 4326), :area,
            :transaction_count, :total_amount, :average_amount,
            :tourist_ratio, :age_distribution, :payment_methods,
            :category_breakdown, :top_items, :data_source, :metadata_json
        )
        """)
        
        try:
            async with AsyncSessionLocal() as session:
                for day in range(days_back):
                    date = datetime.utcnow() - timedelta(days=day)
                    
                    for hour in range(9, 22):  # 営業時間9:00-22:00
                        timestamp = date.replace(hour=hour, minute=0)
                        
                        for store in stores:
                            # 時間帯による変動
                            peak_hours = [12, 13, 18, 19, 20]
                            multiplier = 1.5 if hour in peak_hours else 1.0
                            
                            transaction_count = int(random.uniform(10, 100) * multiplier)
                            average_amount = random.uniform(1000, 5000)
                            
                            cons_data = {
                                "timestamp": timestamp,
                                "store_id": store["id"],
                                "store_name": store["name"],
                                "store_category": store["category"],
                                "lon": store["lon"],
                                "lat": store["lat"],
                                "area": store["area"],
                                "transaction_count": transaction_count,
                                "total_amount": transaction_count * average_amount,
                                "average_amount": average_amount,
                                "tourist_ratio": random.uniform(0.3, 0.7) if store["area"] in ["原爆ドーム", "宮島"] else random.uniform(0.1, 0.3),
                                "age_distribution": json.dumps({
                                    "20-29": 0.2,
                                    "30-39": 0.25,
                                    "40-49": 0.25,
                                    "50-59": 0.2,
                                    "60+": 0.1
                                }),
                                "payment_methods": json.dumps({
                                    "cash": 0.3,
                                    "credit": 0.4,
                                    "qr": 0.3
                                }),
                                "category_breakdown": json.dumps({}),
                                "top_items": json.dumps([]),
                                "data_source": "dummy_consumption",
                                "metadata_json": json.dumps({
                                    "generated_at": datetime.utcnow().isoformat()
                                })
                            }
                            
                            await session.execute(query, cons_data)
                
                await session.commit()
                logger.info(f"✅ Consumption data generated: {len(stores) * days_back * 13} records")
        except Exception as e:
            logger.error(f"Failed to generate consumption data: {str(e)}")


# グローバルインスタンス
dummy_generator = DummyDataGenerator()

async def generate_initial_data():
    """初期データ生成のエントリーポイント"""
    if settings.USE_DUMMY_DATA:
        # 既存のヒートマップデータ生成
        await dummy_generator.generate_initial_data(
            days_back=7,
            points_per_day=settings.DUMMY_DATA_POINTS // 7
        )
        
        # 新しいデータ生成
        await dummy_generator.generate_mobility_data(days_back=7, flows_per_day=500)
        await dummy_generator.generate_accommodation_data(days_back=7)
        await dummy_generator.generate_consumption_data(days_back=7, stores_per_area=20)