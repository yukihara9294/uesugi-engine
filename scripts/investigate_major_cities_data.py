#!/usr/bin/env python3
"""
福岡県・大阪府・東京都のオープンデータポータル調査スクリプト
各自治体のデータポータルサイトとAPIの可用性を確認
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


class MajorCitiesDataInvestigator:
    """主要都市のオープンデータポータル調査"""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.report_dir = self.base_dir / "uesugi-engine-data" / "investigation_reports"
        self.report_dir.mkdir(parents=True, exist_ok=True)
        
        # 調査対象の都市とそのデータポータル情報
        self.cities = {
            "fukuoka": {
                "name": "福岡県",
                "portal_url": "https://ckan.open-governmentdata.org/",
                "api_base": "https://ckan.open-governmentdata.org/api/3/action",
                "alternative_urls": [
                    "https://www.open-governmentdata.org/fukuoka-pref/",
                    "https://data.bodik.jp/"  # BODIK（九州オープンデータ推進会議）
                ],
                "notes": "福岡県はBODIK（九州オープンデータ推進会議）も活用"
            },
            "osaka": {
                "name": "大阪府",
                "portal_url": "https://www.pref.osaka.lg.jp/kikaku_keikaku/opendata/",
                "api_base": None,  # 調査予定
                "alternative_urls": [
                    "https://data.city.osaka.lg.jp/",  # 大阪市データポータル
                    "https://www.city.sakai.lg.jp/shisei/tokei/opendata/"  # 堺市
                ],
                "notes": "大阪府・大阪市・堺市など複数のポータルが存在"
            },
            "tokyo": {
                "name": "東京都",
                "portal_url": "https://portal.data.metro.tokyo.lg.jp/",
                "api_base": "https://portal.data.metro.tokyo.lg.jp/api/3/action",
                "alternative_urls": [
                    "https://catalog.data.metro.tokyo.lg.jp/",
                    "https://www.opendata.metro.tokyo.lg.jp/"
                ],
                "notes": "東京都オープンデータカタログサイト（CKAN）"
            }
        }
        
    def check_ckan_api(self, api_base):
        """CKAN APIの可用性をチェック"""
        try:
            # パッケージリストエンドポイントでテスト
            response = requests.get(f"{api_base}/package_list", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    package_count = len(data.get("result", []))
                    return {
                        "available": True,
                        "package_count": package_count,
                        "requires_auth": False
                    }
            return {"available": False, "error": f"Status code: {response.status_code}"}
        except Exception as e:
            return {"available": False, "error": str(e)}
            
    def search_tourism_data(self, api_base):
        """観光関連データを検索"""
        try:
            keywords = ["観光", "宿泊", "イベント", "tourism"]
            results = []
            
            for keyword in keywords:
                response = requests.get(
                    f"{api_base}/package_search",
                    params={"q": keyword, "rows": 10},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        for package in data["result"]["results"]:
                            results.append({
                                "title": package.get("title", ""),
                                "name": package.get("name", ""),
                                "notes": package.get("notes", "")[:100] + "..."
                            })
                            
            return results[:20]  # 最大20件
        except Exception as e:
            logger.error(f"検索エラー: {e}")
            return []
            
    def investigate_city(self, city_key):
        """都市のデータポータルを調査"""
        city = self.cities[city_key]
        logger.info(f"\n{'='*60}")
        logger.info(f"{city['name']}のオープンデータポータル調査")
        logger.info(f"{'='*60}")
        
        report = {
            "city": city["name"],
            "timestamp": datetime.now().isoformat(),
            "portal_url": city["portal_url"],
            "api_status": None,
            "sample_datasets": [],
            "recommendations": []
        }
        
        # APIチェック
        if city["api_base"]:
            logger.info(f"API確認中: {city['api_base']}")
            api_status = self.check_ckan_api(city["api_base"])
            report["api_status"] = api_status
            
            if api_status["available"]:
                logger.info(f"✅ API利用可能！データセット数: {api_status['package_count']}")
                
                # サンプルデータ検索
                sample_data = self.search_tourism_data(city["api_base"])
                report["sample_datasets"] = sample_data
                logger.info(f"観光関連データ: {len(sample_data)}件発見")
                
                # 推奨事項
                report["recommendations"].append(
                    f"CKAN APIが利用可能。collect_yamaguchi_data_v2.pyをベースに{city['name']}版を作成可能"
                )
            else:
                logger.warning(f"❌ API利用不可: {api_status.get('error', 'Unknown error')}")
                report["recommendations"].append(
                    "CKAN APIが利用できない場合は、手動ダウンロード用スクリプトを検討"
                )
        else:
            logger.info("APIエンドポイント未確認")
            report["recommendations"].append(
                "APIエンドポイントの調査が必要。ポータルサイトでAPI documentationを確認"
            )
            
        # 代替URL情報
        report["alternative_sources"] = city.get("alternative_urls", [])
        report["notes"] = city.get("notes", "")
        
        return report
        
    def generate_collection_script_template(self, city_key):
        """データ収集スクリプトのテンプレートを生成"""
        city = self.cities[city_key]
        template_path = self.report_dir / f"collect_{city_key}_data_template.py"
        
        template = f'''#!/usr/bin/env python3
"""
{city['name']}オープンデータ収集スクリプト
自動生成テンプレート - 要カスタマイズ
"""
import requests
import json
from datetime import datetime
from pathlib import Path
import logging

# 基本設定
CITY_NAME = "{city['name']}"
API_BASE = "{city.get('api_base', 'TODO: APIエンドポイントを設定')}"
PORTAL_URL = "{city['portal_url']}"

class {city_key.capitalize()}DataCollector:
    def __init__(self):
        self.api_base = API_BASE
        self.data_dir = Path("uesugi-engine-data/{city_key}")
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
    def collect_data(self):
        # TODO: 実装
        pass

if __name__ == "__main__":
    collector = {city_key.capitalize()}DataCollector()
    collector.collect_data()
'''
        
        with open(template_path, 'w', encoding='utf-8') as f:
            f.write(template)
            
        return template_path
        
    def run_investigation(self):
        """全都市の調査を実行"""
        all_reports = {}
        
        for city_key in self.cities:
            report = self.investigate_city(city_key)
            all_reports[city_key] = report
            
            # テンプレート生成
            if report["api_status"] and report["api_status"]["available"]:
                template_path = self.generate_collection_script_template(city_key)
                logger.info(f"テンプレート生成: {template_path}")
                
        # 総合レポート作成
        self.save_investigation_report(all_reports)
        
        return all_reports
        
    def save_investigation_report(self, all_reports):
        """調査レポートを保存"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # JSON形式
        json_path = self.report_dir / f"major_cities_investigation_{timestamp}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(all_reports, f, ensure_ascii=False, indent=2)
            
        # テキストレポート
        report_path = self.report_dir / f"major_cities_investigation_{timestamp}.md"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# 主要都市オープンデータポータル調査レポート\n\n")
            f.write(f"実施日時: {datetime.now()}\n\n")
            
            for city_key, report in all_reports.items():
                f.write(f"## {report['city']}\n\n")
                f.write(f"- **ポータルURL**: {report['portal_url']}\n")
                
                if report['api_status']:
                    f.write(f"- **API状態**: {'✅ 利用可能' if report['api_status']['available'] else '❌ 利用不可'}\n")
                    if report['api_status'].get('package_count'):
                        f.write(f"- **データセット数**: {report['api_status']['package_count']}件\n")
                        
                if report['sample_datasets']:
                    f.write(f"\n### サンプルデータセット（観光関連）\n")
                    for ds in report['sample_datasets'][:5]:
                        f.write(f"- {ds['title']}\n")
                        
                if report['alternative_sources']:
                    f.write(f"\n### 代替データソース\n")
                    for url in report['alternative_sources']:
                        f.write(f"- {url}\n")
                        
                if report['recommendations']:
                    f.write(f"\n### 推奨事項\n")
                    for rec in report['recommendations']:
                        f.write(f"- {rec}\n")
                        
                f.write(f"\n---\n\n")
                
        logger.info(f"\n📄 調査レポート保存完了:")
        logger.info(f"- JSON: {json_path}")
        logger.info(f"- Markdown: {report_path}")
        
        return json_path, report_path


def main():
    """メイン処理"""
    print("\n🔍 主要都市オープンデータポータル調査開始")
    print("対象: 福岡県、大阪府、東京都")
    print("="*60)
    
    investigator = MajorCitiesDataInvestigator()
    reports = investigator.run_investigation()
    
    print("\n📊 調査サマリー:")
    for city_key, report in reports.items():
        print(f"\n【{report['city']}】")
        if report['api_status']:
            if report['api_status']['available']:
                print(f"✅ CKAN API利用可能 - {report['api_status']['package_count']}データセット")
            else:
                print(f"❌ API利用不可")
        else:
            print("⚠️ API未調査")
            
        print(f"代替ソース: {len(report.get('alternative_sources', []))}件")


if __name__ == "__main__":
    main()