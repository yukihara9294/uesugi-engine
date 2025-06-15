import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Grid,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Storage as DataIcon,
  Map as MapIcon,
  DirectionsBus as TransportIcon,
  LocalHospital as MedicalIcon,
  School as SchoolIcon,
  Home as FacilityIcon,
  Event as EventIcon,
  People as PeopleIcon,
  Shield as DisasterIcon,
  Landscape as TourismIcon
} from '@mui/icons-material';

const HelpDialog = ({ open, onClose, selectedPrefecture = '山口県' }) => {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  // 都道府県ごとのデータ定義
  const prefectureData = {
    '山口県': {
      dataCollection: [
        {
          category: '交通データ',
          icon: <TransportIcon />,
          count: '61ファイル',
          status: 'partial',
          sources: ['山口県オープンデータカタログ'],
          details: [
            { name: 'GTFSデータ（岩国市・光市）', status: 'available' },
            { name: '交通事故データ（2019-2023年）', status: 'available' },
            { name: '駐車場・駐輪場情報', status: 'available' },
            { name: 'JR山陽本線・山口線データ', status: 'limited' }
          ]
        },
        {
          category: '医療施設',
          icon: <MedicalIcon />,
          count: '59ファイル',
          status: 'available',
          sources: ['山口県オープンデータカタログ'],
          details: [
            { name: '病院・診療所一覧', status: 'available' },
            { name: 'AED設置場所', status: 'available' },
            { name: '薬局情報', status: 'available' },
            { name: 'リアルタイムベッド数', status: 'unavailable' }
          ]
        },
        {
          category: '教育施設',
          icon: <SchoolIcon />,
          count: '163ファイル',
          status: 'available',
          sources: ['山口県オープンデータカタログ'],
          details: [
            { name: '小学校・中学校・高校一覧', status: 'available' },
            { name: '学区情報', status: 'available' },
            { name: '文化財一覧', status: 'available' },
            { name: '保育園・幼稚園情報', status: 'available' }
          ]
        },
        {
          category: '人口統計',
          icon: <PeopleIcon />,
          count: '258ファイル',
          status: 'available',
          sources: ['山口県オープンデータカタログ', 'e-Stat'],
          details: [
            { name: '月次人口データ（2019-2025）', status: 'available' },
            { name: '年齢別・性別人口統計', status: 'available' },
            { name: '地区別詳細データ', status: 'available' },
            { name: '人口移動統計', status: 'available' }
          ]
        },
        {
          category: '観光・イベント',
          icon: <TourismIcon />,
          count: '52ファイル',
          status: 'available',
          sources: ['山口県オープンデータカタログ'],
          details: [
            { name: '観光スポット情報', status: 'available' },
            { name: 'イベント情報', status: 'available' },
            { name: '公衆無線LAN設置場所', status: 'available' },
            { name: '宿泊施設データ', status: 'limited' }
          ]
        },
        {
          category: '防災・安全',
          icon: <DisasterIcon />,
          count: '45ファイル',
          status: 'available',
          sources: ['山口県オープンデータカタログ'],
          details: [
            { name: '避難所・避難場所一覧', status: 'available' },
            { name: '防災無線設置場所', status: 'available' },
            { name: '浸水想定区域データ', status: 'available' },
            { name: 'ヘリポート情報', status: 'available' }
          ]
        }
      ],
      visualization: [
        {
          name: '人流データ',
          status: 'active',
          description: '主要40地点間の人の移動をリアルタイムアニメーションで表示',
          features: ['統計的推定モデルによる人流シミュレーション', '時間帯別の移動パターン']
        },
        {
          name: 'SNS・イベント情報',
          status: 'active',
          description: '山口七夕ちょうちんまつり、下関海響マラソンなどの主要イベント表示',
          features: ['イベント規模に応じた可視化', '影響範囲の表示']
        },
        {
          name: '公共交通',
          status: 'partial',
          description: 'JR山陽本線・山口線、主要バス路線の表示',
          features: ['岩国市・光市のGTFSデータ対応', '主要駅・バス停の表示']
        },
        {
          name: '宿泊施設',
          status: 'inactive',
          description: '現在データ整備中',
          features: []
        },
        {
          name: 'ランドマーク',
          status: 'active',
          description: '県庁、市役所、空港などの主要施設を3D表示',
          features: ['施設タイプ別の色分け', '詳細情報ポップアップ']
        }
      ]
    },
    '広島県': {
      dataCollection: [
        {
          category: '交通データ',
          icon: <TransportIcon />,
          count: '完全対応',
          status: 'available',
          sources: ['広島電鉄GTFS', '広島県オープンデータ'],
          details: [
            { name: '広島電鉄全線GTFSデータ', status: 'available' },
            { name: 'バス路線データ', status: 'available' },
            { name: 'アストラムライン', status: 'available' },
            { name: 'JR路線データ', status: 'available' }
          ]
        }
      ],
      visualization: [
        {
          name: '人流データ',
          status: 'active',
          description: '県全域60地点以上の人流をリアルタイム表示',
          features: ['2000フローまで同時表示可能', '市内限定表示モード']
        },
        {
          name: '公共交通',
          status: 'active',
          description: '路面電車、バス、JRの完全対応',
          features: ['リアルタイム運行情報（開発中）', 'GTFSデータ完全対応']
        }
      ]
    }
  };

  const currentData = prefectureData[selectedPrefecture] || prefectureData['山口県'];

  const TabPanel = ({ children, value, index }) => (
    <Box
      role="tabpanel"
      hidden={value !== index}
      sx={{ pt: 3 }}
    >
      {value === index && children}
    </Box>
  );

  const StatusChip = ({ status }) => {
    const config = {
      available: { label: '利用可能', color: 'success', icon: <CheckIcon /> },
      partial: { label: '一部利用可能', color: 'warning', icon: <WarningIcon /> },
      unavailable: { label: '準備中', color: 'default', icon: <InfoIcon /> },
      active: { label: '表示中', color: 'success', icon: <CheckIcon /> },
      inactive: { label: '非表示', color: 'default', icon: <InfoIcon /> },
      limited: { label: '限定的', color: 'warning', icon: <WarningIcon /> }
    };

    const { label, color, icon } = config[status] || config.unavailable;

    return (
      <Chip
        label={label}
        color={color}
        size="small"
        icon={icon}
        sx={{ ml: 1 }}
      />
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Box>
          <Typography variant="h5" component="div" fontWeight="bold">
            {selectedPrefecture}データ利用ガイド
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Uesugi Engine - 行政向け施策効果検証プラットフォーム
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="収集データ" icon={<DataIcon />} iconPosition="start" />
          <Tab label="可視化機能" icon={<MapIcon />} iconPosition="start" />
          <Tab label="操作方法" icon={<InfoIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Alert severity="info" sx={{ mb: 3 }}>
            {selectedPrefecture}から合計<strong>638ファイル</strong>のオープンデータを収集・統合しました
          </Alert>

          <Grid container spacing={3}>
            {currentData.dataCollection.map((category, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Box color="primary.main" mr={2}>{category.icon}</Box>
                      <Box flex={1}>
                        <Typography variant="h6">{category.category}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {category.count}
                        </Typography>
                      </Box>
                      <StatusChip status={category.status} />
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      データソース: {category.sources.join(', ')}
                    </Typography>

                    <List dense sx={{ mt: 1 }}>
                      {category.details.map((detail, idx) => (
                        <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                          <ListItemText 
                            primary={
                              <Box display="flex" alignItems="center">
                                <Typography variant="body2">{detail.name}</Typography>
                                <StatusChip status={detail.status} />
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Alert severity="success" sx={{ mb: 3 }}>
            現在、以下のデータレイヤーが{selectedPrefecture}で利用可能です
          </Alert>

          <List>
            {currentData.visualization.map((viz, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%',
                        bgcolor: viz.status === 'active' ? 'success.main' : 
                                viz.status === 'partial' ? 'warning.main' : 'grey.500'
                      }} 
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <Typography variant="subtitle1" fontWeight="medium">
                          {viz.name}
                        </Typography>
                        <StatusChip status={viz.status} />
                      </Box>
                    }
                    secondary={
                      <Box mt={1}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {viz.description}
                        </Typography>
                        {viz.features.length > 0 && (
                          <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                            {viz.features.map((feature, idx) => (
                              <Typography component="li" variant="body2" key={idx}>
                                {feature}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < currentData.visualization.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>基本操作</Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="レイヤーの表示/非表示"
                secondary="左サイドバーのトグルボタンで各データレイヤーの表示を切り替えられます"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="地域の切り替え"
                secondary="ヘッダー左上のドロップダウンから広島県、山口県などを選択できます"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="時間範囲の設定"
                secondary="ヘッダーの時間設定から表示するデータの期間を変更できます"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="詳細情報の表示"
                secondary="地図上のアイコンをクリックすると詳細情報が表示されます"
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>活用例</Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="イベント影響分析"
                secondary="イベントレイヤーと人流データを重ねて、イベント時の人の動きを分析"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="交通計画策定"
                secondary="公共交通レイヤーと人流データから、新規路線の需要を推定"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="防災計画"
                secondary="避難所データと人口分布から、避難計画の妥当性を検証"
              />
            </ListItem>
          </List>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              より詳細な分析をご希望の場合は、右サイドバーの「AI分析」ボタンをクリックしてください。
              因果推論AIが施策の効果を定量的に評価します。
            </Typography>
          </Alert>
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;