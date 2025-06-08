/**
 * 反実仮想分析コンポーネント
 * "もし〜だったら"のシナリオを可視化
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  IconButton,
  Collapse,
  Alert,
  Button,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  CloudOff,
  CancelPresentation,
  Celebration,
  TrafficOutlined,
  TrendingUp,
  TrendingDown,
  InfoOutlined,
} from '@mui/icons-material';

const CounterfactualAnalysis = ({ scenarios }) => {
  const [expandedScenario, setExpandedScenario] = useState(null);

  if (!scenarios || scenarios.length === 0) return null;

  const handleExpand = (scenarioId) => {
    setExpandedScenario(expandedScenario === scenarioId ? null : scenarioId);
  };

  // シナリオアイコンのマッピング
  const getScenarioIcon = (id) => {
    const icons = {
      'no-campaign': <CancelPresentation />,
      'bad-weather': <CloudOff />,
      'double-event': <Celebration />,
      'transport-issue': <TrafficOutlined />,
    };
    return icons[id] || <InfoOutlined />;
  };

  // 影響度の色を決定
  const getImpactColor = (impact) => {
    if (impact > 5000) return '#4CAF50';
    if (impact > 0) return '#66BB6A';
    if (impact > -2000) return '#FFA726';
    return '#FF6B6B';
  };

  // 確率レベルの表示
  const getProbabilityLabel = (probability) => {
    if (probability > 0.8) return { label: '高確率', color: '#FF6B6B' };
    if (probability > 0.5) return { label: '中確率', color: '#FFA726' };
    if (probability > 0.2) return { label: '低確率', color: '#66BB6A' };
    return { label: '稀少', color: '#42A5F5' };
  };

  return (
    <Box>
      {scenarios.map((scenario) => {
        const probLabel = getProbabilityLabel(scenario.probability);
        const isExpanded = expandedScenario === scenario.id;

        return (
          <Card
            key={scenario.id}
            sx={{
              mb: 2,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'rgba(102, 126, 234, 0.3)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.1)',
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                {/* アイコン */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${getImpactColor(scenario.impact)}22 0%, ${getImpactColor(scenario.impact)}44 100%)`,
                    border: `1px solid ${getImpactColor(scenario.impact)}66`,
                    color: getImpactColor(scenario.impact),
                  }}
                >
                  {getScenarioIcon(scenario.id)}
                </Box>

                {/* メインコンテンツ */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {scenario.name}
                    </Typography>
                    <Chip
                      label={probLabel.label}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.75rem',
                        backgroundColor: `${probLabel.color}22`,
                        borderColor: probLabel.color,
                        color: probLabel.color,
                        border: '1px solid',
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {scenario.description}
                  </Typography>

                  {/* 影響度 */}
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        訪問者数への影響
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {scenario.impact > 0 ? (
                          <TrendingUp sx={{ fontSize: 16, color: getImpactColor(scenario.impact) }} />
                        ) : (
                          <TrendingDown sx={{ fontSize: 16, color: getImpactColor(scenario.impact) }} />
                        )}
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ color: getImpactColor(scenario.impact) }}
                        >
                          {scenario.impact > 0 ? '+' : ''}{scenario.impact.toLocaleString()}人
                        </Typography>
                      </Box>
                    </Box>
                    
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(Math.abs(scenario.impact) / 150, 100)}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getImpactColor(scenario.impact),
                          borderRadius: 3,
                        },
                      }}
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        予想訪問者数: {scenario.visitors.toLocaleString()}人
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        発生確率: {(scenario.probability * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* 展開ボタン */}
                <IconButton
                  size="small"
                  onClick={() => handleExpand(scenario.id)}
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': { color: '#667eea' }
                  }}
                >
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              {/* 展開コンテンツ */}
              <Collapse in={isExpanded}>
                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Alert
                    severity="info"
                    sx={{
                      background: 'rgba(102, 126, 234, 0.1)',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                      '& .MuiAlert-icon': {
                        color: '#667eea',
                      },
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      推奨対応策
                    </Typography>
                    <Typography variant="body2">
                      {scenario.recommendation}
                    </Typography>
                  </Alert>

                  {/* アクションボタン */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: 'rgba(102, 126, 234, 0.5)',
                        color: '#667eea',
                        '&:hover': {
                          borderColor: '#667eea',
                          background: 'rgba(102, 126, 234, 0.1)',
                        },
                      }}
                    >
                      詳細シミュレーション
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          background: 'rgba(255, 255, 255, 0.05)',
                        },
                      }}
                    >
                      対策を保存
                    </Button>
                  </Box>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default CounterfactualAnalysis;