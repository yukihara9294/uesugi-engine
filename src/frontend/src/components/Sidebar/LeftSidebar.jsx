/**
 * 左サイドバー - 現実世界のデータ
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  IconButton,
  Switch,
  alpha,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Layers,
  WbSunny,
  Map as MapIcon,
  Place,
  Hotel,
  ShoppingCart,
  DirectionsCar,
  Share as ShareIcon,
  Cloud,
  Thermostat,
  Water,
  ChevronLeft,
} from '@mui/icons-material';

const LeftSidebar = ({
  selectedLayers,
  onLayerChange,
  viewport,
  weatherData,
  onRefresh,
  onClose
}) => {
  // 現実世界のデータレイヤー
  const realWorldLayers = [
    { id: 'landmarks', label: 'ランドマーク', icon: <Place />, color: '#FFD700', description: '主要観光地・施設' },
    { id: 'mobility', label: '人流データ', icon: <DirectionsCar />, color: '#00FFFF', description: 'リアルタイム移動情報' },
    { id: 'consumption', label: '消費データ', icon: <ShoppingCart />, color: '#FF69B4', description: '購買・消費動向' },
    { id: 'accommodation', label: '宿泊施設', icon: <Hotel />, color: '#4CAF50', description: '稼働率・空室状況' },
    { id: 'events', label: 'イベント情報', icon: <ShareIcon />, color: '#FF6B6B', description: '開催中・予定イベント' },
  ];

  const handleLayerToggle = (layerId) => {
    const newLayers = selectedLayers.includes(layerId)
      ? selectedLayers.filter(id => id !== layerId)
      : [...selectedLayers, layerId];
    onLayerChange(newLayers);
  };

  return (
    <Paper sx={{ 
      width: 360,
      height: '100%',
      background: 'rgba(10, 10, 10, 0.95)',
      backdropFilter: 'blur(30px)',
      borderRadius: 0,
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '4px 0 24px rgba(0, 0, 0, 0.3)'
    }}>
      {/* ヘッダー */}
      <Box sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapIcon sx={{ color: '#667eea' }} />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              リアルワールドデータ
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              size="small" 
              onClick={onRefresh} 
              sx={{ 
                color: '#667eea',
                background: 'rgba(102, 126, 234, 0.1)',
                '&:hover': {
                  background: 'rgba(102, 126, 234, 0.2)',
                  transform: 'rotate(180deg)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <RefreshIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                color: '#667eea',
                background: 'rgba(102, 126, 234, 0.1)',
                '&:hover': {
                  background: 'rgba(102, 126, 234, 0.2)',
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ChevronLeft />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* 現在の表示エリア */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
            現在の表示エリア
          </Typography>
          <Box sx={{ 
            p: 2, 
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              中心座標: {viewport.latitude.toFixed(4)}, {viewport.longitude.toFixed(4)}
            </Typography>
            <Typography variant="body2">
              ズームレベル: {viewport.zoom.toFixed(1)}
            </Typography>
          </Box>
        </Box>

        {/* 表示レイヤー */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Layers sx={{ fontSize: 20, color: '#667eea' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              表示レイヤー
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {realWorldLayers.map(layer => (
              <Box
                key={layer.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background: selectedLayers.includes(layer.id) 
                    ? alpha(layer.color, 0.1)
                    : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid',
                  borderColor: selectedLayers.includes(layer.id)
                    ? alpha(layer.color, 0.3)
                    : 'rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    background: alpha(layer.color, 0.15),
                    borderColor: alpha(layer.color, 0.5),
                    transform: 'translateX(4px)'
                  }
                }}
                onClick={() => handleLayerToggle(layer.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ color: layer.color }}>{layer.icon}</Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {layer.label}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
                        {layer.description}
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={selectedLayers.includes(layer.id)}
                    onChange={() => handleLayerToggle(layer.id)}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: layer.color,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: layer.color,
                      },
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 3, bgcolor: 'rgba(255, 255, 255, 0.05)' }} />

        {/* 天気情報 */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <WbSunny sx={{ fontSize: 20, color: '#FFA500' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              天気情報
            </Typography>
          </Box>
          
          {weatherData?.current_weather ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* 現在の天気サマリー */}
              <Box sx={{ 
                p: 2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%)',
                border: '1px solid rgba(255, 165, 0, 0.2)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Thermostat sx={{ fontSize: 18, color: '#FFA500' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      平均気温
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ color: '#FFA500', fontWeight: 700 }}>
                    {weatherData.average_temperature?.toFixed(1)}°C
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Water sx={{ fontSize: 18, color: '#4FC3F7' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      降水量
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#4FC3F7', fontWeight: 600 }}>
                    {weatherData.total_precipitation?.toFixed(1)} mm
                  </Typography>
                </Box>
              </Box>

              {/* 地点別天気 */}
              <List sx={{ p: 0 }}>
                {weatherData.current_weather.slice(0, 3).map((weather, index) => (
                  <ListItem
                    key={index}
                    sx={{ 
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      '&:hover': { background: 'rgba(255, 255, 255, 0.02)' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {weather.landmark_name}
                        </Typography>
                      }
                      secondaryTypographyProps={{
                        component: 'div'
                      }}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip 
                            label={`${weather.temperature}°C`}
                            size="small"
                            sx={{ 
                              height: 20,
                              fontSize: '0.75rem',
                              bgcolor: 'rgba(255, 165, 0, 0.2)',
                              color: '#FFA500'
                            }}
                          />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {weather.weather_condition}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              天気データを読み込み中...
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default LeftSidebar;