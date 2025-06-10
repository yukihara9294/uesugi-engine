#!/usr/bin/env python3
"""
観光オープンデータダウンロードスクリプト
Tourism Open Data Download Script for Uesugi Engine

このスクリプトは、日本の各地域の観光関連オープンデータを
収集・ダウンロードするためのものです。
"""

import requests
import pandas as pd
import json
import os
from datetime import datetime
from typing import Dict, List, Optional
import time

class TourismDataDownloader:
    """観光データダウンロード用クラス"""
    
    def __init__(self, output_dir: str = "tourism_data"):
        """
        初期化
        
        Args:
            output_dir: データ保存先ディレクトリ
        """
        self.output_dir = output_dir
        self._create_output_dirs()
        
    def _create_output_dirs(self):
        """出力ディレクトリの作成"""
        dirs = [
            self.output_dir,
            os.path.join(self.output_dir, "hiroshima"),
            os.path.join(self.output_dir, "fukuoka"),
            os.path.join(self.output_dir, "osaka"),
            os.path.join(self.output_dir, "tokyo"),
            os.path.join(self.output_dir, "resas"),
            os.path.join(self.output_dir, "national")
        ]
        for dir_path in dirs:
            os.makedirs(dir_path, exist_ok=True)
    
    def download_resas_data(self, api_key: str):
        """
        RESAS APIからデータをダウンロード
        
        Args:
            api_key: RESAS APIキー（https://opendata.resas-portal.go.jp/で取得）
        """
        base_url = "https://opendata.resas-portal.go.jp/api/v1"
        headers = {"X-API-KEY": api_key}
        
        # 利用可能なエンドポイントの例
        endpoints = {
            "prefectures": "/prefectures",  # 都道府県一覧
            "cities": "/cities",  # 市区町村一覧
            "tourism": {
                "foreign_visitors": "/tourism/foreignVisitors",  # 外国人訪問者数
                "attractions": "/tourism/attractions",  # 観光地
                "events": "/tourism/events"  # イベント情報
            }
        }
        
        results = {}
        
        # 都道府県一覧を取得
        try:
            response = requests.get(
                f"{base_url}{endpoints['prefectures']}", 
                headers=headers
            )
            if response.status_code == 200:
                prefectures = response.json()
                results["prefectures"] = prefectures
                
                # 各都道府県の観光データを取得
                for pref in prefectures.get("result", [])[:5]:  # 最初の5県のみ
                    pref_code = pref["prefCode"]
                    pref_name = pref["prefName"]
                    
                    # 外国人訪問者数データ
                    tourism_response = requests.get(
                        f"{base_url}{endpoints['tourism']['foreign_visitors']}",
                        params={"prefCode": pref_code},
                        headers=headers
                    )
                    
                    if tourism_response.status_code == 200:
                        tourism_data = tourism_response.json()
                        results[f"{pref_name}_tourism"] = tourism_data
                    
                    time.sleep(1)  # APIレート制限対策
                    
        except Exception as e:
            print(f"RESAS APIエラー: {e}")
            
        # 結果を保存
        output_file = os.path.join(
            self.output_dir, 
            "resas", 
            f"resas_data_{datetime.now().strftime('%Y%m%d')}.json"
        )
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
            
        print(f"RESASデータを保存しました: {output_file}")
        
    def download_tokyo_tourism_data(self):
        """
        東京都観光データカタログからデータをダウンロード
        """
        # 東京都観光データカタログのサンプルURL
        # 実際のURLは、サイトから直接取得する必要があります
        sample_urls = {
            "visitor_statistics": "https://data.tourism.metro.tokyo.lg.jp/data/visitor_stats.csv",
            "accommodation_stats": "https://data.tourism.metro.tokyo.lg.jp/data/accommodation.csv",
            "event_data": "https://data.tourism.metro.tokyo.lg.jp/data/events.csv"
        }
        
        for data_type, url in sample_urls.items():
            try:
                # ダウンロード（実際のURLに置き換える必要があります）
                print(f"東京都{data_type}データをダウンロード中...")
                # response = requests.get(url)
                # if response.status_code == 200:
                #     output_file = os.path.join(
                #         self.output_dir, 
                #         "tokyo", 
                #         f"tokyo_{data_type}_{datetime.now().strftime('%Y%m%d')}.csv"
                #     )
                #     with open(output_file, 'wb') as f:
                #         f.write(response.content)
                #     print(f"保存完了: {output_file}")
                
            except Exception as e:
                print(f"東京都データダウンロードエラー ({data_type}): {e}")
    
    def download_data_go_jp(self):
        """
        data.go.jpから観光関連データをダウンロード
        """
        # data.go.jp APIの例
        ckan_api_url = "https://www.data.go.jp/data/api/3/action/"
        
        # 観光関連データセットの検索
        search_params = {
            "q": "観光 tourism",
            "rows": 10,
            "fq": 'res_format:CSV OR res_format:XLSX'
        }
        
        try:
            response = requests.get(
                f"{ckan_api_url}package_search",
                params=search_params
            )
            
            if response.status_code == 200:
                results = response.json()
                datasets = results.get("result", {}).get("results", [])
                
                dataset_info = []
                for dataset in datasets:
                    info = {
                        "title": dataset.get("title"),
                        "name": dataset.get("name"),
                        "organization": dataset.get("organization", {}).get("title"),
                        "resources": []
                    }
                    
                    for resource in dataset.get("resources", []):
                        if resource.get("format") in ["CSV", "XLSX"]:
                            info["resources"].append({
                                "name": resource.get("name"),
                                "url": resource.get("url"),
                                "format": resource.get("format")
                            })
                    
                    dataset_info.append(info)
                
                # 情報を保存
                output_file = os.path.join(
                    self.output_dir,
                    "national",
                    f"data_go_jp_tourism_datasets_{datetime.now().strftime('%Y%m%d')}.json"
                )
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(dataset_info, f, ensure_ascii=False, indent=2)
                    
                print(f"data.go.jpデータセット情報を保存しました: {output_file}")
                
        except Exception as e:
            print(f"data.go.jpエラー: {e}")
    
    def create_summary_report(self):
        """
        収集したデータのサマリーレポートを作成
        """
        summary = {
            "collection_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "data_sources": {
                "RESAS": {
                    "description": "地域経済分析システム",
                    "data_types": ["人口動態", "観光", "産業構造"],
                    "api_available": True,
                    "url": "https://resas.go.jp/"
                },
                "Tokyo Tourism Data Catalog": {
                    "description": "東京都観光データカタログ",
                    "data_types": ["訪問者数", "宿泊統計", "観光消費額"],
                    "dashboard_available": True,
                    "url": "https://data.tourism.metro.tokyo.lg.jp/"
                },
                "data.go.jp": {
                    "description": "日本政府オープンデータポータル",
                    "data_types": ["観光施設一覧", "イベント情報"],
                    "formats": ["CSV", "XLSX"],
                    "url": "https://www.data.go.jp/"
                }
            },
            "high_value_datasets": [
                {
                    "name": "東京都観光統計データ",
                    "value": "2023年の訪問者数、観光消費額の詳細データ",
                    "format": "CSV/Dashboard"
                },
                {
                    "name": "RESAS人流データ",
                    "value": "モバイル空間統計を活用した人の動きデータ",
                    "format": "API/JSON"
                },
                {
                    "name": "地域別宿泊統計",
                    "value": "都道府県別の宿泊者数・稼働率データ",
                    "format": "CSV/Excel"
                }
            ]
        }
        
        output_file = os.path.join(
            self.output_dir,
            f"data_collection_summary_{datetime.now().strftime('%Y%m%d')}.json"
        )
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
            
        print(f"\nサマリーレポートを作成しました: {output_file}")
        
        # 簡易レポート表示
        print("\n=== 収集可能な高価値データセット ===")
        for dataset in summary["high_value_datasets"]:
            print(f"\n{dataset['name']}:")
            print(f"  価値: {dataset['value']}")
            print(f"  形式: {dataset['format']}")


def main():
    """メイン処理"""
    print("観光オープンデータダウンローダーを起動します...")
    
    downloader = TourismDataDownloader()
    
    # 1. data.go.jpからデータセット情報を取得
    print("\n1. data.go.jpから観光データセット情報を取得中...")
    downloader.download_data_go_jp()
    
    # 2. 東京都観光データ（実際のURLが必要）
    print("\n2. 東京都観光データカタログの情報...")
    print("   実際のダウンロードには、サイトから具体的なURLを取得する必要があります")
    print("   URL: https://data.tourism.metro.tokyo.lg.jp/")
    
    # 3. RESAS API（APIキーが必要）
    print("\n3. RESAS APIの利用について...")
    print("   APIキーの取得: https://opendata.resas-portal.go.jp/")
    print("   取得後、download_resas_data()メソッドにAPIキーを渡してください")
    
    # 4. サマリーレポート作成
    print("\n4. サマリーレポートを作成中...")
    downloader.create_summary_report()
    
    print("\n処理が完了しました。")
    print(f"データは '{downloader.output_dir}' ディレクトリに保存されています。")


if __name__ == "__main__":
    main()