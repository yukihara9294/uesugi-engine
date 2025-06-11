/**
 * Map Legend Component
 * Shows a visual guide for all map layers and their meanings
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  Tooltip,
  Fade,
  alpha,
} from '@mui/material';
import {
  InfoOutlined,
  ChevronLeft,
  ChevronRight,
  Place,
  Hotel,
  DirectionsCar,
  ShoppingCart,
  WbSunny,
  Event,
  LocationCity,
  Opacity,
} from '@mui/icons-material';

const MapLegend = ({ selectedLayers, position = 'bottom-left' }) => {
  const [expanded, setExpanded] = useState(true);
  const [hoveredItem, setHoveredItem] = useState(null);

  const legendItems = [
    {
      id: 'heatmap',
      label: 'ヒートマップ',
      icon: <Opacity />,
      color: '#FF5722',
      description: 'エリアの活動密度',
      visual: 'gradient',
    },
    {
      id: 'landmarks',
      label: 'ランドマーク',
      icon: <Place />,
      color: '#FFD700',
      description: '主要観光地・施設',
      visual: 'circle',
    },
    {
      id: 'plateau',
      label: '3D建物',
      icon: <LocationCity />,
      color: '#9C27B0',
      description: 'PLATEAU 3Dデータ',
      visual: 'box',
    },
    {
      id: 'mobility',
      label: '人流',
      icon: <DirectionsCar />,
      color: '#00FFFF',
      description: '移動パターン',
      visual: 'flow',
    },
    {
      id: 'consumption',
      label: '消費',
      icon: <ShoppingCart />,
      color: '#FF69B4',
      description: '購買活動',
      visual: 'circle',
    },
    {
      id: 'accommodation',
      label: '宿泊施設',
      icon: <Hotel />,
      color: '#4CAF50',
      description: '稼働率・空室状況',
      visual: 'circle',
    },
    {
      id: 'weather',
      label: '天気',
      icon: <WbSunny />,
      color: '#FFC107',
      description: '気象情報',
      visual: 'text',
    },
    {
      id: 'events',
      label: 'イベント',
      icon: <Event />,
      color: '#FF6B6B',
      description: 'イベント情報',
      visual: 'marker',
    },
  ];

  const positionStyles = {
    'bottom-left': { bottom: 20, left: 20 },
    'bottom-right': { bottom: 20, right: 20 },
    'top-left': { top: 80, left: 20 },
    'top-right': { top: 80, right: 20 },
  };

  const renderVisual = (item) => {
    switch (item.visual) {
      case 'gradient':
        return (
          <Box
            sx={{
              width: 24,
              height: 24,
              background: `radial-gradient(circle, ${item.color} 0%, transparent 70%)`,
              borderRadius: '50%',
            }}
          />
        );
      case 'circle':
        return (
          <Box
            sx={{
              width: 20,
              height: 20,
              backgroundColor: item.color,
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          />
        );
      case 'box':
        return (
          <Box
            sx={{
              width: 20,
              height: 20,
              backgroundColor: alpha(item.color, 0.8),
              border: `2px solid ${item.color}`,
              transform: 'perspective(10px) rotateX(-10deg)',
            }}
          />
        );
      case 'flow':
        return (
          <Box
            sx={{
              width: 24,
              height: 4,
              backgroundColor: item.color,
              borderRadius: 2,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                right: -2,
                top: -3,
                width: 0,
                height: 0,
                borderStyle: 'solid',
                borderWidth: '5px 0 5px 8px',
                borderColor: `transparent transparent transparent ${item.color}`,
              },
            }}
          />
        );
      case 'text':
        return (
          <Typography
            sx={{
              color: item.color,
              fontWeight: 'bold',
              fontSize: '14px',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            25°C
          </Typography>
        );
      case 'marker':
        return (
          <Box
            sx={{
              width: 24,
              height: 24,
              backgroundColor: item.color,
              borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Fade in timeout={1000}>
      <Paper
        sx={{
          position: 'absolute',
          ...positionStyles[position],
          zIndex: 1000,
          background: 'rgba(10, 10, 10, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          maxWidth: expanded ? 280 : 48,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            borderBottom: expanded ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          }}
        >
          {expanded && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoOutlined sx={{ fontSize: 18, color: '#667eea' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                マップ凡例
              </Typography>
            </Box>
          )}
          <Tooltip title={expanded ? '凡例を閉じる' : '凡例を開く'} placement="right">
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{
                color: '#667eea',
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                },
              }}
            >
              {expanded ? <ChevronLeft /> : <ChevronRight />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Legend Items */}
        <Collapse in={expanded} timeout={300}>
          <Box sx={{ p: 1.5 }}>
            {legendItems.map((item, index) => {
              const isActive = selectedLayers.includes(item.id);
              const isHovered = hoveredItem === item.id;

              return (
                <Tooltip
                  key={item.id}
                  title={item.description}
                  placement="right"
                  arrow
                  TransitionComponent={Fade}
                  TransitionProps={{ timeout: 200 }}
                >
                  <Box
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1,
                      borderRadius: 1,
                      opacity: isActive ? 1 : 0.5,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      transform: isHovered ? 'translateX(4px)' : 'none',
                      background: isHovered
                        ? alpha(item.color, 0.1)
                        : 'transparent',
                      '&:not(:last-child)': {
                        mb: 0.5,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {renderVisual(item)}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isActive ? 500 : 400,
                        color: isActive ? 'text.primary' : 'text.secondary',
                        fontSize: '13px',
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </Collapse>
      </Paper>
    </Fade>
  );
};

export default MapLegend;