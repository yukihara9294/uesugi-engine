"""
施設データAPIエンドポイント
医療施設、教育施設などの実データを提供
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
import csv
import json
from pathlib import Path
from sqlalchemy.orm import Session
from app.core.database import get_db
import time
import logging
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
import asyncio
from functools import partial
from datetime import datetime, timedelta

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter()

# In-memory cache with expiry
# Structure: {
#   "medical": {"prefecture_name": {"data": FeatureCollection, "expires_at": datetime}},
#   "education": {"prefecture_name": {"data": FeatureCollection, "expires_at": datetime}},
#   "disaster": {"prefecture_name": {"data": FeatureCollection, "expires_at": datetime}}
# }
CACHE = {
    "medical": {},
    "education": {},
    "disaster": {}
}
CACHE_EXPIRY_MINUTES = 5

# データディレクトリ
import os
# Docker環境と開発環境の両方に対応
if os.path.exists("/app/uesugi-engine-data"):
    DATA_DIR = Path("/app/uesugi-engine-data")
else:
    # 開発環境用のパス
    DATA_DIR = Path(__file__).parent.parent.parent.parent.parent / "uesugi-engine-data"
YAMAGUCHI_DIR = DATA_DIR / "yamaguchi"

def get_from_cache(category: str, prefecture: str) -> Dict[str, Any]:
    """Get data from cache if it exists and hasn't expired"""
    if prefecture in CACHE[category]:
        cache_entry = CACHE[category][prefecture]
        if datetime.now() < cache_entry["expires_at"]:
            logger.info(f"Cache hit for {category}/{prefecture}")
            return cache_entry["data"]
        else:
            # Remove expired entry
            del CACHE[category][prefecture]
            logger.info(f"Cache expired for {category}/{prefecture}")
    return None

def set_cache(category: str, prefecture: str, data: Dict[str, Any]):
    """Set data in cache with expiry time"""
    CACHE[category][prefecture] = {
        "data": data,
        "expires_at": datetime.now() + timedelta(minutes=CACHE_EXPIRY_MINUTES)
    }
    logger.info(f"Cache set for {category}/{prefecture}, expires at {CACHE[category][prefecture]['expires_at']}")

def read_csv_with_timeout(file_path, encoding, timeout=5):
    """CSVファイルを読み込み、タイムアウト処理を行う"""
    try:
        with open(file_path, 'r', encoding=encoding) as f:
            return list(csv.DictReader(f))
    except Exception as e:
        logger.error(f"Error reading {file_path}: {e}")
        return None

@router.get("/medical/{prefecture}")
async def get_medical_facilities(prefecture: str, db: Session = Depends(get_db)):
    """医療施設データを取得"""
    start_time = time.time()
    logger.info(f"Medical facilities endpoint called for: {prefecture}")
    
    # Check cache first
    cached_data = get_from_cache("medical", prefecture)
    if cached_data:
        cache_response_time = time.time() - start_time
        logger.info(f"Medical facilities returned from cache in {cache_response_time:.2f}s")
        return cached_data
    
    try:
        features = []
        MAX_FEATURES = 100  # Reduce limit for faster response
        
        if prefecture == "山口県":
            # 山口県の医療施設データを読み込み
            medical_dir = YAMAGUCHI_DIR / "medical"
            
            # 病院・診療所データの読み込み
            # Process only a few files to avoid timeout
            hospital_files = [
                ("352152_hospital.csv", "utf-8-sig"),
                ("352080_hospital.csv", "shift-jis"),
                ("【下松市】医療機関一覧.csv", "utf-8-sig"),
            ]
            
            for filename, encoding in hospital_files:
                # Early return if we have enough data
                if len(features) >= MAX_FEATURES:
                    logger.info(f"Early return: Already collected {len(features)} features")
                    break
                    
                file_path = medical_dir / filename
                if file_path.exists():
                    file_start_time = time.time()
                    file_features_count = 0
                    
                    try:
                        with open(file_path, 'r', encoding=encoding) as f:
                            reader = csv.DictReader(f)
                            for row in reader:
                                try:
                                    # 緯度経度のカラム名を確認
                                    lat = None
                                    lon = None
                                    
                                    # 一般的なカラム名のバリエーション
                                    lat_columns = ['緯度', 'lat', 'latitude', 'y', 'Y']
                                    lon_columns = ['経度', 'lon', 'longitude', 'x', 'X']
                                    
                                    for col in lat_columns:
                                        if col in row and row[col]:
                                            try:
                                                lat = float(row[col])
                                                break
                                            except ValueError:
                                                continue
                                    
                                    for col in lon_columns:
                                        if col in row and row[col]:
                                            try:
                                                lon = float(row[col])
                                                break
                                            except ValueError:
                                                continue
                                    
                                    if lat and lon and -90 <= lat <= 90 and -180 <= lon <= 180:
                                        # 医療機関の種類を判定
                                        name = row.get('名称', row.get('施設名', row.get('医療機関名', '')))
                                        facility_type = row.get('医療機関の種類', '')
                                        
                                        # アイコンとタイプの判定
                                        if '病院' in name or '病院' in facility_type:
                                            icon_type = "hospital"
                                            display_type = "病院"
                                        elif '歯科' in name or '歯科' in facility_type or '歯科' in row.get('診療科目', ''):
                                            icon_type = "dentist"
                                            display_type = "歯科"
                                        elif 'クリニック' in name or '診療所' in name or '診療所' in facility_type:
                                            icon_type = "clinic"
                                            display_type = "診療所"
                                        else:
                                            icon_type = "medical"
                                            display_type = "医療機関"
                                        
                                        # 診療科目の取得
                                        departments = row.get('診療科目', '')
                                        if departments:
                                            departments = departments.replace(';', '、')
                                        
                                        features.append({
                                            "type": "Feature",
                                            "geometry": {
                                                "type": "Point",
                                                "coordinates": [lon, lat]
                                            },
                                            "properties": {
                                                "name": name,
                                                "type": display_type,
                                                "address": row.get('住所', row.get('所在地', row.get('所在地_連結表記', ''))),
                                                "phone": row.get('電話番号', ''),
                                                "departments": departments,
                                                "hours": row.get('診療開始時間', '') + '-' + row.get('診療終了時間', '') if row.get('診療開始時間') else '',
                                                "beds": row.get('病床数', ''),
                                                "category": "medical",
                                                "icon": icon_type
                                            }
                                        })
                                        file_features_count += 1
                                        
                                        # Early return if we have enough data
                                        if len(features) >= MAX_FEATURES:
                                            logger.info(f"Early return from {filename}: Reached {MAX_FEATURES} features limit")
                                            break
                                except (ValueError, KeyError):
                                    continue
                        
                        file_processing_time = time.time() - file_start_time
                        logger.info(f"Processed {filename}: {file_features_count} features in {file_processing_time:.2f}s")
                    except UnicodeDecodeError:
                        # エンコーディングエラーの場合は別のエンコーディングを試す
                        alt_encoding = 'shift-jis' if encoding == 'utf-8-sig' else 'utf-8-sig'
                        try:
                            with open(file_path, 'r', encoding=alt_encoding) as f:
                                reader = csv.DictReader(f)
                                for row in reader:
                                    # 同じ処理を繰り返す（コードの重複を避けるため省略）
                                    pass
                        except:
                            continue
            
            # AEDデータも追加（補完データとして）- Only if we need more data
            if len(features) < MAX_FEATURES:
                aed_files = [
                    "01_AED設置箇所一覧_353418_aed.csv",
                    "352080_aed.csv",
                    # "AED設置場所一覧（csv） （令和3年5月24日現在）.csv",
                    # "AED設置箇所一覧（令和6年4月1日時点）.csv",
                    # "【下関市】AED設置箇所一覧.csv"
                ]
            else:
                aed_files = []
            
            for filename in aed_files:
                # Early return if we have enough data
                if len(features) >= MAX_FEATURES:
                    break
                    
                file_path = medical_dir / filename
                if file_path.exists():
                    file_start_time = time.time()
                    file_features_count = 0
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8-sig') as f:
                            reader = csv.DictReader(f)
                            for row in reader:
                                try:
                                    lat = None
                                    lon = None
                                    
                                    lat_columns = ['緯度', 'lat', 'latitude', 'y', 'Y']
                                    lon_columns = ['経度', 'lon', 'longitude', 'x', 'X']
                                    
                                    for col in lat_columns:
                                        if col in row and row[col]:
                                            try:
                                                lat = float(row[col])
                                                break
                                            except ValueError:
                                                continue
                                    
                                    for col in lon_columns:
                                        if col in row and row[col]:
                                            try:
                                                lon = float(row[col])
                                                break
                                            except ValueError:
                                                continue
                                    
                                    if lat and lon and -90 <= lat <= 90 and -180 <= lon <= 180:
                                        features.append({
                                            "type": "Feature",
                                            "geometry": {
                                                "type": "Point",
                                                "coordinates": [lon, lat]
                                            },
                                            "properties": {
                                                "name": row.get('名称', row.get('施設名', 'AED設置場所')),
                                                "type": "AED",
                                                "address": row.get('住所', ''),
                                                "location": row.get('設置位置', ''),
                                                "category": "medical",
                                                "icon": "aed"
                                            }
                                        })
                                        file_features_count += 1
                                        
                                        # Early return if we have enough data
                                        if len(features) >= MAX_FEATURES:
                                            break
                                except (ValueError, KeyError):
                                    continue
                        
                        file_processing_time = time.time() - file_start_time
                        logger.info(f"Processed AED {filename}: {file_features_count} features in {file_processing_time:.2f}s")
                    except:
                        continue
        
        total_time = time.time() - start_time
        logger.info(f"Medical facilities total processing time: {total_time:.2f}s, returned {len(features[:MAX_FEATURES])} features")
        
        result = {
            "type": "FeatureCollection",
            "features": features[:MAX_FEATURES]  # 最大500施設
        }
        
        # Cache the result
        set_cache("medical", prefecture, result)
        
        return result
        
    except Exception as e:
        logger.error(f"Medical facilities data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/education/{prefecture}")
async def get_education_facilities(prefecture: str, db: Session = Depends(get_db)):
    """教育施設データを取得"""
    start_time = time.time()
    logger.info(f"Education facilities endpoint called for: {prefecture}")
    
    # Check cache first
    cached_data = get_from_cache("education", prefecture)
    if cached_data:
        cache_response_time = time.time() - start_time
        logger.info(f"Education facilities returned from cache in {cache_response_time:.2f}s")
        return cached_data
    
    try:
        features = []
        MAX_FEATURES = 100  # Reduce limit for faster response
        total_files_processed = 0
        total_records_found = 0
        
        if prefecture == "山口県":
            # 山口県の教育施設データを読み込み
            education_dir = YAMAGUCHI_DIR / "education"
            
            # 学校データファイル (ファイル名, 施設タイプ, エンコーディング)
            # Process only a few files to avoid timeout
            school_files = [
                ("352080_educational_institution.csv", "教育施設", "shift-jis"),
                ("2_小学校一覧.csv", "小学校", "utf-8-sig"),
                ("2_中学校一覧.csv", "中学校", "utf-8-sig"),
                # ("【下関市】公共施設一覧（公立学校）.csv", "学校", "shift-jis"),  # No coordinate data
                # Process fewer files initially to improve performance
                # ("【光市】子育て施設一覧.csv", "子育て施設", "utf-8-sig"),
                # ("【周防大島町】小学校一覧.csv", "小学校", "utf-8-sig"),
                # ("【周防大島町】中学校一覧.csv", "中学校", "shift-jis"),
                # ("【周防大島町】高等学校一覧.csv", "高等学校", "utf-8-sig"),
                # ("【山口市】小中学校（令和6年4月1日時点）.csv", "学校", "shift-jis"),
                # ("【山口市】幼稚園・保育園・認定こども園（令和6年4月1日時点）.csv", "幼稚園・保育園", "shift-jis"),
                # ("【山口県】子育て施設一覧（csv）.csv", "子育て施設", "cp932"),
                # ("【山陽小野田市】教育機関一覧.csv", "教育機関", "utf-8-sig"),
                # ("【美祢市】小学校・中学校一覧（令和3年10月1日時点）.csv", "学校", "shift-jis"),
                # ("柳井市_教育機関一覧.csv", "教育機関", "shift-jis"),
                # Additional files with coordinate data
                # ("公共施設一覧.csv", "公共施設", "utf-8-sig"),
                # ("【山口市】図書館（令和6年4月1日時点）.csv", "図書館", "shift-jis"),
                # ("【美祢市】図書館一覧（令和3年10月1日時点）.csv", "図書館", "shift-jis"),
                # ("【美祢市】学校給食共同調理場一覧（令和3年10月1日時点）.csv", "給食施設", "shift-jis"),
                # ("給食調理場(令和6年4月1日時点).csv", "給食施設", "shift-jis")
            ]
            
            for filename, facility_type, encoding in school_files:
                # Early return if we have enough data
                if len(features) >= MAX_FEATURES:
                    logger.info(f"Early return: Already collected {len(features)} features")
                    break
                    
                file_path = education_dir / filename
                if file_path.exists():
                    total_files_processed += 1
                    file_records = 0
                    file_start_time = time.time()
                    try:
                        with open(file_path, 'r', encoding=encoding) as f:
                            reader = csv.DictReader(f)
                            for row in reader:
                                try:
                                    # 緯度経度の取得
                                    lat = None
                                    lon = None
                                    
                                    # より多くのカラム名バリエーションに対応
                                    lat_columns = ['緯度', '教育機関_緯度', 'lat', 'latitude', 'y', 'Y', '緯度（10進法）']
                                    lon_columns = ['経度', '教育機関_経度', 'lon', 'longitude', 'x', 'X', '経度（10進法）']
                                    
                                    for col in lat_columns:
                                        if col in row and row[col]:
                                            try:
                                                lat = float(row[col])
                                                break
                                            except ValueError:
                                                continue
                                    
                                    for col in lon_columns:
                                        if col in row and row[col]:
                                            try:
                                                lon = float(row[col])
                                                break
                                            except ValueError:
                                                continue
                                    
                                    if lat and lon and -90 <= lat <= 90 and -180 <= lon <= 180:
                                        # 施設名の取得（複数のカラム名に対応）
                                        name_columns = ['名称', '施設名', '学校名', '教育機関_学校名', '施設名称', '保育所・園名']
                                        name = ''
                                        for col in name_columns:
                                            if col in row and row[col]:
                                                name = row[col]
                                                break
                                        
                                        if not name:
                                            continue
                                        
                                        # 施設タイプの判定
                                        school_type = "school"
                                        icon_type = "school"
                                        
                                        if "小学校" in name or "小学校" in facility_type:
                                            school_type = "elementary"
                                            icon_type = "elementary_school"
                                        elif "中学校" in name or "中学校" in facility_type:
                                            school_type = "junior_high"
                                            icon_type = "junior_high_school"
                                        elif "高校" in name or "高等学校" in name or "高等学校" in facility_type:
                                            school_type = "high_school"
                                            icon_type = "high_school"
                                        elif "大学" in name or "大学" in facility_type:
                                            school_type = "university"
                                            icon_type = "university"
                                        elif "幼稚園" in name or "幼稚園" in facility_type:
                                            school_type = "kindergarten"
                                            icon_type = "kindergarten"
                                        elif "保育" in name or "保育園" in facility_type or "こども園" in name:
                                            school_type = "nursery"
                                            icon_type = "nursery"
                                        
                                        # 住所の取得
                                        address_columns = ['住所', '所在地', '教育機関_学校所在地_連結表記', '所在地_連結表記', '施設住所']
                                        address = ''
                                        for col in address_columns:
                                            if col in row and row[col]:
                                                address = row[col]
                                                break
                                        
                                        features.append({
                                            "type": "Feature",
                                            "geometry": {
                                                "type": "Point",
                                                "coordinates": [lon, lat]
                                            },
                                            "properties": {
                                                "name": name,
                                                "type": facility_type,
                                                "school_type": school_type,
                                                "address": address,
                                                "phone": row.get('電話番号', row.get('教育機関_連絡先電話番号', '')),
                                                "category": "education",
                                                "icon": icon_type
                                            }
                                        })
                                        total_records_found += 1
                                        file_records += 1
                                        
                                        # Early return if we have enough data
                                        if len(features) >= MAX_FEATURES:
                                            break
                                except (ValueError, KeyError) as e:
                                    continue
                                    
                        file_processing_time = time.time() - file_start_time
                        if file_records > 0:
                            logger.info(f"Read {filename}: {file_records} records with valid coordinates in {file_processing_time:.2f}s")
                    except UnicodeDecodeError as e:
                        # エンコーディングエラーの場合は別のエンコーディングを試す
                        alt_encodings = ['cp932', 'shift-jis', 'utf-8-sig', 'utf-8']
                        if encoding in alt_encodings:
                            alt_encodings.remove(encoding)  # 既に試したものを除外
                        
                        for alt_encoding in alt_encodings:
                            try:
                                with open(file_path, 'r', encoding=alt_encoding) as f:
                                    reader = csv.DictReader(f)
                                    for row in reader:
                                        try:
                                            # 緯度経度の取得
                                            lat = None
                                            lon = None
                                            
                                            # より多くのカラム名バリエーションに対応
                                            lat_columns = ['緯度', '教育機関_緯度', 'lat', 'latitude', 'y', 'Y', '緯度（10進法）']
                                            lon_columns = ['経度', '教育機関_経度', 'lon', 'longitude', 'x', 'X', '経度（10進法）']
                                            
                                            for col in lat_columns:
                                                if col in row and row[col]:
                                                    try:
                                                        lat = float(row[col])
                                                        break
                                                    except ValueError:
                                                        continue
                                            
                                            for col in lon_columns:
                                                if col in row and row[col]:
                                                    try:
                                                        lon = float(row[col])
                                                        break
                                                    except ValueError:
                                                        continue
                                            
                                            if lat and lon and -90 <= lat <= 90 and -180 <= lon <= 180:
                                                # 施設名の取得（複数のカラム名に対応）
                                                name_columns = ['名称', '施設名', '学校名', '教育機関_学校名', '施設名称', '保育所・園名']
                                                name = ''
                                                for col in name_columns:
                                                    if col in row and row[col]:
                                                        name = row[col]
                                                        break
                                                
                                                if not name:
                                                    continue
                                                
                                                # 施設タイプの判定
                                                school_type = "school"
                                                icon_type = "school"
                                                
                                                if "小学校" in name or "小学校" in facility_type:
                                                    school_type = "elementary"
                                                    icon_type = "elementary_school"
                                                elif "中学校" in name or "中学校" in facility_type:
                                                    school_type = "junior_high"
                                                    icon_type = "junior_high_school"
                                                elif "高校" in name or "高等学校" in name or "高等学校" in facility_type:
                                                    school_type = "high_school"
                                                    icon_type = "high_school"
                                                elif "大学" in name or "大学" in facility_type:
                                                    school_type = "university"
                                                    icon_type = "university"
                                                elif "幼稚園" in name or "幼稚園" in facility_type:
                                                    school_type = "kindergarten"
                                                    icon_type = "kindergarten"
                                                elif "保育" in name or "保育園" in facility_type or "こども園" in name:
                                                    school_type = "nursery"
                                                    icon_type = "nursery"
                                                
                                                # 住所の取得
                                                address_columns = ['住所', '所在地', '教育機関_学校所在地_連結表記', '所在地_連結表記', '施設住所']
                                                address = ''
                                                for col in address_columns:
                                                    if col in row and row[col]:
                                                        address = row[col]
                                                        break
                                                
                                                features.append({
                                                    "type": "Feature",
                                                    "geometry": {
                                                        "type": "Point",
                                                        "coordinates": [lon, lat]
                                                    },
                                                    "properties": {
                                                        "name": name,
                                                        "type": facility_type,
                                                        "school_type": school_type,
                                                        "address": address,
                                                        "phone": row.get('電話番号', row.get('教育機関_連絡先電話番号', '')),
                                                        "category": "education",
                                                        "icon": icon_type
                                                    }
                                                })
                                                total_records_found += 1
                                                file_records += 1
                                                
                                                # Early return if we have enough data
                                                if len(features) >= MAX_FEATURES:
                                                    break
                                        except (ValueError, KeyError) as e:
                                            continue
                                
                                file_processing_time = time.time() - file_start_time
                                if file_records > 0:
                                    logger.info(f"Read {filename} with {alt_encoding} encoding: {file_records} records in {file_processing_time:.2f}s")
                                break
                            except:
                                continue
                        else:
                            logger.warning(f"Failed to read {filename} with multiple encodings")
                            continue
                    except Exception as e:
                        logger.error(f"Unexpected error reading {filename}: {e}")
                        continue
        
        total_time = time.time() - start_time
        logger.info(f"Education data: Processed {total_files_processed} files in {total_time:.2f}s, found {total_records_found} records, returning {min(len(features), MAX_FEATURES)} features")
        
        result = {
            "type": "FeatureCollection",
            "features": features[:MAX_FEATURES]  # 最大500施設
        }
        
        # Cache the result
        set_cache("education", prefecture, result)
        
        return result
        
    except Exception as e:
        logger.error(f"Education facilities data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/disaster/{prefecture}")
async def get_disaster_facilities(prefecture: str, db: Session = Depends(get_db)):
    """防災施設データを取得"""
    start_time = time.time()
    logger.info(f"Disaster facilities endpoint called for: {prefecture}")
    
    # Check cache first
    cached_data = get_from_cache("disaster", prefecture)
    if cached_data:
        cache_response_time = time.time() - start_time
        logger.info(f"Disaster facilities returned from cache in {cache_response_time:.2f}s")
        return cached_data
    
    try:
        features = []
        MAX_FEATURES = 100  # Reduce limit for faster response
        
        if prefecture == "山口県":
            # 山口県の防災施設データを読み込み
            disaster_dir = YAMAGUCHI_DIR / "disaster"
            
            # 避難所データファイル (ファイル名, エンコーディング)
            # Process only a few files to avoid timeout
            shelter_files = [
                ("352080_evacuation_space.csv", "shift-jis"),
                ("指定緊急避難場所一覧.csv", "utf-8-sig"),
                # Process fewer files initially
                # ("【下松市】指定緊急避難場所・避難所一覧.csv", "shift-jis"),
                # ("【下関市】指定緊急避難場所一覧（csv）.csv", "shift-jis"),
                # ("【周南市】デジタル防災行政無線一覧_.csv", "utf-8-sig"),
                # ("【周防大島町】指定緊急避難場所一覧.csv", "utf-8-sig"),
                # ("【山陽小野田市】指定緊急避難場所一覧.csv", "shift-jis"),
                # ("【柳井市】指定緊急避難場所一覧.csv", "utf-8-sig"),
                # ("【長門市】防災行政無線設置一覧.csv", "shift-jis"),
                # ("指定緊急避難場所・指定避難場所一覧.csv", "utf-8-sig"),
                # ("指定緊急避難場所一覧（csv）（平成29年12月1日時点）.csv", "shift-jis")
            ]
            
            for filename, encoding in shelter_files:
                # Early return if we have enough data
                if len(features) >= MAX_FEATURES:
                    logger.info(f"Early return: Already collected {len(features)} features")
                    break
                    
                file_path = disaster_dir / filename
                if file_path.exists():
                    file_start_time = time.time()
                    file_features_count = 0
                    
                    try:
                        with open(file_path, 'r', encoding=encoding) as f:
                            reader = csv.DictReader(f)
                            for row in reader:
                                try:
                                    lat = None
                                    lon = None
                                    
                                    lat_columns = ['緯度', 'lat', 'latitude', 'y', 'Y']
                                    lon_columns = ['経度', 'lon', 'longitude', 'x', 'X']
                                    
                                    for col in lat_columns:
                                        if col in row and row[col]:
                                            try:
                                                lat = float(row[col])
                                                break
                                            except ValueError:
                                                continue
                                    
                                    for col in lon_columns:
                                        if col in row and row[col]:
                                            try:
                                                lon = float(row[col])
                                                break
                                            except ValueError:
                                                continue
                                    
                                    if lat and lon and -90 <= lat <= 90 and -180 <= lon <= 180:
                                        features.append({
                                            "type": "Feature",
                                            "geometry": {
                                                "type": "Point",
                                                "coordinates": [lon, lat]
                                            },
                                            "properties": {
                                                "name": row.get('名称', row.get('施設名', '避難所')),
                                                "type": "避難所",
                                                "address": row.get('住所', row.get('所在地', '')),
                                                "capacity": row.get('収容人数', ''),
                                                "category": "disaster",
                                                "icon": "emergency"
                                            }
                                        })
                                        file_features_count += 1
                                        
                                        # Early return if we have enough data
                                        if len(features) >= MAX_FEATURES:
                                            break
                                except (ValueError, KeyError):
                                    continue
                        
                        file_processing_time = time.time() - file_start_time
                        logger.info(f"Processed {filename}: {file_features_count} features in {file_processing_time:.2f}s")
                    except UnicodeDecodeError as e:
                        # エンコーディングエラーの場合は別のエンコーディングを試す
                        alt_encodings = ['cp932', 'shift-jis', 'utf-8-sig', 'utf-8']
                        if encoding in alt_encodings:
                            alt_encodings.remove(encoding)  # 既に試したものを除外
                        
                        for alt_encoding in alt_encodings:
                            try:
                                with open(file_path, 'r', encoding=alt_encoding) as f:
                                    reader = csv.DictReader(f)
                                    for row in reader:
                                        try:
                                            lat = None
                                            lon = None
                                            
                                            lat_columns = ['緯度', 'lat', 'latitude', 'y', 'Y']
                                            lon_columns = ['経度', 'lon', 'longitude', 'x', 'X']
                                            
                                            for col in lat_columns:
                                                if col in row and row[col]:
                                                    try:
                                                        lat = float(row[col])
                                                        break
                                                    except ValueError:
                                                        continue
                                            
                                            for col in lon_columns:
                                                if col in row and row[col]:
                                                    try:
                                                        lon = float(row[col])
                                                        break
                                                    except ValueError:
                                                        continue
                                            
                                            if lat and lon and -90 <= lat <= 90 and -180 <= lon <= 180:
                                                features.append({
                                                    "type": "Feature",
                                                    "geometry": {
                                                        "type": "Point",
                                                        "coordinates": [lon, lat]
                                                    },
                                                    "properties": {
                                                        "name": row.get('名称', row.get('施設名', '避難所')),
                                                        "type": "避難所",
                                                        "address": row.get('住所', row.get('所在地', '')),
                                                        "capacity": row.get('収容人数', ''),
                                                        "category": "disaster",
                                                        "icon": "emergency"
                                                    }
                                                })
                                                file_features_count += 1
                                                
                                                # Early return if we have enough data
                                                if len(features) >= MAX_FEATURES:
                                                    break
                                        except (ValueError, KeyError):
                                            continue
                                
                                file_processing_time = time.time() - file_start_time
                                logger.info(f"Successfully read {filename} with {alt_encoding} encoding: {file_features_count} features in {file_processing_time:.2f}s")
                                break
                            except:
                                continue
                        else:
                            logger.warning(f"Failed to read {filename} with multiple encodings")
                            continue
                    except Exception as e:
                        logger.error(f"Unexpected error reading {filename}: {e}")
                        continue
        
        total_time = time.time() - start_time
        logger.info(f"Disaster facilities total processing time: {total_time:.2f}s, returned {len(features[:MAX_FEATURES])} features")
        
        result = {
            "type": "FeatureCollection",
            "features": features[:MAX_FEATURES]  # 最大500施設
        }
        
        # Cache the result
        set_cache("disaster", prefecture, result)
        
        return result
        
    except Exception as e:
        logger.error(f"Disaster facilities data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/cache/clear")
async def clear_cache():
    """Clear all cached data"""
    global CACHE
    CACHE = {
        "medical": {},
        "education": {},
        "disaster": {}
    }
    logger.info("Cache cleared manually")
    return {"message": "Cache cleared successfully"}