"""
ダウンロードマネージャー
大規模データの効率的なダウンロード管理
"""
import os
import asyncio
import aiohttp
import aiofiles
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import hashlib
import json
import logging
from tqdm.asyncio import tqdm
import zipfile
import tarfile
import gzip
import shutil
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class DownloadManager:
    """大規模オープンデータのダウンロード管理"""
    
    def __init__(self, base_dir: str = "uesugi-engine-data"):
        self.base_dir = Path(base_dir)
        self.download_dir = self.base_dir / "downloads"
        self.download_dir.mkdir(parents=True, exist_ok=True)
        
        self.session = None
        self.download_queue = asyncio.Queue()
        self.concurrent_downloads = 3
        self.chunk_size = 1024 * 1024  # 1MB
        
        # ダウンロード履歴
        self.history_file = self.base_dir / "download_history.json"
        self.history = self._load_history()
        
    def _load_history(self) -> Dict:
        """ダウンロード履歴を読み込み"""
        if self.history_file.exists():
            with open(self.history_file, 'r') as f:
                return json.load(f)
        return {}
        
    def _save_history(self):
        """ダウンロード履歴を保存"""
        with open(self.history_file, 'w') as f:
            json.dump(self.history, f, indent=2)
            
    async def download_all(self, urls: List[Dict]) -> List[Dict]:
        """複数URLを並行ダウンロード"""
        async with aiohttp.ClientSession() as self.session:
            # ダウンロードキューに追加
            for url_info in urls:
                await self.download_queue.put(url_info)
                
            # ワーカーを起動
            workers = [
                asyncio.create_task(self._download_worker(f"worker-{i}"))
                for i in range(self.concurrent_downloads)
            ]
            
            # キューが空になるまで待機
            await self.download_queue.join()
            
            # ワーカーを停止
            for worker in workers:
                worker.cancel()
                
            return self.history
            
    async def _download_worker(self, name: str):
        """ダウンロードワーカー"""
        while True:
            try:
                url_info = await self.download_queue.get()
                await self._download_file(url_info)
                self.download_queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"{name} error: {e}")
                self.download_queue.task_done()
                
    async def _download_file(self, url_info: Dict) -> Optional[str]:
        """ファイルをダウンロード"""
        url = url_info["url"]
        name = url_info.get("name", self._get_filename_from_url(url))
        category = url_info.get("category", "misc")
        
        # 保存先
        save_dir = self.download_dir / category
        save_dir.mkdir(parents=True, exist_ok=True)
        filepath = save_dir / name
        
        # 履歴確認（既にダウンロード済みか）
        if self._is_already_downloaded(url, filepath):
            logger.info(f"Already downloaded: {name}")
            return str(filepath)
            
        try:
            # ヘッダー情報取得
            async with self.session.head(url) as response:
                total_size = int(response.headers.get('content-length', 0))
                
            # プログレスバー付きダウンロード
            async with self.session.get(url) as response:
                response.raise_for_status()
                
                with tqdm(total=total_size, unit='B', unit_scale=True, desc=name) as pbar:
                    async with aiofiles.open(filepath, 'wb') as file:
                        async for chunk in response.content.iter_chunked(self.chunk_size):
                            await file.write(chunk)
                            pbar.update(len(chunk))
                            
            # チェックサム計算
            checksum = await self._calculate_checksum(filepath)
            
            # 履歴更新
            self.history[url] = {
                "filepath": str(filepath),
                "timestamp": datetime.now().isoformat(),
                "size": total_size,
                "checksum": checksum,
                "category": category
            }
            self._save_history()
            
            # 圧縮ファイルの場合は解凍
            if self._is_archive(filepath):
                await self._extract_archive(filepath)
                
            logger.info(f"Downloaded: {name} ({total_size:,} bytes)")
            return str(filepath)
            
        except Exception as e:
            logger.error(f"Failed to download {url}: {e}")
            if filepath.exists():
                filepath.unlink()
            return None
            
    def _is_already_downloaded(self, url: str, filepath: Path) -> bool:
        """既にダウンロード済みか確認"""
        if url in self.history and filepath.exists():
            # ファイルサイズで簡易チェック
            if filepath.stat().st_size == self.history[url].get("size", 0):
                return True
        return False
        
    def _get_filename_from_url(self, url: str) -> str:
        """URLからファイル名を生成"""
        parsed = urlparse(url)
        filename = os.path.basename(parsed.path)
        if not filename:
            # URLのハッシュ値をファイル名に
            filename = hashlib.md5(url.encode()).hexdigest()[:8]
        return filename
        
    async def _calculate_checksum(self, filepath: Path) -> str:
        """ファイルのチェックサムを計算"""
        hash_md5 = hashlib.md5()
        async with aiofiles.open(filepath, 'rb') as f:
            while chunk := await f.read(self.chunk_size):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
        
    def _is_archive(self, filepath: Path) -> bool:
        """アーカイブファイルか判定"""
        archive_extensions = {'.zip', '.tar', '.tar.gz', '.tgz', '.gz', '.7z', '.rar'}
        return filepath.suffix.lower() in archive_extensions
        
    async def _extract_archive(self, filepath: Path):
        """アーカイブを解凍"""
        extract_dir = filepath.parent / filepath.stem
        extract_dir.mkdir(exist_ok=True)
        
        try:
            if filepath.suffix == '.zip':
                with zipfile.ZipFile(filepath, 'r') as zip_ref:
                    zip_ref.extractall(extract_dir)
            elif filepath.suffix in ['.tar', '.tar.gz', '.tgz']:
                with tarfile.open(filepath, 'r:*') as tar_ref:
                    tar_ref.extractall(extract_dir)
            elif filepath.suffix == '.gz' and not filepath.suffixes[-2:] == ['.tar', '.gz']:
                # 単一ファイルのgzip
                output_file = extract_dir / filepath.stem
                with gzip.open(filepath, 'rb') as gz_file:
                    with open(output_file, 'wb') as out_file:
                        shutil.copyfileobj(gz_file, out_file)
                        
            logger.info(f"Extracted: {filepath.name} to {extract_dir}")
            
        except Exception as e:
            logger.error(f"Failed to extract {filepath}: {e}")


class DatasetRegistry:
    """利用可能なデータセットのレジストリ"""
    
    # 主要オープンデータセット
    DATASETS = {
        "government": {
            "e-stat": {
                "population": {
                    "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000031524010&fileKind=0",
                    "name": "population_census_2020.csv",
                    "description": "令和2年国勢調査"
                },
                "tourism": {
                    "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000032142541&fileKind=0",
                    "name": "tourism_statistics_2023.csv",
                    "description": "宿泊旅行統計調査"
                }
            },
            "mlit": {
                "gtfs": {
                    "url": "https://www.mlit.go.jp/sogoseisaku/transport/sosei_transport_tk_000035.html",
                    "name": "gtfs_jp_list.json",
                    "description": "GTFS-JP提供事業者一覧"
                },
                "road_traffic": {
                    "url": "https://www.mlit.go.jp/road/census/r2/data/",
                    "name": "road_census_2021.zip",
                    "description": "道路交通センサス"
                }
            }
        },
        "prefectures": {
            "hiroshima": {
                "tourism_stats": {
                    "url": "https://www.pref.hiroshima.lg.jp/uploaded/attachment/tourism_2023.csv",
                    "name": "hiroshima_tourism_2023.csv"
                },
                "population": {
                    "url": "https://www.pref.hiroshima.lg.jp/uploaded/attachment/population_2023.csv",
                    "name": "hiroshima_population_2023.csv"
                }
            },
            "yamaguchi": {
                "tourism_stats": {
                    "url": "https://www.pref.yamaguchi.lg.jp/cms/a12300/opendata/tourism.csv",
                    "name": "yamaguchi_tourism_2023.csv"
                }
            },
            "fukuoka": {
                "population": {
                    "url": "https://www.pref.fukuoka.lg.jp/dataweb/population.csv",
                    "name": "fukuoka_population_2023.csv"
                }
            },
            "osaka": {
                "commerce": {
                    "url": "https://www.pref.osaka.lg.jp/attach/commerce_2023.csv",
                    "name": "osaka_commerce_2023.csv"
                }
            },
            "tokyo": {
                "transport": {
                    "url": "https://portal.data.metro.tokyo.lg.jp/dataset/transport_2023.csv",
                    "name": "tokyo_transport_2023.csv"
                }
            }
        },
        "realtime": {
            "weather": {
                "jma_feed": {
                    "url": "https://www.jma.go.jp/bosai/forecast/data/forecast/340000.json",
                    "name": "weather_hiroshima.json",
                    "refresh": 3600  # 1時間ごと
                }
            },
            "traffic": {
                "jartic": {
                    "url": "https://www.jartic.or.jp/d/api/traffic_hiroshima.json",
                    "name": "traffic_realtime_hiroshima.json",
                    "refresh": 300  # 5分ごと
                }
            }
        },
        "geographic": {
            "osm": {
                "hiroshima": {
                    "url": "https://download.geofabrik.de/asia/japan/chugoku/hiroshima-latest.osm.pbf",
                    "name": "hiroshima.osm.pbf",
                    "size": "50MB"
                },
                "yamaguchi": {
                    "url": "https://download.geofabrik.de/asia/japan/chugoku/yamaguchi-latest.osm.pbf",
                    "name": "yamaguchi.osm.pbf",
                    "size": "35MB"
                }
            },
            "dem": {
                "description": "数値標高モデル（DEM）",
                "url": "https://fgd.gsi.go.jp/download/",
                "format": "GeoTIFF"
            }
        }
    }
    
    @classmethod
    def get_download_list(cls, categories: List[str] = None) -> List[Dict]:
        """ダウンロードリストを生成"""
        download_list = []
        
        def extract_urls(data: Dict, category: str = ""):
            for key, value in data.items():
                if isinstance(value, dict):
                    if "url" in value and "name" in value:
                        # URLエントリ
                        if not categories or category in categories:
                            download_list.append({
                                "url": value["url"],
                                "name": value["name"],
                                "category": category or key,
                                "description": value.get("description", ""),
                                "refresh": value.get("refresh", 0)
                            })
                    else:
                        # ネストされた辞書
                        extract_urls(value, category or key)
                        
        extract_urls(cls.DATASETS)
        return download_list


async def download_all_datasets(categories: List[str] = None):
    """全データセットをダウンロード"""
    manager = DownloadManager()
    registry = DatasetRegistry()
    
    # ダウンロードリスト生成
    download_list = registry.get_download_list(categories)
    
    logger.info(f"Starting download of {len(download_list)} datasets...")
    
    # ダウンロード実行
    results = await manager.download_all(download_list)
    
    # サマリー出力
    success_count = sum(1 for r in results.values() if r.get("filepath"))
    logger.info(f"Download complete: {success_count}/{len(download_list)} successful")
    
    return results


if __name__ == "__main__":
    # 全データセットをダウンロード
    # asyncio.run(download_all_datasets())
    
    # 特定カテゴリのみ
    # asyncio.run(download_all_datasets(["government", "hiroshima"]))