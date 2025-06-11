#!/usr/bin/env python3
"""
6地域データ統合処理スクリプト（簡易版）
外部ライブラリ依存なしバージョン
"""
import json
import csv
from pathlib import Path
import logging
from datetime import datetime
import os

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SixRegionsDataIntegratorSimple:
    """6地域データ統合クラス（簡易版）"""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.data_dir = self.base_dir / "uesugi-engine-data"
        self.integrated_dir = self.data_dir / "6regions_integrated"
        self.integrated_dir.mkdir(parents=True, exist_ok=True)
        
        # 地域情報
        self.regions = {
            "hiroshima": {"name": "広島県", "code": "34"},
            "yamaguchi": {"name": "山口県", "code": "35"},
            "fukuoka": {"name": "福岡県", "code": "40"},
            "osaka": {"name": "大阪府", "code": "27"},
            "tokyo": {"name": "東京都", "code": "13"},
            "okayama": {"name": "岡山県", "code": "33"}
        }
        
    def analyze_collected_data(self):
        """収集済みデータの分析"""
        logger.info("収集済みデータの分析中...")
        
        analysis_results = {
            "timestamp": datetime.now().isoformat(),
            "regions": {},
            "data_summary": {
                "total_files": 0,
                "by_region": {},
                "by_type": {}
            }
        }
        
        for region_key, region_info in self.regions.items():
            region_dir = self.data_dir / region_key
            region_analysis = {
                "name": region_info["name"],
                "code": region_info["code"],
                "exists": region_dir.exists(),
                "data_categories": {}
            }
            
            if region_dir.exists():
                # カテゴリ別にファイル数をカウント
                for category_dir in region_dir.iterdir():
                    if category_dir.is_dir():
                        files = list(category_dir.glob("*"))
                        file_count = len(files)
                        
                        if file_count > 0:
                            region_analysis["data_categories"][category_dir.name] = {
                                "file_count": file_count,
                                "sample_files": [f.name for f in files[:3]],
                                "total_size": sum(f.stat().st_size for f in files)
                            }
                            
                            # 統計更新
                            analysis_results["data_summary"]["total_files"] += file_count
                            
                            if region_key not in analysis_results["data_summary"]["by_region"]:
                                analysis_results["data_summary"]["by_region"][region_key] = 0
                            analysis_results["data_summary"]["by_region"][region_key] += file_count
                            
                            if category_dir.name not in analysis_results["data_summary"]["by_type"]:
                                analysis_results["data_summary"]["by_type"][category_dir.name] = 0
                            analysis_results["data_summary"]["by_type"][category_dir.name] += file_count
                            
            analysis_results["regions"][region_key] = region_analysis
            
        return analysis_results
        
    def integrate_json_data(self):
        """JSONファイルの統合"""
        logger.info("JSONデータ統合開始...")
        
        integrated_json = {
            "metadata": {
                "created_at": datetime.now().isoformat(),
                "version": "1.0",
                "regions": list(self.regions.keys())
            },
            "data": {}
        }
        
        # 各地域のJSONファイルを統合
        for region_key in self.regions:
            region_dir = self.data_dir / region_key
            region_data = []
            
            if region_dir.exists():
                # JSONファイルを探して統合
                for json_file in region_dir.rglob("*.json"):
                    try:
                        with open(json_file, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            
                        region_data.append({
                            "file": str(json_file.relative_to(self.data_dir)),
                            "type": self._guess_data_type(json_file),
                            "record_count": self._count_records(data),
                            "sample": self._get_sample_data(data)
                        })
                    except Exception as e:
                        logger.warning(f"JSONファイル読み込みスキップ ({json_file}): {e}")
                        
            if region_data:
                integrated_json["data"][region_key] = region_data
                
        # 統合結果を保存
        output_file = self.integrated_dir / f"integrated_json_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(integrated_json, f, ensure_ascii=False, indent=2)
            
        logger.info(f"JSON統合完了: {output_file}")
        
        return integrated_json
        
    def _guess_data_type(self, file_path):
        """ファイルパスからデータタイプを推測"""
        path_str = str(file_path).lower()
        
        if "population" in path_str or "人口" in path_str:
            return "population"
        elif "tourism" in path_str or "観光" in path_str:
            return "tourism"
        elif "transport" in path_str or "bus" in path_str or "railway" in path_str:
            return "transport"
        elif "event" in path_str or "イベント" in path_str:
            return "events"
        elif "policy" in path_str or "政策" in path_str:
            return "policy"
        else:
            return "other"
            
    def _count_records(self, data):
        """JSONデータのレコード数をカウント"""
        if isinstance(data, list):
            return len(data)
        elif isinstance(data, dict):
            # 最も長いリストを探す
            max_length = 1
            for value in data.values():
                if isinstance(value, list):
                    max_length = max(max_length, len(value))
            return max_length
        return 1
        
    def _get_sample_data(self, data):
        """データのサンプルを取得"""
        if isinstance(data, list) and len(data) > 0:
            return data[0] if isinstance(data[0], (dict, list)) else str(data[0])[:100]
        elif isinstance(data, dict):
            # キーのリストを返す
            return list(data.keys())[:10]
        return None
        
    def create_unified_catalog(self, analysis_results):
        """統一カタログの作成"""
        logger.info("統一カタログ作成中...")
        
        catalog = {
            "title": "Uesugi Engine 6地域統合データカタログ",
            "description": "広島県、山口県、福岡県、大阪府、東京都、岡山県の統合データカタログ",
            "created_at": datetime.now().isoformat(),
            "regions": [],
            "datasets": [],
            "statistics": analysis_results["data_summary"]
        }
        
        # 地域情報の追加
        for region_key, region_analysis in analysis_results["regions"].items():
            region_info = {
                "id": region_key,
                "name": region_analysis["name"],
                "code": region_analysis["code"],
                "has_data": region_analysis["exists"] and len(region_analysis["data_categories"]) > 0,
                "data_categories": list(region_analysis["data_categories"].keys()),
                "file_count": analysis_results["data_summary"]["by_region"].get(region_key, 0)
            }
            catalog["regions"].append(region_info)
            
            # データセット情報の追加
            if region_analysis["exists"]:
                for category, category_info in region_analysis["data_categories"].items():
                    dataset = {
                        "region": region_key,
                        "region_name": region_analysis["name"],
                        "category": category,
                        "file_count": category_info["file_count"],
                        "total_size": category_info["total_size"],
                        "sample_files": category_info["sample_files"]
                    }
                    catalog["datasets"].append(dataset)
                    
        # カタログ保存
        catalog_file = self.integrated_dir / f"unified_catalog_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(catalog_file, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, ensure_ascii=False, indent=2)
            
        logger.info(f"統一カタログ作成完了: {catalog_file}")
        
        return catalog_file
        
    def generate_integration_report(self, analysis_results, integrated_json, catalog_file):
        """統合レポート生成"""
        report_lines = [
            "="*80,
            "6地域データ統合レポート",
            "="*80,
            f"実行日時: {datetime.now()}",
            "",
            "【収集データ概要】",
            f"総ファイル数: {analysis_results['data_summary']['total_files']}",
            "",
            "【地域別収集状況】"
        ]
        
        # 地域別状況
        for region_key, region_analysis in analysis_results["regions"].items():
            status = "✅" if region_analysis["exists"] and region_analysis["data_categories"] else "❌"
            file_count = analysis_results["data_summary"]["by_region"].get(region_key, 0)
            report_lines.append(f"{status} {region_analysis['name']} ({region_analysis['code']}): {file_count}ファイル")
            
            if region_analysis["data_categories"]:
                for category, info in region_analysis["data_categories"].items():
                    report_lines.append(f"    - {category}: {info['file_count']}ファイル")
                    
        # データタイプ別統計
        report_lines.extend([
            "",
            "【データタイプ別統計】"
        ])
        
        for data_type, count in analysis_results["data_summary"]["by_type"].items():
            report_lines.append(f"- {data_type}: {count}ファイル")
            
        # 統合結果
        report_lines.extend([
            "",
            "【統合処理結果】",
            f"- JSONデータ統合: {len(integrated_json['data'])}地域",
            f"- 統一カタログ: {catalog_file.name}",
            "",
            "【次のアクション】",
            "1. 不足地域のデータ収集",
            "   - 大阪府、東京都、岡山県の実データ収集が必要",
            "2. データ品質の検証",
            "3. PostgreSQLへのインポート準備",
            "4. フロントエンドAPIとの接続テスト",
            "",
            "="*80
        ])
        
        # レポート保存
        report_file = self.integrated_dir / f"integration_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report_lines))
            
        # コンソール出力
        print('\n'.join(report_lines))
        
        return report_file
        
    def generate_sql_schema(self):
        """SQL スキーマ生成"""
        logger.info("SQLスキーマ生成中...")
        
        schema_sql = f"""-- 6地域統合データベーススキーマ
-- Generated: {datetime.now().isoformat()}

-- 地域マスタテーブル
CREATE TABLE IF NOT EXISTS regions (
    region_code VARCHAR(2) PRIMARY KEY,
    region_name VARCHAR(50) NOT NULL,
    region_name_en VARCHAR(50),
    has_data BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 地域マスタデータ
INSERT INTO regions (region_code, region_name, region_name_en, has_data) VALUES
    ('34', '広島県', 'Hiroshima', TRUE),
    ('35', '山口県', 'Yamaguchi', TRUE),
    ('40', '福岡県', 'Fukuoka', FALSE),
    ('27', '大阪府', 'Osaka', FALSE),
    ('13', '東京都', 'Tokyo', FALSE),
    ('33', '岡山県', 'Okayama', FALSE)
ON CONFLICT (region_code) DO UPDATE
    SET has_data = EXCLUDED.has_data,
        last_updated = CURRENT_TIMESTAMP;

-- データカタログテーブル
CREATE TABLE IF NOT EXISTS data_catalog (
    id SERIAL PRIMARY KEY,
    region_code VARCHAR(2) REFERENCES regions(region_code),
    category VARCHAR(50),
    file_name VARCHAR(255),
    file_path TEXT,
    file_size BIGINT,
    record_count INTEGER,
    data_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_catalog_region ON data_catalog(region_code);
CREATE INDEX idx_catalog_category ON data_catalog(category);
CREATE INDEX idx_catalog_type ON data_catalog(data_type);

-- ビューの作成
CREATE OR REPLACE VIEW v_regional_data_summary AS
SELECT 
    r.region_code,
    r.region_name,
    r.has_data,
    COUNT(dc.id) as total_files,
    COALESCE(SUM(dc.file_size), 0) as total_size,
    COALESCE(SUM(dc.record_count), 0) as total_records
FROM regions r
LEFT JOIN data_catalog dc ON r.region_code = dc.region_code
GROUP BY r.region_code, r.region_name, r.has_data
ORDER BY r.region_code;

-- 統合データアクセス用のストアドファンクション
CREATE OR REPLACE FUNCTION get_regional_data(
    p_region_code VARCHAR(2) DEFAULT NULL,
    p_category VARCHAR(50) DEFAULT NULL,
    p_data_type VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    region_name VARCHAR,
    category VARCHAR,
    file_name VARCHAR,
    record_count INTEGER,
    data_type VARCHAR
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.region_name,
        dc.category,
        dc.file_name,
        dc.record_count,
        dc.data_type
    FROM data_catalog dc
    JOIN regions r ON dc.region_code = r.region_code
    WHERE 
        (p_region_code IS NULL OR dc.region_code = p_region_code)
        AND (p_category IS NULL OR dc.category = p_category)
        AND (p_data_type IS NULL OR dc.data_type = p_data_type)
    ORDER BY r.region_code, dc.category, dc.file_name;
END;
$$ LANGUAGE plpgsql;
"""
        
        # スキーマファイル保存
        schema_file = self.integrated_dir / "unified_schema.sql"
        with open(schema_file, 'w', encoding='utf-8') as f:
            f.write(schema_sql)
            
        logger.info(f"SQLスキーマ生成完了: {schema_file}")
        
        return schema_file


def main():
    """メイン処理"""
    print("\n🔄 6地域データ統合処理（簡易版）")
    print("="*80)
    
    integrator = SixRegionsDataIntegratorSimple()
    
    try:
        # 1. 収集済みデータの分析
        logger.info("ステップ1: 収集済みデータの分析...")
        analysis_results = integrator.analyze_collected_data()
        
        # 2. JSONデータの統合
        logger.info("\nステップ2: JSONデータの統合...")
        integrated_json = integrator.integrate_json_data()
        
        # 3. 統一カタログ作成
        logger.info("\nステップ3: 統一カタログ作成...")
        catalog_file = integrator.create_unified_catalog(analysis_results)
        
        # 4. SQLスキーマ生成
        logger.info("\nステップ4: SQLスキーマ生成...")
        schema_file = integrator.generate_sql_schema()
        
        # 5. 統合レポート生成
        logger.info("\nステップ5: 統合レポート生成...")
        report_file = integrator.generate_integration_report(
            analysis_results, integrated_json, catalog_file
        )
        
        print(f"\n✅ 処理完了！")
        print(f"統合ディレクトリ: {integrator.integrated_dir}")
        print(f"生成ファイル:")
        print(f"  - カタログ: {catalog_file.name}")
        print(f"  - スキーマ: {schema_file.name}")
        print(f"  - レポート: {report_file.name}")
        
    except Exception as e:
        logger.error(f"処理中にエラーが発生しました: {e}", exc_info=True)
        
    print("\n" + "="*80)


if __name__ == "__main__":
    main()