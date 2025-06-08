/**
 * ヘッダーコンポーネント
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
} from '@mui/material';
import {
  LocationOn,
  TrendingUp,
  AutoAwesome,
  ArrowDropDown,
} from '@mui/icons-material';
import DatePeriodSelector from './DatePeriodSelector';

const Header = ({ 
  onRefresh,
  timeRange,
  onTimeRangeChange,
  onPrefectureSelect,
  currentPrefecture = '広島県'
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

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
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          flexGrow: 1 
        }}>
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
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                borderColor: 'rgba(102, 126, 234, 0.3)',
              },
              transition: 'all 0.2s ease'
            }}
          >
            {currentPrefecture}
          </Button>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handlePrefectureClose}
            sx={{
              '& .MuiPaper-root': {
                bgcolor: 'rgba(10, 10, 10, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <MenuItem onClick={() => handlePrefectureSelect('広島県')}>
              広島県
            </MenuItem>
            <MenuItem onClick={() => handlePrefectureSelect('東京都')} disabled>
              東京都（準備中）
            </MenuItem>
            <MenuItem onClick={() => handlePrefectureSelect('大阪府')} disabled>
              大阪府（準備中）
            </MenuItem>
          </Menu>
          
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
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* 日付・期間選択 */}
          <DatePeriodSelector 
            timeRange={timeRange}
            onTimeRangeChange={onTimeRangeChange}
          />
          
          <Button
            startIcon={<AutoAwesome />}
            variant="text"
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              textTransform: 'none',
              '&:hover': {
                color: '#667eea',
                background: 'rgba(102, 126, 234, 0.1)'
              }
            }}
          >
            AI分析
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;