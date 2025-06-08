/**
 * AI分析モーダルコンポーネント
 * 因果推論による過去分析と未来予測を提供
 */

import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';

// カスタムコンポーネント
import FactorDecompositionChart from './FactorDecompositionChart';
import PredictionChart from './PredictionChart';
import CounterfactualAnalysis from './CounterfactualAnalysis';
import CausalNetworkVisualization from './CausalNetworkVisualization';

// サービス
import { analyzePastData, predictFuture, getCounterfactualScenarios } from '../../services/causalInference';

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
  const [selectedEvent, setSelectedEvent] = useState('festival');
  const [predictionDays, setPredictionDays] = useState(7);
  const [weatherScenario, setWeatherScenario] = useState('normal');

  // 過去データの分析
  useEffect(() => {
    if (open && activeTab === 0 && !analysisData) {
      loadPastAnalysis();
    }
  }, [open, activeTab]);

  // 未来予測の実行
  useEffect(() => {
    if (open && activeTab === 1 && !predictionData) {
      loadPrediction();
    }
  }, [open, activeTab]);

  const loadPastAnalysis = async () => {
    setLoading(true);
    try {
      const data = await analyzePastData({
        prefecture: currentPrefecture,
        timeRange,
        currentData,
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
      const data = await predictFuture({
        prefecture: currentPrefecture,
        days: predictionDays,
        eventType: selectedEvent,
        weatherScenario,
      });
      setPredictionData(data);
    } catch (error) {
      console.error('Failed to predict future:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getWeatherIcon = (scenario) => {
    switch (scenario) {
      case 'sunny':
        return <WbSunny />;
      case 'rainy':
        return <Thunderstorm />;
      case 'snow':
        return <AcUnit />;
      default:
        return <FilterDrama />;
    }
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
          <Chip
            label="DML (Double Machine Learning)"
            size="small"
            sx={{
              background: 'rgba(102, 126, 234, 0.2)',
              border: '1px solid rgba(102, 126, 234, 0.3)',
              fontSize: '0.75rem',
            }}
          />
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
              {/* 予測設定 */}
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 3,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    予測シナリオ設定
                  </Typography>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>イベントタイプ</InputLabel>
                        <Select
                          value={selectedEvent}
                          onChange={(e) => setSelectedEvent(e.target.value)}
                          label="イベントタイプ"
                        >
                          <MenuItem value="festival">
                            <Event sx={{ mr: 1 }} /> 祭り・フェスティバル
                          </MenuItem>
                          <MenuItem value="campaign">
                            <Campaign sx={{ mr: 1 }} /> SNSキャンペーン
                          </MenuItem>
                          <MenuItem value="none">なし（通常日）</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>天候シナリオ</InputLabel>
                        <Select
                          value={weatherScenario}
                          onChange={(e) => setWeatherScenario(e.target.value)}
                          label="天候シナリオ"
                        >
                          <MenuItem value="sunny">
                            <WbSunny sx={{ mr: 1 }} /> 晴天
                          </MenuItem>
                          <MenuItem value="normal">
                            <CloudQueue sx={{ mr: 1 }} /> 通常
                          </MenuItem>
                          <MenuItem value="rainy">
                            <Thunderstorm sx={{ mr: 1 }} /> 雨天
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography gutterBottom>予測期間: {predictionDays}日間</Typography>
                      <Slider
                        value={predictionDays}
                        onChange={(e, value) => setPredictionDays(value)}
                        min={1}
                        max={30}
                        marks={[
                          { value: 1, label: '1日' },
                          { value: 7, label: '1週間' },
                          { value: 14, label: '2週間' },
                          { value: 30, label: '1ヶ月' },
                        ]}
                        sx={{ color: '#667eea' }}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      startIcon={<Refresh />}
                      onClick={loadPrediction}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                      }}
                    >
                      予測を更新
                    </Button>
                  </Box>
                </Paper>
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
                  <Grid item xs={12}>
                    <Paper
                      sx={{
                        p: 3,
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        訪問者数予測
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        95%信頼区間付き予測結果
                      </Typography>
                      <Box sx={{ mt: 3 }}>
                        <PredictionChart data={predictionData} />
                      </Box>
                    </Paper>
                  </Grid>

                  {/* 予測精度指標 */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      sx={{
                        p: 3,
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        予測精度指標
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            予測精度 (R²)
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={predictionData.accuracy * 100}
                              sx={{
                                flex: 1,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                },
                              }}
                            />
                            <Typography variant="body2" fontWeight={600}>
                              {(predictionData.accuracy * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            平均絶対誤差 (MAE)
                          </Typography>
                          <Typography variant="h5" fontWeight={700} sx={{ mt: 1, color: '#667eea' }}>
                            ±{predictionData.mae.toLocaleString()}人
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* 要因別寄与度 */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      sx={{
                        p: 3,
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        予測への寄与度
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {Object.entries(predictionData.contributions).map(([factor, value]) => (
                          <Box key={factor} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">{factor}</Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {value > 0 ? '+' : ''}{value.toLocaleString()}人
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={Math.abs(value) / 10000 * 100}
                              sx={{
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: value > 0 ? '#4CAF50' : '#FF6B6B',
                                },
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
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