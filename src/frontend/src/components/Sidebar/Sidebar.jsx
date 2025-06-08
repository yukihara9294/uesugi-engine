/**
 * サイドバーコンポーネント
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Switch,
  alpha,
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Layers,
  Category,
  Timeline,
  WbSunny,
  Map as MapIcon,
  ThermostatAuto,
  Place,
  Hotel,
  ShoppingCart,
  DirectionsCar,
  Share as ShareIcon,
} from '@mui/icons-material';

const Sidebar = ({
  selectedLayers,
  onLayerChange,
  selectedCategories,
  onCategoryChange,
  timeRange,
  onTimeRangeChange,
  statistics,
  weatherData,
  onRefresh
}) => {
  // 基本レイヤー
  const baseLayers = [
    { id: 'landmarks', label: 'ランドマーク', icon: <Place />, color: '#FFD700' },
    { id: 'mobility', label: '人流データ', icon: <DirectionsCar />, color: '#00FFFF' },
    { id: 'consumption', label: '消費データ', icon: <ShoppingCart />, color: '#FF69B4' },
    { id: 'accommodation', label: '宿泊施設', icon: <Hotel />, color: '#4CAF50' },
    { id: 'weather', label: '気象データ', icon: <WbSunny />, color: '#FFA500' },
    { id: 'events', label: 'イベント情報', icon: <ShareIcon />, color: '#FF6B6B' },
  ];
  
  // ソーシャル・ネットワーキング・データ
  const socialLayer = { 
    id: 'heatmap', 
    label: 'SNS感情分析', 
    icon: <ThermostatAuto />, 
    color: '#FF5722',
    description: 'ソーシャルメディアの感情分析ヒートマップ'
  };

  const categories = [
    { id: '観光', label: '観光', color: '#4CAF50', icon: '🏯' },
    { id: 'グルメ', label: 'グルメ', color: '#FF9800', icon: '🍜' },
    { id: 'イベント', label: 'イベント', color: '#9C27B0', icon: '🎉' },
    { id: 'ショッピング', label: 'ショッピング', color: '#2196F3', icon: '🛍️' },
    { id: '交通', label: '交通', color: '#607D8B', icon: '🚃' },
  ];

  const handleLayerToggle = (layerId) => {
    const newLayers = selectedLayers.includes(layerId)
      ? selectedLayers.filter(id => id !== layerId)
      : [...selectedLayers, layerId];
    onLayerChange(newLayers);
  };

  const handleCategoryToggle = (categoryId) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    onCategoryChange(newCategories);
  };

  return (
    <Paper sx={{ 
      width: 320,
      height: '100%',
      background: 'rgba(10, 10, 10, 0.9)',
      backdropFilter: 'blur(30px)',
      borderRadius: 0,
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '4px 0 24px rgba(0, 0, 0, 0.3)'
    }}>
      <Box sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapIcon sx={{ color: '#667eea' }} />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              コントロール
            </Typography>
          </Box>
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
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* レイヤー選択 */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Layers sx={{ fontSize: 20, color: '#667eea' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              表示レイヤー
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {baseLayers.map(layer => (
              <Box
                key={layer.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ color: layer.color }}>{layer.icon}</Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {layer.label}
                  </Typography>
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
            ))}
          </Box>
        </Box>

        {/* ソーシャル・ネットワーキング・データ */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ShareIcon sx={{ fontSize: 20, color: socialLayer.color }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              ソーシャル・ネットワーキング・データ
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderRadius: 2,
              background: selectedLayers.includes(socialLayer.id) 
                ? alpha(socialLayer.color, 0.1)
                : 'rgba(255, 255, 255, 0.02)',
              border: '1px solid',
              borderColor: selectedLayers.includes(socialLayer.id)
                ? alpha(socialLayer.color, 0.3)
                : 'rgba(255, 255, 255, 0.05)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              '&:hover': {
                background: alpha(socialLayer.color, 0.15),
                borderColor: alpha(socialLayer.color, 0.5),
                transform: 'translateX(4px)'
              }
            }}
            onClick={() => handleLayerToggle(socialLayer.id)}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ color: socialLayer.color }}>{socialLayer.icon}</Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {socialLayer.label}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                {socialLayer.description}
              </Typography>
            </Box>
            <Switch
              checked={selectedLayers.includes(socialLayer.id)}
              onChange={() => handleLayerToggle(socialLayer.id)}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: socialLayer.color,
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: socialLayer.color,
                },
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3, bgcolor: 'rgba(255, 255, 255, 0.05)' }} />

        {/* カテゴリ選択 */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Category sx={{ fontSize: 20, color: '#667eea' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              カテゴリフィルター
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {categories.map(category => (
              <Chip
                key={category.id}
                icon={<span style={{ fontSize: '16px' }}>{category.icon}</span>}
                label={category.label}
                onClick={() => handleCategoryToggle(category.id)}
                variant={selectedCategories.includes(category.id) ? 'filled' : 'outlined'}
                sx={{
                  px: 1,
                  bgcolor: selectedCategories.includes(category.id) ? category.color : 'transparent',
                  borderColor: category.color,
                  color: selectedCategories.includes(category.id) ? 'white' : category.color,
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: category.color,
                    color: 'white',
                    transform: 'scale(1.05)',
                    boxShadow: `0 4px 12px ${alpha(category.color, 0.4)}`
                  },
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 3, bgcolor: 'rgba(255, 255, 255, 0.05)' }} />

        {/* 統計情報 */}
        {statistics && (
          <Box sx={{ 
            mb: 4,
            p: 2,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Timeline sx={{ fontSize: 20, color: '#667eea' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                統計サマリー
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              p: 1.5,
              mb: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>総データ数</Typography>
              <Typography variant="h6" sx={{ color: '#667eea', fontWeight: 700 }}>
                {statistics.total_points?.toLocaleString() || 0}
              </Typography>
            </Box>
            {statistics.category_breakdown?.slice(0, 3).map((cat, index) => {
              const categoryInfo = categories.find(c => c.id === cat.category);
              return (
                <Box 
                  key={cat.category}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    p: 1,
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.02)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontSize: '14px' }}>{categoryInfo?.icon}</span>
                    <Typography variant="body2">{cat.category}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {cat.point_count}
                    </Typography>
                    <Chip 
                      label={`${cat.percentage?.toFixed(1)}%`} 
                      size="small" 
                      sx={{ 
                        height: 20,
                        fontSize: '0.7rem',
                        bgcolor: alpha(categoryInfo?.color || '#667eea', 0.2),
                        color: categoryInfo?.color || '#667eea'
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

      </Box>

      {/* 時間範囲表示 */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
          データ表示期間
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, color: '#667eea' }}>
          {timeRange.start.toLocaleDateString('ja-JP')} 〜 {timeRange.end.toLocaleDateString('ja-JP')}
        </Typography>
      </Box>
    </Paper>
  );
};

export default Sidebar;