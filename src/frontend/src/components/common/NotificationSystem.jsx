/**
 * Notification System Component
 * Provides user feedback through elegant notifications
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Snackbar,
  Alert,
  Slide,
  Box,
  IconButton,
  Typography,
  alpha,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  Close,
} from '@mui/icons-material';

// Create context
const NotificationContext = createContext();

// Custom hook to use notifications
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// Slide transition
function SlideTransition(props) {
  return <Slide {...props} direction="up" />;
}

// Notification Provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    const newNotification = {
      id,
      message,
      type,
      duration,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const notify = {
    success: (message, duration) => showNotification(message, 'success', duration),
    error: (message, duration) => showNotification(message, 'error', duration),
    warning: (message, duration) => showNotification(message, 'warning', duration),
    info: (message, duration) => showNotification(message, 'info', duration),
  };

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <NotificationDisplay 
        notifications={notifications} 
        onClose={removeNotification} 
      />
    </NotificationContext.Provider>
  );
};

// Notification Display Component
const NotificationDisplay = ({ notifications, onClose }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle />;
      case 'error':
        return <Error />;
      case 'warning':
        return <Warning />;
      case 'info':
      default:
        return <Info />;
    }
  };

  const getColors = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: alpha('#4CAF50', 0.1),
          border: alpha('#4CAF50', 0.3),
          icon: '#4CAF50',
        };
      case 'error':
        return {
          bg: alpha('#FF6B6B', 0.1),
          border: alpha('#FF6B6B', 0.3),
          icon: '#FF6B6B',
        };
      case 'warning':
        return {
          bg: alpha('#FF9800', 0.1),
          border: alpha('#FF9800', 0.3),
          icon: '#FF9800',
        };
      case 'info':
      default:
        return {
          bg: alpha('#2196F3', 0.1),
          border: alpha('#2196F3', 0.3),
          icon: '#2196F3',
        };
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {notifications.map((notification, index) => {
        const colors = getColors(notification.type);
        
        return (
          <Snackbar
            key={notification.id}
            open={true}
            TransitionComponent={SlideTransition}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{
              position: 'relative',
              bottom: 'auto',
              right: 'auto',
              transform: 'none',
              marginBottom: index > 0 ? 1 : 0,
            }}
          >
            <Alert
              severity={notification.type}
              onClose={() => onClose(notification.id)}
              icon={getIcon(notification.type)}
              sx={{
                backgroundColor: 'rgba(10, 10, 10, 0.95)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                minWidth: 300,
                animation: 'slideInRight 0.3s ease-out',
                '& .MuiAlert-icon': {
                  color: colors.icon,
                },
                '& .MuiAlert-message': {
                  color: 'white',
                },
                '& .MuiAlert-action': {
                  paddingLeft: 2,
                },
                '@keyframes slideInRight': {
                  from: {
                    transform: 'translateX(100%)',
                    opacity: 0,
                  },
                  to: {
                    transform: 'translateX(0)',
                    opacity: 1,
                  },
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {notification.message}
              </Typography>
            </Alert>
          </Snackbar>
        );
      })}
    </Box>
  );
};

// Example usage component
export const NotificationExample = () => {
  const notify = useNotification();

  return (
    <Box sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      <button onClick={() => notify.success('データの保存に成功しました')}>
        Success
      </button>
      <button onClick={() => notify.error('エラーが発生しました')}>
        Error
      </button>
      <button onClick={() => notify.warning('接続が不安定です')}>
        Warning
      </button>
      <button onClick={() => notify.info('新しいデータが利用可能です')}>
        Info
      </button>
    </Box>
  );
};