import React from 'react';
import { Box, Alert, Button } from '@mui/material';

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // エラー発生時にstateを更新
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // エラーログを記録
    console.error('Map Error Boundary caught an error:', error, errorInfo);
    
    // Mapbox関連のエラーの場合は特別な処理
    if (error.message && error.message.includes("Cannot read properties of undefined (reading 'sub')")) {
      console.warn('Known Mapbox internal error caught');
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          padding: 3
        }}>
          <Alert 
            severity="error" 
            sx={{ maxWidth: 500 }}
            action={
              <Button color="inherit" size="small" onClick={this.handleReload}>
                再読み込み
              </Button>
            }
          >
            <strong>地図の表示でエラーが発生しました</strong>
            <br />
            {this.state.error?.message || 'Unknown error'}
            <br />
            <small>
              このエラーが続く場合は、ブラウザのキャッシュをクリアしてください。
            </small>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;