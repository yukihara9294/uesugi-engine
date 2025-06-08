/**
 * 因果ネットワーク可視化コンポーネント
 * 要因間の因果関係をネットワークグラフで表示
 */

import React from 'react';
import { Box, Typography, Chip, Paper, Grid } from '@mui/material';
import { 
  AccountTree, 
  ArrowForward, 
  TrendingUp, 
  TrendingDown,
  WbSunny,
  Campaign,
  Event,
  DirectionsBus,
  CalendarMonth,
  Groups
} from '@mui/icons-material';

const CausalNetworkVisualization = ({ data }) => {
  if (!data) return null;

  // ノードアイコンのマッピング
  const getNodeIcon = (nodeId) => {
    const icons = {
      visitors: <Groups />,
      weather: <WbSunny />,
      campaign: <Campaign />,
      event: <Event />,
      transport: <DirectionsBus />,
      season: <CalendarMonth />,
    };
    return icons[nodeId] || <AccountTree />;
  };

  // ノードの色
  const nodeColors = {
    outcome: '#667eea',
    treatment: '#4CAF50',
    mediator: '#FFA726',
    confounder: '#FF6B6B',
  };

  // 簡易的なネットワーク表示
  return (
    <Box>
      {/* メインノード（結果変数） */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Paper
          sx={{
            p: 2,
            background: `linear-gradient(135deg, ${nodeColors.outcome}22 0%, ${nodeColors.outcome}44 100%)`,
            border: `2px solid ${nodeColors.outcome}`,
            borderRadius: 2,
            boxShadow: `0 4px 20px ${nodeColors.outcome}33`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getNodeIcon('visitors')}
            <Typography variant="subtitle1" fontWeight={600}>
              訪問者数
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* 因果関係の矢印 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <TrendingUp sx={{ fontSize: 40, color: '#4CAF50' }} />
          <Typography variant="caption" color="text.secondary">
            因果効果
          </Typography>
        </Box>
      </Box>

      {/* 処置変数とその他の変数 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {data.nodes.filter(n => n.type !== 'outcome').map((node) => {
          const edge = data.edges.find(e => e.source === node.id && e.target === 'visitors');
          const strength = edge ? edge.strength : 0;
          
          return (
            <Grid item xs={6} md={4} key={node.id}>
              <Paper
                sx={{
                  p: 2,
                  background: `rgba(255, 255, 255, 0.02)`,
                  border: `1px solid ${nodeColors[node.type]}66`,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 4px 20px ${nodeColors[node.type]}33`,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ color: nodeColors[node.type] }}>
                    {getNodeIcon(node.id)}
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {node.label}
                  </Typography>
                </Box>
                
                {/* 効果の強さ */}
                {strength !== 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    {strength > 0 ? (
                      <TrendingUp sx={{ fontSize: 16, color: '#4CAF50' }} />
                    ) : (
                      <TrendingDown sx={{ fontSize: 16, color: '#FF6B6B' }} />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      効果: {Math.abs(strength * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* 相互作用の表示 */}
      <Paper
        sx={{
          p: 2,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          mb: 3,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          主要な相互作用
        </Typography>
        {data.edges
          .filter(e => e.source !== 'visitors' && e.target !== 'visitors')
          .map((edge, index) => {
            const sourceNode = data.nodes.find(n => n.id === edge.source);
            const targetNode = data.nodes.find(n => n.id === edge.target);
            
            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mt: 1,
                  p: 1,
                  borderRadius: 1,
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <Typography variant="caption">
                  {sourceNode?.label}
                </Typography>
                <ArrowForward sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.5)' }} />
                <Typography variant="caption">
                  {targetNode?.label}
                </Typography>
                <Chip
                  label={`${(Math.abs(edge.strength) * 100).toFixed(0)}%`}
                  size="small"
                  sx={{
                    ml: 'auto',
                    height: 20,
                    fontSize: '0.7rem',
                    backgroundColor: edge.strength > 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                    color: edge.strength > 0 ? '#4CAF50' : '#FF6B6B',
                  }}
                />
              </Box>
            );
          })}
      </Paper>

      {/* 凡例 */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
        <Chip
          label="結果変数"
          size="small"
          sx={{
            backgroundColor: 'rgba(102, 126, 234, 0.2)',
            border: '1px solid rgba(102, 126, 234, 0.5)',
            color: '#667eea',
          }}
        />
        <Chip
          label="処置変数"
          size="small"
          sx={{
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            border: '1px solid rgba(76, 175, 80, 0.5)',
            color: '#4CAF50',
          }}
        />
        <Chip
          label="媒介変数"
          size="small"
          sx={{
            backgroundColor: 'rgba(255, 167, 38, 0.2)',
            border: '1px solid rgba(255, 167, 38, 0.5)',
            color: '#FFA726',
          }}
        />
        <Chip
          label="交絡変数"
          size="small"
          sx={{
            backgroundColor: 'rgba(255, 107, 107, 0.2)',
            border: '1px solid rgba(255, 107, 107, 0.5)',
            color: '#FF6B6B',
          }}
        />
      </Box>
    </Box>
  );
};

export default CausalNetworkVisualization;