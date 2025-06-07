/**
 * レイヤー状態表示コンポーネント（デバッグ用）
 */

import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';

const LayerStatus = ({ selectedLayers, heatmapData, weatherData, mobilityData, accommodationData }) => {
  const layers = [
    {
      id: 'heatmap',
      label: 'ヒートマップ',
      dataCount: heatmapData?.features?.length || 0,
      dataLabel: 'ポイント'
    },
    {
      id: 'weather',
      label: '気象データ',
      dataCount: weatherData?.length || 0,
      dataLabel: '地点'
    },
    {
      id: 'mobility',
      label: '人流データ',
      dataCount: mobilityData?.flows?.length || 0,
      dataLabel: 'フロー'
    },
    {
      id: 'accommodation',
      label: '宿泊施設',
      dataCount: accommodationData?.facilities?.length || 0,
      dataLabel: '施設'
    }
  ];

  return (
    <Paper
      sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        p: 2,
        minWidth: 200,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000
      }}
    >
      <Typography variant="h6" sx={{ mb: 1, fontSize: 14 }}>
        レイヤー状態
      </Typography>
      {layers.map(layer => (
        <Box key={layer.id} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={selectedLayers.includes(layer.id) ? 'ON' : 'OFF'}
            size="small"
            color={selectedLayers.includes(layer.id) ? 'success' : 'default'}
            sx={{ minWidth: 40 }}
          />
          <Typography variant="body2" sx={{ flex: 1 }}>
            {layer.label}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {layer.dataCount} {layer.dataLabel}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
};

export default LayerStatus;