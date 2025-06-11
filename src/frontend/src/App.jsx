/**
 * Uesugi Engine - メインアプリケーション（安定版）
 * エラーハンドリングとデータ同期を強化
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Alert, Snackbar, IconButton, Fab, Tooltip, Dialog, DialogContent, CircularProgress } from '@mui/material';
import { ChevronRight, ChevronLeft, Science as ScienceIcon, LocationCity as CityIcon } from '@mui/icons-material';

// コンポーネント（実データ版を使用）
import Header from './components/Header/Header';
import MapWithRealData from './components/Map/MapWithRealData';
import MapErrorBoundary from './components/Map/MapErrorBoundary';
import LeftSidebar from './components/Sidebar/LeftSidebar';
import RightSidebar from './components/Sidebar/RightSidebar';
import Dashboard from './components/Dashboard/Dashboard';
import AIAnalysisModal from './components/AIAnalysis/AIAnalysisModal';

// 新機能コンポーネント
import IntegratedDashboard from './components/IntegratedDashboard';

// サービス
import { weatherService, heatmapService, mobilityService, eventService } from './services/api';

// データジェネレーター
import { 
  generateLandmarks, 
  generateHotels, 
  generateMobilityData,
  generateConsumptionData,
  generateHeatmapData,
  generateEventData
} from './utils/dataGenerator';
import { 
  generateAllPrefectureData,
  detectCurrentPrefecture 
} from './utils/multiPrefectureDataGenerator';

// テーマ設定（既存のものを使用）
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#667eea',
      light: '#8da2f4',
      dark: '#4a5bc4',
    },
    secondary: {
      main: '#764ba2',
      light: '#9b6cc6',
      dark: '#5a3980',
    },
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    error: {
      main: '#FF6B6B',
      light: '#FF8E8E',
      dark: '#FF4949',
    },
    background: {
      default: '#000000',
      paper: 'rgba(10, 10, 10, 0.95)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.8)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    body1: {
      letterSpacing: '0.01em',
    },
    body2: {
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(10, 10, 10, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
});

function App() {
  // 基本的な状態管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initializationStatus, setInitializationStatus] = useState({
    dataGeneration: false,
    apiConnection: false,
    mapReady: false
  });

  // UI状態
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [integratedDashboardOpen, setIntegratedDashboardOpen] = useState(false);
  const [aiAnalysisOpen, setAiAnalysisOpen] = useState(false);

  // データ選択状態
  const [selectedPrefecture, setSelectedPrefecture] = useState('広島県');
  const [selectedArea, setSelectedArea] = useState('全域');
  const [layers, setLayers] = useState({
    landmarks: true,
    accommodation: true,  // Changed from hotels to accommodation to match MapWithRealData
    mobility: true,
    consumption: false,
    heatmap: true,
    events: true,
  });
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [timeRange, setTimeRange] = useState({
    start: new Date(Date.now() - 24 * 60 * 60 * 1000),
    end: new Date()
  });

  // データキャッシュ（重要：すべてのデータを保持）
  const dataCache = useRef({
    weather: null,
    prefectureData: {},
    lastUpdate: null,
    initialized: false
  });

  // データ生成と初期化
  const initializeData = useCallback(async () => {
    try {
      console.log('Starting data initialization...');
      
      // 1. 全都道府県データの生成
      if (!dataCache.current.initialized) {
        const prefectures = ['広島県', '東京都', '大阪府', '福岡県', '山口県'];
        const allData = {};
        
        prefectures.forEach(pref => {
          allData[pref] = generateAllPrefectureData(pref);
          // eventDataがない場合は空配列を追加
          if (!allData[pref].events) {
            allData[pref].events = [];
          }
          // eventDataの形式を統一
          allData[pref].eventData = allData[pref].events;
        });
        
        dataCache.current.prefectureData = allData;
        dataCache.current.initialized = true;
        setInitializationStatus(prev => ({ ...prev, dataGeneration: true }));
        console.log('✓ Prefecture data generated');
      }

      // 2. APIデータの取得（エラーを許容）
      try {
        const coordinates = { lat: 34.3966, lon: 132.4597 }; // 広島市の座標
        const [weatherData, eventsData] = await Promise.allSettled([
          weatherService.getCurrentWeather(coordinates.lat, coordinates.lon),
          eventService.getEvents()
        ]);

        if (weatherData.status === 'fulfilled') {
          dataCache.current.weather = weatherData.value;
        }

        if (eventsData.status === 'fulfilled' && eventsData.value?.features) {
          // APIイベントデータを各都道府県にマージ
          Object.keys(dataCache.current.prefectureData).forEach(pref => {
            if (dataCache.current.prefectureData[pref].events) {
              const apiEvents = eventsData.value.features.filter(event => 
                event.properties?.prefecture === pref
              );
              if (apiEvents.length > 0) {
                dataCache.current.prefectureData[pref].events.features.push(...apiEvents);
              }
            }
          });
        }

        setInitializationStatus(prev => ({ ...prev, apiConnection: true }));
        console.log('✓ API data fetched');
      } catch (apiError) {
        console.warn('API connection failed, using local data only:', apiError);
        setInitializationStatus(prev => ({ ...prev, apiConnection: false }));
      }

      // 3. 初期化完了
      dataCache.current.lastUpdate = new Date();
      setLoading(false);
      setError(null);
      console.log('✓ Initialization complete');

    } catch (error) {
      console.error('Failed to initialize data:', error);
      setError('データの初期化に失敗しました。ページを再読み込みしてください。');
      setLoading(false);
    }
  }, []);

  // 初期化エフェクト
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // ローディング画面を非表示にする
  useEffect(() => {
    if (!loading && window.hideLoading) {
      // Reactのレンダリングが完了してから実行
      setTimeout(() => {
        window.hideLoading();
      }, 100);
    }
  }, [loading]);

  // エラー表示
  const handleCloseError = () => setError(null);

  // 統合ダッシュボードのトグル
  const toggleIntegratedDashboard = () => {
    setIntegratedDashboardOpen(!integratedDashboardOpen);
  };

  // レンダリング
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a1e 100%)',
          }}
        >
          <CircularProgress size={60} sx={{ mb: 3, color: '#667eea' }} />
          <Box sx={{ textAlign: 'center', color: 'white' }}>
            <h2 style={{ marginBottom: '20px' }}>Uesugi Engine 起動中...</h2>
            <Box sx={{ mt: 2 }}>
              <div>✓ データ生成: {initializationStatus.dataGeneration ? '完了' : '処理中...'}</div>
              <div>✓ API接続: {initializationStatus.apiConnection ? '完了' : '接続中...'}</div>
              <div>✓ マップ準備: {initializationStatus.mapReady ? '完了' : '準備中...'}</div>
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* ヘッダー */}
        <Header 
          onAIAnalysisClick={() => setAiAnalysisOpen(true)}
          dataCache={dataCache}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          currentPrefecture={selectedPrefecture}
          onPrefectureSelect={setSelectedPrefecture}
        />

        {/* メインコンテンツ */}
        <Box sx={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
          
          {/* 左サイドバー */}
          <Box
            sx={{
              width: leftSidebarOpen ? 360 : 0,
              transition: 'width 0.3s ease',
              overflow: 'hidden',
              position: 'relative',
              zIndex: 2,
              background: 'rgba(10, 10, 10, 0.95)',
              borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <LeftSidebar
              selectedLayers={Object.keys(layers).filter(key => layers[key])}
              onLayerChange={(newLayers) => {
                const updatedLayers = { ...layers };
                Object.keys(layers).forEach(key => {
                  updatedLayers[key] = newLayers.includes(key);
                });
                setLayers(updatedLayers);
              }}
              viewport={{ latitude: 34.3966, longitude: 132.4597, zoom: 11 }}
              weatherData={dataCache.current.weather}
              onRefresh={initializeData}
              onClose={() => setLeftSidebarOpen(false)}
            />
          </Box>

          {/* 地図エリア */}
          <Box sx={{ flex: 1, position: 'relative' }}>
            <MapErrorBoundary>
              <MapWithRealData
                layers={layers}
                categoryFilter={categoryFilter}
                selectedPrefecture={selectedPrefecture}
                leftSidebarOpen={leftSidebarOpen}
                rightSidebarOpen={rightSidebarOpen}
                loading={loading}
                prefectureData={dataCache.current.prefectureData[selectedPrefecture]}
              />
            </MapErrorBoundary>

            {/* フローティングボタン（サイドバーが閉じている時） */}
            {!leftSidebarOpen && (
              <Fab
                color="primary"
                size="small"
                onClick={() => setLeftSidebarOpen(true)}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: 16,
                  zIndex: 1000,
                }}
              >
                <ChevronRight />
              </Fab>
            )}

            {!rightSidebarOpen && (
              <Fab
                color="primary"
                size="small"
                onClick={() => setRightSidebarOpen(true)}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: 16,
                  zIndex: 1000,
                }}
              >
                <ChevronLeft />
              </Fab>
            )}

            {/* 統合ダッシュボードボタン */}
            <Tooltip title="統合ダッシュボード">
              <Fab
                color="secondary"
                onClick={toggleIntegratedDashboard}
                sx={{
                  position: 'absolute',
                  left: 16,
                  bottom: 16,
                  zIndex: 1000,
                }}
              >
                <CityIcon />
              </Fab>
            </Tooltip>
          </Box>

          {/* 右サイドバー */}
          <Box
            sx={{
              width: rightSidebarOpen ? 360 : 0,
              transition: 'width 0.3s ease',
              overflow: 'hidden',
              position: 'relative',
              zIndex: 2,
              background: 'rgba(10, 10, 10, 0.95)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <RightSidebar
              selectedLayers={Object.keys(layers).filter(key => layers[key])}
              onLayerChange={(newLayers) => {
                const updatedLayers = { ...layers };
                Object.keys(layers).forEach(key => {
                  updatedLayers[key] = newLayers.includes(key);
                });
                setLayers(updatedLayers);
              }}
              selectedCategories={categoryFilter ? [categoryFilter] : []}
              onCategoryChange={(category) => {
                setCategoryFilter(categoryFilter === category ? null : category);
              }}
              statistics={dataCache.current.prefectureData[selectedPrefecture]?.statistics || {}}
              onClose={() => setRightSidebarOpen(false)}
            />
          </Box>
        </Box>

        {/* エラー通知 */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={handleCloseError}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        {/* AI分析モーダル */}
        <AIAnalysisModal
          open={aiAnalysisOpen}
          onClose={() => setAiAnalysisOpen(false)}
          currentData={dataCache.current.prefectureData[selectedPrefecture] || {
            eventData: [],
            heatmap: { features: [] },
            mobility: { features: [] },
            landmarks: { features: [] },
            hotels: { features: [] },
            consumption: { features: [] },
            statistics: {}
          }}
          timeRange="24h"
          currentPrefecture={selectedPrefecture}
        />

        {/* 統合ダッシュボード */}
        <Dialog
          open={integratedDashboardOpen}
          onClose={toggleIntegratedDashboard}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            sx: {
              height: '90vh',
              background: 'rgba(10, 10, 10, 0.98)',
            }
          }}
        >
          <DialogContent>
            <IntegratedDashboard
              dataCache={dataCache}
              selectedPrefecture={selectedPrefecture}
            />
          </DialogContent>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}

export default App;