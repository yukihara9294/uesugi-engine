/**
 * ヒートマップ凡例コンポーネント
 * ヒートマップが表すデータの説明を表示
 */

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const HeatmapLegend = ({ visible, selectedCategories }) => {
  if (!visible) return null;

  const categories = [
    { id: '観光', label: '観光スポット', color: '#4CAF50', icon: '🏯', description: '寺社仏閣、名所' },
    { id: 'グルメ', label: 'グルメ', color: '#FF9800', icon: '🍜', description: 'レストラン、カフェ' },
    { id: 'イベント', label: 'イベント', color: '#9C27B0', icon: '🎉', description: '祭り、催し物' },
    { id: 'ショッピング', label: 'ショッピング', color: '#2196F3', icon: '🛍️', description: '商店街、モール' },
    { id: '交通', label: '交通', color: '#607D8B', icon: '🚃', description: '駅、バス停' },
  ];

  const activeCategories = categories.filter(cat => selectedCategories.includes(cat.id));

  return (
    <Paper
      sx={{
        position: 'absolute',
        bottom: 20,
        left: 340,
        p: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        maxWidth: 400,
        zIndex: 1000
      }}
    >
      <Typography variant="h6" sx={{ mb: 1, fontSize: 14, fontWeight: 'bold' }}>
        ヒートマップ: ソーシャル活動密度
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12, mb: 1 }}>
          SNS投稿、チェックイン、レビューなどの活動量を可視化
        </Typography>
        
        {/* 色の強度説明 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Box sx={{ 
            width: 200, 
            height: 8, 
            background: 'linear-gradient(to right, #0000ff, #00ffff, #ffffff, #ffaa00, #ff0000)',
            borderRadius: 1
          }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            低 → 高
          </Typography>
        </Box>
      </Box>

      {/* アクティブなカテゴリ */}
      <Typography variant="body2" sx={{ mb: 1, fontSize: 12 }}>
        表示中のカテゴリ:
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {activeCategories.map(cat => (
          <Box
            key={cat.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              backgroundColor: `${cat.color}20`,
              border: `1px solid ${cat.color}`,
              borderRadius: 2,
              px: 1.5,
              py: 0.5
            }}
          >
            <span style={{ fontSize: 16 }}>{cat.icon}</span>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: cat.color }}>
                {cat.label}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontSize: 10, color: 'text.secondary' }}>
                {cat.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* データポイント説明 */}
      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
          各ポイントは過去24時間のソーシャル活動を表示
        </Typography>
      </Box>
    </Paper>
  );
};

export default HeatmapLegend;