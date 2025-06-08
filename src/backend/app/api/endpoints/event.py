from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Query
from app.schemas.event import Event, EventCategory
import random

router = APIRouter()

# イベントカテゴリ
event_categories = [
    EventCategory.FESTIVAL,
    EventCategory.SPORTS,
    EventCategory.CONCERT,
    EventCategory.EXHIBITION,
    EventCategory.MARKET
]

# サンプルイベントデータ
def generate_dummy_events():
    events = []
    
    # 広島市内の主要イベント会場
    venues = [
        {"name": "マツダスタジアム", "lat": 34.3916, "lng": 132.4847, "capacity": 33000},
        {"name": "広島グリーンアリーナ", "lat": 34.3977, "lng": 132.4549, "capacity": 10000},
        {"name": "広島文化学園HBGホール", "lat": 34.3967, "lng": 132.4554, "capacity": 2000},
        {"name": "平和記念公園", "lat": 34.3952, "lng": 132.4534, "capacity": 50000},
        {"name": "広島城", "lat": 34.4026, "lng": 132.4592, "capacity": 5000},
        {"name": "広島市現代美術館", "lat": 34.3829, "lng": 132.4694, "capacity": 1000},
        {"name": "ひろしま美術館", "lat": 34.3970, "lng": 132.4590, "capacity": 800},
        {"name": "広島県立美術館", "lat": 34.3978, "lng": 132.4681, "capacity": 1200},
        {"name": "紙屋町シャレオ", "lat": 34.3955, "lng": 132.4567, "capacity": 3000},
        {"name": "八丁堀", "lat": 34.3946, "lng": 132.4614, "capacity": 2000}
    ]
    
    # 各会場でイベントを生成
    event_id = 1
    for venue in venues:
        # 各会場で1-3個のイベント
        for _ in range(random.randint(1, 3)):
            category = random.choice(event_categories)
            
            # カテゴリに応じたイベント名を生成
            if category == EventCategory.FESTIVAL:
                event_names = ["夏祭り", "花火大会", "盆踊り", "文化祭", "フードフェスティバル"]
            elif category == EventCategory.SPORTS:
                event_names = ["野球試合", "サッカー試合", "マラソン大会", "スポーツフェスタ"]
            elif category == EventCategory.CONCERT:
                event_names = ["ライブコンサート", "クラシック演奏会", "ジャズフェスティバル", "音楽祭"]
            elif category == EventCategory.EXHIBITION:
                event_names = ["現代アート展", "写真展", "伝統工芸展", "特別展示会"]
            else:  # MARKET
                event_names = ["朝市", "フリーマーケット", "骨董市", "クラフトマーケット"]
            
            event_name = f"{venue['name']} {random.choice(event_names)}"
            
            # 参加者数（会場容量の20-100%）
            attendees = int(venue['capacity'] * random.uniform(0.2, 1.0))
            
            # 影響範囲（会場規模に応じて）
            impact_radius = min(500 + (venue['capacity'] // 100), 2000)
            
            events.append(Event(
                id=event_id,
                name=event_name,
                category=category,
                venue=venue['name'],
                latitude=venue['lat'],
                longitude=venue['lng'],
                start_time=datetime.now().replace(hour=random.randint(10, 20)),
                end_time=datetime.now().replace(hour=random.randint(21, 23)),
                expected_attendees=attendees,
                impact_radius=impact_radius,
                description=f"{event_name}を開催します。多くの方のご来場をお待ちしております。"
            ))
            event_id += 1
    
    return events

@router.get("/", response_model=List[Event])
async def get_events(
    date: Optional[date] = Query(None, description="イベント日付"),
    category: Optional[EventCategory] = Query(None, description="イベントカテゴリ")
):
    """
    イベント情報を取得
    """
    events = generate_dummy_events()
    
    # カテゴリでフィルタリング
    if category:
        events = [e for e in events if e.category == category]
    
    return events

@router.get("/impact-zones", response_model=List[dict])
async def get_event_impact_zones():
    """
    イベントの影響範囲を取得（人流予測用）
    """
    events = generate_dummy_events()
    
    impact_zones = []
    for event in events:
        impact_zones.append({
            "event_id": event.id,
            "name": event.name,
            "center": {
                "lat": event.latitude,
                "lng": event.longitude
            },
            "radius": event.impact_radius,
            "expected_density": event.expected_attendees / (3.14 * (event.impact_radius ** 2) / 1000000),  # 人/㎡
            "time_range": {
                "start": event.start_time.isoformat(),
                "end": event.end_time.isoformat()
            }
        })
    
    return impact_zones