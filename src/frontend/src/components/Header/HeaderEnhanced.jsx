/**
 * ヘッダーコンポーネント - Enhanced with animations and better UX
 */

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Chip,
  Button,
  Menu,
  MenuItem,
  Typography,
  Tooltip,
  Fade,
  Grow,
  alpha,
} from '@mui/material';
import {
  LocationOn,
  TrendingUp,
  AutoAwesome,
  ArrowDropDown,
  Refresh,
  Settings,
  Help,
} from '@mui/icons-material';
import DatePeriodSelector from './DatePeriodSelector';
import HelpTooltip from '../common/HelpTooltip';

const HeaderEnhanced = ({ 
  onRefresh,
  timeRange,
  onTimeRangeChange,
  onPrefectureSelect,
  currentPrefecture = '広島県',
  onAIAnalysisClick,
  dataUpdateTime
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handlePrefectureClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePrefectureClose = () => {
    setAnchorEl(null);
  };

  const handlePrefectureSelect = (prefecture) => {
    onPrefectureSelect(prefecture);
    handlePrefectureClose();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        background: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}
      elevation={0}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 }, py: 1 }}>
        <Grow in timeout={500}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            flexGrow: 1 
          }}>
            {/* Logo/Title */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mr: 2,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              Uesugi Engine
            </Typography>

            {/* 都道府県選択ボタン */}
            <Button
              startIcon={<LocationOn />}
              endIcon={<ArrowDropDown />}
              onClick={handlePrefectureClick}
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.1)',
                textTransform: 'none',
                fontSize: '18px',
                fontWeight: 700,
                color: '#fff',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                  borderColor: 'rgba(102, 126, 234, 0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 24px rgba(102, 126, 234, 0.2)',
                },
              }}
            >
              {currentPrefecture}
            </Button>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handlePrefectureClose}
              TransitionComponent={Fade}
              TransitionProps={{ timeout: 200 }}
              sx={{
                '& .MuiPaper-root': {
                  bgcolor: 'rgba(10, 10, 10, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  mt: 1,
                },
              }}
            >
              <MenuItem 
                onClick={() => handlePrefectureSelect('広島県')}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha('#667eea', 0.1),
                  },
                }}
              >
                広島県
              </MenuItem>
              <MenuItem 
                onClick={() => handlePrefectureSelect('東京都')}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha('#667eea', 0.1),
                  },
                }}
              >
                東京都
              </MenuItem>
              <MenuItem 
                onClick={() => handlePrefectureSelect('大阪府')}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha('#667eea', 0.1),
                  },
                }}
              >
                大阪府
              </MenuItem>
              <MenuItem 
                onClick={() => handlePrefectureSelect('福岡県')}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha('#667eea', 0.1),
                  },
                }}
              >
                福岡県
              </MenuItem>
            </Menu>
            
            <Fade in timeout={700}>
              <Chip
                icon={<TrendingUp sx={{ fontSize: '16px !important' }} />}
                label="リアルタイム分析"
                size="small"
                variant="outlined"
                sx={{
                  borderColor: 'rgba(76, 175, 80, 0.5)',
                  color: '#4CAF50',
                  '& .MuiChip-icon': { color: '#4CAF50' },
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.7 },
                    '100%': { opacity: 1 }
                  }
                }}
              />
            </Fade>
          </Box>
        </Grow>

        <Grow in timeout={600}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            {/* Data Update Time */}
            {dataUpdateTime && (
              <Fade in timeout={800}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: { xs: 'none', md: 'block' },
                  }}
                >
                  最終更新: {new Date(dataUpdateTime).toLocaleTimeString('ja-JP')}
                </Typography>
              </Fade>
            )}

            {/* 日付・期間選択 */}
            <DatePeriodSelector 
              timeRange={timeRange}
              onTimeRangeChange={onTimeRangeChange}
            />
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="データを更新" arrow>
                <IconButton
                  size="small"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: '#667eea',
                      background: 'rgba(102, 126, 234, 0.1)',
                      transform: 'rotate(180deg)',
                    },
                    '&.Mui-disabled': {
                      animation: 'spin 1s linear infinite',
                    },
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>

              <HelpTooltip
                title="AI分析機能"
                content="AIを使用してデータのパターンを分析し、因果関係や予測を行います。"
              >
                <Button
                  startIcon={<AutoAwesome />}
                  variant="text"
                  size="small"
                  onClick={onAIAnalysisClick}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: '#667eea',
                      background: 'rgba(102, 126, 234, 0.1)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  AI分析
                </Button>
              </HelpTooltip>

              <Tooltip title="ヘルプ" arrow>
                <IconButton
                  size="small"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      color: '#667eea',
                      background: 'rgba(102, 126, 234, 0.1)',
                    },
                  }}
                >
                  <Help />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Grow>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderEnhanced;