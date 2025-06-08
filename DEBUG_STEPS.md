# 地図表示のデバッグ手順

## ブラウザで確認する項目

### 1. 開発者ツールのコンソールで確認

以下のコマンドを開発者ツールのコンソールで実行してください：

```javascript
// Mapboxが読み込まれているか確認
console.log('Mapbox loaded:', typeof window.mapboxgl);

// Mapboxトークンが設定されているか確認
console.log('Mapbox token:', window.mapboxgl?.accessToken);

// React環境変数を確認
console.log('REACT_APP_MAPBOX_ACCESS_TOKEN:', process.env.REACT_APP_MAPBOX_ACCESS_TOKEN);
```

### 2. ネットワークタブで確認

1. 開発者ツールのネットワークタブを開く
2. ページをリロード
3. 以下のリクエストを確認：
   - `mapbox-gl.js` - ステータス200であること
   - `mapbox-gl.css` - ステータス200であること
   - `styles/v1/mapbox/dark-v10` - Mapboxスタイルのリクエスト

### 3. 要素の検証

1. 開発者ツールの要素タブを開く
2. 地図が表示されるはずの領域を確認
3. `mapboxgl-map` クラスを持つ要素があるか確認

## 即座に試せる修正

### コンソールで実行：

```javascript
// 手動で地図を初期化してみる
if (window.mapboxgl && !document.querySelector('.mapboxgl-map')) {
  window.mapboxgl.accessToken = 'pk.eyJ1IjoieXVraWhhcmE5MjkiLCJhIjoiY200YzFhaGdkMGU1ODJrc2JxMGI5ZWxxMSJ9.P10U1DXeXxNw6p1FzRcbKA';
  
  const mapContainer = document.querySelector('[style*="width: 100%"][style*="height: 100%"]');
  if (mapContainer) {
    new window.mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [132.4553, 34.3853],
      zoom: 10
    });
  }
}
```

## よくある原因

1. **アクセストークンの問題**
   - トークンが無効または期限切れ
   - ドメイン制限がある場合

2. **コンテナの問題**
   - 地図コンテナに高さが設定されていない
   - コンテナが非表示になっている

3. **タイミングの問題**
   - Mapboxスクリプトの読み込みが完了する前に初期化している
   - Reactのレンダリングタイミングの問題

## 現在の状況を教えてください

1. コンソールにどのようなエラーが表示されていますか？
2. 上記のデバッグコマンドの結果は？
3. ネットワークタブでMapbox関連のリクエストは成功していますか？