/**
 * Enhanced Help Tooltip Component
 * Provides contextual help and information
 */

import React from 'react';
import {
  Tooltip,
  IconButton,
  Box,
  Typography,
  Fade,
  alpha,
} from '@mui/material';
import { HelpOutline, Info } from '@mui/icons-material';

const HelpTooltip = ({ 
  title, 
  content, 
  children, 
  icon = 'help',
  placement = 'top',
  interactive = true,
  maxWidth = 300,
}) => {
  const tooltipContent = (
    <Box sx={{ p: 1 }}>
      {title && (
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            mb: content ? 1 : 0,
            color: '#667eea',
          }}
        >
          {title}
        </Typography>
      )}
      {content && (
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          {content}
        </Typography>
      )}
    </Box>
  );

  // If children are provided, wrap them with tooltip
  if (children) {
    return (
      <Tooltip
        title={tooltipContent}
        placement={placement}
        arrow
        interactive={interactive}
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 200 }}
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: 'rgba(10, 10, 10, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              maxWidth: maxWidth,
              '& .MuiTooltip-arrow': {
                color: 'rgba(10, 10, 10, 0.95)',
                '&::before': {
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              },
            },
          },
        }}
      >
        {children}
      </Tooltip>
    );
  }

  // If no children, render an icon button with tooltip
  return (
    <Tooltip
      title={tooltipContent}
      placement={placement}
      arrow
      interactive={interactive}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 200 }}
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            maxWidth: maxWidth,
            '& .MuiTooltip-arrow': {
              color: 'rgba(10, 10, 10, 0.95)',
              '&::before': {
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
            },
          },
        },
      }}
    >
      <IconButton
        size="small"
        sx={{
          color: alpha('#667eea', 0.7),
          '&:hover': {
            color: '#667eea',
            backgroundColor: alpha('#667eea', 0.1),
          },
          transition: 'all 0.2s ease',
        }}
      >
        {icon === 'help' ? <HelpOutline fontSize="small" /> : <Info fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};

// Quick Help component for inline help text
export const QuickHelp = ({ children, helpText }) => {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {children}
      <HelpTooltip
        content={helpText}
        icon="info"
      />
    </Box>
  );
};

export default HelpTooltip;