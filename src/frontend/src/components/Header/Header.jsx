/**
 * ヘッダーコンポーネント
 */

import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Chip,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Analytics,
  Explore,
  LocationOn,
  TrendingUp,
  AutoAwesome,
} from '@mui/icons-material';

const Header = ({ 
  onSidebarToggle, 
  onDashboardToggle, 
  sidebarOpen, 
  dashboardOpen,
  onRefresh 
}) => {
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
        <IconButton
          edge="start"
          color="inherit"
          onClick={onSidebarToggle}
          sx={{ 
            mr: 2,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.1)',
              transform: 'scale(1.05)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          flexGrow: 1 
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 0.75,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.1)'
          }}>
            <Explore sx={{ fontSize: 20, color: '#667eea' }} />
            <Chip 
              icon={<LocationOn sx={{ fontSize: '16px !important' }} />}
              label="広島県" 
              size="small" 
              sx={{
                background: 'rgba(102, 126, 234, 0.2)',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                '& .MuiChip-label': { px: 1.5, fontWeight: 500 }
              }}
            />
          </Box>
          
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
          
          <Button
            startIcon={<Analytics />}
            color="inherit"
            onClick={onDashboardToggle}
            sx={{
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: 3,
              background: dashboardOpen 
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)' 
                : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid',
              borderColor: dashboardOpen ? 'rgba(102, 126, 234, 0.5)' : 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              fontWeight: 500,
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)',
                borderColor: 'rgba(102, 126, 234, 0.7)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)'
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            ダッシュボード
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;