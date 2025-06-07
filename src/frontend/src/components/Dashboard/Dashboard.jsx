/**
 * ダッシュボードコンポーネント
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  alpha,
} from '@mui/material';
import { 
  Close as CloseIcon, 
  TrendingUp, 
  Place, 
  Schedule,
  Analytics,
  SentimentSatisfied,
  SentimentNeutral,
  SentimentDissatisfied,
  WbSunny,
  Speed,
} from '@mui/icons-material';

const Dashboard = ({
  statistics,
  weatherData,
  mobilityData,
  accommodationData,
  consumptionData,
  timeRange,
  selectedCategories,
  viewport,
  onClose
}) => {
  // カテゴリカラーマップ
  const categoryColors = {
    '観光': '#4CAF50',
    'グルメ': '#FF9800',
    'イベント': '#9C27B0',
    'ショッピング': '#2196F3',
    '交通': '#607D8B',
  };

  const categoryIcons = {
    '観光': '🏯',
    'グルメ': '🍜',
    'イベント': '🎉',
    'ショッピング': '🛍️',
    '交通': '🚃',
  };

  return (
    <Paper sx={{ 
      width: 420,
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
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Analytics sx={{ color: '#667eea' }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            分析ダッシュボード
          </Typography>
        </Box>
        <IconButton 
          size="small" 
          onClick={onClose}
          sx={{ 
            '&:hover': { 
              background: 'rgba(255, 255, 255, 0.1)',
              transform: 'rotate(90deg)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* コンテンツ */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Grid container spacing={2}>
          {/* 総合統計 */}
          <Grid item xs={12}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
              border: '1px solid rgba(102, 126, 234, 0.3)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                background: 'radial-gradient(circle, rgba(102, 126, 234, 0.2) 0%, transparent 70%)',
                borderRadius: '50%',
              }
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    background: 'rgba(102, 126, 234, 0.2)',
                    display: 'flex',
                    mr: 2
                  }}>
                    <TrendingUp sx={{ color: '#667eea' }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, opacity: 0.9 }}>
                    データ概要
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ 
                  color: '#667eea', 
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  mb: 0.5
                }}>
                  {statistics?.total_points?.toLocaleString() || '0'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  総データポイント
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* カテゴリ別分析 */}
          <Grid item xs={12}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 3,
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Speed sx={{ mr: 1.5, color: '#667eea', fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    カテゴリ別分析
                  </Typography>
                </Box>
                {statistics?.category_breakdown?.map((category, index) => {
                  const color = categoryColors[category.category] || '#667eea';
                  const icon = categoryIcons[category.category] || '📍';
                  return (
                    <Box key={category.category} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span style={{ fontSize: '18px' }}>{icon}</span>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {category.category}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" sx={{ color, fontWeight: 700 }}>
                            {category.percentage?.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={category.percentage || 0} 
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha(color, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              backgroundColor: color,
                              backgroundImage: `linear-gradient(45deg, ${color} 25%, ${alpha(color, 0.8)} 25%, ${alpha(color, 0.8)} 50%, ${color} 50%, ${color} 75%, ${alpha(color, 0.8)} 75%, ${alpha(color, 0.8)})`,
                              backgroundSize: '20px 20px',
                              animation: 'progress-bar-stripes 1s linear infinite',
                            },
                            '@keyframes progress-bar-stripes': {
                              '0%': { backgroundPosition: '0 0' },
                              '100%': { backgroundPosition: '20px 20px' }
                            }
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {category.point_count.toLocaleString()} ポイント
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          平均感情: {category.avg_sentiment?.toFixed(2) || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </CardContent>
            </Card>
          </Grid>

          {/* 感情分析 */}
          {statistics?.sentiment_distribution && (
            <Grid item xs={12}>
              <Card sx={{ 
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 3,
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    感情分析
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    {Object.entries(statistics.sentiment_distribution).map(([sentiment, count]) => {
                      const config = {
                        positive: { color: '#4CAF50', icon: <SentimentSatisfied />, label: 'ポジティブ' },
                        neutral: { color: '#FF9800', icon: <SentimentNeutral />, label: 'ニュートラル' },
                        negative: { color: '#F44336', icon: <SentimentDissatisfied />, label: 'ネガティブ' }
                      };
                      const { color, icon, label } = config[sentiment];
                      const total = Object.values(statistics.sentiment_distribution).reduce((a, b) => a + b, 0);
                      const percentage = ((count / total) * 100).toFixed(1);
                      
                      return (
                        <Box 
                          key={sentiment}
                          sx={{ 
                            flex: 1,
                            textAlign: 'center',
                            p: 2,
                            borderRadius: 2,
                            background: alpha(color, 0.1),
                            border: `1px solid ${alpha(color, 0.3)}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 8px 24px ${alpha(color, 0.2)}`,
                              borderColor: alpha(color, 0.5),
                            }
                          }}
                        >
                          <Box sx={{ color, mb: 1 }}>{icon}</Box>
                          <Typography variant="h4" sx={{ color, fontWeight: 700, mb: 0.5 }}>
                            {count}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {label}
                          </Typography>
                          <Chip 
                            label={`${percentage}%`} 
                            size="small" 
                            sx={{ 
                              mt: 1,
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: alpha(color, 0.2),
                              color
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* ピーク時間帯 */}
          {statistics?.peak_hours && (
            <Grid item xs={12}>
              <Card sx={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Schedule sx={{ mr: 1 }} />
                    <Typography variant="h6">ピーク時間帯</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {statistics.peak_hours.map(hour => (
                      <Chip
                        key={hour}
                        label={`${hour}:00`}
                        size="small"
                        color="secondary"
                        variant="filled"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* 現在のビューポート */}
          <Grid item xs={12}>
            <Card sx={{ background: 'rgba(255, 255, 255, 0.02)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Place sx={{ mr: 1 }} />
                  <Typography variant="h6">現在の表示エリア</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  緯度: {viewport.latitude?.toFixed(4)}<br />
                  経度: {viewport.longitude?.toFixed(4)}<br />
                  ズーム: {viewport.zoom?.toFixed(1)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* 気象情報サマリー */}
          {weatherData && (
            <Grid item xs={12}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.1) 0%, rgba(255, 140, 0, 0.1) 100%)',
                border: '1px solid rgba(255, 165, 0, 0.3)',
                borderRadius: 3,
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <WbSunny sx={{ mr: 1.5, color: '#FFA500', fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      広島県の天気
                    </Typography>
                  </Box>
                  
                  {/* 現在の気象状況 */}
                  {weatherData.current_weather && weatherData.current_weather.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, color: '#FFA500', fontWeight: 600 }}>
                        現在の気象状況
                      </Typography>
                      <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                        {weatherData.current_weather.slice(0, 5).map((weather, index) => (
                          <ListItem 
                            key={index}
                            sx={{ 
                              px: 2,
                              py: 1,
                              mb: 1,
                              borderRadius: 2,
                              background: 'rgba(255, 165, 0, 0.05)',
                              border: '1px solid rgba(255, 165, 0, 0.1)',
                              '&:hover': {
                                background: 'rgba(255, 165, 0, 0.1)',
                              }
                            }}
                          >
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {weather.landmark_name}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
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
                  )}
                  
                  {/* 気象サマリー */}
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    background: 'rgba(255, 165, 0, 0.05)',
                    border: '1px solid rgba(255, 165, 0, 0.2)'
                  }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: '#FFA500', fontWeight: 600 }}>
                      気象サマリー
                    </Typography>
                    <Grid container spacing={2}>
                      {weatherData.average_temperature && (
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ color: '#FFA500', fontWeight: 700 }}>
                              {weatherData.average_temperature.toFixed(1)}°C
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              平均気温
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      {weatherData.total_precipitation !== undefined && (
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ color: '#2196F3', fontWeight: 700 }}>
                              {weatherData.total_precipitation}mm
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              降水量
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                    {weatherData.dominant_condition && (
                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Chip 
                          label={weatherData.dominant_condition}
                          sx={{ 
                            bgcolor: 'rgba(255, 165, 0, 0.2)',
                            color: '#FFA500',
                            fontWeight: 500
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* フッター */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
          データ分析期間
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, color: '#667eea' }}>
          {timeRange.start.toLocaleDateString('ja-JP')} 〜 {timeRange.end.toLocaleDateString('ja-JP')}
        </Typography>
      </Box>
    </Paper>
  );
};

export default Dashboard;