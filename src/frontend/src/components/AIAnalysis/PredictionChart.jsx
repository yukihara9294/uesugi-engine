/**
 * 予測チャート
 * 信頼区間付きの未来予測を可視化
 */

import React from 'react';
import { Box, Typography, Chip, Paper, Grid } from '@mui/material';
import { Event, Weekend, TrendingUp } from '@mui/icons-material';

const PredictionChart = ({ data }) => {
  if (!data || !data.predictions) return null;

  const { predictions, summary } = data;

  // 最大値と最小値を計算
  const maxValue = Math.max(...predictions.map(p => p.upperBound));
  const minValue = Math.min(...predictions.map(p => p.lowerBound));
  const range = maxValue - minValue;

  // バーの高さを計算
  const getBarHeight = (value) => {
    return ((value - minValue) / range) * 200; // 200px max height
  };

  // 日付フォーマット
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 曜日を取得
  const getDayOfWeek = (dateStr) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[new Date(dateStr).getDay()];
  };

  return (
    <Box>
      {/* サマリー情報 */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <Paper
          sx={{
            px: 2,
            py: 1.5,
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            平均予測値
          </Typography>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#667eea' }}>
            {summary.averagePrediction.toLocaleString()}人
          </Typography>
        </Paper>
        <Paper
          sx={{
            px: 2,
            py: 1.5,
            background: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            ピーク日
          </Typography>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#4CAF50' }}>
            {new Date(summary.peakDay.date).toLocaleDateString('ja-JP', { 
              month: 'numeric', 
              day: 'numeric' 
            })}
          </Typography>
        </Paper>
        <Paper
          sx={{
            px: 2,
            py: 1.5,
            background: 'rgba(255, 152, 0, 0.1)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            合計訪問者数
          </Typography>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#FF9800' }}>
            {(summary.totalVisitors / 1000).toFixed(1)}k人
          </Typography>
        </Paper>
      </Box>

      {/* チャートエリア */}
      <Paper
        sx={{
          p: 3,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'auto',
        }}
      >
        {/* Y軸ラベル */}
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ width: 60 }}>
            <Box sx={{ height: 250, position: 'relative' }}>
              {[0, 25, 50, 75, 100].map((percent) => (
                <Typography
                  key={percent}
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    position: 'absolute',
                    bottom: `${percent}%`,
                    right: 0,
                    transform: 'translateY(50%)',
                  }}
                >
                  {Math.round(minValue + (range * percent) / 100).toLocaleString()}
                </Typography>
              ))}
            </Box>
          </Box>

          {/* バーチャート */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 1, height: 250, overflowX: 'auto' }}>
            {predictions.map((pred, index) => (
              <Box
                key={index}
                sx={{
                  flex: '0 0 auto',
                  width: predictions.length > 14 ? 40 : 60,
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                {/* 信頼区間 */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    height: getBarHeight(pred.upperBound),
                    background: 'linear-gradient(180deg, rgba(118, 75, 162, 0.2) 0%, rgba(118, 75, 162, 0.05) 100%)',
                    borderRadius: '4px 4px 0 0',
                  }}
                />

                {/* 予測値バー */}
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: getBarHeight(pred.prediction),
                    background: pred.hasEvent
                      ? 'linear-gradient(180deg, #FF6B6B 0%, #FF4949 100%)'
                      : pred.isWeekend
                      ? 'linear-gradient(180deg, #4CAF50 0%, #388E3C 100%)'
                      : 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scaleY(1.05)',
                      filter: 'brightness(1.1)',
                    },
                  }}
                >
                  {/* イベントマーカー */}
                  {pred.hasEvent && (
                    <Event
                      sx={{
                        position: 'absolute',
                        top: -20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 16,
                        color: '#FF6B6B',
                      }}
                    />
                  )}
                </Box>

                {/* 日付ラベル */}
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {formatDate(pred.date)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: pred.isWeekend ? '#4CAF50' : 'text.secondary',
                      fontWeight: pred.isWeekend ? 600 : 400,
                    }}
                  >
                    {getDayOfWeek(pred.date)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* X軸ライン */}
        <Box
          sx={{
            ml: 9,
            height: 1,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            mt: -0.5,
          }}
        />
      </Paper>

      {/* 詳細データテーブル */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          予測詳細データ
        </Typography>
        <Grid container spacing={1} sx={{ mt: 1 }}>
          {predictions.slice(0, 7).map((pred, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                sx={{
                  p: 1.5,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'rgba(102, 126, 234, 0.3)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(pred.date).toLocaleDateString('ja-JP', {
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short',
                      })}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {pred.prediction.toLocaleString()}人
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ±{Math.round((pred.upperBound - pred.prediction) / 2).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {pred.hasEvent && <Event sx={{ fontSize: 16, color: '#FF6B6B' }} />}
                    {pred.isWeekend && <Weekend sx={{ fontSize: 16, color: '#4CAF50' }} />}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 凡例説明 */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FF6B6B' }} />
          <Typography variant="caption" color="text.secondary">
            イベント開催日
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#4CAF50' }} />
          <Typography variant="caption" color="text.secondary">
            週末
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 12, 
              height: 12, 
              background: 'linear-gradient(180deg, rgba(118, 75, 162, 0.3) 0%, rgba(118, 75, 162, 0.05) 100%)' 
            }} 
          />
          <Typography variant="caption" color="text.secondary">
            95%信頼区間
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default PredictionChart;