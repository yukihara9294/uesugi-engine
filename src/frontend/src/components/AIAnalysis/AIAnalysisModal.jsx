/**
 * AI分析モーダルコンポーネント
 * 因果推論による過去分析と未来予測を提供
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Tabs,
  Tab,
  Typography,
  Button,
  Divider,
  Paper,
  Chip,
  CircularProgress,
  LinearProgress,
  Grid,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  TextField,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import {
  Close,
  AutoAwesome,
  Assessment,
  TrendingUp,
  Timeline,
  Psychology,
  Refresh,
  CloudQueue,
  Campaign,
  Event,
  FilterDrama,
  WbSunny,
  Thunderstorm,
  AcUnit,
  Upload,
  Description,
  AttachMoney,
  Train,
  DirectionsCar,
  Groups,
  CalendarMonth,
  LocationOn,
  CheckCircle,
  Warning,
  Lightbulb,
  ShowChart,
} from '@mui/icons-material';

// カスタムコンポーネント
import FactorDecompositionChart from './FactorDecompositionChart';
import PredictionChart from './PredictionChart';
import CounterfactualAnalysis from './CounterfactualAnalysis';
import CausalNetworkVisualization from './CausalNetworkVisualization';

// サービス
import { analyzePastData, predictFuture, getCounterfactualScenarios, predictEventSuccess } from '../../services/causalInference';

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-analysis-tabpanel-${index}`}
      aria-labelledby={`ai-analysis-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const AIAnalysisModal = ({ open, onClose, currentData, timeRange, currentPrefecture }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [counterfactualData, setCounterfactualData] = useState(null);
  const [selectedPastEvent, setSelectedPastEvent] = useState(null);
  
  // 新しい予測用の状態変数
  const [eventName, setEventName] = useState('');
  const [eventCategory, setEventCategory] = useState('');
  const [targetAudience, setTargetAudience] = useState(35000);
  const [eventDuration, setEventDuration] = useState('');
  const [advertisementBudget, setAdvertisementBudget] = useState('');
  const [snsStrategy, setSnsStrategy] = useState('');
  const [mediaStrategy, setMediaStrategy] = useState('');
  const [venueType, setVenueType] = useState('');
  const [transportAccess, setTransportAccess] = useState('');
  const [parkingAvailability, setParkingAvailability] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [referenceEvent, setReferenceEvent] = useState('');
  const fileInputRef = useRef(null);

  // 過去データの分析
  useEffect(() => {
    if (open && activeTab === 0 && !analysisData && currentData.eventData?.length > 0) {
      // 最初のイベントを自動選択
      setSelectedPastEvent(currentData.eventData[0]);
    }
  }, [open, activeTab, currentData.eventData]);

  // 選択されたイベントが変更されたら分析を実行
  useEffect(() => {
    if (selectedPastEvent && activeTab === 0) {
      loadPastAnalysis();
    }
  }, [selectedPastEvent]);

  const loadPastAnalysis = async () => {
    setLoading(true);
    try {
      const data = await analyzePastData({
        prefecture: currentPrefecture,
        timeRange,
        currentData,
        selectedEvent: selectedPastEvent,
      });
      setAnalysisData(data);
      
      // 反実仮想分析も同時に読み込む
      const scenarios = await getCounterfactualScenarios({
        prefecture: currentPrefecture,
        baselineData: data.decomposition,
      });
      setCounterfactualData(scenarios);
    } catch (error) {
      console.error('Failed to analyze past data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrediction = async () => {
    setLoading(true);
    try {
      const data = await predictEventSuccess({
        targetAudience,
        eventCategory,
        eventDuration,
        advertisementBudget,
        snsStrategy,
        mediaStrategy,
        venueType,
        transportAccess,
        parkingAvailability,
      });
      setPredictionData(data);
    } catch (error) {
      console.error('Failed to predict future:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(10, 10, 10, 0.98)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(102, 126, 234, 0.3)',
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AutoAwesome sx={{ color: '#667eea' }} />
          <Typography variant="h6" fontWeight={700}>
            AI因果推論分析
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 60,
                px: 3,
              },
              '& .Mui-selected': {
                color: '#667eea !important',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#667eea',
                height: 3,
              },
            }}
          >
            <Tab
              icon={<Assessment />}
              label="過去分析"
              iconPosition="start"
            />
            <Tab
              icon={<TrendingUp />}
              label="未来予測"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box sx={{ height: 600, overflow: 'auto' }}>
          {/* 過去分析タブ */}
          <TabPanel value={activeTab} index={0}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: '#667eea' }} />
              </Box>
            ) : analysisData ? (
              <Grid container spacing={3}>
                {/* イベント選択 */}
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      <Event sx={{ mr: 1, verticalAlign: 'middle' }} />
                      分析対象イベント
                    </Typography>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>イベントを選択</InputLabel>
                      <Select
                        value={selectedPastEvent?.id || ''}
                        onChange={(e) => {
                          const event = currentData.eventData?.find(ev => ev.id === e.target.value);
                          setSelectedPastEvent(event);
                        }}
                        label="イベントを選択"
                      >
                        {currentData.eventData?.map((event) => (
                          <MenuItem key={event.id} value={event.id}>
                            <Box>
                              <Typography variant="body1" fontWeight={600}>
                                {event.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {event.venue} • {new Date(event.date).toLocaleDateString('ja-JP')}
                                {(event.expected_attendees || event.expectedVisitors || event.attendees) && 
                                  ` • 想定${(event.expected_attendees || event.expectedVisitors || event.attendees).toLocaleString()}人`}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {selectedPastEvent && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(102, 126, 234, 0.1)', borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {selectedPastEvent.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          会場: {selectedPastEvent.venue}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          日時: {new Date(selectedPastEvent.date).toLocaleString('ja-JP')}
                        </Typography>
                        {(selectedPastEvent.expected_attendees || selectedPastEvent.expectedVisitors || selectedPastEvent.attendees) && (
                          <Typography variant="body2" color="text.secondary">
                            想定来場者数: {(selectedPastEvent.expected_attendees || selectedPastEvent.expectedVisitors || selectedPastEvent.attendees).toLocaleString()}人
                          </Typography>
                        )}
                      </Box>
                    )}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={loadPastAnalysis}
                        disabled={!selectedPastEvent}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                        }}
                      >
                        分析を更新
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
                {/* 要因分解 */}
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                      イベント要因分解
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      各要因が訪問者数に与えた因果効果を定量化
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      <FactorDecompositionChart data={analysisData.decomposition} />
                    </Box>
                  </Paper>
                </Grid>

                {/* 因果ネットワーク */}
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      height: '100%',
                    }}
                  >
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
                      因果関係ネットワーク
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <CausalNetworkVisualization data={analysisData.causalNetwork} />
                    </Box>
                  </Paper>
                </Grid>

                {/* 反実仮想分析 */}
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      height: '100%',
                    }}
                  >
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      反実仮想分析
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      "もし〜だったら"のシナリオ分析
                    </Typography>
                    {counterfactualData && (
                      <CounterfactualAnalysis scenarios={counterfactualData} />
                    )}
                  </Paper>
                </Grid>

                {/* 主要な発見事項 */}
                <Grid item xs={12}>
                  <Alert
                    severity="info"
                    sx={{
                      background: 'rgba(102, 126, 234, 0.1)',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600}>
                      主要な発見事項
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {analysisData.insights.map((insight, index) => (
                        <Typography key={index} variant="body2" sx={{ mt: 0.5 }}>
                          • {insight}
                        </Typography>
                      ))}
                    </Box>
                  </Alert>
                </Grid>
              </Grid>
            ) : null}
          </TabPanel>

          {/* 未来予測タブ */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              {/* イベント基本情報セクション */}
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 3,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    <Event sx={{ mr: 1, verticalAlign: 'middle' }} />
                    イベント基本情報
                  </Typography>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="イベント名"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="例: 広島フラワーフェスティバル2025"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>イベントカテゴリー</InputLabel>
                        <Select
                          value={eventCategory}
                          onChange={(e) => setEventCategory(e.target.value)}
                          label="イベントカテゴリー"
                        >
                          <MenuItem value="festival">祭り/フェスティバル</MenuItem>
                          <MenuItem value="sports">スポーツ</MenuItem>
                          <MenuItem value="concert">コンサート</MenuItem>
                          <MenuItem value="exhibition">展示会</MenuItem>
                          <MenuItem value="conference">会議/カンファレンス</MenuItem>
                          <MenuItem value="other">その他</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography gutterBottom>
                        <Groups sx={{ mr: 1, verticalAlign: 'middle' }} />
                        目標来場者数: {targetAudience.toLocaleString()}人
                      </Typography>
                      <Slider
                        value={targetAudience}
                        onChange={(e, value) => setTargetAudience(value)}
                        min={1000}
                        max={100000}
                        step={1000}
                        marks={[
                          { value: 1000, label: '1千人' },
                          { value: 25000, label: '2.5万人' },
                          { value: 50000, label: '5万人' },
                          { value: 100000, label: '10万人' },
                        ]}
                        sx={{ color: '#667eea' }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>開催期間</InputLabel>
                        <Select
                          value={eventDuration}
                          onChange={(e) => setEventDuration(e.target.value)}
                          label="開催期間"
                        >
                          <MenuItem value="1day">1日</MenuItem>
                          <MenuItem value="2-3days">2-3日</MenuItem>
                          <MenuItem value="1week">1週間</MenuItem>
                          <MenuItem value="1month">1ヶ月以上</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* マーケティング戦略セクション */}
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 3,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    <Campaign sx={{ mr: 1, verticalAlign: 'middle' }} />
                    マーケティング戦略
                  </Typography>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>広告予算</InputLabel>
                        <Select
                          value={advertisementBudget}
                          onChange={(e) => setAdvertisementBudget(e.target.value)}
                          label="広告予算"
                        >
                          <MenuItem value="none">なし</MenuItem>
                          <MenuItem value="small">~50万円</MenuItem>
                          <MenuItem value="medium">~200万円</MenuItem>
                          <MenuItem value="large">~500万円</MenuItem>
                          <MenuItem value="xlarge">500万円以上</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>SNS戦略</InputLabel>
                        <Select
                          value={snsStrategy}
                          onChange={(e) => setSnsStrategy(e.target.value)}
                          label="SNS戦略"
                        >
                          <MenuItem value="none">なし</MenuItem>
                          <MenuItem value="basic">基本的な告知</MenuItem>
                          <MenuItem value="active">積極的な発信</MenuItem>
                          <MenuItem value="influencer">インフルエンサー活用</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>メディア露出</InputLabel>
                        <Select
                          value={mediaStrategy}
                          onChange={(e) => setMediaStrategy(e.target.value)}
                          label="メディア露出"
                        >
                          <MenuItem value="none">なし</MenuItem>
                          <MenuItem value="local">地方メディア</MenuItem>
                          <MenuItem value="national">全国メディア</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* 会場・アクセスセクション */}
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 3,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                    会場・アクセス
                  </Typography>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>会場タイプ</InputLabel>
                        <Select
                          value={venueType}
                          onChange={(e) => setVenueType(e.target.value)}
                          label="会場タイプ"
                        >
                          <MenuItem value="indoor">屋内施設</MenuItem>
                          <MenuItem value="outdoor">屋外会場</MenuItem>
                          <MenuItem value="hybrid">複合施設</MenuItem>
                          <MenuItem value="online">オンライン併用</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>公共交通機関アクセス</InputLabel>
                        <Select
                          value={transportAccess}
                          onChange={(e) => setTransportAccess(e.target.value)}
                          label="公共交通機関アクセス"
                        >
                          <MenuItem value="station">駅直結</MenuItem>
                          <MenuItem value="walk10">駅から徒歩10分以内</MenuItem>
                          <MenuItem value="bus">バス必要</MenuItem>
                          <MenuItem value="car">車でのアクセス中心</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>駐車場</InputLabel>
                        <Select
                          value={parkingAvailability}
                          onChange={(e) => setParkingAvailability(e.target.value)}
                          label="駐車場"
                        >
                          <MenuItem value="sufficient">十分</MenuItem>
                          <MenuItem value="limited">限定的</MenuItem>
                          <MenuItem value="none">なし</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* ファイルアップロード & 類似イベント参照 */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 3,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    height: '100%',
                  }}
                >
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                    イベント企画書アップロード
                  </Typography>
                  <Box
                    sx={{
                      mt: 2,
                      p: 4,
                      border: '2px dashed rgba(102, 126, 234, 0.3)',
                      borderRadius: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        borderColor: 'rgba(102, 126, 234, 0.6)',
                        background: 'rgba(102, 126, 234, 0.05)',
                      },
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <Upload sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                    <Typography variant="body1" fontWeight={600}>
                      クリックまたはドラッグ&ドロップでアップロード
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      PDF, Word, Excel形式に対応
                    </Typography>
                    {uploadedFile && (
                      <Chip
                        label={uploadedFile.name}
                        onDelete={() => setUploadedFile(null)}
                        sx={{ mt: 2 }}
                      />
                    )}
                  </Box>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    AIが企画書から情報を自動抽出します
                  </Alert>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 3,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    height: '100%',
                  }}
                >
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    <Event sx={{ mr: 1, verticalAlign: 'middle' }} />
                    過去の類似イベント参照
                  </Typography>
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>類似イベントを選択</InputLabel>
                    <Select
                      value={referenceEvent}
                      onChange={(e) => setReferenceEvent(e.target.value)}
                      label="類似イベントを選択"
                    >
                      {currentData.eventData?.map((event) => (
                        <MenuItem key={event.id} value={event.id}>
                          <Box>
                            <Typography variant="body1" fontWeight={600}>
                              {event.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(event.date).toLocaleDateString('ja-JP')} • 
                              {(event.expected_attendees || event.expectedVisitors || event.attendees || 0).toLocaleString()}人
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    類似イベントの実績を参考にします
                  </Alert>
                </Paper>
              </Grid>

              {/* 予測実行ボタン */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AutoAwesome />}
                    onClick={loadPrediction}
                    disabled={!eventName || !eventCategory}
                    sx={{
                      px: 6,
                      py: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                      fontSize: '1.1rem',
                    }}
                  >
                    AI予測を実行
                  </Button>
                </Box>
              </Grid>

              {/* 予測結果 */}
              {loading ? (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: '#667eea' }} />
                  </Box>
                </Grid>
              ) : predictionData ? (
                <>
                  {/* 予測結果サマリー */}
                  <Grid item xs={12}>
                    <Paper
                      sx={{
                        p: 4,
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        border: '1px solid rgba(102, 126, 234, 0.3)',
                      }}
                    >
                      <Typography variant="h5" fontWeight={700} gutterBottom>
                        予測結果サマリー
                      </Typography>
                      <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={4}>
                          <Card sx={{ background: 'rgba(255, 255, 255, 0.05)', height: '100%' }}>
                            <CardContent>
                              <Typography variant="subtitle2" color="text.secondary">
                                予想来場者数
                              </Typography>
                              <Typography variant="h3" fontWeight={700} sx={{ color: '#667eea', my: 2 }}>
                                {predictionData.expectedVisitors.toLocaleString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                信頼区間: {predictionData.confidenceRange.lower.toLocaleString()} - {predictionData.confidenceRange.upper.toLocaleString()}人
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Card sx={{ background: 'rgba(255, 255, 255, 0.05)', height: '100%' }}>
                            <CardContent>
                              <Typography variant="subtitle2" color="text.secondary">
                                ROI予測
                              </Typography>
                              <Typography variant="h3" fontWeight={700} sx={{ color: predictionData.roi.roiPercentage > 0 ? '#4CAF50' : '#FF6B6B', my: 2 }}>
                                {predictionData.roi.roiPercentage > 0 ? '+' : ''}{predictionData.roi.roiPercentage.toFixed(1)}%
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                予想収益: ¥{(predictionData.roi.estimatedRevenue / 1000000).toFixed(1)}M
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Card sx={{ background: 'rgba(255, 255, 255, 0.05)', height: '100%' }}>
                            <CardContent>
                              <Typography variant="subtitle2" color="text.secondary">
                                成功確率
                              </Typography>
                              <Box sx={{ position: 'relative', display: 'inline-flex', my: 2 }}>
                                <CircularProgress
                                  variant="determinate"
                                  value={85}
                                  size={80}
                                  sx={{ color: '#667eea' }}
                                />
                                <Box
                                  sx={{
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    right: 0,
                                    position: 'absolute',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Typography variant="h5" fontWeight={700}>
                                    85%
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* 成功要因 */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      sx={{
                        p: 3,
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        <CheckCircle sx={{ mr: 1, verticalAlign: 'middle', color: '#4CAF50' }} />
                        成功要因ランキング
                      </Typography>
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        {predictionData.successFactors.map((factor, index) => (
                          <Box key={index}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">{factor.factor}</Typography>
                              <Chip
                                label={factor.impact === 'high' ? '高' : '中'}
                                size="small"
                                color={factor.impact === 'high' ? 'success' : 'default'}
                              />
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={factor.score * 100}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: '#4CAF50',
                                },
                              }}
                            />
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* リスク要因 */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      sx={{
                        p: 3,
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        <Warning sx={{ mr: 1, verticalAlign: 'middle', color: '#FF9800' }} />
                        注意すべきリスク要因
                      </Typography>
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        {predictionData.riskFactors.map((risk, index) => (
                          <Box key={index}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">{risk.factor}</Typography>
                              <Chip
                                label={risk.severity === 'high' ? '高' : risk.severity === 'medium' ? '中' : '低'}
                                size="small"
                                color={risk.severity === 'high' ? 'error' : risk.severity === 'medium' ? 'warning' : 'default'}
                              />
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={risk.probability * 100}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: risk.severity === 'high' ? '#FF6B6B' : '#FF9800',
                                },
                              }}
                            />
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* 推奨アクション */}
                  <Grid item xs={12}>
                    <Paper
                      sx={{
                        p: 3,
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        <Lightbulb sx={{ mr: 1, verticalAlign: 'middle', color: '#FFC107' }} />
                        AIからの推奨アクション
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        {predictionData.recommendations.map((recommendation, index) => (
                          <Grid item xs={12} md={6} key={index}>
                            <Alert severity="info" sx={{ background: 'rgba(102, 126, 234, 0.1)' }}>
                              {recommendation}
                            </Alert>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Grid>
                </>
              ) : null}
            </Grid>
          </TabPanel>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AIAnalysisModal;