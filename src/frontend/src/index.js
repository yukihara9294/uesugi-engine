import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// アプリケーションがマウントされたらローディング画面を非表示
const hideInitialLoading = () => {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.transition = 'opacity 0.3s ease-out';
    loadingElement.style.opacity = '0';
    setTimeout(() => {
      loadingElement.style.display = 'none';
    }, 300);
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Reactがレンダリングを開始したら、少し待ってからローディング画面を非表示
setTimeout(hideInitialLoading, 500);