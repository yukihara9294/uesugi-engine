import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Apartment as BuildingIcon,
  Business as BusinessIcon,
  Warning as RiskIcon,
  DirectionsBus as TransportIcon,
  TrendingUp as EconomicIcon,
  LocationCity as CityIcon,
  Assessment as AnalysisIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

/**
 * 新しい可視化機能のショーケース
 */
const VisualizationShowcase = () => {
  const visualizationFeatures = [
    {
      title: 'PLATEAU 3D都市構造',
      icon: <BuildingIcon />,
      description: '建物の高さ・用途・築年数を3D表現',
      features: [
        '建物高さによる立体表示',
        '用途別カラーコーディング',
        '築年数による耐震リスク評価',
        '推定居住人口の可視化'
      ],
      dataSource: 'PLATEAU 3D都市モデル',
      available: ['東京', '大阪', '福岡', '広島']
    },
    {
      title: '企業活動ヒートマップ',
      icon: <BusinessIcon />,
      description: '企業分布と経済活動の濃淡表示',
      features: [
        '資本金規模による重み付け',
        '産業クラスターの特定',
        '補助金受給企業の強調表示',
        '雇用創出力の推定'
      ],
      dataSource: 'gBizINFO API',
      available: ['全地域']
    },
    {
      title: '複合リスク評価',
      icon: <RiskIcon />,
      description: '防災・経済・社会リスクの統合表示',
      features: [
        '地震リスクスコア',
        '避難困難地域の特定',
        '経済的脆弱性指標',
        '医療アクセス困難度'
      ],
      dataSource: 'PLATEAU + 国土数値情報',
      available: ['全地域']
    },
    {
      title: '交通アクセシビリティ',
      icon: <TransportIcon />,
      description: 'マルチモーダル交通の利便性評価',
      features: [
        'GTFSによる正確な路線表示',
        '停留所500m圏カバレッジ',
        '交通空白地域の自動検出',
        '時間帯別アクセス性'
      ],
      dataSource: 'GTFS + ODPT',
      available: ['広島', '東京']
    },
    {
      title: '経済ダイナミクス',
      icon: <EconomicIcon />,
      description: '地域経済の動的変化を可視化',
      features: [
        'GDP成長率の地域比較',
        '産業構造の時系列変化',
        '観光消費額の季節変動',
        '投資効果のフロー表示'
      ],
      dataSource: 'RESAS + e-Stat',
      available: ['全地域']
    },
    {
      title: '統合都市インデックス',
      icon: <CityIcon />,
      description: '複数指標による都市力の総合評価',
      features: [
        '居住性スコア',
        'ビジネス環境指数',
        '持続可能性評価',
        'イノベーション力'
      ],
      dataSource: '全データ統合',
      available: ['6地域比較']
    }
  ];

  const comparisonData = {
    広島: { 建物数: 12543, 企業数: 3892, リスクスコア: 65, アクセス性: 87 },
    山口: { 建物数: 8234, 企業数: 2341, リスクスコア: 45, アクセス性: 72 },
    福岡: { 建物数: 25678, 企業数: 8901, リスクスコア: 55, アクセス性: 92 },
    大阪: { 建物数: 45678, 企業数: 15234, リスクスコア: 70, アクセス性: 95 },
    東京: { 建物数: 98765, 企業数: 45678, リスクスコア: 75, アクセス性: 98 }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Uesugi Engine 拡張可視化機能
      </Typography>

      {/* 機能一覧 */}
      <Grid container spacing={3}>
        {visualizationFeatures.map((feature, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {feature.icon}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {feature.title}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {feature.description}
                </Typography>
                
                <List dense>
                  {feature.features.map((item, idx) => (
                    <ListItem key={idx} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <ViewIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    データソース: {feature.dataSource}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {feature.available.map((area) => (
                      <Chip 
                        key={area}
                        label={area} 
                        size="small" 
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* 地域比較プレビュー */}
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          6地域統合ダッシュボード（プレビュー）
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {Object.entries(comparisonData).map(([city, data]) => (
            <Grid item xs={12} sm={6} md={2.4} key={city}>
              <Card>
                <CardContent>
                  <Typography variant="h6" align="center" gutterBottom>
                    {city}
                  </Typography>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      建物数
                    </Typography>
                    <Typography variant="h6">
                      {data.建物数.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      企業数
                    </Typography>
                    <Typography variant="h6">
                      {data.企業数.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      リスクスコア
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" color={data.リスクスコア > 60 ? 'error.main' : 'text.primary'}>
                        {data.リスクスコア}
                      </Typography>
                      <Typography variant="caption" sx={{ ml: 0.5 }}>
                        /100
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      交通カバー率
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" color="success.main">
                        {data.アクセス性}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* アクションボタン */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button 
          variant="contained" 
          size="large"
          startIcon={<AnalysisIcon />}
          onClick={() => console.log('統合ダッシュボードを開く')}
        >
          統合ダッシュボードで詳細を見る
        </Button>
      </Box>
    </Box>
  );
};

export default VisualizationShowcase;