# Uesugi Engine - Visualization Guide

This guide explains what the different visual elements and size variations represent in the Uesugi Engine map visualization.

## Layer Types and Visual Representations

### 1. SNS感情分析 (SNS Sentiment Analysis) - Heatmap Layer
- **What it shows**: Social media activity and sentiment across different areas
- **Visual representation**: Colored heatmap with particles
- **Size/Intensity meaning**:
  - **Brighter areas**: Higher social media activity
  - **Color variations**: 
    - Cyan: Tourism-related posts
    - Pink/Purple: Food and dining posts
    - Yellow: Shopping posts
    - Green: Event posts
    - Red/Orange: Transportation posts
  - **Particle density**: Indicates volume of posts in that area

### 2. ランドマーク (Landmarks) - 3D Buildings
- **What it shows**: Major tourist attractions and landmarks
- **Visual representation**: Gold/yellow 3D buildings with labels
- **Height meaning**:
  - **Taller buildings (40-60m)**: Major landmarks with high visitor counts
    - Examples: 原爆ドーム (Atomic Bomb Dome), 厳島神社 (Itsukushima Shrine)
  - **Medium buildings (20-40m)**: Regional attractions
  - **Height directly correlates with**: Historical/cultural importance and visitor numbers

### 3. 宿泊施設 (Accommodation) - Green 3D Bars
- **What it shows**: Hotels, ryokans, and other accommodation facilities
- **Visual representation**: Green 3D bars
- **Height meaning**:
  - **Base height**: 10 meters minimum
  - **Additional height**: Occupancy rate × 50 meters
  - **Taller bars**: Higher occupancy rates (more popular/booked accommodations)
  - **Example**: 90% occupancy = 10 + (0.9 × 50) = 55 meters tall

### 4. 消費データ (Consumption Data) - Pink 3D Bars
- **What it shows**: Consumer spending patterns across different areas
- **Visual representation**: Pink/magenta 3D bars
- **Height meaning**:
  - **Height formula**: Square root of spending amount ÷ 50
  - **Tourist area multiplier**: 20× higher in major tourist areas
  - **Key differences**:
    - **Miyajima/Peace Park areas**: 20× taller bars (major tourist spending)
    - **Regular commercial areas**: Standard height
    - **Station areas**: 1.3× multiplier for transit hubs
  - **Clustering**: Every 5 data points are combined into 1 for cleaner visualization

### 5. 人流データ (Mobility Data) - Animated Particles
- **What it shows**: Transportation flow between major hubs
- **Visual representation**: Flowing blue particles along transportation routes
- **Particle characteristics**:
  - **Color by congestion**:
    - Deep blue: Low congestion (smooth flow)
    - Medium blue: Moderate congestion
    - Hot pink: High congestion (traffic jams)
  - **Particle density**: More particles = higher traffic volume
  - **Particle speed**: Inversely related to congestion
  - **Hub glow size**: Importance of transportation hub

### 6. イベント情報 (Event Information) - Icons with Impact Radius
- **What it shows**: Current and upcoming events across the region
- **Visual representation**: Event category icons with colored circles
- **Size meanings**:
  - **Impact radius (circle size)**:
    - Festivals (祭り): 1.5× base radius (largest impact)
    - Fireworks (花火): 1.4× base radius
    - Sports (スポーツ): 1.0× base radius
    - Concerts (コンサート): 0.7× base radius
    - Exhibitions (展示会): 0.7× base radius (smallest impact)
  - **Base radius**: 40 pixels for major cities, 25 pixels for smaller cities
  - **Expected attendance**: Shown in event details, affects economic impact

## Understanding the Scale

### Population-Based Scaling
Many visualizations scale with city population:
- **Hiroshima City** (1.19M people): Largest representations
- **Fukuyama City** (460K people): Medium representations
- **Smaller cities** (<200K people): Proportionally smaller representations

### Economic Impact Visualization
The height and size of consumption data directly represents economic activity:
- **1 meter height** ≈ ¥2,500 in consumer spending
- **Tourist areas**: Show dramatically taller bars due to concentrated tourist spending
- **Time variations**: Data includes peak hour information for temporal analysis

### Real-Time Data Interpretation
- **Particle animations**: Represent real-time flow and congestion
- **Pulsing effects**: Show active areas and ongoing events
- **Color intensity**: Indicates data freshness and reliability

## Best Practices for Reading the Visualization

1. **Compare relative sizes** within the same layer type for meaningful insights
2. **Look for patterns** in tourist areas vs. residential areas
3. **Observe particle flow** to understand transportation bottlenecks
4. **Check event impacts** to predict crowd and economic effects
5. **Use multiple layers** together for comprehensive area analysis

## Technical Notes

- All heights are in meters for 3D visualizations
- Particle counts and speeds are optimized for performance
- Data clustering reduces visual clutter while maintaining accuracy
- Colors are chosen for accessibility and clear differentiation