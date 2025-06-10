# Free Open Data Sources for Uesugi Engine

## Summary of Updates (2025-06-10)

The `collect_free_opendata.py` script has been significantly enhanced with correct URLs and many new free open data sources for the 5 target prefectures (Hiroshima, Yamaguchi, Fukuoka, Osaka, Tokyo).

## Working Data Sources

### 1. Weather Data (気象データ) ✅
- **Open-Meteo API**: Free weather forecast data for all 5 cities
- No API key required
- 7-day forecast with hourly and daily data
- Current conditions including temperature, humidity, precipitation

### 2. Earthquake Data (地震データ) ✅
- **JMA (気象庁)**: Real-time earthquake information
- Latest 100 earthquake records
- JSON format, no authentication needed

### 3. GTFS Transportation Data ✅
- **ODPT**: Public Transportation Open Data Center (registration required)
- **Tokachi Bus**: Direct GTFS-JP data download
- **Tokyo GTFS**: GitHub repository with rail and bus data
- **TransitFeeds**: Aggregated GTFS feeds (deprecating Dec 2025)

### 4. Government Open Data Portals ✅
Successfully accessing:
- Tokyo Metropolitan Government Open Data Portal
- Osaka City Open Data Portal
- Yamaguchi Prefecture Open Data Catalog
- Fukuoka City Open Data

### 5. Environmental Monitoring (環境モニタリング)
Links to:
- **Soramame-kun**: Air pollution monitoring system
- **River Water Quality Database**: Ministry of Land data
- **Radiation Monitoring**: Nuclear Regulation Authority

### 6. Municipal Open Data (市町村オープンデータ)
Comprehensive list of city-level open data portals across all 5 prefectures, including:
- Evacuation centers
- Public facilities
- AED locations
- Tourism spots

### 7. Tourism Statistics (観光統計)
- **JNTO Statistics Portal**: CSV downloads available
- **Tourism Agency**: Accommodation statistics
- Prefecture-specific tourism data portals

### 8. National Government Data
- **DATA.GO.JP**: Cross-ministry data catalog
- **e-Stat**: Government statistics portal
- **MLIT GIS**: National land numerical information
- **PLATEAU**: 3D city models (open data)

## Failed URLs That Need Updating

1. **Tokyo Population CSV**: The specific CSV URLs for Tokyo statistics need to be obtained from their catalog
2. **Osaka Facility/Event CSV**: Direct CSV links not available, need to use their API or catalog
3. **Hiroshima Open Data Portal**: Access forbidden (403), need to use alternative URLs
4. **Yamaguchi Tourism/Facilities**: Dataset IDs incorrect, need to browse their catalog

## Recommendations

### Immediate Actions:
1. Use the portal URLs to browse and find correct dataset IDs
2. Some data requires web scraping rather than direct download
3. Consider implementing a catalog browser for dynamic URL discovery

### Data Collection Strategy:
1. **Direct Downloads**: Weather, earthquakes, some GTFS data
2. **Portal Browsing**: Most prefecture/city data requires finding correct dataset IDs
3. **API Access**: Some sources offer APIs that don't require keys for basic access
4. **Web Scraping**: Event calendars, some tourism data

### Additional Free Sources to Consider:
1. **OpenStreetMap**: POI and geographic data
2. **Wikipedia/Wikidata**: Structured data about places
3. **USGS Earthquake Data**: Alternative earthquake source
4. **OpenWeatherMap**: Free tier available
5. **RSS Feeds**: Many municipalities offer RSS for events/news

## Next Steps

1. **Browse Each Portal**: Visit the portal URLs to find specific dataset IDs
2. **Implement Catalog Search**: Add functionality to search data catalogs
3. **Add RSS Parser**: For event calendars and news
4. **Web Scraping Module**: For data not available as direct downloads
5. **Caching System**: To avoid repeated downloads of static data

## Script Location
- Main script: `/home/yukihara9294/projects/uesugi-engine/scripts/collect_free_opendata.py`
- Results: `/home/yukihara9294/projects/uesugi-engine/uesugi-engine-data/collection_results/`
- Logs: `/home/yukihara9294/projects/uesugi-engine/uesugi-engine-data/logs/`