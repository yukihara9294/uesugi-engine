/**
 * Mobile Drawer Component
 * Responsive navigation for mobile devices
 */

import React from 'react';
import {
  Drawer,
  Box,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  alpha,
  SwipeableDrawer,
} from '@mui/material';
import {
  Close,
  Map as MapIcon,
  Layers,
  Analytics,
  Settings,
  Info,
} from '@mui/icons-material';

const MobileDrawer = ({ 
  open, 
  onClose, 
  onOpen,
  currentView,
  onViewChange 
}) => {
  const menuItems = [
    {
      id: 'map',
      label: 'マップビュー',
      icon: <MapIcon />,
      description: 'インタラクティブな地図表示',
    },
    {
      id: 'layers',
      label: 'レイヤー管理',
      icon: <Layers />,
      description: 'データレイヤーの表示/非表示',
    },
    {
      id: 'analytics',
      label: 'AI分析',
      icon: <Analytics />,
      description: 'データ分析と予測',
    },
    {
      id: 'settings',
      label: '設定',
      icon: <Settings />,
      description: 'アプリケーション設定',
    },
    {
      id: 'about',
      label: 'ヘルプ',
      icon: <Info />,
      description: '使い方とサポート',
    },
  ];

  const handleItemClick = (itemId) => {
    if (onViewChange) {
      onViewChange(itemId);
    }
    onClose();
  };

  const drawerContent = (
    <Box
      sx={{
        width: 280,
        height: '100%',
        background: 'rgba(10, 10, 10, 0.98)',
        color: 'white',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Uesugi Engine
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              color: '#667eea',
              background: 'rgba(102, 126, 234, 0.1)',
            },
          }}
        >
          <Close />
        </IconButton>
      </Box>

      {/* Menu Items */}
      <List sx={{ pt: 2 }}>
        {menuItems.map((item, index) => (
          <ListItem
            key={item.id}
            disablePadding
            sx={{
              animation: 'fadeInLeft 0.3s ease-out',
              animationDelay: `${index * 50}ms`,
              animationFillMode: 'both',
            }}
          >
            <ListItemButton
              selected={currentView === item.id}
              onClick={() => handleItemClick(item.id)}
              sx={{
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha('#667eea', 0.1),
                  transform: 'translateX(4px)',
                },
                '&.Mui-selected': {
                  backgroundColor: alpha('#667eea', 0.15),
                  borderLeft: '3px solid #667eea',
                  '&:hover': {
                    backgroundColor: alpha('#667eea', 0.2),
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: currentView === item.id ? '#667eea' : 'rgba(255, 255, 255, 0.7)',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={item.description}
                primaryTypographyProps={{
                  fontSize: '15px',
                  fontWeight: currentView === item.id ? 600 : 400,
                }}
                secondaryTypographyProps={{
                  fontSize: '12px',
                  sx: { opacity: 0.7 },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Footer */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            opacity: 0.5,
          }}
        >
          Version 1.0.0
        </Typography>
      </Box>
    </Box>
  );

  // Use SwipeableDrawer for better mobile experience
  return (
    <SwipeableDrawer
      anchor="left"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      disableBackdropTransition={false}
      disableDiscovery={false}
      swipeAreaWidth={20}
      ModalProps={{
        keepMounted: true, // Better performance on mobile
      }}
      sx={{
        '& .MuiDrawer-paper': {
          background: 'transparent',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      {drawerContent}
    </SwipeableDrawer>
  );
};

export default MobileDrawer;