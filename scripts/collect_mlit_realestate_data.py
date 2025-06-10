#!/usr/bin/env python3
"""
国土交通省データプラットフォーム・不動産情報ライブラリAPI統合
Uesugi Engine用の不動産・地域データ収集
"""
import requests
import json
from datetime import datetime
from pathlib import Path
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MLITDataCollector:
    """国土交通省データ収集クラス"""
    
    def __init__(self):
        self.data_dir = Path("uesugi-engine-data/mlit")
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # API基本情報
        self.mlit_dpf_base = "https://www.mlit-data.jp/api"
        self.reinfolib_base = "https://www.reinfolib.mlit.go.jp/api"
        
        # 対象地域（Uesugi Engine対象）
        self.target_prefectures = {
            "34": "広島県",
            "35": "山口県", 
            "40": "福岡県",
            "27": "大阪府",
            "13": "東京都"
        }
        
    def get_prefecture_list(self):
        """都道府県一覧取得"""
        logger.info("=== 都道府県情報取得 ===")
        
        try:
            # 都道府県コード情報取得API
            url = f"{self.mlit_dpf_base}/v1/prefectures"
            response = requests.get(url)
            
            if response.status_code == 200:
                prefectures = response.json()
                
                # 対象地域のみフィルタ
                target_data = {
                    code: name for code, name in prefectures.items() 
                    if code in self.target_prefectures
                }
                
                # 保存
                output_path = self.data_dir / "prefecture_codes.json"
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump({
                        "timestamp": datetime.now().isoformat(),
                        "source": "国土交通省DPF",
                        "prefectures": target_data
                    }, f, ensure_ascii=False, indent=2)
                    
                logger.info(f"✓ 都道府県情報保存: {output_path}")
                return target_data
                
        except Exception as e:
            logger.error(f"都道府県情報取得エラー: {e}")
            return self.target_prefectures
            
    def get_city_list(self, prefecture_code):
        """市区町村一覧取得"""
        logger.info(f"=== {self.target_prefectures.get(prefecture_code, prefecture_code)}の市区町村情報取得 ===")
        
        try:
            # 市区町村コード情報取得API
            url = f"{self.mlit_dpf_base}/v1/cities"
            params = {"prefecture": prefecture_code}
            response = requests.get(url, params=params)
            
            if response.status_code == 200:
                cities = response.json()
                
                # 保存
                output_path = self.data_dir / f"cities_{prefecture_code}.json"
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump({
                        "timestamp": datetime.now().isoformat(),
                        "prefecture": self.target_prefectures.get(prefecture_code),
                        "cities": cities
                    }, f, ensure_ascii=False, indent=2)
                    
                logger.info(f"✓ {len(cities)}市区町村の情報保存")
                return cities
                
        except Exception as e:
            logger.error(f"市区町村情報取得エラー: {e}")
            return []
            
    def get_real_estate_prices(self, prefecture_code, city_code=None):
        """不動産取引価格情報取得"""
        logger.info(f"=== 不動産取引価格情報取得 ===")
        
        try:
            # 不動産取引価格情報取得API
            url = f"{self.reinfolib_base}/webapi/v2/TransactionSearch"
            
            # 最新データ取得（2023年第3四半期～2024年第1四半期）
            params = {
                "from": "20233",
                "to": "20241",
                "prefCode": prefecture_code
            }
            
            if city_code:
                params["cityCode"] = city_code
                
            response = requests.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                transactions = data.get("results", [])
                
                # データ集計
                summary = {
                    "total_count": len(transactions),
                    "average_price": 0,
                    "price_range": {"min": 0, "max": 0},
                    "type_distribution": {},
                    "area_distribution": {}
                }
                
                if transactions:
                    prices = [int(t.get("TradePrice", 0)) for t in transactions if t.get("TradePrice")]
                    if prices:
                        summary["average_price"] = sum(prices) / len(prices)
                        summary["price_range"]["min"] = min(prices)
                        summary["price_range"]["max"] = max(prices)
                        
                    # 物件種別集計
                    for t in transactions:
                        prop_type = t.get("Type", "不明")
                        summary["type_distribution"][prop_type] = summary["type_distribution"].get(prop_type, 0) + 1
                        
                        # 地域別集計
                        area = t.get("Municipality", "不明")
                        summary["area_distribution"][area] = summary["area_distribution"].get(area, 0) + 1
                
                # 保存
                output_path = self.data_dir / f"real_estate_prices_{prefecture_code}.json"
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump({
                        "timestamp": datetime.now().isoformat(),
                        "prefecture": self.target_prefectures.get(prefecture_code),
                        "period": "2023Q3-2024Q1",
                        "summary": summary,
                        "sample_data": transactions[:5]  # サンプル5件
                    }, f, ensure_ascii=False, indent=2)
                    
                logger.info(f"✓ {summary['total_count']}件の取引データを集計")
                return summary
                
        except Exception as e:
            logger.error(f"不動産価格取得エラー: {e}")
            return {}
            
    def analyze_policy_impact(self):
        """施策影響分析のためのデータ統合"""
        logger.info("=== 施策影響分析データ準備 ===")
        
        analysis_framework = {
            "不動産価格変動分析": {
                "用途": "インフラ整備・都市開発の効果測定",
                "指標": [
                    "新駅開業前後の地価変動",
                    "再開発地域の不動産価格推移",
                    "災害リスク地域の価格影響"
                ],
                "手法": "DID（差分の差分法）、合成コントロール"
            },
            "地域経済分析": {
                "用途": "産業政策・企業誘致効果",
                "指標": [
                    "事業所数・従業者数の変化",
                    "一人当たり地方税の推移",
                    "企業立地と雇用創出"
                ],
                "手法": "時系列分析、パネルデータ分析"
            },
            "人口動態分析": {
                "用途": "移住・定住政策効果",
                "指標": [
                    "年齢別人口構成の変化",
                    "転入転出バランス",
                    "世帯数・世帯構成"
                ],
                "手法": "コーホート分析、人口予測モデル"
            },
            "統合分析": {
                "用途": "複合的な施策効果測定",
                "例": [
                    "交通整備→地価上昇→税収増加",
                    "企業誘致→雇用創出→人口増加",
                    "防災投資→リスク低減→地域活性化"
                ]
            }
        }
        
        # 分析フレームワーク保存
        output_path = self.data_dir / "policy_impact_analysis_framework.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "framework": analysis_framework,
                "data_sources": {
                    "国土交通省DPF": ["都道府県・市区町村コード", "地理情報"],
                    "不動産情報ライブラリ": ["取引価格", "地価公示"],
                    "e-Stat": ["人口", "事業所", "地方財政"]
                }
            }, f, ensure_ascii=False, indent=2)
            
        logger.info(f"✓ 分析フレームワーク保存: {output_path}")
        return analysis_framework


class EStatAdvancedCollector:
    """e-Stat詳細データ収集（既存APIキー活用）"""
    
    def __init__(self):
        self.api_key = "c11c2e7910b7810c15770f829b52bb1a75d283ed"
        self.base_url = "https://api.e-stat.go.jp/rest/3.0/app/json"
        self.data_dir = Path("uesugi-engine-data/estat-advanced")
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
    def get_local_tax_data(self):
        """一人当たり地方税データ取得"""
        logger.info("=== 地方税データ取得 ===")
        
        # 地方財政状況調査のstatsDataId
        stats_data_id = "0004006284"  # 2023年市町村分
        
        url = f"{self.base_url}/getStatsData"
        params = {
            "appId": self.api_key,
            "lang": "J",
            "statsDataId": stats_data_id,
            "metaGetFlg": "Y",
            "cntGetFlg": "N"
        }
        
        try:
            response = requests.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                logger.info("✓ 地方税データ取得成功")
                
                # 保存
                output_path = self.data_dir / "local_tax_per_capita.json"
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                    
                return data
                
        except Exception as e:
            logger.error(f"地方税データ取得エラー: {e}")
            return {}
            
    def get_business_census_data(self):
        """経済センサス事業所データ取得"""
        logger.info("=== 事業所・企業データ取得 ===")
        
        # 令和3年経済センサスのID
        stats_data_id = "0003448237"
        
        url = f"{self.base_url}/getStatsData"
        params = {
            "appId": self.api_key,
            "lang": "J",
            "statsDataId": stats_data_id,
            "metaGetFlg": "Y",
            "cntGetFlg": "N",
            "limit": 1000
        }
        
        try:
            response = requests.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                logger.info("✓ 事業所データ取得成功")
                
                # 保存
                output_path = self.data_dir / "business_census_2021.json"
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                    
                return data
                
        except Exception as e:
            logger.error(f"事業所データ取得エラー: {e}")
            return {}


def main():
    """メイン処理"""
    print("🏛️ 国土交通省・e-Stat統合データ収集")
    print("="*60)
    
    # 1. 国土交通省データ収集
    print("\n【国土交通省データプラットフォーム】")
    mlit_collector = MLITDataCollector()
    
    # 都道府県情報
    print("\n📍 都道府県コード取得...")
    prefectures = mlit_collector.get_prefecture_list()
    
    # 各都道府県の市区町村情報
    print("\n🏘️ 市区町村情報取得...")
    for pref_code in mlit_collector.target_prefectures:
        cities = mlit_collector.get_city_list(pref_code)
        
    # 不動産価格情報（サンプル：広島県）
    print("\n🏠 不動産取引価格情報取得...")
    real_estate_summary = mlit_collector.get_real_estate_prices("34")
    
    # 施策影響分析フレームワーク
    print("\n📊 施策影響分析フレームワーク作成...")
    analysis = mlit_collector.analyze_policy_impact()
    
    # 2. e-Stat詳細データ収集
    print("\n【e-Stat詳細データ】")
    estat_collector = EStatAdvancedCollector()
    
    print("\n💰 地方税データ取得...")
    tax_data = estat_collector.get_local_tax_data()
    
    print("\n🏢 事業所・企業データ取得...")
    business_data = estat_collector.get_business_census_data()
    
    print("\n✅ データ収集完了！")
    print("\n" + "="*60)
    print("【Uesugi Engineでの活用】")
    print("\n1. 不動産価格分析")
    print("   → インフラ整備効果の定量化")
    print("   → 都市開発の経済効果測定")
    
    print("\n2. 地域経済分析")
    print("   → 企業誘致政策の効果検証")
    print("   → 雇用創出と税収の相関分析")
    
    print("\n3. 複合的な因果推論")
    print("   → 交通×不動産×人口の連鎖効果")
    print("   → 政策の波及効果シミュレーション")
    
    print("\n💡 これらのデータにより、より精密な政策効果測定が可能になります！")


if __name__ == "__main__":
    main()