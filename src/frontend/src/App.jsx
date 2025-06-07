/**
 * Uesugi Engine - メインアプリケーション
 * 広島県ソーシャルヒートマップのフロントエンド
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Alert, Snackbar } from '@mui/material';

// コンポーネント
import Header from './components/Header/Header';
import MapSimple from './components/Map/MapSimple';
import MapErrorBoundary from './components/Map/MapErrorBoundary';
import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';

// サービス
import { weatherService, heatmapService, mobilityService } from './services/api';

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

// 広島県の中心座標とズームレベル
const HIROSHIMA_CENTER = {
  latitude: 34.3853,
  longitude: 132.4553,
  zoom: 9,
};

function App() {
  // 地図ビューステート
  const [viewport, setViewport] = useState(HIROSHIMA_CENTER);
  
  // フィルタ・表示設定
  const [selectedLayers, setSelectedLayers] = useState(['heatmap', 'weather', 'accommodation', 'consumption']);
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
  const [loading, setLoading] = useState(true);
  
  // エラー・通知状態
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // サイドバー表示状態
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardOpen, setDashboardOpen] = useState(false);

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
          consumptionResult
        ] = await Promise.allSettled([
          loadHeatmapData(),
          loadWeatherData(), // 初回のみ読み込み
          loadStatistics(),
          loadMobilityData(),
          loadAccommodationData(),
          loadConsumptionData(),
        ]);
        
        // エラーチェック
        const errors = [];
        if (heatmapResult.status === 'rejected') errors.push('ヒートマップデータ');
        if (weatherResult.status === 'rejected') errors.push('気象データ');
        if (statsResult.status === 'rejected') errors.push('統計データ');
        if (mobilityResult.status === 'rejected') errors.push('人流データ');
        if (accommodationResult.status === 'rejected') errors.push('宿泊データ');
        if (consumptionResult.status === 'rejected') errors.push('消費データ');
        
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
        const viewportChanged = Math.abs(viewport.latitude - HIROSHIMA_CENTER.latitude) > 0.1 ||
                              Math.abs(viewport.longitude - HIROSHIMA_CENTER.longitude) > 0.1;
        if (viewportChanged) {
          loadMobilityData();
        }
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
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          onDashboardToggle={() => setDashboardOpen(!dashboardOpen)}
          sidebarOpen={sidebarOpen}
          dashboardOpen={dashboardOpen}
        />
        
        {/* メインコンテンツ */}
        <Box sx={{ 
          display: 'flex', 
          flex: 1, 
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* サイドバー */}
          {sidebarOpen && (
            <Sidebar
              selectedLayers={selectedLayers}
              onLayerChange={setSelectedLayers}
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              statistics={statistics}
              weatherData={weatherData}
              onRefresh={() => {
                loadHeatmapData();
                // loadWeatherData(); // 天気データは自動更新しない
                loadStatistics();
                loadMobilityData();
              }}
            />
          )}
          
          {/* 地図エリア */}
          <Box sx={{ 
            flex: 1, 
            position: 'relative',
            overflow: 'hidden'
          }}>
            <MapErrorBoundary>
              <MapSimple
                viewport={viewport}
                onViewportChange={setViewport}
                heatmapData={heatmapData}
                weatherData={weatherData}
                mobilityData={mobilityData}
                accommodationData={accommodationData}
                consumptionData={consumptionData}
                selectedLayers={selectedLayers}
                selectedCategories={selectedCategories}
                loading={loading}
                onError={(error) => handleError(error, 'Map')}
              />
            </MapErrorBoundary>
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