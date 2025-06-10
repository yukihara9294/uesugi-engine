"""
リアルタイムデータ収集モジュール
各種リアルタイムAPIからのストリーミングデータ取得
"""
import asyncio
import aiohttp
import json
import websockets
from datetime import datetime
from typing import Dict, List, Optional, Callable
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class RealtimeDataCollector:
    """リアルタイムデータのストリーミング収集"""
    
    # リアルタイムデータソース
    REALTIME_SOURCES = {
        # 交通情報
        "jr_west": {
            "type": "http_polling",
            "url": "https://www.train-guide.westjr.co.jp/api/v3/trains",
            "interval": 30,  # 秒
            "areas": ["sanyo", "sanin"]
        },
        "jr_kyushu": {
            "type": "http_polling",
            "url": "https://www.jrkyushu.co.jp/railway/delay/api.php",
            "interval": 60
        },
        "tokyo_metro": {
            "type": "http_polling",
            "url": "https://api.tokyometroapp.jp/api/v2/datapoints",
            "interval": 20,
            "requires_key": True
        },
        
        # 気象情報
        "jma_feed": {
            "type": "websocket",
            "url": "wss://www.jma.go.jp/bosai/ws/feed",
            "channels": ["earthquake", "weather", "warning"]
        },
        
        # 交通カメラ
        "traffic_cam": {
            "type": "http_polling",
            "urls": {
                "hiroshima": "https://www.jartic.or.jp/api/hiroshima/camera/",
                "yamaguchi": "https://www.jartic.or.jp/api/yamaguchi/camera/",
                "fukuoka": "https://www.jartic.or.jp/api/fukuoka/camera/",
                "osaka": "https://www.jartic.or.jp/api/osaka/camera/",
                "tokyo": "https://www.jartic.or.jp/api/tokyo/camera/"
            },
            "interval": 300  # 5分
        },
        
        # SNSストリーム（要認証）
        "twitter_stream": {
            "type": "stream",
            "url": "https://api.twitter.com/2/tweets/search/stream",
            "rules": [
                {"value": "#広島観光 OR #ひろしま", "tag": "hiroshima"},
                {"value": "#山口観光 OR #やまぐち", "tag": "yamaguchi"},
                {"value": "#福岡観光 OR #ふくおか", "tag": "fukuoka"},
                {"value": "#大阪観光 OR #おおさか", "tag": "osaka"},
                {"value": "#東京観光 OR #とうきょう", "tag": "tokyo"}
            ]
        },
        
        # 人流センサー
        "people_flow": {
            "type": "mqtt",
            "broker": "mqtt://iot.example.com",
            "topics": [
                "sensor/hiroshima/+/people_count",
                "sensor/yamaguchi/+/people_count",
                "sensor/fukuoka/+/people_count",
                "sensor/osaka/+/people_count",
                "sensor/tokyo/+/people_count"
            ]
        }
    }
    
    def __init__(self):
        self.data_dir = Path("uesugi-engine-data/realtime")
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.active_streams = {}
        self.callbacks = {}
        
    async def start_all_streams(self):
        """全リアルタイムストリームを開始"""
        tasks = []
        
        for source_name, config in self.REALTIME_SOURCES.items():
            if config["type"] == "http_polling":
                task = asyncio.create_task(
                    self._start_http_polling(source_name, config)
                )
                tasks.append(task)
            elif config["type"] == "websocket":
                task = asyncio.create_task(
                    self._start_websocket_stream(source_name, config)
                )
                tasks.append(task)
            elif config["type"] == "stream" and self._has_credentials(source_name):
                task = asyncio.create_task(
                    self._start_api_stream(source_name, config)
                )
                tasks.append(task)
                
        await asyncio.gather(*tasks)
        
    async def _start_http_polling(self, name: str, config: Dict):
        """HTTPポーリングによるデータ取得"""
        async with aiohttp.ClientSession() as session:
            while True:
                try:
                    if isinstance(config.get("url"), dict):
                        # 複数URLの場合
                        for region, url in config["url"].items():
                            await self._fetch_http_data(session, name, url, region)
                    else:
                        # 単一URLの場合
                        await self._fetch_http_data(session, name, config["url"])
                        
                except Exception as e:
                    logger.error(f"Error in {name} polling: {e}")
                    
                await asyncio.sleep(config.get("interval", 60))
                
    async def _fetch_http_data(self, session: aiohttp.ClientSession, 
                               source: str, url: str, region: str = None):
        """HTTPデータを取得"""
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    await self._process_realtime_data(source, data, region)
                    
        except Exception as e:
            logger.error(f"Failed to fetch from {url}: {e}")
            
    async def _start_websocket_stream(self, name: str, config: Dict):
        """WebSocketストリームを開始"""
        try:
            async with websockets.connect(config["url"]) as websocket:
                logger.info(f"Connected to {name} WebSocket")
                
                # チャンネル購読
                for channel in config.get("channels", []):
                    await websocket.send(json.dumps({
                        "action": "subscribe",
                        "channel": channel
                    }))
                    
                # メッセージ受信ループ
                async for message in websocket:
                    data = json.loads(message)
                    await self._process_realtime_data(name, data)
                    
        except Exception as e:
            logger.error(f"WebSocket error for {name}: {e}")
            # 再接続を試みる
            await asyncio.sleep(5)
            await self._start_websocket_stream(name, config)
            
    async def _start_api_stream(self, name: str, config: Dict):
        """APIストリーム（Twitter等）を開始"""
        # Twitter Streaming API v2の例
        if name == "twitter_stream":
            await self._start_twitter_stream(config)
            
    async def _start_twitter_stream(self, config: Dict):
        """Twitter Filtered Streamを開始"""
        bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
        if not bearer_token:
            logger.warning("Twitter bearer token not found")
            return
            
        # ストリームルールの設定
        await self._setup_twitter_rules(config["rules"], bearer_token)
        
        # ストリーム接続
        url = config["url"]
        headers = {"Authorization": f"Bearer {bearer_token}"}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                async for line in response.content:
                    if line:
                        tweet = json.loads(line)
                        await self._process_realtime_data("twitter", tweet)
                        
    async def _process_realtime_data(self, source: str, data: Dict, 
                                     region: str = None):
        """リアルタイムデータを処理"""
        # タイムスタンプ付与
        processed_data = {
            "source": source,
            "timestamp": datetime.now().isoformat(),
            "region": region,
            "data": data
        }
        
        # コールバック実行
        if source in self.callbacks:
            await self.callbacks[source](processed_data)
            
        # バッファリングして定期的に保存
        await self._buffer_and_save(source, processed_data)
        
    async def _buffer_and_save(self, source: str, data: Dict):
        """データをバッファリングして保存"""
        # メモリバッファ（実際はRedis等を使用）
        if source not in self.active_streams:
            self.active_streams[source] = []
            
        self.active_streams[source].append(data)
        
        # 100件または5分ごとに保存
        if len(self.active_streams[source]) >= 100:
            await self._save_buffer(source)
            
    async def _save_buffer(self, source: str):
        """バッファをファイルに保存"""
        if source not in self.active_streams:
            return
            
        data = self.active_streams[source]
        if not data:
            return
            
        # ファイル名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{source}_{timestamp}.json"
        filepath = self.data_dir / source / filename
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        # 保存
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        # バッファクリア
        self.active_streams[source] = []
        logger.info(f"Saved {len(data)} records to {filename}")
        
    def register_callback(self, source: str, callback: Callable):
        """データ受信時のコールバックを登録"""
        self.callbacks[source] = callback
        
    def _has_credentials(self, source: str) -> bool:
        """認証情報があるか確認"""
        if source == "twitter_stream":
            return bool(os.getenv("TWITTER_BEARER_TOKEN"))
        elif source == "tokyo_metro":
            return bool(os.getenv("TOKYO_METRO_API_KEY"))
        return True
        
    async def get_latest_data(self, source: str, count: int = 10) -> List[Dict]:
        """最新データを取得"""
        if source in self.active_streams:
            return self.active_streams[source][-count:]
        return []


# 個別コレクター
class TrafficJamCollector:
    """渋滞情報収集"""
    
    JARTIC_API = "https://www.jartic.or.jp/api/traffic/"
    
    async def collect_traffic_jam(self, prefecture: str) -> Dict:
        """渋滞情報を収集"""
        async with aiohttp.ClientSession() as session:
            url = f"{self.JARTIC_API}{prefecture}"
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.json()
                return {}


class EventStreamCollector:
    """イベント情報のリアルタイム収集"""
    
    def __init__(self):
        self.event_sources = {
            "ticketmaster": "https://app.ticketmaster.com/discovery/v2/events",
            "pia": "https://ticket.pia.jp/api/events",
            "eplus": "https://eplus.jp/api/events"
        }
        
    async def collect_upcoming_events(self, prefecture: str) -> List[Dict]:
        """開催予定イベントを収集"""
        events = []
        
        # 各チケットサイトから収集
        for source, base_url in self.event_sources.items():
            try:
                # 実際のAPI実装
                pass
            except Exception as e:
                logger.error(f"Failed to collect from {source}: {e}")
                
        return events


class EmergencyAlertCollector:
    """緊急速報・災害情報収集"""
    
    JMA_ALERT_URL = "https://www.jma.go.jp/bosai/warning/data/warning/"
    L_ALERT_URL = "https://www.l-alert.go.jp/api/"
    
    async def collect_alerts(self, prefecture: str) -> List[Dict]:
        """緊急速報を収集"""
        alerts = []
        
        # 気象庁警報
        jma_alerts = await self._get_jma_alerts(prefecture)
        alerts.extend(jma_alerts)
        
        # L-ALERT
        l_alerts = await self._get_l_alerts(prefecture)
        alerts.extend(l_alerts)
        
        return alerts
        
    async def _get_jma_alerts(self, prefecture: str) -> List[Dict]:
        """気象庁の警報を取得"""
        # 実装
        return []
        
    async def _get_l_alerts(self, prefecture: str) -> List[Dict]:
        """L-ALERTを取得"""
        # 実装
        return []


if __name__ == "__main__":
    import os
    
    # リアルタイムコレクター起動
    collector = RealtimeDataCollector()
    
    # 非同期実行
    # asyncio.run(collector.start_all_streams())