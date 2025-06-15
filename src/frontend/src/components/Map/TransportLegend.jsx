import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const TransportLegend = ({ visible }) => {
  if (!visible) return null;

  const legendItems = [
    { color: '#FFD700', label: '新幹線 (Shinkansen)', icon: '🚄' },
    { color: '#FF4500', label: 'JR在来線 (Local trains)', icon: '🚃' },
    { color: '#3B82F6', label: 'バス (Bus)', icon: '🚌' },
  ];

  return (
    <Paper
      sx={{
        position: 'absolute',
        bottom: 100,
        right: 20,
        padding: 2,
        backgroundColor: 'rgba(30, 30, 30, 0.95)',  // Dark background
        backdropFilter: 'blur(8px)',
        borderRadius: 2,
        zIndex: 1000,
        minWidth: 200,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Typography variant="h6" sx={{ mb: 1, fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>
        公共交通凡例
      </Typography>
      {legendItems.map((item, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 0.5,
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 3,
              backgroundColor: item.color,
              mr: 1,
              borderRadius: 1,
            }}
          />
          <Typography sx={{ fontSize: '12px', color: '#ffffff' }}>
            {item.icon} {item.label}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
};

export default TransportLegend;