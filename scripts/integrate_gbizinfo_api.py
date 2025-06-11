#!/usr/bin/env python3
"""
gBizINFO API統合スクリプト

法人番号をキーに企業情報・許認可・補助金情報を取得し、
建物データや経済分析に活用します。
"""

import os
import sys
import json
import requests
from datetime import datetime
from pathlib import Path
import logging
from typing import Dict, List, Optional
import time

# プロジェクトルートをPythonパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GBizINFOCollector:
    """gBizINFO API データ収集クラス"""
    
    def __init__(self):
        self.base_url = "https://info.gbiz.go.jp/hojin/v1"
        self.data_dir = Path(__file__).parent.parent / "uesugi-engine-data" / "gbizinfo"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # レート制限対策
        self.request_interval = 1.0  # 1秒間隔
        self.last_request_time = 0
        
    def _rate_limit(self):
        """APIレート制限対策"""
        current_time = time.time()
        elapsed = current_time - self.last_request_time
        if elapsed < self.request_interval:
            time.sleep(self.request_interval - elapsed)
        self.last_request_time = time.time()
        
    def search_corporations(self, prefecture: str, city: str = None, 
                          industry: str = None, limit: int = 100) -> List[Dict]:
        """企業検索"""
        logger.info(f"企業検索: {prefecture} {city or ''}")
        
        params = {
            "prefecture": prefecture,
            "limit": limit,
            "page": 1
        }
        
        if city:
            params["city"] = city
        if industry:
            params["industry"] = industry
            
        all_results = []
        
        try:
            while True:
                self._rate_limit()
                
                response = requests.get(
                    f"{self.base_url}/corporations",
                    params=params,
                    timeout=30
                )
                response.raise_for_status()
                
                data = response.json()
                corporations = data.get("hojin_infos", [])
                
                if not corporations:
                    break
                    
                all_results.extend(corporations)
                logger.info(f"ページ{params['page']}: {len(corporations)}件取得")
                
                # 次ページ確認
                if len(corporations) < limit:
                    break
                    
                params["page"] += 1
                
                # デモのため3ページまで
                if params["page"] > 3:
                    break
                    
            logger.info(f"合計{len(all_results)}件の企業情報を取得")
            return all_results
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API接続エラー: {e}")
            return []
            
    def get_corporation_detail(self, corporate_number: str) -> Optional[Dict]:
        """企業詳細情報取得"""
        try:
            self._rate_limit()
            
            response = requests.get(
                f"{self.base_url}/corporation/{corporate_number}",
                timeout=30
            )
            response.raise_for_status()
            
            return response.json().get("hojin_info")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"詳細取得エラー ({corporate_number}): {e}")
            return None
            
    def get_certifications(self, corporate_number: str) -> List[Dict]:
        """許認可情報取得"""
        try:
            self._rate_limit()
            
            response = requests.get(
                f"{self.base_url}/corporation/{corporate_number}/certification",
                timeout=30
            )
            response.raise_for_status()
            
            return response.json().get("certification", [])
            
        except requests.exceptions.RequestException as e:
            logger.error(f"許認可取得エラー ({corporate_number}): {e}")
            return []
            
    def get_subsidies(self, corporate_number: str) -> List[Dict]:
        """補助金情報取得"""
        try:
            self._rate_limit()
            
            response = requests.get(
                f"{self.base_url}/corporation/{corporate_number}/subsidy",
                timeout=30
            )
            response.raise_for_status()
            
            return response.json().get("subsidy", [])
            
        except requests.exceptions.RequestException as e:
            logger.error(f"補助金取得エラー ({corporate_number}): {e}")
            return []
            
    def analyze_corporation_for_uesugi(self, corp_data: Dict) -> Dict:
        """企業データをUesugi Engine用に分析"""
        basic = corp_data.get("basic", {})
        
        # 企業規模推定
        capital = basic.get("capital", 0)
        if isinstance(capital, str):
            capital = int(capital.replace(",", "")) if capital.replace(",", "").isdigit() else 0
            
        if capital >= 1000000000:  # 10億円以上
            scale = "large"
        elif capital >= 100000000:  # 1億円以上
            scale = "medium"
        else:
            scale = "small"
            
        # 産業分類
        industry = basic.get("industry_large_classification", "")
        
        # 雇用推定（資本金から概算）
        estimated_employees = 0
        if scale == "large":
            estimated_employees = 500
        elif scale == "medium":
            estimated_employees = 100
        else:
            estimated_employees = 20
            
        return {
            "corporate_number": corp_data.get("corporate_number"),
            "name": basic.get("name"),
            "address": basic.get("location"),
            "prefecture": basic.get("prefecture_name"),
            "city": basic.get("city_name"),
            "capital": capital,
            "scale": scale,
            "industry": industry,
            "estimated_employees": estimated_employees,
            "established_date": basic.get("date_of_establishment"),
            "update_date": basic.get("update_date"),
            "certifications": corp_data.get("certifications", []),
            "subsidies": corp_data.get("subsidies", [])
        }
        
    def collect_regional_corporations(self, regions: Dict[str, List[str]]):
        """地域別企業データ収集"""
        results = {}
        
        for region_key, cities in regions.items():
            logger.info(f"\n{region_key}の企業データ収集開始")
            region_results = []
            
            for city in cities:
                # 企業検索
                corporations = self.search_corporations(
                    prefecture=region_key,
                    city=city,
                    limit=50  # デモのため少なめ
                )
                
                for corp in corporations[:10]:  # デモのため10社まで
                    corp_number = corp.get("corporate_number")
                    
                    # 詳細情報取得
                    detail = self.get_corporation_detail(corp_number)
                    if not detail:
                        continue
                        
                    # 許認可・補助金情報
                    certifications = self.get_certifications(corp_number)
                    subsidies = self.get_subsidies(corp_number)
                    
                    # 統合データ作成
                    full_data = detail.copy()
                    full_data["certifications"] = certifications
                    full_data["subsidies"] = subsidies
                    
                    # Uesugi形式に変換
                    analyzed = self.analyze_corporation_for_uesugi(full_data)
                    region_results.append(analyzed)
                    
            results[region_key] = region_results
            
            # 地域別保存
            output_file = self.data_dir / f"{region_key}_corporations.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "region": region_key,
                    "collected_at": datetime.now().isoformat(),
                    "corporation_count": len(region_results),
                    "corporations": region_results
                }, f, ensure_ascii=False, indent=2)
                
            logger.info(f"{region_key}: {len(region_results)}社のデータを保存")
            
        return results
        
    def create_economic_indicators(self, results: Dict):
        """経済指標の作成"""
        indicators = {}
        
        for region, corporations in results.items():
            if not corporations:
                continue
                
            # 産業別集計
            industry_count = {}
            total_capital = 0
            total_employees = 0
            subsidy_amount = 0
            
            for corp in corporations:
                # 産業分類
                industry = corp.get("industry", "その他")
                industry_count[industry] = industry_count.get(industry, 0) + 1
                
                # 資本金合計
                total_capital += corp.get("capital", 0)
                
                # 従業員数推定合計
                total_employees += corp.get("estimated_employees", 0)
                
                # 補助金総額
                for subsidy in corp.get("subsidies", []):
                    amount = subsidy.get("amount", 0)
                    if isinstance(amount, str):
                        amount = int(amount.replace(",", "")) if amount.replace(",", "").isdigit() else 0
                    subsidy_amount += amount
                    
            indicators[region] = {
                "corporation_count": len(corporations),
                "industry_distribution": industry_count,
                "total_capital": total_capital,
                "average_capital": total_capital / len(corporations) if corporations else 0,
                "estimated_total_employees": total_employees,
                "total_subsidy_amount": subsidy_amount,
                "subsidy_per_company": subsidy_amount / len(corporations) if corporations else 0
            }
            
        # 指標保存
        indicators_file = self.data_dir / "economic_indicators.json"
        with open(indicators_file, 'w', encoding='utf-8') as f:
            json.dump({
                "created_at": datetime.now().isoformat(),
                "indicators": indicators
            }, f, ensure_ascii=False, indent=2)
            
        logger.info(f"経済指標作成完了: {indicators_file}")
        

def main():
    """メイン処理"""
    collector = GBizINFOCollector()
    
    # 対象地域と主要都市
    target_regions = {
        "広島県": ["広島市", "福山市", "呉市"],
        "山口県": ["山口市", "下関市", "宇部市"],
        "福岡県": ["福岡市", "北九州市", "久留米市"],
        "大阪府": ["大阪市", "堺市", "東大阪市"],
        "東京都": ["千代田区", "中央区", "港区"]
    }
    
    logger.info("gBizINFO企業データ収集を開始します")
    
    # 地域別収集
    results = collector.collect_regional_corporations(target_regions)
    
    # 経済指標作成
    collector.create_economic_indicators(results)
    
    logger.info("\ngBizINFOデータ収集が完了しました")
    

if __name__ == "__main__":
    main()