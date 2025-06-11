/**
 * 右サイドバー - ソーシャルネットワーキングデータ
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Divider,
  Switch,
  alpha,
  LinearProgress,
  IconButton,
} from '@mui/material';
import { 
  Category,
  Timeline,
  ThermostatAuto,
  TrendingUp,
  SentimentSatisfied,
  SentimentNeutral,
  SentimentDissatisfied,
  Tag,
  Analytics,
  ChevronRight,
} from '@mui/icons-material';

const RightSidebar = ({
  selectedLayers,
  onLayerChange,
  selectedCategories,
  onCategoryChange,
  statistics,
  onClose,
}) => {
  // ソーシャル・ネットワーキング・データレイヤー
  const socialLayer = { 
    id: 'heatmap', 
    label: 'SNS感情分析ヒートマップ', 
    icon: <ThermostatAuto />, 
    color: '#FF5722',
    description: 'リアルタイムの感情分析と話題トレンド'
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

  // 感情スコアから色を取得
  const getSentimentColor = (sentiment) => {
    if (sentiment >= 0.7) return '#4CAF50';
    if (sentiment >= 0.4) return '#FF9800';
    return '#F44336';
  };

  const getSentimentIcon = (sentiment) => {
    if (sentiment >= 0.7) return <SentimentSatisfied />;
    if (sentiment >= 0.4) return <SentimentNeutral />;
    return <SentimentDissatisfied />;
  };

  return (
    <Paper sx={{ 
      width: 360,
      height: '100%',
      background: 'rgba(10, 10, 10, 0.95)',
      backdropFilter: 'blur(30px)',
      borderRadius: 0,
      borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.3)'
    }}>
      {/* ヘッダー */}
      <Box sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Analytics sx={{ color: socialLayer.color }} />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              ソーシャルデータ
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: socialLayer.color,
              background: 'rgba(255, 87, 34, 0.1)',
              '&:hover': {
                background: 'rgba(255, 87, 34, 0.2)',
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* SNSデータレイヤー */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
            データ可視化
          </Typography>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: selectedLayers?.includes(socialLayer.id) 
                ? alpha(socialLayer.color, 0.1)
                : 'rgba(255, 255, 255, 0.02)',
              border: '1px solid',
              borderColor: selectedLayers?.includes(socialLayer.id)
                ? alpha(socialLayer.color, 0.3)
                : 'rgba(255, 255, 255, 0.05)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              '&:hover': {
                background: alpha(socialLayer.color, 0.15),
                borderColor: alpha(socialLayer.color, 0.5),
              }
            }}
            onClick={() => handleLayerToggle(socialLayer.id)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Box sx={{ color: socialLayer.color }}>{socialLayer.icon}</Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {socialLayer.label}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
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
        </Box>

        <Divider sx={{ my: 3, bgcolor: 'rgba(255, 255, 255, 0.05)' }} />

        {/* カテゴリフィルター */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Category sx={{ fontSize: 20, color: socialLayer.color }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              カテゴリフィルター
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
            表示するSNS投稿のカテゴリを選択
          </Typography>
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

        {/* データ概要 */}
        {statistics && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Timeline sx={{ fontSize: 20, color: socialLayer.color }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                データ概要
              </Typography>
            </Box>
            
            {/* 総投稿数 */}
            <Box sx={{ 
              p: 2,
              mb: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%)',
              border: '1px solid rgba(255, 87, 34, 0.2)'
            }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                過去24時間の投稿数
              </Typography>
              <Typography variant="h4" sx={{ color: socialLayer.color, fontWeight: 700 }}>
                {selectedCategories.length === 0 ? 0 : (statistics.total_points?.toLocaleString() || 0)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                件のソーシャル投稿を分析
              </Typography>
            </Box>

            {/* 感情分析 */}
            {statistics.sentiment_distribution && (
              <Box sx={{ 
                p: 2,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                  感情分析結果
                </Typography>
                {Object.entries(statistics.sentiment_distribution).map(([sentiment, count]) => {
                  const total = Object.values(statistics.sentiment_distribution).reduce((a, b) => a + b, 0);
                  const percentage = ((count / total) * 100).toFixed(1);
                  const sentimentScore = sentiment === 'positive' ? 0.8 : sentiment === 'neutral' ? 0.5 : 0.2;
                  const color = getSentimentColor(sentimentScore);
                  const icon = getSentimentIcon(sentimentScore);
                  const label = sentiment === 'positive' ? 'ポジティブ' : sentiment === 'neutral' ? 'ニュートラル' : 'ネガティブ';
                  
                  return (
                    <Box key={sentiment} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color }}>{icon}</Box>
                          <Typography variant="body2">{label}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {count}件
                          </Typography>
                          <Chip 
                            label={`${percentage}%`} 
                            size="small" 
                            sx={{ 
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: alpha(color, 0.2),
                              color
                            }}
                          />
                        </Box>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={parseFloat(percentage)} 
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: alpha(color, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: color,
                            borderRadius: 2
                          }
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {/* カテゴリ別分析 */}
        {statistics?.category_breakdown && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Tag sx={{ fontSize: 20, color: socialLayer.color }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                カテゴリ別分析
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {statistics.category_breakdown.map((cat) => {
                const categoryInfo = categories.find(c => c.id === cat.category);
                if (!categoryInfo) return null;
                
                return (
                  <Box 
                    key={cat.category}
                    sx={{ 
                      p: 1.5,
                      borderRadius: 2,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: alpha(categoryInfo.color, 0.05),
                        borderColor: alpha(categoryInfo.color, 0.2)
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: '18px' }}>{categoryInfo.icon}</span>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {cat.category}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getSentimentIcon(cat.avg_sentiment || 0.5)}
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          感情スコア: {(cat.avg_sentiment || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {cat.point_count.toLocaleString()} 投稿
                      </Typography>
                      <Chip 
                        icon={<TrendingUp sx={{ fontSize: 14 }} />}
                        label={`${cat.percentage?.toFixed(1)}%`} 
                        size="small" 
                        sx={{ 
                          height: 20,
                          fontSize: '0.7rem',
                          bgcolor: alpha(categoryInfo.color, 0.2),
                          color: categoryInfo.color
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default RightSidebar;