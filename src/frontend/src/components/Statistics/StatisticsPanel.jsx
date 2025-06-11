import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  alpha,
  Stack,
  Divider,
} from '@mui/material';
import {
  Hotel,
  ShoppingCart,
  DirectionsCar,
  Place,
  Event,
  TrendingUp,
  TrendingDown,
  People,
  AttachMoney,
  Speed,
  SentimentSatisfied,
  LocationCity,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

const StatisticsPanel = ({ prefectureData, selectedPrefecture }) => {
  // Calculate statistics from the data
  const statistics = useMemo(() => {
    if (!prefectureData) return null;

    const stats = {
      accommodation: {
        total: 0,
        avgOccupancy: 0,
        avgPrice: 0,
        byType: {}
      },
      consumption: {
        total: 0,
        byCategory: {},
        topAreas: []
      },
      mobility: {
        congestionLevel: 0,
        flowSpeed: 0,
        congestionPoints: []
      },
      events: {
        total: 0,
        byCategory: {},
        totalAttendance: 0
      },
      landmarks: {
        total: 0,
        totalVisitors: 0,
        byCategory: {}
      },
      population: 0
    };

    // Accommodation statistics
    if (prefectureData.accommodation?.features) {
      const accommodations = prefectureData.accommodation.features;
      stats.accommodation.total = accommodations.length;
      
      let totalOccupancy = 0;
      let totalPrice = 0;
      
      accommodations.forEach(acc => {
        const props = acc.properties || {};
        const occupancy = props.occupancy || props.occupancy_rate || 0;
        const price = props.price || props.avg_price || 0;
        const type = props.type || 'その他';
        
        totalOccupancy += occupancy;
        totalPrice += price;
        
        stats.accommodation.byType[type] = (stats.accommodation.byType[type] || 0) + 1;
      });
      
      stats.accommodation.avgOccupancy = accommodations.length > 0 
        ? (totalOccupancy / accommodations.length * 100).toFixed(1) 
        : 0;
      stats.accommodation.avgPrice = accommodations.length > 0 
        ? Math.round(totalPrice / accommodations.length) 
        : 0;
    }

    // Consumption statistics
    if (prefectureData.consumption?.features) {
      const consumptions = prefectureData.consumption.features;
      
      consumptions.forEach(cons => {
        const props = cons.properties || {};
        const amount = props.amount || props.total_amount || 0;
        const category = props.category || 'その他';
        const area = props.area || props.city || '不明';
        
        stats.consumption.total += amount;
        stats.consumption.byCategory[category] = (stats.consumption.byCategory[category] || 0) + amount;
      });
      
      // Calculate top areas
      const areaAmounts = {};
      consumptions.forEach(cons => {
        const props = cons.properties || {};
        const amount = props.amount || 0;
        const area = props.area || props.city || '不明';
        areaAmounts[area] = (areaAmounts[area] || 0) + amount;
      });
      
      stats.consumption.topAreas = Object.entries(areaAmounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([area, amount]) => ({ area, amount }));
    }

    // Mobility statistics
    if (prefectureData.mobility) {
      const routes = prefectureData.mobility.routes || [];
      const congestionPoints = prefectureData.mobility.congestionPoints || [];
      
      let totalCongestion = 0;
      let totalSpeed = 0;
      
      routes.forEach(route => {
        totalCongestion += route.congestion || 0;
        totalSpeed += route.flow_speed || 0;
      });
      
      stats.mobility.congestionLevel = routes.length > 0 
        ? (totalCongestion / routes.length * 100).toFixed(1)
        : 0;
      stats.mobility.flowSpeed = routes.length > 0 
        ? Math.round(totalSpeed / routes.length)
        : 0;
      stats.mobility.congestionPoints = congestionPoints.length;
    }

    // Events statistics
    if (prefectureData.events?.features) {
      const events = prefectureData.events.features;
      stats.events.total = events.length;
      
      events.forEach(event => {
        const props = event.properties || {};
        const category = props.category || 'その他';
        const attendance = props.expected_attendance || props.attendance || 0;
        
        stats.events.byCategory[category] = (stats.events.byCategory[category] || 0) + 1;
        stats.events.totalAttendance += attendance;
      });
    }

    // Landmarks statistics
    if (prefectureData.landmarks?.features) {
      const landmarks = prefectureData.landmarks.features;
      stats.landmarks.total = landmarks.length;
      
      landmarks.forEach(landmark => {
        const props = landmark.properties || {};
        const visitors = props.visitor_count || 0;
        const category = props.category || 'その他';
        
        stats.landmarks.totalVisitors += visitors;
        stats.landmarks.byCategory[category] = (stats.landmarks.byCategory[category] || 0) + 1;
      });
    }

    return stats;
  }, [prefectureData]);

  if (!statistics) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          データを読み込み中...
        </Typography>
      </Box>
    );
  }

  // Prepare chart data
  const consumptionChartData = Object.entries(statistics.consumption.byCategory)
    .map(([category, amount]) => ({
      name: category,
      value: amount
    }))
    .sort((a, b) => b.value - a.value);

  const eventChartData = Object.entries(statistics.events.byCategory)
    .map(([category, count]) => ({
      name: category,
      value: count
    }));

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#6C5CE7'];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        {selectedPrefecture} 統計データ
      </Typography>

      <Grid container spacing={3}>
        {/* Accommodation Statistics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            background: 'rgba(76, 175, 80, 0.05)',
            border: '1px solid rgba(76, 175, 80, 0.2)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Hotel sx={{ color: '#4CAF50' }} />
                <Typography variant="h6">宿泊施設</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">施設数</Typography>
                  <Typography variant="h4">{statistics.accommodation.total}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">平均稼働率</Typography>
                  <Typography variant="h4">{statistics.accommodation.avgOccupancy}%</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">平均価格</Typography>
                  <Typography variant="h4">¥{statistics.accommodation.avgPrice.toLocaleString()}</Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                {Object.entries(statistics.accommodation.byType).map(([type, count]) => (
                  <Box key={type} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{type}</Typography>
                    <Chip label={count} size="small" />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Consumption Statistics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            background: 'rgba(255, 152, 0, 0.05)',
            border: '1px solid rgba(255, 152, 0, 0.2)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ShoppingCart sx={{ color: '#FF9800' }} />
                <Typography variant="h6">消費データ</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary">総消費額</Typography>
              <Typography variant="h4" sx={{ mb: 2 }}>
                ¥{(statistics.consumption.total / 1000000).toFixed(1)}M
              </Typography>

              {consumptionChartData.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={consumptionChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {consumptionChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `¥${(value / 1000).toFixed(0)}k`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Mobility Statistics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            background: 'rgba(0, 188, 212, 0.05)',
            border: '1px solid rgba(0, 188, 212, 0.2)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DirectionsCar sx={{ color: '#00BCD4' }} />
                <Typography variant="h6">人流・交通</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">混雑度</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h4">{statistics.mobility.congestionLevel}%</Typography>
                    {statistics.mobility.congestionLevel > 70 ? 
                      <TrendingUp color="error" /> : 
                      <TrendingDown color="success" />
                    }
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={parseFloat(statistics.mobility.congestionLevel)} 
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    color={statistics.mobility.congestionLevel > 70 ? 'error' : 'success'}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">平均速度</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h4">{statistics.mobility.flowSpeed}</Typography>
                    <Typography variant="body1">km/h</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Speed fontSize="small" />
                    <Typography variant="caption" color="text.secondary">
                      混雑ポイント: {statistics.mobility.congestionPoints}箇所
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Events Statistics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            background: 'rgba(255, 107, 107, 0.05)',
            border: '1px solid rgba(255, 107, 107, 0.2)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Event sx={{ color: '#FF6B6B' }} />
                <Typography variant="h6">イベント</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">開催数</Typography>
                  <Typography variant="h4">{statistics.events.total}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">総参加者数</Typography>
                  <Typography variant="h4">
                    {(statistics.events.totalAttendance / 1000).toFixed(0)}k
                  </Typography>
                </Grid>
              </Grid>

              {eventChartData.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={eventChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" tick={{ fill: '#fff', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#fff', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(0,0,0,0.8)', 
                          border: '1px solid rgba(255,255,255,0.2)' 
                        }} 
                      />
                      <Bar dataKey="value" fill="#FF6B6B" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Landmarks Statistics */}
        <Grid item xs={12}>
          <Card sx={{ 
            background: 'rgba(255, 215, 0, 0.05)',
            border: '1px solid rgba(255, 215, 0, 0.2)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Place sx={{ color: '#FFD700' }} />
                <Typography variant="h6">ランドマーク</Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">総数</Typography>
                  <Typography variant="h4">{statistics.landmarks.total}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">総訪問者数</Typography>
                  <Typography variant="h4">
                    {(statistics.landmarks.totalVisitors / 1000).toFixed(0)}k
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {Object.entries(statistics.landmarks.byCategory).map(([category, count]) => (
                      <Chip 
                        key={category}
                        label={`${category} (${count})`}
                        size="small"
                        sx={{ 
                          bgcolor: alpha('#FFD700', 0.2),
                          color: '#FFD700',
                          borderColor: '#FFD700'
                        }}
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Consumption Areas */}
        {statistics.consumption.topAreas.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ 
              background: 'rgba(156, 39, 176, 0.05)',
              border: '1px solid rgba(156, 39, 176, 0.2)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationCity sx={{ color: '#9C27B0' }} />
                  <Typography variant="h6">消費額上位エリア</Typography>
                </Box>
                
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={statistics.consumption.topAreas}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="area" tick={{ fill: '#fff', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#fff', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)' 
                      }}
                      formatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#9C27B0" 
                      fill="#9C27B0" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default StatisticsPanel;