from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum

class EventCategory(str, Enum):
    FESTIVAL = "festival"
    SPORTS = "sports"
    CONCERT = "concert"
    EXHIBITION = "exhibition"
    MARKET = "market"

class Event(BaseModel):
    id: int
    name: str
    category: EventCategory
    venue: str
    latitude: float
    longitude: float
    start_time: datetime
    end_time: datetime
    expected_attendees: int
    impact_radius: int  # meters
    description: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "広島フラワーフェスティバル",
                "category": "festival",
                "venue": "平和記念公園",
                "latitude": 34.3952,
                "longitude": 132.4534,
                "start_time": "2025-05-03T10:00:00",
                "end_time": "2025-05-05T21:00:00",
                "expected_attendees": 150000,
                "impact_radius": 2000,
                "description": "広島最大級の花と緑の祭典"
            }
        }