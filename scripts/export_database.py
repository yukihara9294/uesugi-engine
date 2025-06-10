#!/usr/bin/env python3
"""
データベースの内容をCSVファイルにエクスポートするスクリプト
非エンジニアの共同開発者がデータを確認できるようにする
"""
import os
import psycopg2
import csv
from datetime import datetime

# データベース接続情報
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'uesugi_heatmap',
    'user': 'postgres',
    'password': 'postgres'
}

# エクスポート先ディレクトリ
EXPORT_DIR = 'data/exports'

def export_table_to_csv(connection, table_name, output_file):
    """テーブルの内容をCSVファイルにエクスポート"""
    try:
        cursor = connection.cursor()
        
        # テーブルの全データを取得
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        
        # カラム名を取得
        cursor.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '{table_name}' 
            ORDER BY ordinal_position
        """)
        columns = [row[0] for row in cursor.fetchall()]
        
        # CSVファイルに書き込み
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(columns)
            writer.writerows(rows)
        
        print(f"✓ {table_name} を {output_file} にエクスポートしました")
        return True
        
    except Exception as e:
        print(f"✗ {table_name} のエクスポートに失敗: {e}")
        return False
    finally:
        cursor.close()

def main():
    """メイン処理"""
    # エクスポートディレクトリを作成
    os.makedirs(EXPORT_DIR, exist_ok=True)
    
    # データベースに接続
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("データベースに接続しました")
        
        # 現在の日時をファイル名に含める
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # エクスポートするテーブル一覧
        tables = [
            'heatmap_data',
            'mobility_data',
            'events',
            'landmarks',
            'weather_data'
        ]
        
        # 各テーブルをエクスポート
        for table in tables:
            output_file = os.path.join(EXPORT_DIR, f"{table}_{timestamp}.csv")
            export_table_to_csv(conn, table, output_file)
        
        # サマリーファイルを作成
        summary_file = os.path.join(EXPORT_DIR, f"database_summary_{timestamp}.txt")
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write(f"Uesugi Engine データベースエクスポート\\n")
            f.write(f"エクスポート日時: {datetime.now().strftime('%Y年%m月%d日 %H:%M:%S')}\\n\\n")
            f.write(f"エクスポートされたテーブル:\\n")
            for table in tables:
                f.write(f"- {table}\\n")
            f.write(f"\\n各ファイルはCSV形式で、ExcelやGoogleスプレッドシートで開くことができます。\\n")
        
        print(f"\\n✓ すべてのエクスポートが完了しました")
        print(f"✓ ファイルは {EXPORT_DIR} に保存されました")
        
    except psycopg2.OperationalError:
        print("エラー: データベースに接続できません")
        print("Dockerコンテナが起動していることを確認してください")
        
    except Exception as e:
        print(f"エラー: {e}")
        
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()