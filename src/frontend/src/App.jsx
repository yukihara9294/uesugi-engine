/**
 * Uesugi Engine - メインアプリケーション
 * 広島県ソーシャルヒートマップのフロントエンド
 */

import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Alert, Snackbar, IconButton } from '@mui/material';
import { ChevronRight, ChevronLeft } from '@mui/icons-material';

// コンポーネント
import Header from './components/Header/Header';
import MapEnhancedFixed from './components/Map/MapEnhancedFixed';
import MapErrorBoundary from './components/Map/MapErrorBoundary';
import LeftSidebar from './components/Sidebar/LeftSidebar';
import RightSidebar from './components/Sidebar/RightSidebar';
import Dashboard from './components/Dashboard/Dashboard';

// サービス
import { weatherService, heatmapService, mobilityService, eventService } from './services/api';

// データジェネレーター
import { getPrefectureBounds } from './utils/multiPrefectureDataGenerator';

// テーマ設定
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
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
  },
});

// 初期ビューポート設定（広島県をデフォルトとする）
const getInitialViewport = (prefecture = '広島県') => {
  const bounds = getPrefectureBounds(prefecture);
  return {
    latitude: bounds.center[1],
    longitude: bounds.center[0],
    zoom: bounds.defaultZoom,
  };
};

function App() {
  // 地図ビューステート
  const [viewport, setViewport] = useState(getInitialViewport());
  
  // フィルタ・表示設定
  const [selectedLayers, setSelectedLayers] = useState(['heatmap', 'weather', 'accommodation', 'consumption', 'events']);
  const [selectedCategories, setSelectedCategories] = useState(['観光', 'グルメ']);
  const [timeRange, setTimeRange] = useState({
    start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24時間前
    end: new Date(),
  });
  
  // データ状態
  const [heatmapData, setHeatmapData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [mobilityData, setMobilityData] = useState(null);
  const [accommodationData, setAccommodationData] = useState(null);
  const [consumptionData, setConsumptionData] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // エラー・通知状態
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // サイドバー表示状態
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [currentPrefecture, setCurrentPrefecture] = useState('広島県');

  // 初期データ読み込み
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        
        // 並行してデータを取得（天気データは初回のみ）
        const [
          heatmapResult, 
          weatherResult, 
          statsResult,
          mobilityResult,
          accommodationResult,
          consumptionResult,
          eventResult
        ] = await Promise.allSettled([
          loadHeatmapData(),
          loadWeatherData(), // 初回のみ読み込み
          loadStatistics(),
          loadMobilityData(),
          loadAccommodationData(),
          loadConsumptionData(),
          loadEventData(),
        ]);
        
        // エラーチェック
        const errors = [];
        if (heatmapResult.status === 'rejected') errors.push('ヒートマップデータ');
        if (weatherResult.status === 'rejected') errors.push('気象データ');
        if (statsResult.status === 'rejected') errors.push('統計データ');
        if (mobilityResult.status === 'rejected') errors.push('人流データ');
        if (accommodationResult.status === 'rejected') errors.push('宿泊データ');
        if (consumptionResult.status === 'rejected') errors.push('消費データ');
        if (eventResult.status === 'rejected') errors.push('イベントデータ');
        
        if (errors.length > 0) {
          setNotification({
            type: 'warning',
            message: `一部のデータ読み込みに失敗しました: ${errors.join(', ')}`
          });
        } else {
          setNotification({
            type: 'success',
            message: 'データの読み込みが完了しました'
          });
        }
        
      } catch (error) {
        console.error('App initialization failed:', error);
        setError('アプリケーションの初期化に失敗しました');
      } finally {
        setLoading(false);
        // ローディング画面を非表示
        if (window.hideLoading) window.hideLoading();
      }
    };
    
    initializeApp();
  }, []);

  // ヒートマップデータの読み込み
  const loadHeatmapData = async () => {
    try {
      const bounds = calculateBounds();
      const data = await heatmapService.getHeatmapPoints({
        ...bounds,
        start_time: timeRange.start.toISOString(),
        end_time: timeRange.end.toISOString(),
        categories: selectedCategories.join(','),
        limit: 2000,
      });
      
      setHeatmapData(data);
      return data;
    } catch (error) {
      console.error('Failed to load heatmap data:', error);
      throw error;
    }
  };

  // 気象データの読み込み
  const loadWeatherData = async () => {
    try {
      const data = await weatherService.getLandmarksWeather();
      console.log('App - Weather data loaded:', data);
      console.log('App - Setting weatherData state...');
      setWeatherData(data);
      console.log('App - weatherData state set successfully');
      return data;
    } catch (error) {
      console.error('Failed to load weather data:', error);
      throw error;
    }
  };

  // 統計データの読み込み
  const loadStatistics = async () => {
    try {
      const data = await heatmapService.getStatistics({
        start_time: timeRange.start.toISOString(),
        end_time: timeRange.end.toISOString(),
        categories: selectedCategories.join(','),
      });
      
      setStatistics(data);
      return data;
    } catch (error) {
      console.error('Failed to load statistics:', error);
      throw error;
    }
  };

  // 人流データの読み込み
  const loadMobilityData = async () => {
    try {
      const bounds = calculateBounds();
      const [flowsData, heatmapData] = await Promise.all([
        mobilityService.getFlows({
          ...bounds,
          start_time: timeRange.start.toISOString(),
          end_time: timeRange.end.toISOString(),
        }),
        mobilityService.getHeatmap({
          ...bounds,
          timestamp: new Date().toISOString(),
        })
      ]);
      
      setMobilityData({
        ...flowsData,
        heatmapData: heatmapData
      });
      return flowsData;
    } catch (error) {
      console.error('Failed to load mobility data:', error);
      throw error;
    }
  };

  // 宿泊データの読み込み
  const loadAccommodationData = async () => {
    try {
      // 日付のみを送信（時刻部分を除去）
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const data = await mobilityService.getAccommodation({
        date: dateStr,
      });
      console.log('App - Accommodation data loaded:', data);
      setAccommodationData(data);
      return data;
    } catch (error) {
      console.error('Failed to load accommodation data:', error);
      throw error;
    }
  };

  // 消費データの読み込み
  const loadConsumptionData = async () => {
    try {
      const data = await mobilityService.getConsumption({
        start_time: timeRange.start.toISOString(),
        end_time: timeRange.end.toISOString(),
      });
      setConsumptionData(data);
      return data;
    } catch (error) {
      console.error('Failed to load consumption data:', error);
      throw error;
    }
  };

  // イベントデータの読み込み
  const loadEventData = async () => {
    try {
      const data = await eventService.getEvents();
      console.log('App - Event data loaded:', data);
      setEventData(data);
      return data;
    } catch (error) {
      console.error('Failed to load event data:', error);
      throw error;
    }
  };

  // 地図の境界を計算
  const calculateBounds = () => {
    const padding = 0.5; // 度
    return {
      north: viewport.latitude + padding,
      south: viewport.latitude - padding,
      east: viewport.longitude + padding,
      west: viewport.longitude - padding,
    };
  };

  // フィルタ変更時のデータ再読み込み
  useEffect(() => {
    if (!loading) {
      loadHeatmapData();
      loadStatistics();
    }
  }, [selectedCategories, timeRange]);

  // ビューポート変更時のデータ再読み込み（デバウンス付き）
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!loading) {
        loadHeatmapData();
        // 人流データも更新（ただし大きな移動時のみ）
        // Removed the HIROSHIMA_CENTER check - always update on significant viewport changes
        loadMobilityData();
      }
    }, 2000); // デバウンス時間を長く

    return () => clearTimeout(timeoutId);
  }, [viewport]);

  // エラー処理
  const handleError = (error, context = '') => {
    console.error(`Error in ${context}:`, error);
    setError(`${context}でエラーが発生しました: ${error.message}`);
  };

  // 通知を閉じる
  const handleCloseNotification = () => {
    setNotification(null);
  };

  // エラーを閉じる
  const handleCloseError = () => {
    setError(null);
  };
  
  // Map reference for smooth camera animation
  const mapRef = useRef(null);
  
  // State to track if prefecture was clicked
  const [prefectureClicked, setPrefectureClicked] = useState(false);
  
  // Handle prefecture selection with smooth camera animation
  const handlePrefectureSelect = (prefecture) => {
    setCurrentPrefecture(prefecture);
    setPrefectureClicked(true);
  };
  
  useEffect(() => {
    if (prefectureClicked && mapRef.current && mapRef.current.flyToCenter) {
      // Reset the flag
      setPrefectureClicked(false);
      
      // Fly to the specified coordinates based on prefecture
      setTimeout(() => {
        switch (currentPrefecture) {
          case '広島県':
            mapRef.current.flyToCenter([132.75, 34.5], 9.2);
            break;
          case '東京都':
            mapRef.current.flyToCenter([139.7670, 35.6812], 10.5);
            break;
          case '大阪府':
            mapRef.current.flyToCenter([135.4959, 34.7028], 10.5);
            break;
          case '福岡県':
            mapRef.current.flyToCenter([130.4017, 33.5904], 10);
            break;
          default:
            mapRef.current.flyToCenter([132.75, 34.5], 9.2);
        }
      }, 100);
    }
  }, [currentPrefecture, prefectureClicked]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* ヘッダー */}
        <Header
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          currentPrefecture={currentPrefecture}
          onPrefectureSelect={handlePrefectureSelect}
        />
        
        {/* メインコンテンツ */}
        <Box sx={{ 
          display: 'flex', 
          flex: 1, 
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* 左サイドバー - 現実世界データ */}
          <Box sx={{
            width: leftSidebarOpen ? 360 : 0,
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {leftSidebarOpen && (
              <LeftSidebar
                selectedLayers={selectedLayers}
                onLayerChange={setSelectedLayers}
                viewport={viewport}
                weatherData={weatherData}
                onRefresh={() => {
                  loadMobilityData();
                  loadAccommodationData();
                  loadConsumptionData();
                  loadEventData();
                }}
                onClose={() => setLeftSidebarOpen(false)}
              />
            )}
          </Box>
          
          {/* 地図エリア */}
          <Box sx={{ 
            flex: 1, 
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
          }}>
            <MapErrorBoundary>
              <MapEnhancedFixed
                ref={mapRef}
                viewport={viewport}
                onViewportChange={setViewport}
                heatmapData={heatmapData}
                weatherData={weatherData}
                mobilityData={mobilityData}
                accommodationData={accommodationData}
                consumptionData={consumptionData}
                landmarkData={null}
                eventData={eventData}
                selectedLayers={selectedLayers}
                selectedCategories={selectedCategories}
                loading={loading}
                onError={(error) => handleError(error, 'Map')}
                leftSidebarOpen={leftSidebarOpen}
                rightSidebarOpen={rightSidebarOpen}
              />
            </MapErrorBoundary>
            
            {/* 左サイドバー開くボタン */}
            {!leftSidebarOpen && (
              <IconButton
                onClick={() => setLeftSidebarOpen(true)}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(102, 126, 234, 0.9)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(102, 126, 234, 1)',
                    transform: 'translateY(-50%) scale(1.1)',
                  },
                  transition: 'all 0.2s ease',
                  zIndex: 1000,
                }}
              >
                <ChevronRight />
              </IconButton>
            )}
            
            {/* 右サイドバー開くボタン */}
            {!rightSidebarOpen && (
              <IconButton
                onClick={() => setRightSidebarOpen(true)}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255, 87, 34, 0.9)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(255, 87, 34, 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 87, 34, 1)',
                    transform: 'translateY(-50%) scale(1.1)',
                  },
                  transition: 'all 0.2s ease',
                  zIndex: 1000,
                }}
              >
                <ChevronLeft />
              </IconButton>
            )}
          </Box>
          
          {/* 右サイドバー - ソーシャルネットワーキングデータ */}
          <Box sx={{
            width: rightSidebarOpen ? 360 : 0,
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {rightSidebarOpen && (
              <RightSidebar
                selectedLayers={selectedLayers}
                onLayerChange={setSelectedLayers}
                selectedCategories={selectedCategories}
                onCategoryChange={setSelectedCategories}
                statistics={statistics}
                onClose={() => setRightSidebarOpen(false)}
              />
            )}
          </Box>
          
          {/* ダッシュボード */}
          {dashboardOpen && (
            <Dashboard
              statistics={statistics}
              weatherData={weatherData}
              mobilityData={mobilityData}
              accommodationData={accommodationData}
              consumptionData={consumptionData}
              timeRange={timeRange}
              selectedCategories={selectedCategories}
              viewport={viewport}
              onClose={() => setDashboardOpen(false)}
            />
          )}
        </Box>
        
        {/* エラー通知 */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={handleCloseError}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseError} 
            severity="error"
            variant="filled"
          >
            {error}
          </Alert>
        </Snackbar>
        
        {/* 一般通知 */}
        <Snackbar
          open={!!notification}
          autoHideDuration={4000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification?.type || 'info'}
            variant="filled"
          >
            {notification?.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;