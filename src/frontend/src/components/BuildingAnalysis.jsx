import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  Business as BusinessIcon,
  Home as HomeIcon,
  Store as StoreIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

/**
 * PLATEAU建物データ分析コンポーネント
 * 建物属性から都市の特性を可視化
 */
const BuildingAnalysis = ({ prefecture, plateauData }) => {
  const [analysis, setAnalysis] = useState({
    totalBuildings: 0,
    averageHeight: 0,
    usageDistribution: {},
    earthquakeRisk: { high: 0, medium: 0, low: 0 },
    estimatedPopulation: 0,
    economicIndicators: {}
  });

  useEffect(() => {
    if (plateauData?.features) {
      analyzeBuildings(plateauData.features);
    }
  }, [plateauData]);

  const analyzeBuildings = (buildings) => {
    let totalHeight = 0;
    const usage = {};
    const risk = { high: 0, medium: 0, low: 0 };
    let population = 0;

    buildings.forEach(building => {
      const props = building.properties;
      
      // 高さ集計
      if (props.height) {
        totalHeight += props.height;
      }

      // 用途別集計
      const buildingUsage = props.usage || 'その他';
      usage[buildingUsage] = (usage[buildingUsage] || 0) + 1;

      // 地震リスク集計
      if (props.earthquake_risk) {
        risk[props.earthquake_risk]++;
      }

      // 人口推計
      population += props.estimated_population || 0;
    });

    setAnalysis({
      totalBuildings: buildings.length,
      averageHeight: buildings.length > 0 ? (totalHeight / buildings.length).toFixed(1) : 0,
      usageDistribution: usage,
      earthquakeRisk: risk,
      estimatedPopulation: population,
      economicIndicators: calculateEconomicIndicators(usage, buildings.length)
    });
  };

  const calculateEconomicIndicators = (usage, total) => {
    const commercial = (usage['商業'] || 0) + (usage['店舗'] || 0);
    const office = usage['事務所'] || 0;
    const residential = (usage['住宅'] || 0) + (usage['共同住宅'] || 0);

    return {
      commercialRatio: ((commercial / total) * 100).toFixed(1),
      officeRatio: ((office / total) * 100).toFixed(1),
      residentialRatio: ((residential / total) * 100).toFixed(1),
      economicDiversity: Object.keys(usage).length
    };
  };

  const getUsageIcon = (usage) => {
    if (usage.includes('住宅')) return <HomeIcon />;
    if (usage.includes('商業') || usage.includes('店舗')) return <StoreIcon />;
    if (usage.includes('事務所')) return <BusinessIcon />;
    return <BusinessIcon />;
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return '#ff4444';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#999';
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BusinessIcon color="primary" />
        都市構造分析（PLATEAU建物データ）
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* 基本統計 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>基本統計</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  総建物数
                </Typography>
                <Typography variant="h4">
                  {analysis.totalBuildings.toLocaleString()}棟
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  平均建物高さ
                </Typography>
                <Typography variant="h5">
                  {analysis.averageHeight}m
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  推定居住人口
                </Typography>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon />
                  {analysis.estimatedPopulation.toLocaleString()}人
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 地震リスク評価 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" />
                地震リスク評価
              </Typography>
              {Object.entries(analysis.earthquakeRisk).map(([level, count]) => {
                const percentage = analysis.totalBuildings > 0 
                  ? (count / analysis.totalBuildings * 100).toFixed(1)
                  : 0;
                return (
                  <Box key={level} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">
                        {level === 'high' ? '高リスク（旧耐震）' : 
                         level === 'medium' ? '中リスク' : '低リスク（新耐震）'}
                      </Typography>
                      <Typography variant="body2">
                        {count}棟 ({percentage}%)
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={parseFloat(percentage)}
                      sx={{ 
                        height: 8,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getRiskColor(level)
                        }
                      }}
                    />
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        {/* 用途別分布 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>用途別建物分布</Typography>
              <Grid container spacing={2}>
                {Object.entries(analysis.usageDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([usage, count]) => (
                    <Grid item xs={6} sm={4} md={2} key={usage}>
                      <Box sx={{ textAlign: 'center' }}>
                        {getUsageIcon(usage)}
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {usage}
                        </Typography>
                        <Typography variant="h6">
                          {count}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 経済指標 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="success" />
                都市経済指標
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      商業施設比率
                    </Typography>
                    <Typography variant="h5">
                      {analysis.economicIndicators.commercialRatio}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      オフィス比率
                    </Typography>
                    <Typography variant="h5">
                      {analysis.economicIndicators.officeRatio}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      住宅比率
                    </Typography>
                    <Typography variant="h5">
                      {analysis.economicIndicators.residentialRatio}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      用途多様性
                    </Typography>
                    <Typography variant="h5">
                      {analysis.economicIndicators.economicDiversity}種類
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip 
          label="PLATEAU 3D都市モデル" 
          size="small" 
          color="primary"
        />
        <Chip 
          label={`${prefecture}データ`}
          size="small"
        />
        <Chip 
          label="建物属性分析"
          size="small"
          variant="outlined"
        />
      </Box>
    </Paper>
  );
};

export default BuildingAnalysis;