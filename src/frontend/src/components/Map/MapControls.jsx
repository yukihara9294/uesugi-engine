/**
 * Enhanced Map Controls Component
 * Provides intuitive controls for map interaction
 */

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Paper,
  Fade,
  Zoom,
  alpha,
} from '@mui/material';
import {
  Add,
  Remove,
  Navigation,
  ThreeDRotation,
  Refresh,
  CenterFocusStrong,
  Layers,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material';

const MapControls = ({ 
  map, 
  onResetView,
  on3DToggle,
  is3DEnabled,
  position = 'top-right' 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bearing, setBearing] = useState(0);

  const handleZoomIn = () => {
    if (map) {
      map.zoomIn({ duration: 300 });
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.zoomOut({ duration: 300 });
    }
  };

  const handleResetNorth = () => {
    if (map) {
      map.easeTo({ bearing: 0, pitch: 0, duration: 500 });
      setBearing(0);
    }
  };

  const handleResetView = () => {
    if (onResetView) {
      onResetView();
    }
  };

  const handle3DToggle = () => {
    if (on3DToggle) {
      on3DToggle();
    }
  };

  const handleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const positionStyles = {
    'top-right': { top: 80, right: 10 },
    'top-left': { top: 80, left: 10 },
    'bottom-right': { bottom: 30, right: 10 },
    'bottom-left': { bottom: 30, left: 10 },
  };

  const controls = [
    {
      icon: <Add />,
      tooltip: 'ズームイン',
      onClick: handleZoomIn,
      id: 'zoom-in',
    },
    {
      icon: <Remove />,
      tooltip: 'ズームアウト',
      onClick: handleZoomOut,
      id: 'zoom-out',
    },
    {
      icon: <Navigation sx={{ transform: `rotate(${bearing}deg)` }} />,
      tooltip: '北向きにリセット',
      onClick: handleResetNorth,
      id: 'reset-north',
    },
    {
      icon: <ThreeDRotation />,
      tooltip: '3D表示切替',
      onClick: handle3DToggle,
      id: '3d-toggle',
      active: is3DEnabled,
    },
    {
      icon: <CenterFocusStrong />,
      tooltip: '表示をリセット',
      onClick: handleResetView,
      id: 'reset-view',
    },
    {
      icon: isFullscreen ? <FullscreenExit /> : <Fullscreen />,
      tooltip: isFullscreen ? 'フルスクリーン終了' : 'フルスクリーン',
      onClick: handleFullscreen,
      id: 'fullscreen',
    },
  ];

  return (
    <Fade in timeout={500}>
      <Box
        sx={{
          position: 'absolute',
          ...positionStyles[position],
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        {controls.map((control, index) => (
          <Zoom
            key={control.id}
            in
            timeout={300 + index * 50}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <Paper
              sx={{
                background: 'rgba(10, 10, 10, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 1.5,
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                '&:hover': {
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                },
              }}
            >
              <Tooltip 
                title={control.tooltip} 
                placement="left" 
                arrow
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 200 }}
              >
                <IconButton
                  size="small"
                  onClick={control.onClick}
                  sx={{
                    color: control.active ? '#667eea' : 'rgba(255, 255, 255, 0.7)',
                    backgroundColor: control.active 
                      ? alpha('#667eea', 0.1)
                      : 'transparent',
                    borderRadius: 1,
                    p: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: '#667eea',
                      backgroundColor: alpha('#667eea', 0.1),
                      transform: 'scale(1.1)',
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    },
                  }}
                >
                  {control.icon}
                </IconButton>
              </Tooltip>
            </Paper>
          </Zoom>
        ))}
      </Box>
    </Fade>
  );
};

export default MapControls;