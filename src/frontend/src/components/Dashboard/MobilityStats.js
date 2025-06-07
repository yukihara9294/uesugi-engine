/**
 * 人流・宿泊・消費統計ダッシュボードコンポーネント
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  DirectionsWalk,
  DirectionsCar,
  Train,
  Hotel,
  ShoppingCart,
  TrendingUp,
  People,
  AttachMoney
} from '@mui/icons-material';

const MobilityStats = ({ mobilityData, accommodationData, consumptionData }) => {
  // 交通手段別の集計
  const transportStats = mobilityData?.features?.reduce((acc, feature) => {
    const mode = feature.properties.transport_mode;
    if (!acc[mode]) acc[mode] = 0;
    acc[mode] += feature.properties.flow_count;
    return acc;
  }, {}) || {};

  // 宿泊統計
  const accommodationStats = accommodationData?.summary || {
    total_facilities: 0,
    overall_occupancy_rate: 0,
    total_guests: 0
  };

  // 消費統計
  const consumptionStats = consumptionData?.summary || {
    total_transactions: 0,
    total_amount: 0,
    category_breakdown: {}
  };

  const getTransportIcon = (mode) => {
    switch (mode) {
      case '徒歩': return <DirectionsWalk />;
      case '車': return <DirectionsCar />;
      case '電車': return <Train />;
      default: return <People />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Box>
      {/* 人流統計 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <People color="primary" />
          人流データ
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              交通手段別の移動人数
            </Typography>
            <List dense>
              {Object.entries(transportStats).map(([mode, count]) => (
                <ListItem key={mode}>
                  <ListItemIcon>
                    {getTransportIcon(mode)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={mode}
                    secondary={`${count.toLocaleString()}人`}
                  />
                  <Box sx={{ width: 100 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(count / Math.max(...Object.values(transportStats))) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* 宿泊統計 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Hotel color="primary" />
          宿泊データ
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              施設数
            </Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {accommodationStats.total_facilities}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              稼働率
            </Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {Math.round(accommodationStats.overall_occupancy_rate * 100)}%
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              総宿泊者数
            </Typography>
            <Typography variant="h5" sx={{ mt: 1 }}>
              {accommodationStats.total_guests.toLocaleString()}人
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 消費統計 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCart color="primary" />
          消費データ
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              総売上額
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, mb: 2 }}>
              {formatCurrency(consumptionStats.total_amount)}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              カテゴリ別売上
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {Object.entries(consumptionStats.category_breakdown).map(([category, data]) => (
                <Chip
                  key={category}
                  label={`${category}: ${formatCurrency(data.total_amount)}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              総取引件数
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <TrendingUp color="success" />
              <Typography variant="h5">
                {consumptionStats.total_transactions.toLocaleString()}件
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default MobilityStats;