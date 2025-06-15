const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      timeout: 120000, // 120 seconds timeout
      proxyTimeout: 120000, // 120 seconds proxy timeout
      onProxyReq: (proxyReq, req, res) => {
        // Set timeout on the request
        proxyReq.setTimeout(120000);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(504).json({ error: 'Gateway Timeout', message: err.message });
      }
    })
  );
};