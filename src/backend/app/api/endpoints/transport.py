from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os
import csv
import json
from pathlib import Path

from app.core.database import get_db

router = APIRouter()

# Path to GTFS data
GTFS_DATA_PATH = Path("/app/uesugi-engine-data/hiroshima/transport/bus/gtfs_extracted")

@router.get("/gtfs")
async def get_gtfs_data():
    """
    Get GTFS data for public transportation
    """
    try:
        # Load stops data
        stops = load_gtfs_file("stops.txt")
        
        # Load routes data
        routes = load_gtfs_file("routes.txt")
        
        # Load shapes data
        shapes = load_and_process_shapes()
        
        # Combine route data with shapes
        route_shapes = {}
        if shapes:
            # Load trips to map routes to shapes
            trips = load_gtfs_file("trips.txt")
            for trip in trips:
                route_id = trip.get("route_id")
                shape_id = trip.get("shape_id")
                if route_id and shape_id and shape_id in shapes:
                    route_shapes[route_id] = shapes[shape_id]
        
        # Add shapes to routes
        for route in routes:
            route_id = route.get("route_id")
            if route_id in route_shapes:
                route["shapes"] = route_shapes[route_id]
            else:
                route["shapes"] = []
        
        # Process stop times to determine route type for stops
        stop_times = load_gtfs_file("stop_times.txt")
        stop_route_types = {}
        
        for stop_time in stop_times:
            trip_id = stop_time.get("trip_id")
            stop_id = stop_time.get("stop_id")
            
            # Find route type for this trip
            trip = next((t for t in trips if t.get("trip_id") == trip_id), None)
            if trip:
                route_id = trip.get("route_id")
                route = next((r for r in routes if r.get("route_id") == route_id), None)
                if route:
                    route_type = get_route_type_name(route.get("route_type", "3"))
                    if stop_id not in stop_route_types:
                        stop_route_types[stop_id] = route_type
        
        # Add route type to stops
        for stop in stops:
            stop_id = stop.get("stop_id")
            if stop_id in stop_route_types:
                stop["route_type"] = stop_route_types[stop_id]
            else:
                stop["route_type"] = "bus"  # Default to bus
        
        return {
            "stops": stops[:500],  # Limit to 500 stops for performance
            "routes": routes[:50], # Limit to 50 routes for performance
            "total_stops": len(stops),
            "total_routes": len(routes)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load GTFS data: {str(e)}")


def load_gtfs_file(filename: str) -> List[Dict[str, Any]]:
    """
    Load a GTFS file and return as list of dictionaries
    """
    file_path = GTFS_DATA_PATH / filename
    
    if not file_path.exists():
        # Try alternative paths
        alt_paths = [
            Path(f"/app/data/uesugi-engine-data/hiroshima/transport/bus/gtfs_extracted/{filename}"),
            Path(f"./uesugi-engine-data/hiroshima/transport/bus/gtfs_extracted/{filename}"),
            Path(f"./data/uesugi-engine-data/hiroshima/transport/bus/gtfs_extracted/{filename}")
        ]
        
        for alt_path in alt_paths:
            if alt_path.exists():
                file_path = alt_path
                break
        else:
            raise FileNotFoundError(f"GTFS file not found: {filename}")
    
    data = []
    with open(file_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Clean up the data
            cleaned_row = {}
            for key, value in row.items():
                if value:
                    cleaned_row[key.strip()] = value.strip()
                else:
                    cleaned_row[key.strip()] = ""
            data.append(cleaned_row)
    
    return data


def load_and_process_shapes() -> Dict[str, List[List[float]]]:
    """
    Load and process shapes.txt to create route geometries
    """
    try:
        shapes_data = load_gtfs_file("shapes.txt")
        
        # Group by shape_id and sort by sequence
        shapes = {}
        for point in shapes_data:
            shape_id = point.get("shape_id")
            if not shape_id:
                continue
                
            if shape_id not in shapes:
                shapes[shape_id] = []
            
            try:
                shapes[shape_id].append({
                    "sequence": int(point.get("shape_pt_sequence", 0)),
                    "coordinates": [
                        float(point.get("shape_pt_lon", 0)),
                        float(point.get("shape_pt_lat", 0))
                    ]
                })
            except (ValueError, TypeError):
                continue
        
        # Sort by sequence and extract coordinates
        processed_shapes = {}
        for shape_id, points in shapes.items():
            sorted_points = sorted(points, key=lambda x: x["sequence"])
            processed_shapes[shape_id] = [p["coordinates"] for p in sorted_points]
        
        return processed_shapes
        
    except Exception as e:
        print(f"Error processing shapes: {e}")
        return {}


def get_route_type_name(route_type: str) -> str:
    """
    Convert GTFS route type to friendly name
    """
    route_types = {
        "0": "tram",
        "1": "subway",
        "2": "rail",
        "3": "bus",
        "4": "ferry",
        "5": "cable_car",
        "6": "gondola",
        "7": "funicular"
    }
    return route_types.get(str(route_type), "bus")


@router.get("/stops/{stop_id}")
async def get_stop_details(stop_id: str):
    """
    Get details for a specific stop
    """
    try:
        stops = load_gtfs_file("stops.txt")
        stop = next((s for s in stops if s.get("stop_id") == stop_id), None)
        
        if not stop:
            raise HTTPException(status_code=404, detail="Stop not found")
        
        # Load stop times for this stop
        stop_times = load_gtfs_file("stop_times.txt")
        trips = load_gtfs_file("trips.txt")
        routes = load_gtfs_file("routes.txt")
        
        # Find all routes that serve this stop
        serving_routes = []
        for stop_time in stop_times:
            if stop_time.get("stop_id") == stop_id:
                trip_id = stop_time.get("trip_id")
                trip = next((t for t in trips if t.get("trip_id") == trip_id), None)
                if trip:
                    route_id = trip.get("route_id")
                    route = next((r for r in routes if r.get("route_id") == route_id), None)
                    if route and route not in serving_routes:
                        serving_routes.append({
                            "route_id": route.get("route_id"),
                            "route_short_name": route.get("route_short_name"),
                            "route_long_name": route.get("route_long_name"),
                            "route_type": get_route_type_name(route.get("route_type", "3"))
                        })
        
        return {
            "stop": stop,
            "serving_routes": serving_routes
        }
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="GTFS data not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load stop details: {str(e)}")