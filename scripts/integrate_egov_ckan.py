#!/usr/bin/env python3
"""
e-Gov データポータル CKAN API 統合スクリプト

省庁横断のオープンデータをCKAN APIで取得し、
Uesugi Engine用に統合します。
"""

import os
import sys
import json
import requests
from datetime import datetime
from pathlib import Path
import logging
from typing import Dict, List, Optional
import pandas as pd

# プロジェクトルートをPythonパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class EGovCKANCollector:
    """e-Gov CKAN データ収集クラス"""
    
    def __init__(self):
        self.base_url = "https://data.e-gov.go.jp/data/api/3"
        self.data_dir = Path(__file__).parent.parent / "uesugi-engine-data" / "egov"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
    def search_packages(self, query: str, rows: int = 100) -> List[Dict]:
        """データセット検索"""
        logger.info(f"e-Govデータ検索: {query}")
        
        try:
            params = {
                'q': query,
                'rows': rows,
                'start': 0
            }
            
            response = requests.get(
                f"{self.base_url}/action/package_search",
                params=params,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            if result.get('success'):
                packages = result.get('result', {}).get('results', [])
                logger.info(f"{len(packages)}件のデータセットが見つかりました")
                return packages
            
        except requests.exceptions.RequestException as e:
            logger.error(f"検索エラー: {e}")
            return []
            
    def get_package_details(self, package_id: str) -> Optional[Dict]:
        """データセット詳細取得"""
        try:
            response = requests.get(
                f"{self.base_url}/action/package_show",
                params={'id': package_id},
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            if result.get('success'):
                return result.get('result')
                
        except requests.exceptions.RequestException as e:
            logger.error(f"詳細取得エラー ({package_id}): {e}")
            return None
            
    def download_resource(self, resource: Dict, output_dir: Path) -> Optional[Path]:
        """リソースファイルのダウンロード"""
        url = resource.get('url')
        if not url:
            return None
            
        filename = resource.get('name', 'data') + '.' + resource.get('format', 'csv').lower()
        filepath = output_dir / filename
        
        if filepath.exists():
            logger.info(f"既存ファイルをスキップ: {filepath}")
            return filepath
            
        try:
            logger.info(f"ダウンロード中: {url}")
            response = requests.get(url, timeout=60, stream=True)
            response.raise_for_status()
            
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    
            logger.info(f"保存完了: {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"ダウンロードエラー: {e}")
            return None
            
    def collect_regional_data(self):
        """地域関連データの収集"""
        logger.info("地域関連データの収集を開始")
        
        # 検索キーワード
        search_terms = [
            "人口統計",
            "経済統計",
            "観光統計",
            "医療統計",
            "教育統計",
            "防災",
            "都市計画"
        ]
        
        all_datasets = []
        
        for term in search_terms:
            packages = self.search_packages(term, rows=50)
            
            for package in packages[:5]:  # 各カテゴリ上位5件
                package_id = package.get('id')
                details = self.get_package_details(package_id)
                
                if details:
                    # メタデータ保存
                    metadata = {
                        'id': package_id,
                        'title': details.get('title'),
                        'notes': details.get('notes'),
                        'tags': [tag['name'] for tag in details.get('tags', [])],
                        'organization': details.get('organization', {}).get('title'),
                        'resources': []
                    }
                    
                    # リソースダウンロード
                    package_dir = self.data_dir / package_id
                    package_dir.mkdir(exist_ok=True)
                    
                    for resource in details.get('resources', []):
                        if resource.get('format', '').lower() in ['csv', 'json', 'xml']:
                            filepath = self.download_resource(resource, package_dir)
                            if filepath:
                                metadata['resources'].append({
                                    'name': resource.get('name'),
                                    'format': resource.get('format'),
                                    'filepath': str(filepath.relative_to(self.data_dir))
                                })
                                
                    all_datasets.append(metadata)
                    
        # メタデータ保存
        metadata_file = self.data_dir / "egov_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump({
                'collected_at': datetime.now().isoformat(),
                'datasets': all_datasets
            }, f, ensure_ascii=False, indent=2)
            
        logger.info(f"収集完了: {len(all_datasets)}データセット")
        
    def analyze_collected_data(self):
        """収集データの分析・整理"""
        metadata_file = self.data_dir / "egov_metadata.json"
        
        if not metadata_file.exists():
            logger.warning("メタデータファイルが見つかりません")
            return
            
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
            
        # カテゴリ別整理
        categories = {}
        for dataset in metadata['datasets']:
            for tag in dataset.get('tags', []):
                if tag not in categories:
                    categories[tag] = []
                categories[tag].append(dataset['title'])
                
        # 分析結果保存
        analysis = {
            'total_datasets': len(metadata['datasets']),
            'categories': categories,
            'organizations': {},
            'formats': {}
        }
        
        # 組織別集計
        for dataset in metadata['datasets']:
            org = dataset.get('organization', '不明')
            analysis['organizations'][org] = analysis['organizations'].get(org, 0) + 1
            
        # フォーマット別集計
        for dataset in metadata['datasets']:
            for resource in dataset.get('resources', []):
                fmt = resource.get('format', '不明')
                analysis['formats'][fmt] = analysis['formats'].get(fmt, 0) + 1
                
        # 分析結果保存
        analysis_file = self.data_dir / "data_analysis.json"
        with open(analysis_file, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, ensure_ascii=False, indent=2)
            
        logger.info("データ分析完了")
        
        # サマリー表示
        print("\n=== e-Gov データ収集サマリー ===")
        print(f"総データセット数: {analysis['total_datasets']}")
        print(f"\n主要カテゴリ:")
        for tag, titles in sorted(categories.items(), key=lambda x: len(x[1]), reverse=True)[:10]:
            print(f"  - {tag}: {len(titles)}件")
        print(f"\n提供組織:")
        for org, count in sorted(analysis['organizations'].items(), key=lambda x: x[1], reverse=True)[:5]:
            print(f"  - {org}: {count}件")
            

def main():
    """メイン処理"""
    collector = EGovCKANCollector()
    
    logger.info("e-Gov CKAN データ収集を開始します")
    
    # データ収集
    collector.collect_regional_data()
    
    # 分析実行
    collector.analyze_collected_data()
    
    logger.info("e-Gov データ収集が完了しました")
    

if __name__ == "__main__":
    main()