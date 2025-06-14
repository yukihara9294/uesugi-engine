# 人流データ分析システム 詳細仕様書

最終更新: 2025-06-14  
作成者: Claude Code

## 目次
1. [概要](#概要)
2. [データ形式詳細](#データ形式詳細)
3. [データ生成手法](#データ生成手法)
4. [地域別実装状況](#地域別実装状況)
5. [統計的推定モデル](#統計的推定モデル)
6. [データ統合アーキテクチャ](#データ統合アーキテクチャ)
7. [今後の拡張計画](#今後の拡張計画)

## 概要

Uesugi Engineの人流データシステムは、実際の統計データと高度な推定モデルを組み合わせて、リアルタイムに近い人流可視化を実現しています。本システムは、マクロレベルの統計データからミクロレベルの移動パターンを推定し、視覚的に表現することを目的としています。

## データ形式詳細

### 1. フロー（Flows）データ構造

フローデータは、地点間の人の移動を表現するLineString型のGeoJSONデータです。

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [132.4753, 34.3974],  // 起点（広島駅）
          [132.3196, 34.2960]   // 終点（宮島）
        ]
      },
      "properties": {
        // 基本属性
        "origin_name": "広島駅",
        "destination_name": "宮島",
        "volume": 30000,              // 実際の移動人数（日次）
        "intensity": 85,              // 正規化値（0-100）
        "flow_type": "tourism",       // 移動タイプ
        
        // 可視化属性
        "color": "#FF00FF",           // フロータイプに基づく色
        "lineWidth": 2.5,             // 線の太さ（正規化値に基づく）
        "opacity": 0.8,               // 透明度
        
        // メタデータ
        "distance_km": 25.3,          // 距離
        "average_time_minutes": 45,   // 平均移動時間
        "peak_hours": [9, 10, 15, 16], // ピーク時間帯
        "confidence_score": 0.85      // 推定精度
      }
    }
  ]
}
```

### 2. パーティクル（Particles）データ構造

パーティクルは、フローに沿って移動する個々の要素を表現するPoint型のGeoJSONデータです。

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [132.4753, 34.3974]  // 現在位置
      },
      "properties": {
        // 移動情報
        "origin_lon": 132.4753,
        "origin_lat": 34.3974,
        "destination_lon": 132.3196,
        "destination_lat": 34.2960,
        "control_lon": 132.3975,      // ベジエ曲線制御点
        "control_lat": 34.3467,
        "progress": 0.0,               // 移動進捗（0-1）
        
        // 表示属性
        "size": 2.5,                   // パーティクルサイズ
        "color": "#FF00FF",            // 色（フロータイプに基づく）
        "speed": 0.003,                // アニメーション速度
        
        // 関連情報
        "flow_index": 0,               // 所属するフローのインデックス
        "particle_index": 0,           // パーティクル番号
        "flow_type": "tourism",        // 移動タイプ
        "flow_volume": 30000,          // 所属フローの総量
        
        // 特殊タイプ（渋滞エリア用）
        "is_circular": false,          // 円運動フラグ
        "center_lon": null,            // 円運動中心（渋滞ポイント用）
        "center_lat": null,
        "orbit_radius": null,          // 回転半径
        "angle_offset": null           // 初期角度
      }
    }
  ]
}
```

### 3. フロータイプ分類

| タイプ | 説明 | 色 | 特徴 |
|--------|------|-----|------|
| commute | 通勤・通学 | #00FFFF（シアン） | 朝夕にピーク、平日に多い |
| tourism | 観光 | #FF00FF（マゼンタ） | 休日に多い、季節変動あり |
| general | 一般移動 | #FFFF00（イエロー） | 時間帯による変動少ない |
| business | ビジネス | #00FF00（グリーン） | 平日日中に多い |

## データ生成手法

### 1. 重力モデル（Gravity Model）

重力モデルは、物理学の重力の法則を応用して、2地点間の移動量を推定します。

```python
def calculate_flow_volume(origin, destination, stats):
    """
    流動量 = k × (起点の魅力度 × 終点の魅力度) / 距離^α
    
    Parameters:
    - origin: 起点情報（人口、施設等）
    - destination: 終点情報
    - stats: 統計データ
    
    Returns:
    - flow_volume: 推定流動量
    """
    # 魅力度の計算
    origin_attraction = get_attraction_score(origin, stats)
    dest_attraction = get_attraction_score(destination, stats)
    
    # 距離の計算
    distance = calculate_distance(origin.coords, destination.coords)
    
    # 重力モデルの適用
    k = 1.0  # 調整係数
    alpha = 1.5  # 距離減衰パラメータ
    flow_volume = k * (origin_attraction * dest_attraction) / (distance ** alpha)
    
    return flow_volume
```

### 2. 魅力度スコア計算

各地点の魅力度（発生力・吸引力）は、施設タイプと利用者数データに基づいて計算されます。

```python
def get_attraction_score(location, stats):
    """
    地点の魅力度を計算
    
    スコア要素:
    - 駅利用者数
    - 人口密度
    - 施設タイプ（観光地、商業施設等）
    - 時間帯別補正
    """
    base_score = 1000  # 基本スコア
    
    # 駅の場合
    if location.name in stats.major_stations_daily:
        base_score = stats.major_stations_daily[location.name] * 0.1
    
    # 観光地の場合
    elif location.name in stats.tourist_spots_daily:
        base_score = stats.tourist_spots_daily[location.name] * 0.15
    
    # キーワードベース推定
    elif "駅" in location.name:
        base_score = 5000
    elif "空港" in location.name:
        base_score = 15000
    elif "大学" in location.name:
        base_score = 8000
    elif "市役所" in location.name:
        base_score = 3000
    
    return base_score
```

### 3. 時間帯補正

移動パターンは時間帯によって大きく変動するため、時間帯別の補正を適用します。

```python
def apply_time_correction(base_flow, hour, flow_type):
    """
    時間帯による流動量補正
    """
    time_patterns = {
        "commute": {
            "peak_hours": [7, 8, 18, 19],
            "peak_multiplier": 2.0,
            "off_peak_multiplier": 0.3
        },
        "tourism": {
            "peak_hours": [10, 11, 14, 15, 16],
            "peak_multiplier": 1.5,
            "off_peak_multiplier": 0.5
        },
        "general": {
            "peak_hours": list(range(9, 21)),
            "peak_multiplier": 1.2,
            "off_peak_multiplier": 0.8
        }
    }
    
    pattern = time_patterns.get(flow_type, time_patterns["general"])
    
    if hour in pattern["peak_hours"]:
        return base_flow * pattern["peak_multiplier"]
    else:
        return base_flow * pattern["off_peak_multiplier"]
```

### 4. 距離ベースパーティクル生成

パーティクルの数と速度は、移動距離に応じて最適化されます。

```python
def generate_particles_for_flow(flow, num_base_particles):
    """
    距離に基づくパーティクル生成
    
    近距離（<5km）: 少なめ、ゆっくり
    中距離（5-20km）: 標準
    遠距離（>20km）: 多め、速め
    """
    distance = flow.distance_km
    
    # パーティクル数の調整
    if distance < 5:
        particle_multiplier = 0.3
        speed_multiplier = 0.15
    elif distance > 20:
        particle_multiplier = 2.0
        speed_multiplier = 0.5
    else:
        particle_multiplier = 1.0
        speed_multiplier = 0.33
    
    adjusted_num = int(num_base_particles * particle_multiplier)
    
    particles = []
    for i in range(adjusted_num):
        particle = {
            "position": i / adjusted_num,  # 均等配置
            "speed": (0.003 + random() * 0.005) * speed_multiplier,
            "size": 2 + flow.normalized_volume * 2,
            "color": get_flow_color(flow.type)
        }
        particles.append(particle)
    
    return particles
```

### 5. ベジエ曲線による自然な経路生成

直線的な移動ではなく、自然な曲線を描く経路を生成します。

```python
def create_bezier_path(origin, destination):
    """
    2次ベジエ曲線で自然な移動経路を生成
    """
    # 中間点の計算
    mid_lon = (origin[0] + destination[0]) / 2
    mid_lat = (origin[1] + destination[1]) / 2
    
    # 曲線の湾曲度（ランダム要素を追加）
    curve_factor = random.uniform(-0.02, 0.02)
    control_lon = mid_lon + curve_factor
    control_lat = mid_lat + curve_factor
    
    # パス上の点を生成（30ステップ）
    points = []
    for i in range(31):
        t = i / 30
        
        # 2次ベジエ曲線の方程式
        lon = (1-t)**2 * origin[0] + 2*(1-t)*t * control_lon + t**2 * destination[0]
        lat = (1-t)**2 * origin[1] + 2*(1-t)*t * control_lat + t**2 * destination[1]
        
        points.append([lon, lat])
    
    return points, [control_lon, control_lat]
```

## 地域別実装状況

### 広島県（実データ）

**カバー範囲:**
- 県全域40地点（県北部・東部含む）
- 主要都市：広島市、福山市、呉市、東広島市、尾道市、廿日市市、三原市、三次市、庄原市
- 主要IC・JCT：広島IC、広島JCT、福山西IC、尾道IC

**データソース:**
```python
hiroshima_stats = {
    "population": 2800000,          # 県人口
    "hiroshima_city": 1200000,      # 広島市人口
    "daily_commuters": 450000,      # 通勤通学者数
    "tourist_annual": 70000000,     # 年間観光客数
    "major_stations_daily": {
        "広島駅": 140000,
        "紙屋町": 85000,
        "八丁堀": 75000,
        "横川駅": 35000,
        "西広島駅": 25000,
        "福山駅": 60000,
        "尾道駅": 20000,
        "呉駅": 30000
    }
}
```

### 山口県（実データ）

**カバー範囲:**
- 主要10地点
- 主要都市：下関市、山口市、宇部市、防府市、岩国市、萩市

**データソース:**
```python
yamaguchi_stats = {
    "population": 1350000,
    "daily_commuters": 180000,
    "major_stations_daily": {
        "下関駅": 25000,
        "山口駅": 15000,
        "新山口駅": 30000,
        "防府駅": 12000,
        "徳山駅": 18000
    }
}
```

### 東京都（ダミーデータ）

**実装内容:**
- JR山手線全29駅
- 主要地下鉄路線（東京メトロ、都営地下鉄）
- 主要ターミナル駅の詳細データ
- 観光地（浅草、お台場、六本木等）

### 大阪府（ダミーデータ）

**実装内容:**
- JR大阪環状線全19駅
- 御堂筋線、谷町線等の主要地下鉄
- 梅田、難波、天王寺の主要ターミナル
- 観光地（大阪城、USJ、道頓堀等）

### 福岡県（ダミーデータ）

**実装内容:**
- 博多・天神を中心とした都市圏
- 空港線、七隈線等の地下鉄
- 主要観光地（太宰府、門司港等）

## 統計的推定モデル

### 1. OD（Origin-Destination）行列の推定

```python
def estimate_od_matrix(points, prefecture):
    """
    全地点間のOD行列を推定
    
    手順:
    1. 各地点ペアに対して重力モデルを適用
    2. 時間帯補正を適用
    3. 最小閾値でフィルタリング
    4. フロータイプを分類
    """
    flows = []
    
    for origin in points:
        for destination in points:
            if origin == destination:
                continue
            
            # 基本流動量の計算
            base_flow = calculate_flow_volume(origin, destination, stats)
            
            # 時間帯補正
            current_hour = datetime.now().hour
            flow_type = classify_flow_type(origin, destination)
            corrected_flow = apply_time_correction(base_flow, current_hour, flow_type)
            
            # 閾値フィルタ
            if corrected_flow > 1000:
                flows.append({
                    "origin": origin,
                    "destination": destination,
                    "volume": int(corrected_flow),
                    "type": flow_type
                })
    
    return flows
```

### 2. フロータイプの分類

```python
def classify_flow_type(origin, destination):
    """
    起点・終点の特性からフロータイプを推定
    """
    commute_keywords = ["駅", "大学", "市役所", "区役所", "オフィス"]
    tourist_keywords = ["公園", "城", "記念", "港", "空港", "神社", "寺"]
    
    origin_features = extract_features(origin.name)
    dest_features = extract_features(destination.name)
    
    # 両方が通勤関連施設
    if (any(k in origin_features for k in commute_keywords) and 
        any(k in dest_features for k in commute_keywords)):
        return "commute"
    
    # どちらかが観光地
    elif (any(k in origin_features for k in tourist_keywords) or 
          any(k in dest_features for k in tourist_keywords)):
        return "tourism"
    
    else:
        return "general"
```

### 3. リアルタイム性の実現

```python
class RealtimeFlowAdjuster:
    """
    リアルタイムデータを反映した流動調整
    """
    def __init__(self):
        self.base_flows = None
        self.real_time_factors = {}
    
    def update_with_realtime_data(self, sensor_data):
        """
        センサーデータを使用してリアルタイム補正
        
        補正要素:
        - 天候（雨天時は20-30%減少）
        - イベント（大規模イベント時は特定エリア200-300%増加）
        - 事故・遅延（迂回ルートへの流動増加）
        """
        for sensor in sensor_data:
            area = sensor.area
            congestion_level = sensor.congestion_level
            
            # エリアの補正係数を更新
            self.real_time_factors[area] = {
                "multiplier": congestion_level / sensor.baseline,
                "timestamp": datetime.now()
            }
    
    def get_adjusted_flow(self, flow):
        """
        リアルタイム補正を適用した流動量を返す
        """
        origin_factor = self.real_time_factors.get(flow.origin.area, {"multiplier": 1.0})
        dest_factor = self.real_time_factors.get(flow.destination.area, {"multiplier": 1.0})
        
        # 起点・終点両方の要素を考慮
        combined_factor = (origin_factor["multiplier"] + dest_factor["multiplier"]) / 2
        
        return flow.volume * combined_factor
```

## データ統合アーキテクチャ

### 1. データソース階層

```
┌─────────────────────────────────────────┐
│         リアルタイムデータ層            │
│  (センサー、GPS、SNS、気象データ)       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         統計的推定モデル層              │
│  (重力モデル、機械学習、時系列分析)     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         データ統合・正規化層            │
│  (品質チェック、異常値除去、補間)       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         可視化データ生成層              │
│  (GeoJSON生成、アニメーション計算)      │
└─────────────────────────────────────────┘
```

### 2. データ更新フロー

```python
async def update_mobility_data_pipeline():
    """
    人流データ更新パイプライン（5分ごと実行）
    """
    # 1. 各種データソースから最新データ取得
    realtime_data = await fetch_realtime_sources()
    
    # 2. 基本OD行列の生成
    base_od_matrix = estimate_od_matrix(points, prefecture)
    
    # 3. リアルタイムデータによる補正
    adjusted_flows = apply_realtime_corrections(base_od_matrix, realtime_data)
    
    # 4. 品質チェック
    validated_flows = validate_and_clean(adjusted_flows)
    
    # 5. 可視化用データ生成
    geojson_data = generate_visualization_data(validated_flows)
    
    # 6. キャッシュ更新
    await update_cache(geojson_data)
    
    return geojson_data
```

### 3. データ品質管理

```python
def validate_and_clean(flows):
    """
    データ品質チェックとクリーニング
    """
    cleaned_flows = []
    
    for flow in flows:
        # 異常値チェック
        if flow.volume < 0 or flow.volume > 1000000:
            logger.warning(f"Abnormal flow volume: {flow}")
            continue
        
        # 座標妥当性チェック
        if not is_valid_coordinates(flow.origin) or not is_valid_coordinates(flow.destination):
            logger.warning(f"Invalid coordinates: {flow}")
            continue
        
        # 時間的整合性チェック
        if not is_temporally_consistent(flow):
            flow = apply_temporal_smoothing(flow)
        
        cleaned_flows.append(flow)
    
    return cleaned_flows
```

## 今後の拡張計画

### 1. 追加データソースの統合

**携帯電話基地局データ:**
- リアルタイムの人口分布
- 移動パターンの詳細把握
- 滞在時間分析

**交通系ICカードデータ:**
- 正確な乗降客数
- 乗り換えパターン
- 移動時間の実測値

**道路交通センサー:**
- 車両流動データ
- 渋滞情報
- 速度データ

### 2. 機械学習モデルの導入

```python
class FlowPredictionModel:
    """
    過去データから未来の流動を予測
    """
    def __init__(self):
        self.model = self._build_lstm_model()
        self.scaler = StandardScaler()
    
    def _build_lstm_model(self):
        """
        LSTM（Long Short-Term Memory）モデルの構築
        """
        model = Sequential([
            LSTM(128, return_sequences=True, input_shape=(24, 10)),  # 24時間、10特徴量
            Dropout(0.2),
            LSTM(64, return_sequences=True),
            Dropout(0.2),
            LSTM(32),
            Dropout(0.2),
            Dense(1)  # 流動量予測
        ])
        
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model
    
    def predict_next_hour(self, historical_data):
        """
        次の1時間の流動量を予測
        """
        # データの前処理
        features = self._extract_features(historical_data)
        scaled_features = self.scaler.transform(features)
        
        # 予測
        prediction = self.model.predict(scaled_features.reshape(1, 24, 10))
        
        # 逆スケーリング
        return self.scaler.inverse_transform(prediction)[0][0]
```

### 3. 異常検知システム

```python
class AnomalyDetector:
    """
    異常な人流パターンを検出
    """
    def __init__(self):
        self.isolation_forest = IsolationForest(contamination=0.1)
        self.historical_patterns = {}
    
    def detect_anomalies(self, current_flows):
        """
        現在の流動パターンから異常を検出
        
        検出対象:
        - 通常の3倍以上の流動
        - 逆方向への異常な流動
        - 新規ルートの突発的発生
        """
        anomalies = []
        
        for flow in current_flows:
            # 過去パターンとの比較
            historical = self.historical_patterns.get(flow.route_id, None)
            
            if historical:
                deviation = abs(flow.volume - historical.mean) / historical.std
                
                if deviation > 3:  # 3σを超える異常
                    anomalies.append({
                        "flow": flow,
                        "type": "volume_anomaly",
                        "severity": deviation,
                        "message": f"異常な流動量検出: {flow.volume} (通常の{deviation:.1f}倍)"
                    })
        
        return anomalies
```

### 4. 多層的分析機能

```python
class MultiLayerAnalyzer:
    """
    複数の観点から人流を分析
    """
    def analyze(self, flows, timeframe):
        return {
            "temporal": self._temporal_analysis(flows, timeframe),
            "spatial": self._spatial_analysis(flows),
            "demographic": self._demographic_analysis(flows),
            "economic": self._economic_impact_analysis(flows)
        }
    
    def _temporal_analysis(self, flows, timeframe):
        """
        時系列分析
        - ピーク時間の特定
        - 周期性の検出
        - トレンド分析
        """
        pass
    
    def _spatial_analysis(self, flows):
        """
        空間分析
        - ホットスポット検出
        - 流動の方向性分析
        - クラスタリング
        """
        pass
    
    def _demographic_analysis(self, flows):
        """
        属性分析
        - 年齢層別の移動パターン
        - 目的別の分類
        - 滞在時間分析
        """
        pass
    
    def _economic_impact_analysis(self, flows):
        """
        経済影響分析
        - 消費額推定
        - 商圏分析
        - 機会損失計算
        """
        pass
```

## まとめ

Uesugi Engineの人流データシステムは、統計的手法と最新技術を組み合わせることで、高精度な人流可視化を実現しています。今後は、より多様なデータソースの統合と、AI/機械学習の活用により、リアルタイム性と予測精度をさらに向上させていく予定です。

本システムは、都市計画、交通政策、防災対策、商業戦略など、幅広い分野での意思決定を支援する強力なツールとして発展していきます。