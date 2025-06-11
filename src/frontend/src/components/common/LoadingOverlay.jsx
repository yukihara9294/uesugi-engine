/**
 * Enhanced Loading Overlay Component
 * Provides smooth, informative loading states
 */

import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Fade,
  alpha,
} from '@mui/material';
import { keyframes } from '@mui/system';

// Animations
const pulse = keyframes`
  0% {
    opacity: 0.6;
    transform: scale(0.95);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 0.6;
    transform: scale(0.95);
  }
`;

const slideIn = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const LoadingOverlay = ({ 
  loading, 
  message = 'データを読み込んでいます...', 
  progress = null,
  subMessage = null,
  fullScreen = false 
}) => {
  if (!loading) return null;

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        p: 4,
      }}
    >
      {/* Animated Logo/Icon */}
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: `${pulse} 2s ease-in-out infinite`,
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: '#fff',
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              to: { transform: 'rotate(360deg)' },
            },
          }}
        />
      </Box>

      {/* Loading Text */}
      <Box
        sx={{
          textAlign: 'center',
          animation: `${slideIn} 0.5s ease-out`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {message}
        </Typography>
        
        {subMessage && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              animation: `${slideIn} 0.5s ease-out 0.1s both`,
            }}
          >
            {subMessage}
          </Typography>
        )}
      </Box>

      {/* Progress Bar */}
      {progress !== null && (
        <Box
          sx={{
            width: '100%',
            maxWidth: 300,
            animation: `${slideIn} 0.5s ease-out 0.2s both`,
          }}
        >
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: alpha('#667eea', 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 1,
              color: 'text.secondary',
            }}
          >
            {Math.round(progress)}%
          </Typography>
        </Box>
      )}

      {/* Loading Tips */}
      <LoadingTips />
    </Box>
  );

  if (fullScreen) {
    return (
      <Fade in={loading} timeout={300}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          {content}
        </Box>
      </Fade>
    );
  }

  return (
    <Fade in={loading} timeout={300}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        {content}
      </Box>
    </Fade>
  );
};

// Loading Tips Component
const LoadingTips = () => {
  const tips = [
    'ヒント: 複数のレイヤーを組み合わせて、より詳細な分析が可能です',
    'ヒント: AI分析機能で、データから新しい洞察を発見できます',
    'ヒント: 時間範囲を変更して、トレンドの変化を確認しましょう',
    'ヒント: 3D表示モードで、都市の立体的な構造を確認できます',
    'ヒント: リアルタイムデータは自動的に更新されます',
  ];

  const [currentTip, setCurrentTip] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <Box
      sx={{
        maxWidth: 400,
        animation: `${slideIn} 0.5s ease-out 0.3s both`,
      }}
    >
      <Fade in key={currentTip} timeout={500}>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            color: alpha('#fff', 0.6),
            fontStyle: 'italic',
          }}
        >
          {tips[currentTip]}
        </Typography>
      </Fade>
    </Box>
  );
};

export default LoadingOverlay;