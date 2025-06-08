/**
 * 日付・期間選択コンポーネント
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Divider,
  Typography,
  IconButton,
} from '@mui/material';
import {
  DateRange,
  Today,
  CalendarMonth,
  AccessTime,
  ArrowDropDown,
} from '@mui/icons-material';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';

const DatePeriodSelector = ({ timeRange, onTimeRangeChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const presetPeriods = [
    {
      label: '過去1時間',
      icon: <AccessTime />,
      getValue: () => ({
        start: new Date(Date.now() - 60 * 60 * 1000),
        end: new Date(),
      }),
    },
    {
      label: '過去6時間',
      icon: <AccessTime />,
      getValue: () => ({
        start: new Date(Date.now() - 6 * 60 * 60 * 1000),
        end: new Date(),
      }),
    },
    {
      label: '過去24時間',
      icon: <Today />,
      getValue: () => ({
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date(),
      }),
    },
    {
      label: '過去7日間',
      icon: <CalendarMonth />,
      getValue: () => ({
        start: subDays(new Date(), 7),
        end: new Date(),
      }),
    },
    {
      label: '過去30日間',
      icon: <CalendarMonth />,
      getValue: () => ({
        start: subDays(new Date(), 30),
        end: new Date(),
      }),
    },
    {
      label: '今日',
      icon: <Today />,
      getValue: () => ({
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
      }),
    },
  ];

  const handleSelectPeriod = (period) => {
    const newRange = period.getValue();
    onTimeRangeChange(newRange);
    handleClose();
  };

  const formatTimeRange = () => {
    if (!timeRange) return '期間を選択';
    
    const now = new Date();
    const diffMs = now - timeRange.start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
      return `過去${diffHours}時間`;
    } else if (diffDays <= 30) {
      return `過去${diffDays}日間`;
    } else {
      return `${format(timeRange.start, 'M/d', { locale: ja })} - ${format(timeRange.end, 'M/d', { locale: ja })}`;
    }
  };

  return (
    <>
      <Button
        startIcon={<DateRange />}
        endIcon={<ArrowDropDown />}
        onClick={handleClick}
        variant="outlined"
        sx={{
          borderColor: 'rgba(255, 255, 255, 0.2)',
          color: 'rgba(255, 255, 255, 0.9)',
          textTransform: 'none',
          px: 2,
          py: 0.75,
          borderRadius: 2,
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.4)',
            background: 'rgba(255, 255, 255, 0.05)',
          },
        }}
      >
        {formatTimeRange()}
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{
          '& .MuiPaper-root': {
            bgcolor: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minWidth: 200,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            期間を選択
          </Typography>
        </Box>
        <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
        
        {presetPeriods.map((period, index) => (
          <MenuItem
            key={index}
            onClick={() => handleSelectPeriod(period)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              py: 1,
              '&:hover': {
                bgcolor: 'rgba(102, 126, 234, 0.1)',
              },
            }}
          >
            <Box sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              {period.icon}
            </Box>
            <Typography variant="body2">
              {period.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default DatePeriodSelector;