#!/usr/bin/env python3
"""
APIキー不要のオープンデータ収集スクリプト
認証なしで取得可能なデータから開始
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src', 'backend', 'app'))

import asyncio
import logging
from datetime import datetime
from pathlib import Path
import json
import requests
from typing import Dict, List

# ロギング設定
log_dir = Path("uesugi-engine-data/logs")
log_dir.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_dir / f'collection_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class FreeOpenDataCollector:
    """APIキー不要のオープンデータ収集"""
    
    def __init__(self):
        self.data_dir = Path("uesugi-engine-data")
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Uesugi-Engine/1.0 (https://github.com/yukihara9294/uesugi-engine)'
        })
        
    def collect_all(self) -> Dict:
        """全ての無料データを収集"""
        results = {
            "timestamp": datetime.now().isoformat(),
            "weather": self.collect_weather_data(),
            "earthquakes": self.collect_earthquake_data(),
            "prefectures": self.collect_prefecture_data(),
            "gtfs": self.collect_gtfs_data(),
            "statistics": self.collect_basic_statistics(),
            "environmental": self.collect_environmental_data(),
            "municipal": self.collect_municipal_opendata(),
            "event_calendars": self.collect_event_calendars(),
            "air_quality": self.collect_air_quality_data(),
            "tourism": self.collect_tourism_data(),
            "government": self.collect_government_opendata()
        }
        
        # 結果を保存
        self._save_results(results)
        return results
        
    def collect_weather_data(self) -> Dict:
        """気象データ収集（Open-Meteo）"""
        logger.info("=== 気象データ収集開始 ===")
        weather_data = {}
        
        # 主要都市の座標
        cities = {
            "広島市": {"lat": 34.3853, "lng": 132.4553},
            "山口市": {"lat": 34.1859, "lng": 131.4705},
            "福岡市": {"lat": 33.5904, "lng": 130.4017},
            "大阪市": {"lat": 34.6937, "lng": 135.5023},
            "東京都": {"lat": 35.6762, "lng": 139.6503}
        }
        
        for city_name, coords in cities.items():
            try:
                url = "https://api.open-meteo.com/v1/forecast"
                params = {
                    "latitude": coords["lat"],
                    "longitude": coords["lng"],
                    "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
                    "hourly": "temperature_2m,precipitation_probability,weather_code",
                    "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
                    "timezone": "Asia/Tokyo",
                    "forecast_days": 7
                }
                
                response = self.session.get(url, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                weather_data[city_name] = {
                    "status": "success",
                    "current": data.get("current", {}),
                    "daily_forecast": data.get("daily", {})
                }
                logger.info(f"✓ {city_name}の気象データ取得成功")
                
            except Exception as e:
                logger.error(f"✗ {city_name}の気象データ取得失敗: {e}")
                weather_data[city_name] = {"status": "error", "error": str(e)}
                
        return weather_data
        
    def collect_earthquake_data(self) -> List[Dict]:
        """地震データ収集（気象庁）"""
        logger.info("=== 地震データ収集開始 ===")
        
        try:
            url = "https://www.jma.go.jp/bosai/quake/data/list.json"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            earthquakes = response.json()
            
            # 最新100件を保存
            recent_quakes = earthquakes[:100] if len(earthquakes) > 100 else earthquakes
            
            logger.info(f"✓ 地震データ {len(recent_quakes)}件取得成功")
            return recent_quakes
            
        except Exception as e:
            logger.error(f"✗ 地震データ取得失敗: {e}")
            return []
            
    def collect_prefecture_data(self) -> Dict:
        """都府県オープンデータポータルから収集"""
        logger.info("=== 都府県オープンデータ収集開始 ===")
        prefecture_data = {}
        
        # 各都府県のオープンデータカタログ（CSVファイルのダイレクトリンク）
        open_data_urls = {
            "東京都": {
                "portal_info": {
                    "url": "https://portal.data.metro.tokyo.lg.jp/",
                    "description": "東京都オープンデータカタログサイト"
                },
                "data_catalog": {
                    "url": "https://catalog.data.metro.tokyo.lg.jp/dataset",
                    "description": "東京都データカタログ"
                }
            },
            "大阪府": {
                "portal_info": {
                    "url": "https://www.city.osaka.lg.jp/contents/wdu290/opendata/",
                    "description": "大阪市オープンデータポータルサイト"
                },
                "pref_portal": {
                    "url": "https://www.pref.osaka.lg.jp/it-suishin/smart/opendata.html",
                    "description": "大阪府オープンデータ"
                }
            },
            "広島県": {
                "portal_info": {
                    "url": "https://www.pref.hiroshima.lg.jp/soshiki/266/opendata.html",
                    "description": "広島県オープンデータライブラリ"
                },
                "city_portal": {
                    "url": "https://www.city.hiroshima.lg.jp/site/opendata/",
                    "description": "広島市オープンデータ"
                }
            },
            "山口県": {
                "portal_info": {
                    "url": "https://yamaguchi-opendata.jp/",
                    "description": "山口県オープンデータカタログサイト"
                },
                "tourism": {
                    "url": "https://yamaguchi-opendata.jp/ckan/dataset/350001-tourism",
                    "description": "観光関連データ"
                },
                "facilities": {
                    "url": "https://yamaguchi-opendata.jp/ckan/dataset/public-facilities",
                    "description": "公共施設データ"
                }
            },
            "福岡県": {
                "portal_info": {
                    "url": "https://www.open-governmentdata.org/fukuoka-city/",
                    "description": "福岡市オープンデータ"
                },
                "facilities": {
                    "url": "https://www.open-governmentdata.org/fukuoka-city/dataset/facility-info",
                    "description": "施設情報"
                },
                "evacuation": {
                    "url": "https://www.open-governmentdata.org/fukuoka-city/dataset/evacuation-center",
                    "description": "避難所情報"
                }
            }
        }
        
        for prefecture, datasets in open_data_urls.items():
            prefecture_data[prefecture] = {}
            
            for dataset_name, dataset_info in datasets.items():
                if isinstance(dataset_info, dict):
                    url = dataset_info.get("url", "")
                    description = dataset_info.get("description", dataset_name)
                else:
                    url = dataset_info
                    description = dataset_name
                    
                try:
                    # ヘッダーのみ取得してファイルサイズを確認
                    head_response = self.session.head(url, timeout=5)
                    file_size = int(head_response.headers.get('content-length', 0))
                    
                    # 10MB以下なら取得
                    if file_size < 10 * 1024 * 1024:
                        response = self.session.get(url, timeout=30)
                        response.raise_for_status()
                        
                        # ファイル保存
                        filename = f"{prefecture}_{dataset_name}_{datetime.now().strftime('%Y%m%d')}.csv"
                        filepath = self.data_dir / "raw" / "prefectures" / filename
                        filepath.parent.mkdir(parents=True, exist_ok=True)
                        
                        with open(filepath, 'wb') as f:
                            f.write(response.content)
                            
                        prefecture_data[prefecture][dataset_name] = {
                            "status": "success",
                            "description": description,
                            "file": str(filepath),
                            "size": file_size
                        }
                        logger.info(f"✓ {prefecture} - {dataset_name} 取得成功")
                    else:
                        prefecture_data[prefecture][dataset_name] = {
                            "status": "skipped",
                            "reason": "file_too_large",
                            "size": file_size
                        }
                        
                except Exception as e:
                    logger.error(f"✗ {prefecture} - {dataset_name} 取得失敗: {e}")
                    prefecture_data[prefecture][dataset_name] = {
                        "status": "error",
                        "error": str(e)
                    }
                    
        return prefecture_data
        
    def collect_gtfs_data(self) -> Dict:
        """GTFS（公共交通）データ収集"""
        logger.info("=== GTFSデータ収集開始 ===")
        gtfs_data = {}
        
        # 確実に利用可能なGTFSデータ
        gtfs_feeds = {
            "ODPT": {
                "url": "https://www.odpt.org/en/overview/",
                "type": "公共交通オープンデータセンター",
                "note": "登録必要"
            },
            "十勝バス": {
                "url": "https://www.tokachibus.jp/rosenbus/opendata/",
                "type": "バス（GTFS-JP）"
            },
            "東京GTFS": {
                "url": "https://github.com/MKuranowski/TokyoGTFS",
                "type": "東京圏鉄道・バス",
                "note": "GitHubリポジトリ"
            },
            "TransitFeeds": {
                "url": "https://transitfeeds.com/location/asia/japan",
                "type": "日本のGTFSフィード集約",
                "note": "2025年12月廃止予定"
            }
        }
        
        for operator, info in gtfs_feeds.items():
            try:
                # URLの存在確認
                response = self.session.head(info["url"], timeout=5)
                if response.status_code == 200:
                    gtfs_data[operator] = {
                        "status": "available",
                        "url": info["url"],
                        "type": info["type"]
                    }
                    logger.info(f"✓ {operator} GTFS利用可能")
                else:
                    gtfs_data[operator] = {
                        "status": "not_found",
                        "code": response.status_code
                    }
                    
            except Exception as e:
                logger.error(f"✗ {operator} GTFS確認失敗: {e}")
                gtfs_data[operator] = {
                    "status": "error",
                    "error": str(e)
                }
                
        return gtfs_data
        
    def collect_basic_statistics(self) -> Dict:
        """基本統計データ収集"""
        logger.info("=== 基本統計データ収集開始 ===")
        
        # e-Statの統計表一覧（APIキーなしでもメタデータは取得可能）
        stats = {
            "population": {
                "stat_id": "0003412316",
                "name": "人口推計"
            },
            "tourism": {
                "stat_id": "0003165838", 
                "name": "宿泊旅行統計"
            }
        }
        
        results = {}
        for stat_type, info in stats.items():
            results[stat_type] = {
                "name": info["name"],
                "stat_id": info["stat_id"],
                "note": "APIキーが必要です。メタデータのみ取得可能。"
            }
            
        return results
        
    def collect_environmental_data(self) -> Dict:
        """環境モニタリングデータ収集"""
        logger.info("=== 環境モニタリングデータ収集開始 ===")
        env_data = {}
        
        # 環境省大気汚染物質広域監視システム（そらまめ君）
        env_sources = {
            "大気環境": {
                "soramame": {
                    "url": "http://soramame.env.go.jp/",
                    "description": "大気汚染物質広域監視システム",
                    "note": "リアルタイムデータ"
                }
            },
            "河川水質": {
                "water_info": {
                    "url": "http://www1.river.go.jp/",
                    "description": "水文水質データベース",
                    "note": "国土交通省"
                }
            },
            "放射線": {
                "radiation": {
                    "url": "https://radioactivity.nra.go.jp/en/",
                    "description": "放射線モニタリング情報",
                    "note": "原子力規制委員会"
                }
            }
        }
        
        for category, sources in env_sources.items():
            env_data[category] = sources
            logger.info(f"環境データカテゴリ: {category}")
            
        return env_data
        
    def collect_municipal_opendata(self) -> Dict:
        """市町村オープンデータ収集"""
        logger.info("=== 市町村オープンデータ収集開始 ===")
        
        municipal_data = {
            "広島県": {
                "広島市": {
                    "url": "https://www.city.hiroshima.lg.jp/site/opendata/",
                    "datasets": ["避難所", "AED設置場所", "公共施設"]
                },
                "呉市": {
                    "url": "https://www.city.kure.lg.jp/soshiki/7/opendata.html",
                    "datasets": ["観光施設", "公共施設"]
                },
                "福山市": {
                    "url": "https://www.city.fukuyama.hiroshima.jp/soshiki/johokanri/126167.html",
                    "datasets": ["オープンデータ一覧"]
                }
            },
            "山口県": {
                "下関市": {
                    "url": "https://www.city.shimonoseki.lg.jp/soshiki/12/4181.html",
                    "datasets": ["公共施設", "観光情報"]
                },
                "宇部市": {
                    "url": "https://www.city.ube.yamaguchi.jp/shisei/toukei/opendata/",
                    "datasets": ["観光スポット", "イベント情報"]
                }
            },
            "福岡県": {
                "北九州市": {
                    "url": "https://www.city.kitakyushu.lg.jp/soumu/file_0308.html",
                    "datasets": ["公共施設", "避難所", "観光情報"]
                },
                "久留米市": {
                    "url": "https://www.city.kurume.fukuoka.jp/1080shisei/2040keikaku/3090jouhou/4020opendata/",
                    "datasets": ["施設情報", "統計情報"]
                }
            },
            "大阪府": {
                "堺市": {
                    "url": "https://www.city.sakai.lg.jp/shisei/tokei/opendata/",
                    "datasets": ["避難所", "公共施設", "統計"]
                },
                "東大阪市": {
                    "url": "https://www.city.higashiosaka.lg.jp/0000027168.html",
                    "datasets": ["公共施設一覧"]
                }
            },
            "東京都": {
                "世田谷区": {
                    "url": "https://www.city.setagaya.lg.jp/mokuji/kusei/002/006/001/d00132106.html",
                    "datasets": ["施設情報", "統計データ"]
                },
                "新宿区": {
                    "url": "https://www.city.shinjuku.lg.jp/kusei/file09_00001.html",
                    "datasets": ["公共施設", "統計情報"]
                }
            }
        }
        
        return municipal_data
        
    def collect_event_calendars(self) -> Dict:
        """イベントカレンダーデータ収集"""
        logger.info("=== イベントカレンダーデータ収集開始 ===")
        
        event_sources = {
            "観光イベント": {
                "jnto": {
                    "url": "https://www.jnto.go.jp/",
                    "description": "日本政府観光局イベント情報",
                    "note": "多言語対応"
                },
                "local_events": {
                    "hiroshima": "https://www.hiroshima-navi.or.jp/",
                    "yamaguchi": "https://yamaguchi-tourism.jp/",
                    "fukuoka": "https://yokanavi.com/",
                    "osaka": "https://osaka-info.jp/",
                    "tokyo": "https://www.gotokyo.org/"
                }
            },
            "文化イベント": {
                "museums": {
                    "description": "博物館・美術館イベント",
                    "note": "各施設のRSSフィード利用可能"
                }
            },
            "スポーツイベント": {
                "sports": {
                    "description": "スポーツイベント・大会情報",
                    "note": "各競技団体サイトから取得"
                }
            }
        }
        
        return event_sources
        
    def collect_air_quality_data(self) -> Dict:
        """大気質データ収集"""
        logger.info("=== 大気質データ収集開始 ===")
        
        air_quality_data = {
            "sources": {
                "soramame": {
                    "url": "http://soramame.env.go.jp/",
                    "description": "環境省大気汚染物質広域監視システム",
                    "note": "リアルタイムデータ"
                },
                "pm25": {
                    "url": "http://pm25.jp/",
                    "description": "PM2.5まとめ",
                    "note": "全国のPM2.5情報"
                }
            },
            "note": "大気質データはWebスクレイピングが必要な場合が多い"
        }
        
        return air_quality_data
        
    def collect_tourism_data(self) -> Dict:
        """観光統計データ収集"""
        logger.info("=== 観光統計データ収集開始 ===")
        
        tourism_data = {
            "JNTO": {
                "statistics_portal": {
                    "url": "https://statistics.jnto.go.jp/en/graph/",
                    "description": "日本政府観光局統計サイト",
                    "note": "CSVダウンロード可能"
                },
                "visitor_arrivals": {
                    "url": "https://www.jnto.go.jp/statistics/data/",
                    "description": "訪日外客統計",
                    "note": "月次データ"
                }
            },
            "観光庁": {
                "statistics": {
                    "url": "https://www.mlit.go.jp/kankocho/siryou/toukei/",
                    "description": "観光統計・白書",
                    "note": "宿泊旅行統計など"
                }
            },
            "地域別": {
                "hiroshima": {
                    "url": "https://www.pref.hiroshima.lg.jp/soshiki/78/",
                    "description": "広島県観光統計"
                },
                "yamaguchi": {
                    "url": "https://www.pref.yamaguchi.lg.jp/soshiki/123/",
                    "description": "山口県観光統計"
                },
                "fukuoka": {
                    "url": "https://www.pref.fukuoka.lg.jp/contents/kanko-tokei.html",
                    "description": "福岡県観光統計"
                }
            }
        }
        
        return tourism_data
        
    def collect_government_opendata(self) -> Dict:
        """政府オープンデータ収集"""
        logger.info("=== 政府オープンデータ収集開始 ===")
        
        gov_data = {
            "DATA.GO.JP": {
                "portal": {
                    "url": "https://www.data.go.jp/",
                    "description": "日本政府オープンデータポータル",
                    "note": "省庁横断的データカタログ"
                }
            },
            "e-Stat": {
                "portal": {
                    "url": "https://www.e-stat.go.jp/",
                    "description": "政府統計の総合窓口",
                    "note": "一部データはAPIキー不要"
                },
                "regional": {
                    "url": "https://www.e-stat.go.jp/regional-statistics/ssdsview",
                    "description": "地域統計",
                    "note": "市区町村データ"
                }
            },
            "総務省統計局": {
                "data": {
                    "url": "https://www.stat.go.jp/data/",
                    "description": "各種統計データ",
                    "note": "国勢調査、家計調査など"
                }
            },
            "国土交通省": {
                "gis": {
                    "url": "https://nlftp.mlit.go.jp/",
                    "description": "国土数値情報",
                    "note": "GISデータ（無料）"
                },
                "plateau": {
                    "url": "https://www.mlit.go.jp/plateau/",
                    "description": "PLATEAU（3D都市モデル）",
                    "note": "オープンデータ"
                }
            }
        }
        
        return gov_data
        
    def _save_results(self, results: Dict):
        """結果を保存"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # JSON形式で保存
        output_path = self.data_dir / "collection_results" / f"free_data_{timestamp}.json"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
            
        logger.info(f"結果を保存: {output_path}")
        
        # サマリー作成
        self._create_summary(results)
        
    def _create_summary(self, results: Dict):
        """収集結果のサマリー作成"""
        summary = []
        summary.append("\n" + "="*60)
        summary.append("オープンデータ収集サマリー")
        summary.append("="*60)
        summary.append(f"実行時刻: {results['timestamp']}")
        summary.append("")
        
        # 気象データ
        weather_success = sum(1 for city in results['weather'].values() 
                            if city.get('status') == 'success')
        summary.append(f"気象データ: {weather_success}/{len(results['weather'])} 都市成功")
        
        # 地震データ
        summary.append(f"地震データ: {len(results['earthquakes'])} 件取得")
        
        # 都府県データ
        prefecture_count = len(results.get('prefectures', {}))
        summary.append(f"都府県オープンデータ: {prefecture_count} 都府県分のデータ収集")
        
        # GTFSデータ
        gtfs_available = sum(1 for op in results.get('gtfs', {}).values() 
                           if op.get('status') == 'available')
        summary.append(f"GTFSデータ: {gtfs_available}/{len(results.get('gtfs', {}))} 事業者利用可能")
        
        # 環境データ
        env_categories = len(results.get('environmental', {}))
        summary.append(f"環境モニタリング: {env_categories} カテゴリ")
        
        # 市町村データ
        municipal_prefectures = len(results.get('municipal', {}))
        municipal_cities = sum(len(cities) for cities in results.get('municipal', {}).values())
        summary.append(f"市町村オープンデータ: {municipal_prefectures} 都府県、{municipal_cities} 市区")
        
        # イベントカレンダー
        event_categories = len(results.get('event_calendars', {}))
        summary.append(f"イベントカレンダー: {event_categories} カテゴリ")
        
        # 大気質データ
        air_quality_sources = len(results.get('air_quality', {}).get('sources', {}))
        summary.append(f"大気質データ: {air_quality_sources} ソース")
        
        # 観光データ
        tourism_categories = len(results.get('tourism', {}))
        summary.append(f"観光統計データ: {tourism_categories} カテゴリ")
        
        # 政府オープンデータ
        gov_sources = len(results.get('government', {}))
        summary.append(f"政府オープンデータ: {gov_sources} ソース")
        
        summary.append("="*60)
        
        summary_text = "\n".join(summary)
        print(summary_text)
        
        # サマリーファイル保存
        summary_path = self.data_dir / "collection_results" / "latest_summary.txt"
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(summary_text)


async def collect_realtime_feeds():
    """リアルタイムフィードの設定"""
    logger.info("=== リアルタイムフィード設定 ===")
    
    feeds = {
        "weather": {
            "open_meteo": {
                "url": "https://api.open-meteo.com/v1/forecast",
                "interval": 3600,  # 1時間
                "description": "気象予報データ"
            }
        },
        "earthquake": {
            "jma": {
                "url": "https://www.jma.go.jp/bosai/quake/data/list.json",
                "interval": 300,  # 5分
                "description": "地震情報"
            }
        },
        "transport": {
            "description": "交通情報（各事業者のAPIキーが必要）"
        }
    }
    
    # 設定ファイル保存
    config_path = Path("uesugi-engine-data/config/realtime_feeds.json")
    config_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(feeds, f, ensure_ascii=False, indent=2)
        
    logger.info(f"リアルタイムフィード設定を保存: {config_path}")
    

def main():
    """メイン処理"""
    print("🚀 Uesugi Engine オープンデータ収集開始")
    print("APIキー不要のデータから収集を開始します...\n")
    
    # 無料データ収集
    collector = FreeOpenDataCollector()
    results = collector.collect_all()
    
    # リアルタイムフィード設定
    asyncio.run(collect_realtime_feeds())
    
    print("\n✅ 収集完了！")
    print("\n📌 次のステップ:")
    print("1. 収集結果を確認: uesugi-engine-data/collection_results/")
    print("2. APIキーが必要なデータ:")
    print("   - e-Stat (統計データ)")
    print("   - ODPT (詳細な交通データ)")
    print("   - Twitter (SNS分析)")
    print("   - 各自治体のAPI")
    print("\n📧 メールアドレス登録が必要なサービスがあれば、お知らせください。")


if __name__ == "__main__":
    main()