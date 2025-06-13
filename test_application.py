#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8000"

def test_api_endpoints():
    """Test all API endpoints"""
    print("Testing Uesugi Engine API endpoints...")
    
    test_cases = [
        ("Health Check", f"{BASE_URL}/health/"),
        ("Accommodation - Hiroshima", f"{BASE_URL}/api/v1/real/accommodation/real/広島県"),
        ("Accommodation - Yamaguchi", f"{BASE_URL}/api/v1/real/accommodation/real/山口県"),
        ("Mobility - Hiroshima", f"{BASE_URL}/api/v1/real/mobility/real/広島県"),
        ("Events - Hiroshima", f"{BASE_URL}/api/v1/real/events/real/広島県"),
        ("Events - Yamaguchi", f"{BASE_URL}/api/v1/real/events/real/山口県"),
        ("GTFS Hiroshima", f"{BASE_URL}/api/v1/real/transport/gtfs/hiroshima"),
        ("Tourism Yamaguchi", f"{BASE_URL}/api/v1/real/tourism/facilities/yamaguchi"),
    ]
    
    results = []
    for name, url in test_cases:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict) and 'features' in data:
                    feature_count = len(data['features'])
                    results.append(f"✓ {name}: OK ({feature_count} features)")
                else:
                    results.append(f"✓ {name}: OK")
            else:
                results.append(f"✗ {name}: Error {response.status_code}")
        except Exception as e:
            results.append(f"✗ {name}: {str(e)}")
    
    print("\n".join(results))
    
    # Check if frontend is accessible
    print("\nChecking frontend...")
    try:
        response = requests.get("http://localhost:3001", timeout=5)
        if response.status_code == 200:
            print("✓ Frontend: OK (http://localhost:3001)")
        else:
            print(f"✗ Frontend: Error {response.status_code}")
    except Exception as e:
        print(f"✗ Frontend: {str(e)}")

if __name__ == "__main__":
    test_api_endpoints()