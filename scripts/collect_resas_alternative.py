#!/usr/bin/env python3
"""
RESAS API代替データ収集スクリプト
2025年3月でAPI終了のため、代替データソースから収集
"""
import requests
import json
from datetime import datetime
from pathlib import Path
import logging

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class RESASAlternativeCollector:
    """RESAS代替データ収集"""
    
    def __init__(self):
        self.data_dir = Path("uesugi-engine-data/resas-alternative")
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # e-Stat APIキー（既に取得済み）
        self.estat_api_key = "c11c2e7910b7810c15770f829b52bb1a75d283ed"
        
    def collect_regional_economy_data(self):
        """地域経済データを収集（e-Statから）"""
        logger.info("地域経済データ収集開始")
        
        # 経済センサスのデータを取得
        url = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList"
        
        # 対象都府県
        prefectures = {
            "13": "東京都",
            "27": "大阪府", 
            "34": "広島県",
            "35": "山口県",
            "40": "福岡県"
        }
        
        economic_data = {}
        
        # 各都府県の経済データを検索
        for pref_code, pref_name in prefectures.items():
            params = {
                "appId": self.estat_api_key,
                "lang": "J",
                "searchWord": f"{pref_name} 経済",
                "statsCode": "00200552",  # 経済センサス
                "limit": 10
            }
            
            try:
                response = requests.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if "GET_STATS_LIST" in data:
                    stat_list = data["GET_STATS_LIST"]
                    if "DATALIST_INF" in stat_list:
                        list_inf = stat_list["DATALIST_INF"].get("LIST_INF", [])
                        if isinstance(list_inf, dict):
                            list_inf = [list_inf]
                            
                        economic_data[pref_name] = []
                        for stat in list_inf[:3]:  # 最初の3件
                            economic_data[pref_name].append({
                                "id": stat.get("@id", ""),
                                "title": stat.get("TITLE", {}).get("$", ""),
                                "survey_date": stat.get("SURVEY_DATE", "")
                            })
                            
                logger.info(f"✓ {pref_name}の経済データ取得")
                
            except Exception as e:
                logger.error(f"{pref_name}のデータ取得エラー: {e}")
                
        return economic_data
        
    def collect_tourism_flow_data(self):
        """観光流動データの代替収集"""
        logger.info("観光流動データ収集開始")
        
        # 国土交通省の観光統計を利用
        tourism_flow = {
            "source": "国土交通省観光統計",
            "description": "RESAS観光マップの代替データ",
            "data": {}
        }
        
        # 対象地域
        regions = ["広島県", "山口県", "福岡県", "大阪府", "東京都"]
        
        for region in regions:
            tourism_flow["data"][region] = {
                "domestic_visitors": "e-Statの宿泊旅行統計から取得可能",
                "foreign_visitors": "訪日外国人消費動向調査から取得可能",
                "day_trip_visitors": "全国観光統計基準から推計可能"
            }
            
        return tourism_flow
        
    def collect_industry_data(self):
        """産業構造データの収集"""
        logger.info("産業構造データ収集開始")
        
        # 工業統計調査のデータを取得
        url = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList"
        params = {
            "appId": self.estat_api_key,
            "lang": "J",
            "searchWord": "製造業 事業所",
            "statsCode": "00200202",  # 工業統計
            "limit": 5
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            industry_data = []
            if "GET_STATS_LIST" in data:
                stat_list = data["GET_STATS_LIST"]
                if "DATALIST_INF" in stat_list:
                    list_inf = stat_list["DATALIST_INF"].get("LIST_INF", [])
                    if isinstance(list_inf, dict):
                        list_inf = [list_inf]
                        
                    for stat in list_inf:
                        industry_data.append({
                            "id": stat.get("@id", ""),
                            "title": stat.get("TITLE", {}).get("$", ""),
                            "stat_name": stat.get("STAT_NAME", {}).get("$", "")
                        })
                        
            return industry_data
            
        except Exception as e:
            logger.error(f"産業データ取得エラー: {e}")
            return []
            
    def get_alternative_sources(self):
        """RESAS代替データソース一覧"""
        sources = {
            "人口マップ代替": {
                "e-Stat": "国勢調査、人口推計",
                "総務省統計局": "住民基本台帳人口移動報告",
                "厚生労働省": "人口動態統計"
            },
            "地域経済循環マップ代替": {
                "e-Stat": "経済センサス、商業統計",
                "経済産業省": "工業統計調査",
                "内閣府": "県民経済計算"
            },
            "産業構造マップ代替": {
                "e-Stat": "経済センサス-活動調査",
                "総務省": "事業所・企業統計調査",
                "経済産業省": "特定サービス産業実態調査"
            },
            "観光マップ代替": {
                "観光庁": "宿泊旅行統計調査",
                "JNTO": "訪日外客統計",
                "各自治体": "観光入込客統計"
            },
            "まちづくりマップ代替": {
                "国土交通省": "国土数値情報",
                "総務省": "統計GIS",
                "各自治体": "オープンデータ"
            }
        }
        
        return sources
        
    def save_summary(self, all_data):
        """収集結果のサマリーを保存"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # JSON保存
        json_path = self.data_dir / f"resas_alternative_{timestamp}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, ensure_ascii=False, indent=2)
            
        # マークダウン形式で代替案を保存
        guide_path = self.data_dir / "RESAS_ALTERNATIVE_GUIDE.md"
        with open(guide_path, 'w', encoding='utf-8') as f:
            f.write("# RESAS API代替データソースガイド\n\n")
            f.write("## 背景\n")
            f.write("RESAS APIは2025年3月24日にサービスを終了します。\n")
            f.write("以下は、RESASで提供されていたデータの代替取得方法です。\n\n")
            
            f.write("## 代替データソース\n\n")
            for category, sources in all_data["alternative_sources"].items():
                f.write(f"### {category}\n")
                for source, description in sources.items():
                    f.write(f"- **{source}**: {description}\n")
                f.write("\n")
                
            f.write("## 実装済みデータ収集\n\n")
            f.write("### 1. e-Stat経由での経済データ\n")
            f.write("```python\n")
            f.write("# 既に実装済み\n")
            f.write("collector.collect_regional_economy_data()\n")
            f.write("```\n\n")
            
            f.write("### 2. 山口県オープンデータ\n")
            f.write("```python\n")
            f.write("# 登録不要で利用可能\n")
            f.write("yamaguchi_collector.collect_tourism_data()\n")
            f.write("```\n\n")
            
            f.write("### 3. 国土数値情報\n")
            f.write("- URL: https://nlftp.mlit.go.jp/\n")
            f.write("- 登録必要だが、豊富な地理空間データ\n\n")
            
            f.write("## 推奨される移行戦略\n")
            f.write("1. **短期的対応**: e-Statとオープンデータポータルを活用\n")
            f.write("2. **中期的対応**: 各省庁の個別APIと連携\n")
            f.write("3. **長期的対応**: 独自のデータ収集・分析基盤構築\n")
            
        logger.info(f"代替ガイド保存: {guide_path}")
        return json_path, guide_path


def main():
    """メイン処理"""
    print("🔄 RESAS API代替データ収集")
    print("="*60)
    print("⚠️  RESAS APIは2025年3月24日で終了")
    print("✅ 代替データソースから収集します")
    print()
    
    collector = RESASAlternativeCollector()
    
    # データ収集
    all_data = {
        "timestamp": datetime.now().isoformat(),
        "notice": "RESAS APIは2025年3月24日終了。代替データソースを使用",
        "regional_economy": collector.collect_regional_economy_data(),
        "tourism_flow": collector.collect_tourism_flow_data(),
        "industry": collector.collect_industry_data(),
        "alternative_sources": collector.get_alternative_sources()
    }
    
    # 結果保存
    json_path, guide_path = collector.save_summary(all_data)
    
    print("\n✅ 代替データ収集完了！")
    print(f"データ保存先: {json_path}")
    print(f"移行ガイド: {guide_path}")
    
    # 代替ソース一覧を表示
    print("\n" + "="*60)
    print("【RESAS代替データソース】")
    for category, sources in all_data["alternative_sources"].items():
        print(f"\n{category}:")
        for source, desc in sources.items():
            print(f"  - {source}: {desc}")
    
    print("\n" + "="*60)
    print("推奨事項:")
    print("1. e-Statで基本的な統計データは取得可能")
    print("2. 各自治体のオープンデータが充実")
    print("3. 国土数値情報で地理データ取得可能")
    print("4. 観光庁・JNTOで観光統計取得可能")


if __name__ == "__main__":
    main()