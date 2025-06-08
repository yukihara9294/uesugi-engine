/**
 * 要因分解チャート
 * 各要因の因果効果を可視化
 */

import React from 'react';
import { Box, Typography, LinearProgress, Chip, Tooltip } from '@mui/material';
import {
  WbSunny,
  Campaign,
  Event,
  DirectionsBus,
  CalendarMonth,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';

const FactorDecompositionChart = ({ data }) => {
  if (!data) return null;

  const { baseline, factors } = data;
  const totalEffect = factors.reduce((sum, f) => sum + f.effect, 0);
  const finalValue = baseline + totalEffect;

  // アイコンマッピング
  const getIcon = (iconName) => {
    const icons = {
      weather: <WbSunny />,
      campaign: <Campaign />,
      event: <Event />,
      transport: <DirectionsBus />,
      season: <CalendarMonth />,
    };
    return icons[iconName] || <TrendingUp />;
  };

  // 効果の色を決定
  const getEffectColor = (effect) => {
    if (effect > 5000) return '#4CAF50';
    if (effect > 0) return '#66BB6A';
    if (effect > -2000) return '#FFA726';
    return '#FF6B6B';
  };

  // 最大効果を計算（スケーリング用）
  const maxEffect = Math.max(...factors.map(f => Math.abs(f.effect)));

  return (
    <Box>
      {/* ベースライン */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            ベースライン訪問者数
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#667eea' }}>
            {baseline.toLocaleString()}人
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={100}
          sx={{
            height: 12,
            borderRadius: 6,
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 6,
            },
          }}
        />
      </Box>

      {/* 要因別効果 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          要因別の因果効果
        </Typography>
        {factors.map((factor, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${getEffectColor(factor.effect)}22 0%, ${getEffectColor(factor.effect)}44 100%)`,
                  border: `1px solid ${getEffectColor(factor.effect)}66`,
                  color: getEffectColor(factor.effect),
                }}
              >
                {getIcon(factor.icon)}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight={600}>
                    {factor.name}
                  </Typography>
                  <Tooltip title={`信頼度: ${(factor.confidence * 100).toFixed(0)}%`}>
                    <Chip
                      label={`${(factor.confidence * 100).toFixed(0)}%`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    />
                  </Tooltip>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {factor.description}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ color: getEffectColor(factor.effect) }}
                >
                  {factor.effect > 0 ? '+' : ''}{factor.effect.toLocaleString()}人
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {factor.effect > 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                  {' '}
                  {((Math.abs(factor.effect) / baseline) * 100).toFixed(1)}%
                </Typography>
              </Box>
            </Box>
            
            {/* プログレスバー */}
            <Box sx={{ pl: 7 }}>
              <LinearProgress
                variant="determinate"
                value={(Math.abs(factor.effect) / maxEffect) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getEffectColor(factor.effect),
                    borderRadius: 4,
                  },
                }}
              />
              {factor.details && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {factor.details}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>

      {/* 合計効果 */}
      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          border: '1px solid rgba(102, 126, 234, 0.3)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            最終訪問者数
          </Typography>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#667eea' }}>
              {finalValue.toLocaleString()}人
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalEffect > 0 ? '+' : ''}{totalEffect.toLocaleString()}人 ({((totalEffect / baseline) * 100).toFixed(1)}%)
            </Typography>
          </Box>
        </Box>
        
        {/* 効果の内訳バー */}
        <Box sx={{ display: 'flex', height: 20, borderRadius: 2, overflow: 'hidden' }}>
          <Box
            sx={{
              width: `${(baseline / finalValue) * 100}%`,
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            }}
          />
          {factors
            .filter(f => f.effect > 0)
            .map((factor, index) => (
              <Box
                key={index}
                sx={{
                  width: `${(factor.effect / finalValue) * 100}%`,
                  backgroundColor: getEffectColor(factor.effect),
                  opacity: 0.8,
                }}
              />
            ))}
        </Box>
      </Box>
    </Box>
  );
};

export default FactorDecompositionChart;