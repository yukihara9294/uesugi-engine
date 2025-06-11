import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Card,
  CardContent,
  Chip,
  IconButton,
  Fab,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Layers as LayersIcon,
  Timeline as TimelineIcon,
  Compare as CompareIcon,
  Insights as InsightsIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Speed as SpeedIcon,
  CameraAlt as SnapshotIcon
} from '@mui/icons-material';

/**
 * 統合ダッシュボード - 拡張された可視化機能
 */
const IntegratedDashboard = ({ mapRef, currentData }) => {
  // レイヤー管理
  const [activeLayers, setActiveLayers] = useState({
    buildings: true,
    economic: false,
    risk: false,
    transport: false
  });
  
  // レイヤー透明度
  const [layerOpacity, setLayerOpacity] = useState({
    buildings: 80,
    economic: 60,
    risk: 60,
    transport: 70
  });
  
  // 表示モード
  const [viewMode, setViewMode] = useState('single'); // single, compare, timeline
  
  // タイムライン
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentYear, setCurrentYear] = useState(2025);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // 分析結果
  const [insights, setInsights] = useState([]);

  // レイヤー切り替え
  const toggleLayer = (layerName) => {
    setActiveLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
    
    // Mapboxレイヤーの表示/非表示
    if (mapRef?.current) {
      const visibility = !activeLayers[layerName] ? 'visible' : 'none';
      updateMapLayer(layerName, visibility);
    }
  };

  // レイヤー透明度変更
  const handleOpacityChange = (layerName, value) => {
    setLayerOpacity(prev => ({
      ...prev,
      [layerName]: value
    }));
    
    // Mapboxレイヤーの透明度更新
    if (mapRef?.current) {
      updateLayerOpacity(layerName, value / 100);
    }
  };

  // マップレイヤー更新
  const updateMapLayer = (layerName, visibility) => {
    const map = mapRef.current;
    const layerIds = {
      buildings: ['buildings-3d', 'buildings-shadow'],
      economic: ['economic-heatmap', 'corporation-points'],
      risk: ['earthquake-risk', 'evacuation-routes'],
      transport: ['bus-routes', 'bus-stops', 'accessibility-zones']
    };
    
    layerIds[layerName]?.forEach(id => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visibility);
      }
    });
  };

  // レイヤー透明度更新
  const updateLayerOpacity = (layerName, opacity) => {
    const map = mapRef.current;
    const opacityProps = {
      buildings: { layer: 'buildings-3d', prop: 'fill-extrusion-opacity' },
      economic: { layer: 'economic-heatmap', prop: 'heatmap-opacity' },
      risk: { layer: 'earthquake-risk', prop: 'fill-opacity' },
      transport: { layer: 'bus-routes', prop: 'line-opacity' }
    };
    
    const config = opacityProps[layerName];
    if (config && map.getLayer(config.layer)) {
      map.setPaintProperty(config.layer, config.prop, opacity);
    }
  };

  // タイムライン再生
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentYear(prev => {
          if (prev >= 2025) return 2015;
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // AI分析結果の取得
  useEffect(() => {
    if (currentData) {
      generateInsights(currentData);
    }
  }, [currentData]);

  const generateInsights = (data) => {
    // 仮のAI分析結果
    const newInsights = [
      {
        type: 'alert',
        title: '地震リスク警告',
        message: '中央地区に旧耐震建物が集中（全体の45%）'
      },
      {
        type: 'opportunity',
        title: '経済成長機会',
        message: 'IT企業の集積により東地区のGDPが前年比12%増'
      },
      {
        type: 'recommendation',
        title: '交通改善提案',
        message: '北部エリアのバス路線追加で人口カバー率15%向上可能'
      }
    ];
    setInsights(newInsights);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* コントロールパネル */}
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* 表示モード切り替え */}
          <Grid item xs={12} md={3}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, mode) => mode && setViewMode(mode)}
              size="small"
            >
              <ToggleButton value="single">
                <Tooltip title="通常表示">
                  <LayersIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="compare">
                <Tooltip title="比較モード">
                  <CompareIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="timeline">
                <Tooltip title="時系列表示">
                  <TimelineIcon />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          {/* タイムラインコントロール */}
          {viewMode === 'timeline' && (
            <>
              <Grid item xs={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </IconButton>
                  <Typography variant="h6">{currentYear}年</Typography>
                  <IconButton onClick={() => console.log('スナップショット保存')}>
                    <SnapshotIcon />
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SpeedIcon fontSize="small" />
                  <Slider
                    value={playbackSpeed}
                    onChange={(e, v) => setPlaybackSpeed(v)}
                    min={0.5}
                    max={5}
                    step={0.5}
                    marks
                    valueLabelDisplay="auto"
                    sx={{ width: 100 }}
                  />
                </Box>
              </Grid>
            </>
          )}

          {/* インサイトボタン */}
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Chip
                icon={<InsightsIcon />}
                label={`${insights.length}件の分析結果`}
                color="primary"
                onClick={() => console.log('インサイトパネル表示')}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* メインコンテンツ */}
      <Grid container spacing={2} sx={{ flex: 1 }}>
        {/* レイヤーコントロール */}
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              データレイヤー
            </Typography>
            
            {Object.entries(activeLayers).map(([layer, active]) => (
              <Card key={layer} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">
                      {layer === 'buildings' && '建物・都市構造'}
                      {layer === 'economic' && '経済活動'}
                      {layer === 'risk' && 'リスク評価'}
                      {layer === 'transport' && '交通ネットワーク'}
                    </Typography>
                    <ToggleButton
                      value={layer}
                      selected={active}
                      onChange={() => toggleLayer(layer)}
                      size="small"
                    >
                      <LayersIcon fontSize="small" />
                    </ToggleButton>
                  </Box>
                  
                  {active && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        透明度: {layerOpacity[layer]}%
                      </Typography>
                      <Slider
                        value={layerOpacity[layer]}
                        onChange={(e, v) => handleOpacityChange(layer, v)}
                        min={0}
                        max={100}
                        size="small"
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>

        {/* KPIパネル */}
        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            {/* 主要指標 */}
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    総建物数
                  </Typography>
                  <Typography variant="h4">
                    12,543
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={75} 
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    企業数
                  </Typography>
                  <Typography variant="h4">
                    3,892
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    +12% 前年比
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    高リスク建物
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    2,451
                  </Typography>
                  <Typography variant="caption">
                    旧耐震基準
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    交通カバー率
                  </Typography>
                  <Typography variant="h4">
                    87%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={87} 
                    color="success"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* インサイト表示 */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  AI分析結果
                </Typography>
                <Grid container spacing={2}>
                  {insights.map((insight, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Card 
                        sx={{ 
                          borderLeft: 4, 
                          borderColor: 
                            insight.type === 'alert' ? 'error.main' : 
                            insight.type === 'opportunity' ? 'success.main' : 
                            'info.main'
                        }}
                      >
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            {insight.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {insight.message}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* フローティングアクションボタン */}
      <Fab
        color="primary"
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
        onClick={() => console.log('詳細分析モード')}
      >
        <InsightsIcon />
      </Fab>
    </Box>
  );
};

export default IntegratedDashboard;