"""
イベントダミーデータ生成サービス
"""

import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict
from loguru import logger
from app.core.database import AsyncSessionLocal
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class EventDataGenerator:
    """イベントダミーデータ生成クラス"""
    
    def __init__(self):
        self.event_templates = {
            "広島県": [
                {
                    "name": "広島フラワーフェスティバル",
                    "category": "festival",
                    "location": {"lat": 34.3935, "lon": 132.4595},
                    "venue": "平和大通り",
                    "capacity": 150000,
                    "impact_radius": 5000
                },
                {
                    "name": "広島東洋カープ vs 巨人",
                    "category": "sports",
                    "location": {"lat": 34.3916, "lon": 132.4848},
                    "venue": "マツダスタジアム",
                    "capacity": 32000,
                    "impact_radius": 3000
                },
                {
                    "name": "ひろしまドリミネーション",
                    "category": "festival",
                    "location": {"lat": 34.3935, "lon": 132.4595},
                    "venue": "平和大通り周辺",
                    "capacity": 50000,
                    "impact_radius": 4000
                },
                {
                    "name": "広島国際アニメーションフェスティバル",
                    "category": "exhibition",
                    "location": {"lat": 34.3978, "lon": 132.4592},
                    "venue": "アステールプラザ",
                    "capacity": 1200,
                    "impact_radius": 2000
                },
                {
                    "name": "広島みなと夢花火大会",
                    "category": "festival",
                    "location": {"lat": 34.3583, "lon": 132.4558},
                    "venue": "広島港",
                    "capacity": 400000,
                    "impact_radius": 8000
                },
                {
                    "name": "広島護国神社 初詣",
                    "category": "festival",
                    "location": {"lat": 34.4028, "lon": 132.4597},
                    "venue": "広島護国神社",
                    "capacity": 60000,
                    "impact_radius": 2500
                },
                {
                    "name": "ピースコンサート",
                    "category": "concert",
                    "location": {"lat": 34.3927, "lon": 132.4531},
                    "venue": "広島文化学園HBGホール",
                    "capacity": 2000,
                    "impact_radius": 1500
                },
                {
                    "name": "とうかさん大祭",
                    "category": "festival",
                    "location": {"lat": 34.3953, "lon": 132.4579},
                    "venue": "圓隆寺",
                    "capacity": 450000,
                    "impact_radius": 3000
                },
                {
                    "name": "広島オクトーバーフェスト",
                    "category": "market",
                    "location": {"lat": 34.3945, "lon": 132.4575},
                    "venue": "旧広島市民球場跡地",
                    "capacity": 20000,
                    "impact_radius": 2000
                },
                {
                    "name": "広島ファーマーズマーケット",
                    "category": "market",
                    "location": {"lat": 34.3952, "lon": 132.4598},
                    "venue": "中央公園",
                    "capacity": 5000,
                    "impact_radius": 1000
                }
            ],
            "山口県": [
                {
                    "name": "山口七夕ちょうちんまつり",
                    "category": "festival",
                    "location": {"lat": 34.1784, "lon": 131.4739},
                    "venue": "山口市中心商店街",
                    "capacity": 100000,
                    "impact_radius": 3000
                },
                {
                    "name": "錦帯橋まつり",
                    "category": "festival",
                    "location": {"lat": 34.1667, "lon": 132.1800},
                    "venue": "錦帯橋",
                    "capacity": 50000,
                    "impact_radius": 2500
                }
            ],
            "福岡県": [
                {
                    "name": "博多どんたく港まつり",
                    "category": "festival",
                    "location": {"lat": 33.5904, "lon": 130.4017},
                    "venue": "博多区一帯",
                    "capacity": 2000000,
                    "impact_radius": 10000
                },
                {
                    "name": "福岡ソフトバンクホークス vs 日本ハム",
                    "category": "sports",
                    "location": {"lat": 33.5955, "lon": 130.3620},
                    "venue": "PayPayドーム",
                    "capacity": 40000,
                    "impact_radius": 3500
                }
            ],
            "大阪府": [
                {
                    "name": "天神祭",
                    "category": "festival",
                    "location": {"lat": 34.6937, "lon": 135.5023},
                    "venue": "大阪天満宮",
                    "capacity": 1300000,
                    "impact_radius": 8000
                },
                {
                    "name": "大阪マラソン",
                    "category": "sports",
                    "location": {"lat": 34.6863, "lon": 135.5202},
                    "venue": "大阪城公園",
                    "capacity": 35000,
                    "impact_radius": 15000
                }
            ],
            "東京都": [
                {
                    "name": "隅田川花火大会",
                    "category": "festival",
                    "location": {"lat": 35.7101, "lon": 139.8107},
                    "venue": "隅田川",
                    "capacity": 950000,
                    "impact_radius": 5000
                },
                {
                    "name": "コミックマーケット",
                    "category": "exhibition",
                    "location": {"lat": 35.6298, "lon": 139.7967},
                    "venue": "東京ビッグサイト",
                    "capacity": 200000,
                    "impact_radius": 4000
                }
            ]
        }
    
    async def generate_event_data(self, days: int = 30):
        """イベントデータを生成"""
        logger.info(f"Generating event data for {days} days")
        
        async with AsyncSessionLocal() as db:
            # 既存のイベントデータをクリア
            await db.execute(text("DELETE FROM event_data"))
            await db.commit()
            
            events = []
            for prefecture, templates in self.event_templates.items():
                for i in range(days):
                    # 各日に1-3個のイベントを生成
                    num_events = random.randint(1, 3)
                    for _ in range(num_events):
                        template = random.choice(templates)
                        event_date = datetime.now() - timedelta(days=days-i-1)
                        
                        # ランダムな変動を加える
                        lat_offset = random.uniform(-0.001, 0.001)
                        lon_offset = random.uniform(-0.001, 0.001)
                        
                        start_time = event_date.replace(hour=random.randint(9, 18), minute=0)
                        duration_days = random.randint(0, 3)
                        end_time = start_time + timedelta(days=duration_days, hours=random.randint(2, 8))
                        
                        event = {
                            "id": str(uuid.uuid4()),
                            "event_name": template["name"],
                            "event_type": template["category"],
                            "location": f"POINT({template['location']['lon'] + lon_offset} {template['location']['lat'] + lat_offset})",
                            "venue_name": template["venue"],
                            "start_datetime": start_time,
                            "end_datetime": end_time,
                            "expected_attendance": int(template["capacity"] * random.uniform(0.6, 1.0)),
                            "influence_radius": template["impact_radius"],
                            "capacity": template["capacity"],
                            "organizer": f"{prefecture}実行委員会",
                            "created_at": datetime.now()
                        }
                        events.append(event)
            
            # バッチインサート
            if events:
                insert_query = text("""
                    INSERT INTO event_data 
                    (id, event_name, event_type, location, venue_name, start_datetime, 
                     end_datetime, expected_attendance, influence_radius, capacity, organizer, created_at)
                    VALUES 
                    (:id, :event_name, :event_type, ST_GeomFromText(:location, 4326), :venue_name,
                     :start_datetime, :end_datetime, :expected_attendance, :influence_radius, :capacity, :organizer, :created_at)
                """)
                
                for event in events:
                    await db.execute(insert_query, event)
                
                await db.commit()
                logger.info(f"✅ Generated {len(events)} events for {days} days")
                
                return len(events)


# インスタンスを作成
event_generator = EventDataGenerator()