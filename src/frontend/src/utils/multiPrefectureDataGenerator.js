/**
 * Multi-Prefecture Data Generator
 * Generates realistic dummy data for multiple prefectures
 */

import { 
  generateAllPrefectureData as generateHiroshimaData,
  getHiroshimaPrefectureBounds 
} from './hiroshimaPrefectureDataGenerator';
import { toValidGeoJSON, sanitizeProperties } from './geoJSONValidator';

// Validation function to ensure prefecture data has required structure
function validatePrefectureData(prefectureData, functionName) {
  if (!prefectureData) {
    console.error(`${functionName}: Prefecture data is null or undefined`);
    return false;
  }
  
  if (!prefectureData.bounds) {
    console.warn(`${functionName}: Prefecture data missing bounds property`);
    return false;
  }
  
  if (!prefectureData.bounds.center || !Array.isArray(prefectureData.bounds.center)) {
    console.warn(`${functionName}: Prefecture data missing bounds.center array`);
    return false;
  }
  
  if (!prefectureData.cities) {
    console.warn(`${functionName}: Prefecture data missing cities property`);
    return false;
  }
  
  return true;
}

// Helper function to convert array data to GeoJSON FeatureCollection
// Now uses the validated version from geoJSONValidator
function toGeoJSON(data, geometryType = 'Point', requiredProps = []) {
  return toValidGeoJSON(data, geometryType, requiredProps);
}

// Helper function to generate random points around a center with normal distribution
function generatePointsAroundCenter(center, count, spread = 0.01) {
  const points = [];
  for (let i = 0; i < count; i++) {
    // Use Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    
    points.push([
      center[0] + z0 * spread,
      center[1] + z1 * spread
    ]);
  }
  return points;
}

// Tokyo Prefecture Data
const TOKYO_DATA = {
  bounds: {
    north: 35.9,
    south: 35.5,
    east: 140.0,
    west: 139.5,
    center: [139.7670, 35.6812],
    defaultZoom: 10.5
  },
  cities: {
    chiyoda: {
      name: '千代田区',
      nameEn: 'Chiyoda',
      center: [139.7540, 35.6938],
      population: 67000,
      districts: [
        { name: '丸の内', center: [139.7643, 35.6812], population: 10000 },
        { name: '大手町', center: [139.7665, 35.6876], population: 15000 },
        { name: '永田町', center: [139.7453, 35.6763], population: 8000 },
        { name: '霞が関', center: [139.7520, 35.6740], population: 12000 }
      ],
      touristSpots: ['皇居', '東京駅', '日比谷公園', '東京国際フォーラム', '国会議事堂'],
      commercialAreas: ['丸の内', '大手町', '有楽町', '秋葉原']
    },
    shinjuku: {
      name: '新宿区',
      nameEn: 'Shinjuku',
      center: [139.7036, 35.6938],
      population: 348000,
      districts: [
        { name: '新宿', center: [139.7036, 35.6895], population: 120000 },
        { name: '歌舞伎町', center: [139.7038, 35.6952], population: 80000 },
        { name: '西新宿', center: [139.6917, 35.6895], population: 100000 }
      ],
      touristSpots: ['新宿御苑', '東京都庁', '歌舞伎町', '新宿ゴールデン街'],
      commercialAreas: ['新宿駅周辺', '西新宿', '歌舞伎町']
    },
    shibuya: {
      name: '渋谷区',
      nameEn: 'Shibuya',
      center: [139.7019, 35.6580],
      population: 243000,
      districts: [
        { name: '渋谷', center: [139.7019, 35.6580], population: 100000 },
        { name: '原宿', center: [139.7021, 35.6702], population: 80000 },
        { name: '恵比寿', center: [139.7101, 35.6467], population: 63000 }
      ],
      touristSpots: ['渋谷スクランブル交差点', '明治神宮', '原宿竹下通り', '代々木公園', '恵比寿ガーデンプレイス'],
      commercialAreas: ['渋谷駅周辺', '原宿', '表参道', '恵比寿']
    },
    minato: {
      name: '港区',
      nameEn: 'Minato',
      center: [139.7514, 35.6584],
      population: 260000,
      districts: [
        { name: '六本木', center: [139.7314, 35.6627], population: 70000 },
        { name: '赤坂', center: [139.7366, 35.6764], population: 65000 },
        { name: '品川', center: [139.7400, 35.6286], population: 80000 },
        { name: 'お台場', center: [139.7744, 35.6311], population: 45000 }
      ],
      touristSpots: ['東京タワー', '六本木ヒルズ', 'お台場', 'レインボーブリッジ', '増上寺'],
      commercialAreas: ['六本木', '赤坂', '品川駅周辺', 'お台場']
    },
    taito: {
      name: '台東区',
      nameEn: 'Taito',
      center: [139.7804, 35.7120],
      population: 213000,
      districts: [
        { name: '浅草', center: [139.7966, 35.7120], population: 100000 },
        { name: '上野', center: [139.7744, 35.7141], population: 113000 }
      ],
      touristSpots: ['浅草寺', '東京スカイツリー', '上野公園', '上野動物園', 'アメ横'],
      commercialAreas: ['浅草', '上野駅周辺', '浅草橋']
    }
  },
  landmarks: [
    // Iconic structures
    { name: '東京スカイツリー', coordinates: [139.8107, 35.7101], height: 634 },
    { name: '東京タワー', coordinates: [139.7454, 35.6586], height: 333 },
    { name: '東京ドーム', coordinates: [139.7518, 35.7056], height: 56 },
    { name: '国立競技場', coordinates: [139.7147, 35.6781], height: 47 },
    { name: '両国国技館', coordinates: [139.7966, 35.6969], height: 39 },
    // Palaces and temples
    { name: '皇居', coordinates: [139.7540, 35.6938], height: 30 },
    { name: '明治神宮', coordinates: [139.6994, 35.6763], height: 25 },
    { name: '浅草寺', coordinates: [139.7966, 35.7147], height: 53 },
    { name: '増上寺', coordinates: [139.7484, 35.6585], height: 21 },
    // Museums and cultural sites
    { name: '東京国立博物館', coordinates: [139.7766, 35.7188], height: 25 },
    { name: '国立西洋美術館', coordinates: [139.7756, 35.7156], height: 20 },
    { name: '東京都庁', coordinates: [139.6917, 35.6895], height: 243 },
    { name: '渋谷スクランブル交差点', coordinates: [139.7019, 35.6580], height: 20 },
    // Shopping and entertainment
    { name: '東京ビッグサイト', coordinates: [139.7946, 35.6301], height: 58 },
    { name: 'レインボーブリッジ', coordinates: [139.7812, 35.6368], height: 126 },
    { name: '六本木ヒルズ', coordinates: [139.7293, 35.6600], height: 238 },
    { name: '東京ミッドタウン', coordinates: [139.7314, 35.6657], height: 248 },
    // Parks and nature
    { name: '上野公園', coordinates: [139.7734, 35.7141], height: 15 },
    { name: '代々木公園', coordinates: [139.6969, 35.6721], height: 15 },
    { name: '日比谷公園', coordinates: [139.7560, 35.6742], height: 15 },
    { name: '新宿御苑', coordinates: [139.7106, 35.6852], height: 15 }
  ],
  events: [
    // Tokyo Dome Events (文京区)
    { name: '読売ジャイアンツ vs 阪神タイガース', coordinates: [139.7518, 35.7056], category: '野球', icon: '⚾' },
    { name: '読売ジャイアンツ vs 広島東洋カープ', coordinates: [139.7518, 35.7056], category: '野球', icon: '⚾' },
    { name: 'B\'z LIVE-GYM 2024', coordinates: [139.7518, 35.7056], category: 'コンサート', icon: '🎵' },
    { name: 'Mr.Children Tour 2024', coordinates: [139.7518, 35.7056], category: 'コンサート', icon: '🎵' },
    { name: 'サザンオールスターズ 特別公演', coordinates: [139.7518, 35.7056], category: 'コンサート', icon: '🎵' },
    { name: '東京ドーム格闘技イベント', coordinates: [139.7518, 35.7056], category: 'スポーツ', icon: '🥊' },
    
    // Nippon Budokan Events (千代田区)
    { name: '全日本柔道選手権大会', coordinates: [139.7497, 35.6932], category: '武道', icon: '🥋' },
    { name: '全日本剣道選手権大会', coordinates: [139.7497, 35.6932], category: '武道', icon: '⚔️' },
    { name: '武道館ライブ - 福山雅治', coordinates: [139.7497, 35.6932], category: 'コンサート', icon: '🎵' },
    { name: '武道館ライブ - 宇多田ヒカル', coordinates: [139.7497, 35.6932], category: 'コンサート', icon: '🎵' },
    { name: '日本武道館50周年記念公演', coordinates: [139.7497, 35.6932], category: 'イベント', icon: '🎊' },
    
    // Tokyo Big Sight Events (江東区)
    { name: 'コミックマーケット C103', coordinates: [139.7946, 35.6301], category: '展示会', icon: '🎨' },
    { name: '東京ゲームショウ 2024', coordinates: [139.7946, 35.6301], category: '展示会', icon: '🎮' },
    { name: '東京モーターショー 2024', coordinates: [139.7946, 35.6301], category: '展示会', icon: '🚗' },
    { name: 'AnimeJapan 2024', coordinates: [139.7946, 35.6301], category: '展示会', icon: '🎌' },
    { name: '東京国際ブックフェア', coordinates: [139.7946, 35.6301], category: '展示会', icon: '📚' },
    { name: 'CEATEC JAPAN 2024', coordinates: [139.7946, 35.6301], category: '展示会', icon: '💻' },
    
    // National Stadium Events (新宿区)
    { name: '日本代表 vs ブラジル代表', coordinates: [139.7147, 35.6781], category: 'サッカー', icon: '⚽' },
    { name: 'J1リーグ決勝戦', coordinates: [139.7147, 35.6781], category: 'サッカー', icon: '⚽' },
    { name: '陸上日本選手権', coordinates: [139.7147, 35.6781], category: '陸上', icon: '🏃' },
    { name: '嵐 復活コンサート', coordinates: [139.7147, 35.6781], category: 'コンサート', icon: '🎵' },
    { name: 'ラグビーワールドカップ記念試合', coordinates: [139.7147, 35.6781], category: 'ラグビー', icon: '🏈' },
    
    // Seasonal Festivals
    { name: '隅田川花火大会', coordinates: [139.8107, 35.7101], category: '花火', icon: '🎆' },
    { name: '神田祭', coordinates: [139.7671, 35.6989], category: '祭り', icon: '🎊' },
    { name: '三社祭', coordinates: [139.7966, 35.7147], category: '祭り', icon: '🎊' },
    { name: '深川八幡祭り', coordinates: [139.7996, 35.6726], category: '祭り', icon: '🎊' },
    { name: '山王祭', coordinates: [139.7454, 35.6795], category: '祭り', icon: '🎊' },
    
    // Cherry Blossom Festivals
    { name: '上野桜まつり', coordinates: [139.7734, 35.7141], category: '花見', icon: '🌸' },
    { name: '千鳥ヶ淵桜まつり', coordinates: [139.7518, 35.6895], category: '花見', icon: '🌸' },
    { name: '目黒川桜まつり', coordinates: [139.6993, 35.6337], category: '花見', icon: '🌸' },
    { name: '代々木公園桜まつり', coordinates: [139.6969, 35.6721], category: '花見', icon: '🌸' },
    { name: '新宿御苑桜まつり', coordinates: [139.7106, 35.6852], category: '花見', icon: '🌸' },
    
    // Summer Festivals
    { name: '高円寺阿波おどり', coordinates: [139.6496, 35.7056], category: '祭り', icon: '🎊' },
    { name: '築地本願寺納涼盆踊り大会', coordinates: [139.7714, 35.6661], category: '祭り', icon: '🎊' },
    { name: '麻布十番納涼まつり', coordinates: [139.7366, 35.6564], category: '祭り', icon: '🎊' },
    { name: '神楽坂まつり', coordinates: [139.7408, 35.7012], category: '祭り', icon: '🎊' },
    { name: '六本木ヒルズ盆踊り', coordinates: [139.7293, 35.6600], category: '祭り', icon: '🎊' },
    
    // Other Major Events
    { name: '東京マラソン', coordinates: [139.7540, 35.6812], category: 'スポーツ', icon: '🏃' },
    { name: 'コミコン東京', coordinates: [139.6917, 35.6295], category: 'イベント', icon: '🎭' },
    { name: '東京国際映画祭', coordinates: [139.7314, 35.6627], category: '映画', icon: '🎬' },
    { name: '東京ラーメンショー', coordinates: [139.7670, 35.6700], category: 'グルメ', icon: '🍜' },
    { name: 'デザインフェスタ', coordinates: [139.7946, 35.6301], category: 'アート', icon: '🎨' }
  ]
};

// Osaka Prefecture Data
const OSAKA_DATA = {
  bounds: {
    north: 34.9,
    south: 34.5,
    east: 135.7,
    west: 135.3,
    center: [135.4959, 34.7028],
    defaultZoom: 10.5
  },
  cities: {
    kitaku: {
      name: '北区',
      nameEn: 'Kita',
      center: [135.5070, 34.7055],
      population: 135000,
      districts: [
        { name: '梅田', center: [135.4959, 34.7028], population: 60000 },
        { name: '中之島', center: [135.4930, 34.6939], population: 35000 },
        { name: '天神橋筋', center: [135.5131, 34.7009], population: 40000 }
      ],
      touristSpots: ['大阪駅', '梅田スカイビル', '中之島公園', '大阪天満宮'],
      commercialAreas: ['梅田', '茶屋町', '天神橋筋商店街']
    },
    chuoku: {
      name: '中央区',
      nameEn: 'Chuo',
      center: [135.5069, 34.6816],
      population: 100000,
      districts: [
        { name: '心斎橋', center: [135.5014, 34.6731], population: 40000 },
        { name: '難波', center: [135.5027, 34.6627], population: 35000 },
        { name: '本町', center: [135.4986, 34.6826], population: 25000 }
      ],
      touristSpots: ['大阪城', '道頓堀', '心斎橋筋商店街', '黒門市場'],
      commercialAreas: ['心斎橋', '難波', '道頓堀']
    },
    naniwaku: {
      name: '浪速区',
      nameEn: 'Naniwa',
      center: [135.4986, 34.6613],
      population: 75000,
      districts: [
        { name: '新世界', center: [135.5063, 34.6525], population: 35000 },
        { name: '日本橋', center: [135.5050, 34.6600], population: 40000 }
      ],
      touristSpots: ['通天閣', '新世界', 'スパワールド', '今宮戎神社'],
      commercialAreas: ['新世界', '日本橋電気街']
    },
    yodogawaku: {
      name: '淀川区',
      nameEn: 'Yodogawa',
      center: [135.4850, 34.7206],
      population: 180000,
      districts: [
        { name: '新大阪', center: [135.5008, 34.7338], population: 90000 },
        { name: '十三', center: [135.4745, 34.7161], population: 90000 }
      ],
      touristSpots: ['新大阪駅'],
      commercialAreas: ['新大阪駅周辺', '十三駅周辺']
    },
    abenoku: {
      name: '阿倍野区',
      nameEn: 'Abeno',
      center: [135.5189, 34.6394],
      population: 110000,
      districts: [
        { name: '天王寺', center: [135.5189, 34.6466], population: 60000 },
        { name: '阿倍野', center: [135.5189, 34.6394], population: 50000 }
      ],
      touristSpots: ['あべのハルカス', '天王寺動物園', '四天王寺'],
      commercialAreas: ['天王寺駅周辺', 'あべのキューズモール']
    }
  },
  landmarks: [
    // Iconic structures
    { name: 'あべのハルカス', coordinates: [135.5147, 34.6458], height: 300 },
    { name: '通天閣', coordinates: [135.5063, 34.6525], height: 103 },
    { name: '梅田スカイビル', coordinates: [135.4903, 34.7055], height: 173 },
    { name: '大阪城天守閣', coordinates: [135.5256, 34.6873], height: 55 },
    { name: '京セラドーム大阪', coordinates: [135.4760, 34.6695], height: 36 },
    // Cultural and historical sites
    { name: '四天王寺', coordinates: [135.5166, 34.6534], height: 39 },
    { name: '住吉大社', coordinates: [135.4930, 34.6125], height: 20 },
    { name: '大阪天満宮', coordinates: [135.5131, 34.6959], height: 15 },
    // Entertainment districts
    { name: '道頓堀グリコサイン', coordinates: [135.5014, 34.6689], height: 20 },
    { name: 'ユニバーサル・スタジオ・ジャパン', coordinates: [135.4322, 34.6655], height: 40 },
    { name: '海遊館', coordinates: [135.4288, 34.6548], height: 30 },
    { name: 'なんばパークス', coordinates: [135.5018, 34.6617], height: 149 },
    // Museums and culture
    { name: '国立国際美術館', coordinates: [135.4915, 34.6925], height: 20 },
    { name: '大阪市立科学館', coordinates: [135.4905, 34.6920], height: 25 },
    { name: '大阪歴史博物館', coordinates: [135.5210, 34.6825], height: 35 },
    // Parks and nature
    { name: '大阪城公園', coordinates: [135.5256, 34.6873], height: 15 },
    { name: '中之島公園', coordinates: [135.4930, 34.6939], height: 10 },
    { name: '天王寺公園', coordinates: [135.5189, 34.6506], height: 10 },
    // Shopping areas
    { name: '心斎橋筋商店街', coordinates: [135.5014, 34.6731], height: 20 },
    { name: '黒門市場', coordinates: [135.5050, 34.6650], height: 15 }
  ],
  events: [
    // Kyocera Dome Events (西区)
    { name: 'オリックス・バファローズ vs ソフトバンクホークス', coordinates: [135.4760, 34.6695], category: '野球', icon: '⚾' },
    { name: 'オリックス・バファローズ vs 日本ハムファイターズ', coordinates: [135.4760, 34.6695], category: '野球', icon: '⚾' },
    { name: 'BTS WORLD TOUR 大阪', coordinates: [135.4760, 34.6695], category: 'K-POP', icon: '🎵' },
    { name: 'SEVENTEEN CONCERT 大阪', coordinates: [135.4760, 34.6695], category: 'K-POP', icon: '🎵' },
    { name: 'TWICE JAPAN TOUR 大阪', coordinates: [135.4760, 34.6695], category: 'K-POP', icon: '🎵' },
    { name: '関ジャニ∞ DOME TOUR', coordinates: [135.4760, 34.6695], category: 'コンサート', icon: '🎵' },
    { name: 'Perfume LIVE 大阪', coordinates: [135.4760, 34.6695], category: 'コンサート', icon: '🎵' },
    
    // Osaka-jo Hall Events (中央区)
    { name: 'EXILE LIVE TOUR 大阪', coordinates: [135.5256, 34.6873], category: 'コンサート', icon: '🎵' },
    { name: '三代目 J SOUL BROTHERS LIVE', coordinates: [135.5256, 34.6873], category: 'コンサート', icon: '🎵' },
    { name: '安室奈美恵 復活ライブ', coordinates: [135.5256, 34.6873], category: 'コンサート', icon: '🎵' },
    { name: '大阪プロレス祭り', coordinates: [135.5256, 34.6873], category: 'スポーツ', icon: '🤼' },
    { name: '全日本フィギュアスケート選手権', coordinates: [135.5256, 34.6873], category: 'スポーツ', icon: '⛸️' },
    
    // Grand Cube Osaka Events (住之江区)
    { name: '大阪国際会議', coordinates: [135.4290, 34.6380], category: '会議', icon: '🏢' },
    { name: '関西医学会総会', coordinates: [135.4290, 34.6380], category: '学会', icon: '🔬' },
    { name: '大阪モーターサイクルショー', coordinates: [135.4290, 34.6380], category: '展示会', icon: '🏍️' },
    { name: 'コスプレ博 in 大阪', coordinates: [135.4290, 34.6380], category: 'イベント', icon: '🎭' },
    { name: '大阪コミコン', coordinates: [135.4290, 34.6380], category: 'イベント', icon: '🎨' },
    
    // Universal Studios Japan Special Events
    { name: 'ユニバーサル・クールジャパン', coordinates: [135.4322, 34.6655], category: 'テーマパーク', icon: '🎢' },
    { name: 'ハロウィーン・ホラー・ナイト', coordinates: [135.4322, 34.6655], category: 'テーマパーク', icon: '🎃' },
    { name: 'ユニバーサル・カウントダウン・パーティ', coordinates: [135.4322, 34.6655], category: 'テーマパーク', icon: '🎆' },
    { name: 'ウィザーディング・ワールド特別イベント', coordinates: [135.4322, 34.6655], category: 'テーマパーク', icon: '🪄' },
    { name: 'ミニオン・パーク新アトラクション', coordinates: [135.4322, 34.6655], category: 'テーマパーク', icon: '🎠' },
    
    // Traditional Festivals
    { name: '天神祭', coordinates: [135.5131, 34.6959], category: '祭り', icon: '🎊' },
    { name: '岸和田だんじり祭', coordinates: [135.3714, 34.4606], category: '祭り', icon: '🎊' },
    { name: '住吉大社 夏祭り', coordinates: [135.4930, 34.6125], category: '祭り', icon: '🎊' },
    { name: '今宮戎十日戎', coordinates: [135.4963, 34.6500], category: '祭り', icon: '🎊' },
    { name: '四天王寺 どやどや', coordinates: [135.5166, 34.6534], category: '祭り', icon: '🎊' },
    { name: '愛染まつり', coordinates: [135.5166, 34.6460], category: '祭り', icon: '🎊' },
    { name: '生國魂神社夏祭り', coordinates: [135.5133, 34.6536], category: '祭り', icon: '🎊' },
    
    // Fireworks and Summer Events
    { name: 'なにわ淀川花火大会', coordinates: [135.4850, 34.7206], category: '花火', icon: '🎆' },
    { name: 'PL花火芸術', coordinates: [135.6020, 34.5090], category: '花火', icon: '🎆' },
    { name: '天神祭奉納花火', coordinates: [135.5131, 34.6959], category: '花火', icon: '🎆' },
    { name: '泉州夢花火', coordinates: [135.3166, 34.3407], category: '花火', icon: '🎆' },
    
    // Sports Events
    { name: '大阪マラソン', coordinates: [135.5256, 34.6873], category: 'スポーツ', icon: '🏃' },
    { name: '大阪国際女子マラソン', coordinates: [135.5189, 34.6780], category: 'スポーツ', icon: '🏃' },
    { name: 'セレッソ大阪 vs ガンバ大阪', coordinates: [135.5189, 34.6142], category: 'サッカー', icon: '⚽' },
    { name: '関西学生アメフト決勝', coordinates: [135.5189, 34.6142], category: 'スポーツ', icon: '🏈' },
    
    // Cultural Events
    { name: '大阪城音楽堂コンサート', coordinates: [135.5256, 34.6873], category: 'コンサート', icon: '🎵' },
    { name: '大阪アジアン映画祭', coordinates: [135.5014, 34.6731], category: '映画', icon: '🎬' },
    { name: 'サマーソニック大阪', coordinates: [135.4290, 34.6380], category: '音楽フェス', icon: '🎸' },
    { name: '食博覧会・大阪', coordinates: [135.4290, 34.6380], category: 'グルメ', icon: '🍜' },
    { name: '大阪モーターショー', coordinates: [135.4290, 34.6380], category: '展示会', icon: '🚗' },
    { name: '御堂筋イルミネーション', coordinates: [135.5014, 34.6831], category: 'イルミネーション', icon: '✨' }
  ]
};

// Fukuoka Prefecture Data
const FUKUOKA_DATA = {
  bounds: {
    north: 33.7,
    south: 33.4,
    east: 130.6,
    west: 130.2,
    center: [130.4017, 33.5904],
    defaultZoom: 10
  },
  cities: {
    hakataku: {
      name: '博多区',
      nameEn: 'Hakata',
      center: [130.4147, 33.5904],
      population: 240000,
      districts: [
        { name: '博多駅周辺', center: [130.4205, 33.5897], population: 100000 },
        { name: '中洲', center: [130.4059, 33.5943], population: 60000 },
        { name: '博多港', center: [130.4090, 33.6047], population: 80000 }
      ],
      touristSpots: ['博多駅', 'キャナルシティ博多', '櫛田神社', '博多ポートタワー'],
      commercialAreas: ['博多駅周辺', '中洲', 'キャナルシティ']
    },
    chuoku_fukuoka: {
      name: '中央区',
      nameEn: 'Chuo',
      center: [130.3926, 33.5890],
      population: 200000,
      districts: [
        { name: '天神', center: [130.4017, 33.5904], population: 80000 },
        { name: '大濠', center: [130.3760, 33.5850], population: 60000 },
        { name: '薬院', center: [130.3956, 33.5788], population: 60000 }
      ],
      touristSpots: ['天神地下街', '大濠公園', '福岡城跡', '福岡市美術館'],
      commercialAreas: ['天神', '大名', '今泉']
    },
    nishiku: {
      name: '西区',
      nameEn: 'Nishi',
      center: [130.3235, 33.5851],
      population: 210000,
      districts: [
        { name: '姪浜', center: [130.3235, 33.5851], population: 110000 },
        { name: '西新', center: [130.3590, 33.5790], population: 100000 }
      ],
      touristSpots: ['マリノアシティ福岡', '福岡タワー', 'ももち浜海浜公園'],
      commercialAreas: ['姪浜駅周辺', '西新商店街']
    },
    higashiku: {
      name: '東区',
      nameEn: 'Higashi',
      center: [130.4252, 33.6170],
      population: 320000,
      districts: [
        { name: '香椎', center: [130.4446, 33.6596], population: 160000 },
        { name: '箱崎', center: [130.4252, 33.6170], population: 160000 }
      ],
      touristSpots: ['香椎宮', '筥崎宮', 'マリンワールド海の中道'],
      commercialAreas: ['香椎駅周辺', '千早駅周辺']
    },
    minamiku: {
      name: '南区',
      nameEn: 'Minami',
      center: [130.4262, 33.5616],
      population: 260000,
      districts: [
        { name: '大橋', center: [130.4262, 33.5616], population: 130000 },
        { name: '高宮', center: [130.4140, 33.5680], population: 130000 }
      ],
      touristSpots: ['鴻巣山展望台'],
      commercialAreas: ['大橋駅周辺', '高宮駅周辺']
    }
  },
  landmarks: [
    // Iconic structures
    { name: '福岡タワー', coordinates: [130.3514, 33.5933], height: 234 },
    { name: '博多ポートタワー', coordinates: [130.4090, 33.6047], height: 103 },
    { name: 'ヤフオクドーム', coordinates: [130.3620, 33.5953], height: 84 },
    { name: 'アクロス福岡', coordinates: [130.4048, 33.5880], height: 60 },
    { name: 'キャナルシティ博多', coordinates: [130.4111, 33.5899], height: 45 },
    // Temples and shrines
    { name: '櫛田神社', coordinates: [130.4108, 33.5930], height: 20 },
    { name: '太宰府天満宮', coordinates: [130.5347, 33.5217], height: 25 },
    { name: '筥崎宮', coordinates: [130.4252, 33.6170], height: 20 },
    { name: '住吉神社', coordinates: [130.4125, 33.5833], height: 15 },
    // Historical sites
    { name: '福岡城跡', coordinates: [130.3809, 33.5845], height: 30 },
    { name: '大濠公園', coordinates: [130.3760, 33.5850], height: 10 },
    { name: '舞鶴公園', coordinates: [130.3809, 33.5845], height: 15 },
    // Shopping and entertainment
    { name: '天神地下街', coordinates: [130.4017, 33.5904], height: 10 },
    { name: '博多駅', coordinates: [130.4205, 33.5897], height: 60 },
    { name: 'マリノアシティ福岡', coordinates: [130.3235, 33.5851], height: 20 },
    // Cultural sites
    { name: '福岡市博物館', coordinates: [130.3551, 33.5895], height: 25 },
    { name: '福岡アジア美術館', coordinates: [130.4059, 33.5943], height: 20 },
    { name: '九州国立博物館', coordinates: [130.5380, 33.5185], height: 35 },
    // Nature and parks
    { name: '海の中道海浜公園', coordinates: [130.3647, 33.6554], height: 10 },
    { name: 'ももち浜海浜公園', coordinates: [130.3514, 33.5933], height: 5 }
  ],
  events: [
    // PayPay Dome Events (中央区)
    { name: '福岡ソフトバンクホークス vs 西武ライオンズ', coordinates: [130.3620, 33.5953], category: '野球', icon: '⚾' },
    { name: '福岡ソフトバンクホークス vs 楽天イーグルス', coordinates: [130.3620, 33.5953], category: '野球', icon: '⚾' },
    { name: '福岡ソフトバンクホークス 日本シリーズ', coordinates: [130.3620, 33.5953], category: '野球', icon: '⚾' },
    { name: 'BIGBANG JAPAN DOME TOUR 福岡', coordinates: [130.3620, 33.5953], category: 'K-POP', icon: '🎵' },
    { name: 'Hey! Say! JUMP LIVE 福岡', coordinates: [130.3620, 33.5953], category: 'コンサート', icon: '🎵' },
    { name: '浜崎あゆみ DOME TOUR 福岡', coordinates: [130.3620, 33.5953], category: 'コンサート', icon: '🎵' },
    
    // Marine Messe Fukuoka Events (博多区)
    { name: 'ONE OK ROCK LIVE 福岡', coordinates: [130.4090, 33.6047], category: 'コンサート', icon: '🎵' },
    { name: 'RADWIMPS TOUR 福岡', coordinates: [130.4090, 33.6047], category: 'コンサート', icon: '🎵' },
    { name: '福岡モーターショー', coordinates: [130.4090, 33.6047], category: '展示会', icon: '🚗' },
    { name: '九州コミティア', coordinates: [130.4090, 33.6047], category: '展示会', icon: '🎨' },
    { name: '福岡ゲームショウ', coordinates: [130.4090, 33.6047], category: '展示会', icon: '🎮' },
    { name: '九州ペット博', coordinates: [130.4090, 33.6047], category: '展示会', icon: '🐕' },
    
    // Traditional Festivals
    { name: '博多どんたく港まつり', coordinates: [130.4017, 33.5904], category: '祭り', icon: '🎊' },
    { name: '博多祇園山笠', coordinates: [130.4108, 33.5930], category: '祭り', icon: '🎊' },
    { name: '放生会', coordinates: [130.4252, 33.6170], category: '祭り', icon: '🎊' },
    { name: '博多おくんち', coordinates: [130.4108, 33.5930], category: '祭り', icon: '🎊' },
    { name: '飯盛神社秋季大祭', coordinates: [130.3570, 33.5840], category: '祭り', icon: '🎊' },
    
    // Hakata Station Area Events
    { name: 'JR博多シティ イルミネーション', coordinates: [130.4205, 33.5897], category: 'イルミネーション', icon: '✨' },
    { name: '博多駅前広場 夏祭り', coordinates: [130.4205, 33.5897], category: '祭り', icon: '🎊' },
    { name: '九州物産展', coordinates: [130.4205, 33.5897], category: '物産展', icon: '🛍️' },
    
    // Asian Cultural Events
    { name: 'アジアンパーティ', coordinates: [130.4111, 33.5899], category: '文化', icon: '🌏' },
    { name: '福岡アジア文化賞', coordinates: [130.4048, 33.5880], category: '文化', icon: '🏆' },
    { name: 'アジア太平洋フェスティバル', coordinates: [130.4017, 33.5904], category: 'フェス', icon: '🎪' },
    { name: '福岡アジア映画祭', coordinates: [130.4111, 33.5899], category: '映画', icon: '🎬' },
    { name: '九州・アジア国際音楽祭', coordinates: [130.4048, 33.5880], category: '音楽', icon: '🎵' },
    
    // Sports Events
    { name: '福岡マラソン', coordinates: [130.4017, 33.5904], category: 'スポーツ', icon: '🏃' },
    { name: '福岡国際マラソン', coordinates: [130.3760, 33.5850], category: 'スポーツ', icon: '🏃' },
    { name: 'アビスパ福岡 vs サガン鳥栖', coordinates: [130.4520, 33.5860], category: 'サッカー', icon: '⚽' },
    { name: '九州場所 大相撲', coordinates: [130.4090, 33.5900], category: 'スポーツ', icon: '🤼' },
    
    // Fireworks and Summer Events
    { name: '西日本大濠花火大会', coordinates: [130.3760, 33.5850], category: '花火', icon: '🎆' },
    { name: '関門海峡花火大会', coordinates: [130.8842, 33.9610], category: '花火', icon: '🎆' },
    { name: '筑後川花火大会', coordinates: [130.5080, 33.3190], category: '花火', icon: '🎆' },
    
    // Cultural Events
    { name: '博多座 歌舞伎公演', coordinates: [130.4059, 33.5943], category: '伝統芸能', icon: '🎭' },
    { name: 'サンセットライブ', coordinates: [130.3514, 33.5933], category: '音楽フェス', icon: '🎸' },
    { name: '福岡城さくらまつり', coordinates: [130.3809, 33.5845], category: '花見', icon: '🌸' },
    { name: 'ももち浜 SUMMER FESTIVAL', coordinates: [130.3514, 33.5933], category: 'フェス', icon: '🏖️' },
    { name: '天神きらめき通りイルミネーション', coordinates: [130.4017, 33.5904], category: 'イルミネーション', icon: '✨' }
  ]
};

// Generate accommodation data for a prefecture
function generateAccommodationForPrefecture(prefectureData) {
  const accommodations = [];
  
  if (!validatePrefectureData(prefectureData, 'generateAccommodationForPrefecture')) {
    return accommodations;
  }
  
  Object.values(prefectureData.cities).forEach(city => {
    if (!city.districts || !Array.isArray(city.districts)) {
      console.warn('generateAccommodationForPrefecture: City missing districts array:', city.name);
      return;
    }
    city.districts.forEach(district => {
      // Generate more hotels for major cities (25-50 per district based on population)
      const baseHotelCount = city.population > 300000 ? 30 : 20;
      const hotelCount = Math.floor(baseHotelCount + (district.population / 20000) * 10);
      const points = generatePointsAroundCenter(district.center, hotelCount, 0.005);
      
      points.forEach((coord, idx) => {
        // More diverse hotel types with weights based on district characteristics
        const isBusinessDistrict = district.name.includes('区') && !district.name.includes('住宅');
        const isTouristArea = city.touristSpots && city.touristSpots.length > 5;
        
        let hotelTypes, typeWeights;
        if (isBusinessDistrict) {
          hotelTypes = ['シティホテル', 'ビジネスホテル', 'カプセルホテル'];
          typeWeights = [0.3, 0.5, 0.2];
        } else if (isTouristArea) {
          hotelTypes = ['シティホテル', 'ビジネスホテル', '旅館', 'ゲストハウス'];
          typeWeights = [0.25, 0.35, 0.2, 0.2];
        } else {
          hotelTypes = ['ビジネスホテル', 'カプセルホテル', 'ゲストハウス'];
          typeWeights = [0.5, 0.25, 0.25];
        }
        
        // Weighted random selection
        const rand = Math.random();
        let cumWeight = 0;
        let type = hotelTypes[0];
        for (let i = 0; i < typeWeights.length; i++) {
          cumWeight += typeWeights[i];
          if (rand < cumWeight) {
            type = hotelTypes[i];
            break;
          }
        }
        
        const occupancy = 0.6 + Math.random() * 0.35; // 60-95% occupancy
        
        // More diverse hotel names
        const hotelNames = {
          'シティホテル': ['ヒルトン', 'シェラトン', 'マリオット', 'インターコンチネンタル', 
                      'パークハイアット', 'グランドハイアット', 'ザ・リッツ・カールトン', 
                      'コンラッド', 'アンダーズ', 'ハイアットリージェンシー', 'ウェスティン',
                      'プリンスホテル', 'ニューオータニ', 'オークラ', 'インペリアル',
                      'セントレジス', 'フォーシーズンズ', 'マンダリンオリエンタル'],
          'ビジネスホテル': ['東横イン', 'アパホテル', 'スーパーホテル', 'ルートイン', 
                       'ドーミーイン', 'リッチモンドホテル', 'ダイワロイネット', 
                       'ホテルサンルート', 'ワシントンホテル', 'コンフォートホテル',
                       'チサンホテル', 'ホテル法華クラブ', 'ホテルリブマックス', 'ユニゾイン',
                       'ホテルモントレ', 'ホテルグランヴィア', 'ホテルメッツ', 'ビスタホテル'],
          'カプセルホテル': ['ナインアワーズ', 'ファーストキャビン', 'カプセルイン', 
                       'グランパーク・イン', 'ベイサイドホテル アジュール', 'コンパクトホテル',
                       'スマートホテル', 'ポッドイン', 'キャビンホテル'],
          'ゲストハウス': ['ホステル', 'バックパッカーズ', 'ゲストハウス', 
                      'K\'s House', 'サクラホステル', 'カオサン', 'ゲストハウス品川宿',
                      'トーキョーハウス', '東京ひかりゲストハウス', 'BOOK AND BED'],
          '旅館': ['旅館', '温泉旅館', '料亭旅館', '和風旅館', '老舗旅館', '湯宿',
                  '民宿', '町家旅館', '庭園旅館']
        };
        
        const nameOptions = hotelNames[type] || hotelNames['ビジネスホテル'];
        const baseName = nameOptions[Math.floor(Math.random() * nameOptions.length)];
        const suffix = district.name;
        
        // More realistic capacity based on hotel type and city
        const capacityRanges = {
          'シティホテル': city.population > 500000 ? [300, 800] : [200, 500],
          'ビジネスホテル': city.population > 500000 ? [150, 300] : [100, 200],
          'カプセルホテル': [100, 250],
          'ゲストハウス': [20, 60],
          '旅館': [30, 100]
        };
        
        const [minCap, maxCap] = capacityRanges[type] || [50, 150];
        const capacity = Math.floor(minCap + Math.random() * (maxCap - minCap));
        
        accommodations.push({
          id: `${city.nameEn}-${district.name}-hotel-${idx}`,
          coordinates: coord,
          name: `${baseName}${suffix}`,
          type: type,
          occupancy: occupancy,
          capacity: capacity,
          city: city.name,
          district: district.name,
          rating: 3 + Math.random() * 2, // 3-5 star rating
          priceRange: type === 'シティホテル' ? '高' : 
                      type === 'ビジネスホテル' ? '中' : '低'
        });
      });
    });
    
    // Add hotels near major train stations
    const stationHotelNames = ['JR', '駅前', 'ステーション', 'グランド', 'プレミア'];
    const stationAreas = ['駅前', '駅南', '駅北', '駅東', '駅西'];
    
    stationAreas.forEach((area, areaIdx) => {
      const stationHotels = Math.floor(8 + Math.random() * 7);
      const stationCoord = [
        city.center[0] + (Math.random() - 0.5) * 0.01,
        city.center[1] + (Math.random() - 0.5) * 0.01
      ];
      const stationPoints = generatePointsAroundCenter(stationCoord, stationHotels, 0.002);
      
      stationPoints.forEach((coord, idx) => {
        const hotelTypes = ['ビジネスホテル', 'シティホテル'];
        const type = hotelTypes[Math.floor(Math.random() * hotelTypes.length)];
        const stationPrefix = stationHotelNames[Math.floor(Math.random() * stationHotelNames.length)];
        
        accommodations.push({
          id: `${city.nameEn}-station-${areaIdx}-hotel-${idx}`,
          coordinates: coord,
          name: `${stationPrefix}ホテル${city.name}${area}`,
          type: type,
          occupancy: 0.75 + Math.random() * 0.2,
          capacity: type === 'シティホテル' ? 250 + Math.floor(Math.random() * 150) :
                   150 + Math.floor(Math.random() * 100),
          city: city.name,
          district: city.districts && city.districts.length > 0 ? city.districts[0].name : city.name,
          nearStation: true,
          rating: 3.5 + Math.random() * 1.0
        });
      });
    });
    
    // Add extra hotels near tourist spots
    if (city.touristSpots) {
      city.touristSpots.slice(0, 5).forEach((spot, spotIdx) => {
        const touristHotels = Math.floor(5 + Math.random() * 5);
        const spotCoord = [
          city.center[0] + (Math.random() - 0.5) * 0.02,
          city.center[1] + (Math.random() - 0.5) * 0.02
        ];
        const nearbyPoints = generatePointsAroundCenter(spotCoord, touristHotels, 0.003);
        
        nearbyPoints.forEach((coord, idx) => {
          const touristHotelTypes = ['シティホテル', '旅館', 'ゲストハウス'];
          const type = touristHotelTypes[Math.floor(Math.random() * touristHotelTypes.length)];
          
          accommodations.push({
            id: `${city.nameEn}-tourist-${spotIdx}-hotel-${idx}`,
            coordinates: coord,
            name: `${spot}${type === '旅館' ? '温泉' : 'ホテル'}`,
            type: type,
            occupancy: 0.7 + Math.random() * 0.25,
            capacity: type === 'シティホテル' ? 200 + Math.floor(Math.random() * 200) :
                     type === '旅館' ? 40 + Math.floor(Math.random() * 60) :
                     20 + Math.floor(Math.random() * 40),
            city: city.name,
            district: city.districts && city.districts.length > 0 ? city.districts[0].name : city.name,
            nearLandmark: spot,
            rating: 3.5 + Math.random() * 1.5
          });
        });
      });
    }
  });
  
  return accommodations;
}

// Generate consumption data for a prefecture
function generateConsumptionForPrefecture(prefectureData) {
  const consumptionData = [];
  
  if (!validatePrefectureData(prefectureData, 'generateConsumptionForPrefecture')) {
    return consumptionData;
  }
  
  Object.values(prefectureData.cities).forEach(city => {
    // Generate consumption data for commercial areas with increased density
    const commercialAreas = Array.isArray(city.commercialAreas) 
      ? city.commercialAreas 
      : [city.name + '商業地区'];
    commercialAreas.forEach(areaName => {
      const area = typeof areaName === 'string' ? { name: areaName } : areaName;
      // More points for larger cities (8-20 points per area)
      const basePoints = city.population > 500000 ? 10 : 6;
      const pointCount = Math.floor(basePoints + (city.population / 60000) * 2.5);
      const centerOffset = [
        city.center[0] + (Math.random() - 0.5) * 0.01,
        city.center[1] + (Math.random() - 0.5) * 0.01
      ];
      const points = generatePointsAroundCenter(centerOffset, pointCount, 0.003);
      
      points.forEach((coord, idx) => {
        const categories = ['飲食', 'ショッピング', '観光', 'エンターテイメント', 'サービス', 
                          'カフェ', 'コンビニ', 'デパート', '専門店'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        // Higher base amounts for major cities
        const baseAmount = city.population * (city.population > 500000 ? 0.3 : 0.2);
        const categoryMultiplier = {
          '飲食': 1.3,
          'ショッピング': 1.6,
          '観光': 1.0,
          'エンターテイメント': 0.8,
          'サービス': 0.9,
          'カフェ': 0.7,
          'コンビニ': 0.5,
          'デパート': 2.0,
          '専門店': 1.1
        };
        
        const timeVariation = Math.sin(idx * 0.3) * 0.3 + 0.7;
        const locationVariation = area?.name?.includes('駅') ? 1.4 : 1.0;
        const randomVariation = 0.3 + Math.random() * 1.2;
        
        const amount = baseAmount * categoryMultiplier[category] * timeVariation * 
                      locationVariation * randomVariation;
        
        consumptionData.push({
          id: `${city.nameEn}-${area?.name || 'area'}-consumption-${idx}`,
          coordinates: coord,
          amount: Math.floor(amount),
          category: category,
          area: area?.name || city.name + '商業地区',
          city: city.name,
          peak_time: Math.floor(Math.random() * 24),
          isTouristArea: city.touristSpots && city.touristSpots.length > 5
        });
      });
    });
    
    // Add consumption points near tourist spots (tourist areas have 20x higher consumption)
    if (city.touristSpots) {
      city.touristSpots.forEach((spot, spotIdx) => {
        const touristConsumption = Math.floor(8 + Math.random() * 7);
        const spotCoord = [
          city.center[0] + (Math.random() - 0.5) * 0.02,
          city.center[1] + (Math.random() - 0.5) * 0.02
        ];
        const nearbyPoints = generatePointsAroundCenter(spotCoord, touristConsumption, 0.002);
        
        nearbyPoints.forEach((coord, idx) => {
          const touristCategories = ['観光', 'お土産', '飲食', 'カフェ'];
          const category = touristCategories[Math.floor(Math.random() * touristCategories.length)];
          
          // Tourist areas have much higher consumption
          const touristMultiplier = 20;
          const baseAmount = city.population * 0.15 * touristMultiplier;
          const amount = baseAmount * (0.8 + Math.random() * 0.4);
          
          consumptionData.push({
            id: `${city.nameEn}-tourist-${spotIdx}-consumption-${idx}`,
            coordinates: coord,
            amount: Math.floor(amount),
            category: category,
            area: spot,
            city: city.name,
            peak_time: 10 + Math.floor(Math.random() * 8), // Tourist areas peak 10am-6pm
            isTouristArea: true,
            nearLandmark: spot
          });
        });
      });
    }
    
    // Add consumption data for districts
    if (city.districts && Array.isArray(city.districts)) {
      city.districts.forEach(district => {
        // Residential areas have lower but steady consumption
      const districtPoints = Math.floor(5 + (district.population / 50000) * 3);
      const points = generatePointsAroundCenter(district.center, districtPoints, 0.004);
      
      points.forEach((coord, idx) => {
        const residentialCategories = ['コンビニ', 'スーパー', '飲食', 'サービス'];
        const category = residentialCategories[Math.floor(Math.random() * residentialCategories.length)];
        
        const baseAmount = district.population * 0.1;
        const amount = baseAmount * (0.5 + Math.random() * 0.5);
        
        consumptionData.push({
          id: `${city.nameEn}-${district.name}-residential-${idx}`,
          coordinates: coord,
          amount: Math.floor(amount),
          category: category,
          area: district.name,
          city: city.name,
          peak_time: category === '飲食' ? 12 + Math.floor(Math.random() * 2) : 
                     Math.floor(Math.random() * 24),
          isResidential: true
        });
      });
    });
    }
  });
  
  return consumptionData;
}

// Generate mobility data for a prefecture
function generateMobilityForPrefecture(prefectureData) {
  const mobilityData = {
    routes: [],
    congestionPoints: []
  };
  
  // Validate prefecture data structure
  if (!prefectureData || !prefectureData.bounds || !prefectureData.bounds.center || !Array.isArray(prefectureData.bounds.center)) {
    console.warn('Invalid prefecture data structure for mobility generation:', prefectureData);
    // Convert mobility data to the format expected by MapWithRealData
  // Add sanitized properties to ensure all required fields exist
  const particlesData = mobilityData.congestionPoints.map((point, idx) => ({
    coordinates: point.coordinates,
    id: `particle-${idx}`,
    size: 5 + point.level * 10,
    color: point.level > 0.7 ? '#FF6B6B' : point.level > 0.5 ? '#FFA726' : '#66BB6A',
    speed: 0.5 + point.level * 0.5,
    glowRadius: 15,
    glowColor: point.level > 0.7 ? '#FF6B6B' : point.level > 0.5 ? '#FFA726' : '#66BB6A',
    glowOpacityOuter: 0.3,
    glowOpacityMiddle: 0.5,
    coreColor: '#FFFFFF',
    coreOpacity: 1,
    type: 'congestion',
    radius: 10,
    ...point
  }));

  const flowsData = mobilityData.routes.map((route, idx) => ({
    coordinates: route.points,
    id: route.id || `flow-${idx}`,
    color: route.congestion > 0.8 ? '#FF5252' : route.congestion > 0.6 ? '#FFA726' : '#66BB6A',
    width: 2 + route.congestion * 3,
    showGlowingArc: route.congestion > 0.5,
    currentOpacity: 1,
    opacity: 1,
    distanceKm: route.distanceKm || 10,
    congestion: route.congestion || 0,
    ...route
  }));

  // Use validated GeoJSON conversion
  return {
    particles: toGeoJSON(particlesData, 'Point', [
      'size', 'glowRadius', 'glowColor', 'glowOpacityOuter', 
      'glowOpacityMiddle', 'coreColor', 'coreOpacity', 'radius', 'type'
    ]),
    flows: toGeoJSON(flowsData, 'LineString', [
      'showGlowingArc', 'currentOpacity', 'distanceKm', 'congestion', 'opacity'
    ])
  };
  }
  
  // Prefecture-specific transportation routes
  if (prefectureData.bounds.center[0] === 139.7670) { // Tokyo
    // Yamanote Line (circular route) - Complete circle
    const yamanoteStations = [
      { name: '東京', coord: [139.7671, 35.6812] },
      { name: '有楽町', coord: [139.7635, 35.6750] },
      { name: '新橋', coord: [139.7590, 35.6665] },
      { name: '浜松町', coord: [139.7566, 35.6554] },
      { name: '田町', coord: [139.7477, 35.6455] },
      { name: '品川', coord: [139.7400, 35.6286] },
      { name: '大崎', coord: [139.7285, 35.6198] },
      { name: '五反田', coord: [139.7236, 35.6262] },
      { name: '目黒', coord: [139.7158, 35.6339] },
      { name: '恵比寿', coord: [139.7101, 35.6467] },
      { name: '渋谷', coord: [139.7019, 35.6580] },
      { name: '原宿', coord: [139.7021, 35.6702] },
      { name: '代々木', coord: [139.7020, 35.6837] },
      { name: '新宿', coord: [139.7036, 35.6938] },
      { name: '新大久保', coord: [139.7005, 35.7006] },
      { name: '高田馬場', coord: [139.7039, 35.7125] },
      { name: '目白', coord: [139.7068, 35.7211] },
      { name: '池袋', coord: [139.7100, 35.7295] },
      { name: '大塚', coord: [139.7286, 35.7316] },
      { name: '巣鴨', coord: [139.7393, 35.7334] },
      { name: '駒込', coord: [139.7468, 35.7365] },
      { name: '田端', coord: [139.7608, 35.7381] },
      { name: '西日暮里', coord: [139.7668, 35.7320] },
      { name: '日暮里', coord: [139.7706, 35.7280] },
      { name: '鶯谷', coord: [139.7782, 35.7209] },
      { name: '上野', coord: [139.7774, 35.7141] },
      { name: '御徒町', coord: [139.7747, 35.7074] },
      { name: '秋葉原', coord: [139.7740, 35.6984] },
      { name: '神田', coord: [139.7709, 35.6918] }
    ];
    
    for (let i = 0; i < yamanoteStations.length; i++) {
      const next = (i + 1) % yamanoteStations.length;
      mobilityData.routes.push({
        id: `yamanote-${i}`,
        name: `山手線: ${yamanoteStations[i].name} - ${yamanoteStations[next].name}`,
        type: 'train',
        points: [yamanoteStations[i].coord, yamanoteStations[next].coord],
        congestion: 0.7 + Math.random() * 0.25,
        flow_speed: 35,
        category: 'JR線'
      });
    }
    
    // Chuo Line
    const chuoStations = [
      { name: '東京', coord: [139.7671, 35.6812] },
      { name: '神田', coord: [139.7709, 35.6918] },
      { name: '御茶ノ水', coord: [139.7636, 35.6993] },
      { name: '四ツ谷', coord: [139.7298, 35.6858] },
      { name: '新宿', coord: [139.7036, 35.6938] },
      { name: '中野', coord: [139.6644, 35.7056] },
      { name: '高円寺', coord: [139.6496, 35.7056] },
      { name: '阿佐ヶ谷', coord: [139.6357, 35.7046] },
      { name: '荻窪', coord: [139.6205, 35.7043] },
      { name: '吉祥寺', coord: [139.5796, 35.7030] },
      { name: '三鷹', coord: [139.5606, 35.7028] }
    ];
    
    for (let i = 0; i < chuoStations.length - 1; i++) {
      mobilityData.routes.push({
        id: `chuo-${i}`,
        name: `中央線: ${chuoStations[i].name} - ${chuoStations[i + 1].name}`,
        type: 'train',
        points: [chuoStations[i].coord, chuoStations[i + 1].coord],
        congestion: 0.75 + Math.random() * 0.2,
        flow_speed: 40,
        category: 'JR線'
      });
    }
    
    // Major subway lines
    mobilityData.routes.push({
      id: 'ginza-line',
      name: '銀座線: 渋谷 - 浅草',
      type: 'subway',
      points: [[139.7019, 35.6580], [139.7540, 35.6718], [139.7636, 35.6750], [139.7706, 35.6950], [139.7966, 35.7120]],
      congestion: 0.75,
      flow_speed: 30,
      category: '地下鉄'
    });
    
    mobilityData.routes.push({
      id: 'marunouchi-line',
      name: '丸ノ内線: 荻窪 - 池袋',
      type: 'subway',
      points: [[139.6205, 35.7043], [139.7036, 35.6938], [139.7300, 35.6860], [139.7540, 35.6812], [139.7100, 35.7295]],
      congestion: 0.8,
      flow_speed: 28,
      category: '地下鉄'
    });
    
    // Tozai Line
    mobilityData.routes.push({
      id: 'tozai-line',
      name: '東西線: 中野 - 西船橋',
      type: 'subway',
      points: [[139.6644, 35.7056], [139.6850, 35.7010], [139.7300, 35.6860], [139.7840, 35.6950], [139.8200, 35.7000]],
      congestion: 0.85,
      flow_speed: 28,
      category: '地下鉄'
    });
    
    // Hibiya Line
    mobilityData.routes.push({
      id: 'hibiya-line',
      name: '日比谷線: 中目黒 - 北千住',
      type: 'subway',
      points: [[139.6989, 35.6470], [139.7080, 35.6580], [139.7314, 35.6627], [139.7540, 35.6760], [139.7706, 35.6990], [139.7974, 35.7492]],
      congestion: 0.78,
      flow_speed: 30,
      category: '地下鉄'
    });
    
    // Major private railways
    mobilityData.routes.push({
      id: 'odakyu-line',
      name: '小田急線: 新宿 - 町田',
      type: 'train',
      points: [[139.7036, 35.6938], [139.6800, 35.6700], [139.6500, 35.6400], [139.4386, 35.5463]],
      congestion: 0.8,
      flow_speed: 35,
      category: '私鉄'
    });
    
    mobilityData.routes.push({
      id: 'keio-line',
      name: '京王線: 新宿 - 調布',
      type: 'train',
      points: [[139.7036, 35.6938], [139.6700, 35.6800], [139.6200, 35.6600], [139.5439, 35.6517]],
      congestion: 0.75,
      flow_speed: 35,
      category: '私鉄'
    });
    
    mobilityData.routes.push({
      id: 'tokyu-toyoko',
      name: '東急東横線: 渋谷 - 横浜',
      type: 'train',
      points: [[139.7019, 35.6580], [139.6989, 35.6470], [139.6864, 35.6283], [139.6222, 35.4660]],
      congestion: 0.82,
      flow_speed: 35,
      category: '私鉄'
    });
    
    // Major highways within Tokyo
    mobilityData.routes.push({
      id: 'shuto-c1',
      name: '首都高速都心環状線',
      type: 'highway',
      points: [[139.7540, 35.6812], [139.7590, 35.6665], [139.7314, 35.6627], [139.7019, 35.6580], [139.7300, 35.6860], [139.7540, 35.6812]],
      congestion: 0.85,
      flow_speed: 40,
      category: '高速道路'
    });
    
    mobilityData.routes.push({
      id: 'shuto-3',
      name: '首都高速3号渋谷線',
      type: 'highway',
      points: [[139.7019, 35.6580], [139.6700, 35.6400], [139.6200, 35.6100]],
      congestion: 0.8,
      flow_speed: 50,
      category: '高速道路'
    });
    
  } else if (prefectureData.bounds && prefectureData.bounds.center && prefectureData.bounds.center[0] === 135.4959) { // Osaka
    // Osaka Loop Line - Complete circle
    const loopStations = [
      { name: '大阪', coord: [135.4959, 34.7028] },
      { name: '福島', coord: [135.4846, 34.6977] },
      { name: '野田', coord: [135.4720, 34.6940] },
      { name: '西九条', coord: [135.4661, 34.6833] },
      { name: '弁天町', coord: [135.4614, 34.6687] },
      { name: '大正', coord: [135.4757, 34.6542] },
      { name: '芦原橋', coord: [135.4936, 34.6515] },
      { name: '今宮', coord: [135.5016, 34.6508] },
      { name: '新今宮', coord: [135.5063, 34.6525] },
      { name: '天王寺', coord: [135.5189, 34.6466] },
      { name: '寺田町', coord: [135.5188, 34.6570] },
      { name: '桃谷', coord: [135.5180, 34.6650] },
      { name: '鶴橋', coord: [135.5247, 34.6679] },
      { name: '玉造', coord: [135.5283, 34.6737] },
      { name: '森ノ宮', coord: [135.5315, 34.6820] },
      { name: '大阪城公園', coord: [135.5285, 34.6875] },
      { name: '京橋', coord: [135.5339, 34.6968] },
      { name: '桜ノ宮', coord: [135.5298, 34.7020] },
      { name: '天満', coord: [135.5188, 34.7054] }
    ];
    
    for (let i = 0; i < loopStations.length; i++) {
      const next = (i + 1) % loopStations.length;
      mobilityData.routes.push({
        id: `osaka-loop-${i}`,
        name: `大阪環状線: ${loopStations[i].name} - ${loopStations[next].name}`,
        type: 'train',
        points: [loopStations[i].coord, loopStations[next].coord],
        congestion: 0.65 + Math.random() * 0.25,
        flow_speed: 35,
        category: 'JR線'
      });
    }
    
    // JR Tokaido/Sanyo Line
    const tokaidoStations = [
      { name: '新大阪', coord: [135.5008, 34.7338] },
      { name: '大阪', coord: [135.4959, 34.7028] },
      { name: '塚本', coord: [135.4803, 34.7133] },
      { name: '尼崎', coord: [135.4234, 34.7210] },
      { name: '甲子園口', coord: [135.3717, 34.7247] },
      { name: '西宮', coord: [135.3426, 34.7375] },
      { name: '芦屋', coord: [135.3047, 34.7286] },
      { name: '甲南山手', coord: [135.2731, 34.7243] },
      { name: '摂津本山', coord: [135.2639, 34.7238] },
      { name: '住吉', coord: [135.2427, 34.7216] },
      { name: '六甲道', coord: [135.2378, 34.7172] },
      { name: '灘', coord: [135.2137, 34.7138] },
      { name: '三ノ宮', coord: [135.1955, 34.6947] }
    ];
    
    for (let i = 0; i < tokaidoStations.length - 1; i++) {
      mobilityData.routes.push({
        id: `tokaido-${i}`,
        name: `東海道本線: ${tokaidoStations[i].name} - ${tokaidoStations[i + 1].name}`,
        type: 'train',
        points: [tokaidoStations[i].coord, tokaidoStations[i + 1].coord],
        congestion: 0.7 + Math.random() * 0.2,
        flow_speed: 45,
        category: 'JR線'
      });
    }
    
    // Osaka Metro Midosuji Line
    const midosujiStations = [
      { name: '江坂', coord: [135.4977, 34.7595] },
      { name: '東三国', coord: [135.5008, 34.7455] },
      { name: '新大阪', coord: [135.5008, 34.7338] },
      { name: '西中島南方', coord: [135.4993, 34.7208] },
      { name: '中津', coord: [135.4975, 34.7089] },
      { name: '梅田', coord: [135.4959, 34.7028] },
      { name: '淀屋橋', coord: [135.4986, 34.6926] },
      { name: '本町', coord: [135.4986, 34.6826] },
      { name: '心斎橋', coord: [135.5014, 34.6731] },
      { name: '難波', coord: [135.5027, 34.6627] },
      { name: '大国町', coord: [135.4992, 34.6515] },
      { name: '動物園前', coord: [135.5034, 34.6486] },
      { name: '天王寺', coord: [135.5189, 34.6466] },
      { name: '昭和町', coord: [135.5192, 34.6378] },
      { name: '西田辺', coord: [135.5195, 34.6290] },
      { name: '長居', coord: [135.5188, 34.6111] },
      { name: 'あびこ', coord: [135.5166, 34.6033] },
      { name: '北花田', coord: [135.5195, 34.5863] },
      { name: '新金岡', coord: [135.5194, 34.5700] },
      { name: '中百舌鳥', coord: [135.5198, 34.5536] }
    ];
    
    for (let i = 0; i < midosujiStations.length - 1; i++) {
      mobilityData.routes.push({
        id: `midosuji-${i}`,
        name: `御堂筋線: ${midosujiStations[i].name} - ${midosujiStations[i + 1].name}`,
        type: 'subway',
        points: [midosujiStations[i].coord, midosujiStations[i + 1].coord],
        congestion: 0.85,
        flow_speed: 30,
        category: '地下鉄'
      });
    }
    
    // Osaka Metro Yotsubashi Line
    const yotsubashiStations = [
      { name: '西梅田', coord: [135.4945, 34.6998] },
      { name: '肥後橋', coord: [135.4957, 34.6899] },
      { name: '本町', coord: [135.4986, 34.6826] },
      { name: '四ツ橋', coord: [135.4971, 34.6763] },
      { name: '難波', coord: [135.5003, 34.6642] },
      { name: '大国町', coord: [135.4992, 34.6515] },
      { name: '花園町', coord: [135.4988, 34.6413] },
      { name: '岸里', coord: [135.4990, 34.6342] },
      { name: '玉出', coord: [135.4993, 34.6260] },
      { name: '北加賀屋', coord: [135.4798, 34.6160] },
      { name: '住之江公園', coord: [135.4796, 34.6090] }
    ];
    
    for (let i = 0; i < yotsubashiStations.length - 1; i++) {
      mobilityData.routes.push({
        id: `yotsubashi-${i}`,
        name: `四つ橋線: ${yotsubashiStations[i].name} - ${yotsubashiStations[i + 1].name}`,
        type: 'subway',
        points: [yotsubashiStations[i].coord, yotsubashiStations[i + 1].coord],
        congestion: 0.7,
        flow_speed: 28,
        category: '地下鉄'
      });
    }
    
    // Osaka Metro Chuo Line
    mobilityData.routes.push({
      id: 'chuo-line-osaka',
      name: '中央線: コスモスクエア - 生駒',
      type: 'subway',
      points: [[135.4180, 34.6380], [135.4660, 34.6833], [135.4986, 34.6826], [135.5315, 34.6820], [135.5765, 34.6901]],
      congestion: 0.72,
      flow_speed: 35,
      category: '地下鉄'
    });
    
    // Hanshin Main Line
    mobilityData.routes.push({
      id: 'hanshin-main',
      name: '阪神本線: 梅田 - 三宮',
      type: 'train',
      points: [[135.4959, 34.7028], [135.4846, 34.6977], [135.4660, 34.6833], [135.4234, 34.7210], [135.3426, 34.7375], [135.1955, 34.6947]],
      congestion: 0.75,
      flow_speed: 35,
      category: '私鉄'
    });
    
    // Hankyu Kobe Line
    mobilityData.routes.push({
      id: 'hankyu-kobe',
      name: '阪急神戸線: 梅田 - 三宮',
      type: 'train',
      points: [[135.4959, 34.7028], [135.4520, 34.7160], [135.3830, 34.7340], [135.3426, 34.7375], [135.1955, 34.6947]],
      congestion: 0.78,
      flow_speed: 35,
      category: '私鉄'
    });
    
    // Keihan Main Line
    mobilityData.routes.push({
      id: 'keihan-main',
      name: '京阪本線: 淀屋橋 - 出町柳',
      type: 'train',
      points: [[135.4986, 34.6926], [135.5339, 34.6968], [135.5520, 34.7100], [135.6830, 34.8830], [135.7720, 35.0304]],
      congestion: 0.72,
      flow_speed: 35,
      category: '私鉄'
    });
    
    // Major highways
    mobilityData.routes.push({
      id: 'hanshin-exp',
      name: '阪神高速1号環状線',
      type: 'highway',
      points: [[135.4959, 34.7028], [135.5027, 34.6627], [135.4661, 34.6833], [135.4959, 34.7028]],
      congestion: 0.82,
      flow_speed: 45,
      category: '高速道路'
    });
    
  } else if (prefectureData.bounds && prefectureData.bounds.center && prefectureData.bounds.center[0] === 130.4017) { // Fukuoka
    // Fukuoka Airport Line (Kuko Line) - detailed stations
    const kukoStations = [
      { name: '姪浜', coord: [130.3235, 33.5851] },
      { name: '室見', coord: [130.3373, 33.5840] },
      { name: '藤崎', coord: [130.3508, 33.5817] },
      { name: '西新', coord: [130.3590, 33.5790] },
      { name: '唐人町', coord: [130.3695, 33.5871] },
      { name: '大濠公園', coord: [130.3780, 33.5850] },
      { name: '赤坂', coord: [130.3890, 33.5865] },
      { name: '天神', coord: [130.4017, 33.5904] },
      { name: '中洲川端', coord: [130.4059, 33.5943] },
      { name: '祗園', coord: [130.4110, 33.5925] },
      { name: '博多', coord: [130.4205, 33.5897] },
      { name: '東比恵', coord: [130.4347, 33.5855] },
      { name: '福岡空港', coord: [130.4510, 33.5859] }
    ];
    
    for (let i = 0; i < kukoStations.length - 1; i++) {
      mobilityData.routes.push({
        id: `kuko-${i}`,
        name: `空港線: ${kukoStations[i].name} - ${kukoStations[i + 1].name}`,
        type: 'subway',
        points: [kukoStations[i].coord, kukoStations[i + 1].coord],
        congestion: 0.7 + Math.random() * 0.2,
        flow_speed: 35,
        category: '地下鉄'
      });
    }
    
    // Hakozaki Line - detailed stations
    const hakozakiStations = [
      { name: '中洲川端', coord: [130.4059, 33.5943] },
      { name: '呉服町', coord: [130.4101, 33.5989] },
      { name: '千代県庁口', coord: [130.4140, 33.6060] },
      { name: '馬出九大病院前', coord: [130.4180, 33.6110] },
      { name: '箱崎宮前', coord: [130.4222, 33.6133] },
      { name: '箱崎九大前', coord: [130.4240, 33.6150] },
      { name: '貝塚', coord: [130.4252, 33.6170] }
    ];
    
    for (let i = 0; i < hakozakiStations.length - 1; i++) {
      mobilityData.routes.push({
        id: `hakozaki-${i}`,
        name: `箱崎線: ${hakozakiStations[i].name} - ${hakozakiStations[i + 1].name}`,
        type: 'subway',
        points: [hakozakiStations[i].coord, hakozakiStations[i + 1].coord],
        congestion: 0.6 + Math.random() * 0.2,
        flow_speed: 30,
        category: '地下鉄'
      });
    }
    
    // Nanakuma Line - detailed stations
    const nanakumaStations = [
      { name: '天神南', coord: [130.3999, 33.5874] },
      { name: '渡辺通', coord: [130.4016, 33.5815] },
      { name: '薬院', coord: [130.3956, 33.5788] },
      { name: '薬院大通', coord: [130.3922, 33.5750] },
      { name: '桜坂', coord: [130.3880, 33.5700] },
      { name: '六本松', coord: [130.3810, 33.5680] },
      { name: '別府', coord: [130.3720, 33.5730] },
      { name: '茶山', coord: [130.3640, 33.5760] },
      { name: '金山', coord: [130.3560, 33.5780] },
      { name: '七隈', coord: [130.3480, 33.5790] },
      { name: '福大前', coord: [130.3390, 33.5800] },
      { name: '梅林', coord: [130.3310, 33.5810] },
      { name: '野芥', coord: [130.3230, 33.5820] },
      { name: '賀茂', coord: [130.3150, 33.5830] },
      { name: '次郎丸', coord: [130.3070, 33.5840] },
      { name: '橋本', coord: [130.2990, 33.5850] }
    ];
    
    for (let i = 0; i < nanakumaStations.length - 1; i++) {
      mobilityData.routes.push({
        id: `nanakuma-${i}`,
        name: `七隈線: ${nanakumaStations[i].name} - ${nanakumaStations[i + 1].name}`,
        type: 'subway',
        points: [nanakumaStations[i].coord, nanakumaStations[i + 1].coord],
        congestion: 0.65 + Math.random() * 0.2,
        flow_speed: 32,
        category: '地下鉄'
      });
    }
    
    // JR Kagoshima Main Line
    const kagoshimaStations = [
      { name: '博多', coord: [130.4205, 33.5897] },
      { name: '吉塚', coord: [130.4300, 33.6005] },
      { name: '箱崎', coord: [130.4252, 33.6170] },
      { name: '千早', coord: [130.4446, 33.6596] },
      { name: '香椎', coord: [130.4446, 33.6596] },
      { name: '九産大前', coord: [130.4450, 33.6780] },
      { name: '福工大前', coord: [130.4460, 33.6890] },
      { name: '新宮中央', coord: [130.4470, 33.7100] }
    ];
    
    for (let i = 0; i < kagoshimaStations.length - 1; i++) {
      mobilityData.routes.push({
        id: `kagoshima-${i}`,
        name: `鹿児島本線: ${kagoshimaStations[i].name} - ${kagoshimaStations[i + 1].name}`,
        type: 'train',
        points: [kagoshimaStations[i].coord, kagoshimaStations[i + 1].coord],
        congestion: 0.7 + Math.random() * 0.2,
        flow_speed: 40,
        category: 'JR線'
      });
    }
    
    // Nishitetsu Tenjin Omuta Line
    const nishitetsuStations = [
      { name: '西鉄福岡（天神）', coord: [130.4017, 33.5904] },
      { name: '薬院', coord: [130.3956, 33.5788] },
      { name: '西鉄平尾', coord: [130.3890, 33.5700] },
      { name: '高宮', coord: [130.3850, 33.5600] },
      { name: '大橋', coord: [130.3800, 33.5520] },
      { name: '井尻', coord: [130.3750, 33.5450] },
      { name: '雑餉隈', coord: [130.3700, 33.5380] },
      { name: '春日原', coord: [130.3650, 33.5310] },
      { name: '白木原', coord: [130.3600, 33.5240] },
      { name: '下大利', coord: [130.3550, 33.5170] },
      { name: '都府楼前', coord: [130.3500, 33.5100] },
      { name: '西鉄二日市', coord: [130.3450, 33.5030] }
    ];
    
    for (let i = 0; i < nishitetsuStations.length - 1; i++) {
      mobilityData.routes.push({
        id: `nishitetsu-${i}`,
        name: `西鉄天神大牟田線: ${nishitetsuStations[i].name} - ${nishitetsuStations[i + 1].name}`,
        type: 'train',
        points: [nishitetsuStations[i].coord, nishitetsuStations[i + 1].coord],
        congestion: 0.72 + Math.random() * 0.2,
        flow_speed: 35,
        category: '私鉄'
      });
    }
    
    // Major highways
    mobilityData.routes.push({
      id: 'fukuoka-exp-1',
      name: '福岡都市高速1号線',
      type: 'highway',
      points: [[130.3235, 33.5851], [130.3590, 33.5790], [130.4017, 33.5904], [130.4205, 33.5897], [130.4510, 33.5859]],
      congestion: 0.78,
      flow_speed: 50,
      category: '高速道路'
    });
    
    mobilityData.routes.push({
      id: 'fukuoka-exp-circular',
      name: '福岡都市高速環状線',
      type: 'highway',
      points: [[130.4017, 33.5904], [130.4205, 33.5897], [130.4252, 33.6170], [130.3800, 33.6200], [130.3590, 33.5790], [130.4017, 33.5904]],
      congestion: 0.8,
      flow_speed: 45,
      category: '高速道路'
    });
    
    // Add major bus routes
    mobilityData.routes.push({
      id: 'bus-100',
      name: '西鉄バス100番系統: 博多駅 - 天神',
      type: 'bus',
      points: [[130.4205, 33.5897], [130.4111, 33.5899], [130.4017, 33.5904]],
      congestion: 0.75,
      flow_speed: 20,
      category: 'バス'
    });
  }
  
  // Generate highway routes between major areas
  if (prefectureData.cities) {
    const cities = Object.values(prefectureData.cities);
    for (let i = 0; i < cities.length - 1; i++) {
    for (let j = i + 1; j < cities.length; j++) {
      const congestionLevel = 0.5 + Math.random() * 0.4;
      mobilityData.routes.push({
        id: `highway-${cities[i].nameEn}-${cities[j].nameEn}`,
        name: `高速道路: ${cities[i].name} - ${cities[j].name}`,
        type: 'highway',
        points: [cities[i].center, cities[j].center],
        congestion: congestionLevel,
        flow_speed: 60 - (congestionLevel * 30),
        category: '高速道路'
      });
    }
  }
  
  // Add congestion points
  if (cities && cities.length > 0) {
    cities.forEach(city => {
    mobilityData.congestionPoints.push({
      coordinates: city.center,
      level: 0.6 + Math.random() * 0.3,
      radius: city.population > 200000 ? 0.015 : 0.008,
      type: 'station',
      name: `${city.name}駅周辺`
    });
    
    if (city.commercialAreas && Array.isArray(city.commercialAreas)) {
      city.commercialAreas.forEach(area => {
        mobilityData.congestionPoints.push({
          coordinates: [
            city.center[0] + (Math.random() - 0.5) * 0.01,
            city.center[1] + (Math.random() - 0.5) * 0.01
          ],
          level: 0.5 + Math.random() * 0.35,
          radius: 0.005,
          type: 'commercial',
          name: area
        });
      });
    }
  });
  }
  }
  
  // Convert mobility data to the format expected by MapWithRealData
  // Add sanitized properties to ensure all required fields exist
  const particlesData = mobilityData.congestionPoints.map((point, idx) => ({
    coordinates: point.coordinates,
    id: `particle-${idx}`,
    size: 5 + point.level * 10,
    color: point.level > 0.7 ? '#FF6B6B' : point.level > 0.5 ? '#FFA726' : '#66BB6A',
    speed: 0.5 + point.level * 0.5,
    glowRadius: 15,
    glowColor: point.level > 0.7 ? '#FF6B6B' : point.level > 0.5 ? '#FFA726' : '#66BB6A',
    glowOpacityOuter: 0.3,
    glowOpacityMiddle: 0.5,
    coreColor: '#FFFFFF',
    coreOpacity: 1,
    type: 'congestion',
    radius: 10,
    ...point
  }));

  const flowsData = mobilityData.routes.map((route, idx) => ({
    coordinates: route.points,
    id: route.id || `flow-${idx}`,
    color: route.congestion > 0.8 ? '#FF5252' : route.congestion > 0.6 ? '#FFA726' : '#66BB6A',
    width: 2 + route.congestion * 3,
    showGlowingArc: route.congestion > 0.5,
    currentOpacity: 1,
    opacity: 1,
    distanceKm: route.distanceKm || 10,
    congestion: route.congestion || 0,
    ...route
  }));

  // Use validated GeoJSON conversion
  return {
    particles: toGeoJSON(particlesData, 'Point', [
      'size', 'glowRadius', 'glowColor', 'glowOpacityOuter', 
      'glowOpacityMiddle', 'coreColor', 'coreOpacity', 'radius', 'type'
    ]),
    flows: toGeoJSON(flowsData, 'LineString', [
      'showGlowingArc', 'currentOpacity', 'distanceKm', 'congestion', 'opacity'
    ])
  };
}

// Generate event data for a prefecture
function generateEventForPrefecture(prefectureData) {
  const events = [];
  
  if (!prefectureData || !prefectureData.events) {
    console.warn('generateEventForPrefecture: Prefecture data missing events property');
    return events;
  }
  
  prefectureData.events.forEach((event, idx) => {
    const city = Object.values(prefectureData.cities).find(c => 
      Math.abs(c.center[0] - event.coordinates[0]) < 0.1 && 
      Math.abs(c.center[1] - event.coordinates[1]) < 0.1
    );
    
    const attendance = event.category === '花火' ? 50000 + Math.random() * 150000 :
                      event.category === '祭り' ? 30000 + Math.random() * 100000 :
                      event.category === 'スポーツ' ? 20000 + Math.random() * 50000 :
                      10000 + Math.random() * 30000;
    
    const impactRadius = attendance > 100000 ? 60 :
                        attendance > 50000 ? 45 :
                        attendance > 20000 ? 30 : 20;
    
    // 今日から前後30日のランダムな日付を生成
    const dateOffset = Math.floor(Math.random() * 60) - 30;
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + dateOffset);
    
    events.push({
      id: `event-${idx}`,
      coordinates: event.coordinates,
      name: event.name,
      category: event.category,
      icon: event.icon,
      impact_radius: impactRadius,
      expected_attendance: Math.floor(attendance),
      city: city ? city.name : '不明',
      venue_type: event.category,
      date: eventDate.toISOString(),
      expected_attendees: Math.floor(attendance),
      expectedVisitors: Math.floor(attendance),
      attendees: Math.floor(attendance)
    });
  });
  
  return events;
}

// Generate SNS heatmap data for a prefecture
function generateSNSHeatmapForPrefecture(prefectureData) {
  const heatmapPoints = [];
  const categories = ['観光', 'グルメ', 'ショッピング', 'イベント', '交通'];
  
  if (!validatePrefectureData(prefectureData, 'generateSNSHeatmapForPrefecture')) {
    return heatmapPoints;
  }
  
  Object.values(prefectureData.cities).forEach(city => {
    if (!city.districts || !Array.isArray(city.districts)) {
      console.warn('generateSNSHeatmapForPrefecture: City missing districts array:', city.name);
      return;
    }
    city.districts.forEach(district => {
      const pointCount = Math.floor((district.population / 20000) * 2);
      const points = generatePointsAroundCenter(district.center, pointCount, 0.005);
      
      points.forEach(coord => {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const baseIntensity = district.population / city.population;
        const intensity = baseIntensity * (0.6 + Math.random() * 0.4);
        const sentiment = 0.5 + Math.random() * 0.45;
        
        heatmapPoints.push({
          coordinates: coord,
          intensity: intensity,
          sentiment: sentiment,
          category: category,
          city: city.name,
          district: district.name
        });
      });
    });
    
    // Extra activity around tourist spots
    if (city.touristSpots && Array.isArray(city.touristSpots)) {
      city.touristSpots.forEach(spot => {
      const touristPoints = generatePointsAroundCenter(city.center, 8, 0.003);
      touristPoints.forEach(coord => {
        heatmapPoints.push({
          coordinates: coord,
          intensity: 0.8 + Math.random() * 0.2,
          sentiment: 0.8 + Math.random() * 0.2,
          category: '観光',
          city: city.name,
          nearSpot: spot
        });
      });
    });
    }
  });
  
  return heatmapPoints;
}

// Generate statistics from SNS heatmap data
export function generateStatisticsFromHeatmap(heatmapData, selectedCategories = []) {
  const statistics = {
    total_points: 0,
    sentiment_distribution: {
      positive: 0,
      neutral: 0,
      negative: 0
    },
    category_breakdown: []
  };

  // If heatmapData is a GeoJSON FeatureCollection, extract features
  const dataPoints = heatmapData.features ? heatmapData.features : heatmapData;
  
  // Filter by selected categories
  const filteredPoints = selectedCategories.length > 0 
    ? dataPoints.filter(point => {
        const category = point.properties?.category || point.category;
        return selectedCategories.includes(category);
      })
    : dataPoints;

  statistics.total_points = filteredPoints.length;

  // Calculate sentiment distribution
  const categoryStats = {};
  
  filteredPoints.forEach(point => {
    const sentiment = point.properties?.sentiment || point.sentiment || 0.5;
    const category = point.properties?.category || point.category || '不明';
    
    // Sentiment distribution
    if (sentiment >= 0.7) {
      statistics.sentiment_distribution.positive++;
    } else if (sentiment >= 0.4) {
      statistics.sentiment_distribution.neutral++;
    } else {
      statistics.sentiment_distribution.negative++;
    }
    
    // Category breakdown
    if (!categoryStats[category]) {
      categoryStats[category] = {
        category: category,
        point_count: 0,
        total_sentiment: 0,
        avg_sentiment: 0
      };
    }
    categoryStats[category].point_count++;
    categoryStats[category].total_sentiment += sentiment;
  });

  // Calculate averages and percentages
  Object.values(categoryStats).forEach(catStat => {
    catStat.avg_sentiment = catStat.total_sentiment / catStat.point_count;
    catStat.percentage = (catStat.point_count / statistics.total_points) * 100;
  });

  statistics.category_breakdown = Object.values(categoryStats)
    .sort((a, b) => b.point_count - a.point_count);

  return statistics;
}

// Main function to generate data for all prefectures
export function generateAllPrefectureData(prefectureName = '広島県') {
  switch (prefectureName) {
    case '広島県': {
      const hiroshimaData = generateHiroshimaData();
      const heatmapGeoJSON = toGeoJSON(hiroshimaData.heatmap, 'Point', ['intensity', 'category', 'sentiment']);
      return {
        accommodation: toGeoJSON(hiroshimaData.accommodation, 'Point', ['height', 'occupancy_rate', 'avg_price']),
        hotels: toGeoJSON(hiroshimaData.accommodation, 'Point', ['height', 'occupancy_rate', 'avg_price']), // Alias for compatibility
        consumption: toGeoJSON(hiroshimaData.consumption, 'Point', ['radius', 'amount', 'total_amount', 'height']),
        mobility: hiroshimaData.mobility, // Already in GeoJSON format from generateMobilityFlowsGeoJSON
        landmarks: toGeoJSON(hiroshimaData.landmarks, 'Point', ['height', 'color', 'name']),
        events: toGeoJSON(hiroshimaData.events, 'Point', ['radius', 'color']),
        eventData: toGeoJSON(hiroshimaData.events, 'Point', ['radius', 'color']), // Alias for compatibility
        heatmap: heatmapGeoJSON,
        bounds: hiroshimaData.bounds,
        statistics: generateStatisticsFromHeatmap(heatmapGeoJSON)
      };
    }
      
    case '東京都': {
      const tokyoLandmarks = TOKYO_DATA.landmarks.map((l, idx) => ({
        id: `tokyo-landmark-${idx}`,
        ...l,
        city: '東京都',
        visitor_count: Math.floor(50000 + Math.random() * 200000),
        category: l.height > 300 ? '超高層建築' : l.height > 100 ? '高層建築' : '建築物'
      }));
      
      const heatmapGeoJSON = toGeoJSON(generateSNSHeatmapForPrefecture(TOKYO_DATA), 'Point', ['intensity', 'category', 'sentiment']);
      return {
        accommodation: toGeoJSON(generateAccommodationForPrefecture(TOKYO_DATA), 'Point', ['height', 'occupancy_rate', 'avg_price']),
        hotels: toGeoJSON(generateAccommodationForPrefecture(TOKYO_DATA), 'Point', ['height', 'occupancy_rate', 'avg_price']), // Alias for compatibility
        consumption: toGeoJSON(generateConsumptionForPrefecture(TOKYO_DATA), 'Point', ['radius', 'amount', 'total_amount', 'height']),
        mobility: generateMobilityForPrefecture(TOKYO_DATA), // Already returns correct format
        landmarks: toGeoJSON(tokyoLandmarks, 'Point', ['height', 'color', 'name']),
        events: toGeoJSON(generateEventForPrefecture(TOKYO_DATA), 'Point', ['radius', 'color']),
        eventData: toGeoJSON(generateEventForPrefecture(TOKYO_DATA), 'Point', ['radius', 'color']), // Alias for compatibility
        heatmap: heatmapGeoJSON,
        bounds: TOKYO_DATA.bounds,
        statistics: generateStatisticsFromHeatmap(heatmapGeoJSON)
      };
    }
    
    case '大阪府': {
      const osakaLandmarks = OSAKA_DATA.landmarks.map((l, idx) => ({
        id: `osaka-landmark-${idx}`,
        ...l,
        city: '大阪府',
        visitor_count: Math.floor(30000 + Math.random() * 150000),
        category: l.height > 200 ? '超高層建築' : l.height > 100 ? '高層建築' : '建築物'
      }));
      
      const heatmapGeoJSON = toGeoJSON(generateSNSHeatmapForPrefecture(OSAKA_DATA), 'Point', ['intensity', 'category', 'sentiment']);
      return {
        accommodation: toGeoJSON(generateAccommodationForPrefecture(OSAKA_DATA), 'Point', ['height', 'occupancy_rate', 'avg_price']),
        hotels: toGeoJSON(generateAccommodationForPrefecture(OSAKA_DATA), 'Point', ['height', 'occupancy_rate', 'avg_price']), // Alias for compatibility
        consumption: toGeoJSON(generateConsumptionForPrefecture(OSAKA_DATA), 'Point', ['radius', 'amount', 'total_amount', 'height']),
        mobility: generateMobilityForPrefecture(OSAKA_DATA), // Already returns correct format
        landmarks: toGeoJSON(osakaLandmarks, 'Point', ['height', 'color', 'name']),
        events: toGeoJSON(generateEventForPrefecture(OSAKA_DATA), 'Point', ['radius', 'color']),
        eventData: toGeoJSON(generateEventForPrefecture(OSAKA_DATA), 'Point', ['radius', 'color']), // Alias for compatibility
        heatmap: heatmapGeoJSON,
        bounds: OSAKA_DATA.bounds,
        statistics: generateStatisticsFromHeatmap(heatmapGeoJSON)
      };
    }
    
    case '福岡県': {
      const fukuokaLandmarks = FUKUOKA_DATA.landmarks.map((l, idx) => ({
        id: `fukuoka-landmark-${idx}`,
        ...l,
        city: '福岡県',
        visitor_count: Math.floor(20000 + Math.random() * 100000),
        category: l.height > 200 ? '超高層建築' : l.height > 100 ? '高層建築' : '建築物'
      }));
      
      const heatmapGeoJSON = toGeoJSON(generateSNSHeatmapForPrefecture(FUKUOKA_DATA), 'Point', ['intensity', 'category', 'sentiment']);
      return {
        accommodation: toGeoJSON(generateAccommodationForPrefecture(FUKUOKA_DATA), 'Point', ['height', 'occupancy_rate', 'avg_price']),
        hotels: toGeoJSON(generateAccommodationForPrefecture(FUKUOKA_DATA), 'Point', ['height', 'occupancy_rate', 'avg_price']), // Alias for compatibility
        consumption: toGeoJSON(generateConsumptionForPrefecture(FUKUOKA_DATA), 'Point', ['radius', 'amount', 'total_amount', 'height']),
        mobility: generateMobilityForPrefecture(FUKUOKA_DATA), // Already returns correct format
        landmarks: toGeoJSON(fukuokaLandmarks, 'Point', ['height', 'color', 'name']),
        events: toGeoJSON(generateEventForPrefecture(FUKUOKA_DATA), 'Point', ['radius', 'color']),
        eventData: toGeoJSON(generateEventForPrefecture(FUKUOKA_DATA), 'Point', ['radius', 'color']), // Alias for compatibility
        heatmap: heatmapGeoJSON,
        bounds: FUKUOKA_DATA.bounds,
        statistics: generateStatisticsFromHeatmap(heatmapGeoJSON)
      };
    }
    
    case '山口県': {
      // 山口県データ
      const yamaguchiData = {
        bounds: { 
          north: 34.6, 
          south: 33.7, 
          east: 132.2, 
          west: 130.8,
          center: [131.4705, 34.1858],  // Yamaguchi City center
          defaultZoom: 9.5
        },
        cities: {
          yamaguchi: { 
            name: '山口市', 
            nameEn: 'Yamaguchi',
            center: [131.4705, 34.1858], 
            population: 196000,
            districts: [
              { name: '小郡', center: [131.3950, 34.1560], population: 35000 },
              { name: '山口', center: [131.4705, 34.1858], population: 45000 },
              { name: '湯田', center: [131.4550, 34.1650], population: 25000 },
              { name: '大内', center: [131.4000, 34.1700], population: 30000 }
            ],
            touristSpots: ['瑠璃光寺', '山口県立美術館', '湯田温泉', '常栄寺雪舟庭', 'サビエル記念聖堂'],
            commercialAreas: ['山口駅前', '湯田温泉街', '小郡駅前']
          },
          shimonoseki: { 
            name: '下関市', 
            nameEn: 'Shimonoseki',
            center: [130.9400, 33.9570], 
            population: 259000,
            districts: [
              { name: '下関', center: [130.9400, 33.9570], population: 60000 },
              { name: '長府', center: [130.9800, 33.9900], population: 45000 },
              { name: '唐戸', center: [130.9450, 33.9550], population: 35000 },
              { name: '彦島', center: [130.9000, 33.9300], population: 30000 }
            ],
            touristSpots: ['関門橋', '唐戸市場', '海響館', '赤間神宮', '巌流島', '角島大橋'],
            commercialAreas: ['下関駅前', '唐戸', 'シーモール下関']
          },
          ube: { 
            name: '宇部市', 
            nameEn: 'Ube',
            center: [131.2465, 33.9430], 
            population: 166000,
            districts: [
              { name: '宇部', center: [131.2465, 33.9430], population: 50000 },
              { name: '東岐波', center: [131.2800, 33.9600], population: 35000 },
              { name: '西岐波', center: [131.2200, 33.9300], population: 30000 }
            ],
            touristSpots: ['ときわ公園', '宇部市立彫刻美術館', 'ときわ動物園'],
            commercialAreas: ['宇部新川駅前', '宇部駅前']
          },
          iwakuni: {
            name: '岩国市',
            nameEn: 'Iwakuni',
            center: [132.2200, 34.1667],
            population: 133000,
            districts: [
              { name: '岩国', center: [132.2200, 34.1667], population: 40000 },
              { name: '錦帯橋', center: [132.1800, 34.1667], population: 20000 },
              { name: '南岩国', center: [132.2300, 34.1300], population: 25000 }
            ],
            touristSpots: ['錦帯橋', '岩国城', '吉香公園', '白蛇観覧所', '岩国美術館'],
            commercialAreas: ['岩国駅前', '錦帯橋周辺']
          },
          hagi: {
            name: '萩市',
            nameEn: 'Hagi',
            center: [131.3993, 34.4083],
            population: 46000,
            districts: [
              { name: '萩', center: [131.3993, 34.4083], population: 25000 },
              { name: '椿', center: [131.3700, 34.4200], population: 10000 }
            ],
            touristSpots: ['萩城跡', '松下村塾', '東光寺', '大照院', '萩博物館', '菊屋横町'],
            commercialAreas: ['萩駅前', '萩城下町']
          },
          shunan: {
            name: '周南市',
            nameEn: 'Shunan',
            center: [131.8058, 34.0556],
            population: 142000,
            districts: [
              { name: '徳山', center: [131.8058, 34.0556], population: 60000 },
              { name: '新南陽', center: [131.7500, 34.0300], population: 40000 }
            ],
            touristSpots: ['周南市美術博物館', '徳山動物園', '大津島'],
            commercialAreas: ['徳山駅前', '新南陽駅前']
          }
        },
        landmarks: [
          { name: '錦帯橋', coordinates: [132.1800, 34.1667], category: '観光地', height: 20, color: '#FFD700' },
          { name: '秋吉台', coordinates: [131.3033, 34.2347], category: '自然', height: 30, color: '#90EE90' },
          { name: '萩城跡', coordinates: [131.3993, 34.4167], category: '史跡', height: 25, color: '#DDA0DD' },
          { name: '角島大橋', coordinates: [130.8900, 34.3567], category: '観光地', height: 35, color: '#87CEEB' },
          { name: '関門橋', coordinates: [130.9586, 33.9608], category: '建造物', height: 40, color: '#4682B4' },
          { name: '瑠璃光寺五重塔', coordinates: [131.4749, 34.1903], category: '史跡', height: 30, color: '#CD853F' },
          { name: '秋芳洞', coordinates: [131.3033, 34.2300], category: '自然', height: 25, color: '#2F4F4F' },
          { name: '元乃隅神社', coordinates: [130.9142, 34.4258], category: '神社', height: 20, color: '#DC143C' }
        ],
        events: [
          { name: '山口七夕ちょうちんまつり', coordinates: [131.4705, 34.1858], category: '祭り', icon: '🏮' },
          { name: '錦帯橋まつり', coordinates: [132.1800, 34.1667], category: '祭り', icon: '🎊' },
          { name: '萩時代まつり', coordinates: [131.3993, 34.4083], category: '祭り', icon: '🎭' },
          { name: '下関海峡まつり', coordinates: [130.9400, 33.9570], category: '祭り', icon: '⛩️' },
          { name: '防府天満宮御神幸祭', coordinates: [131.5667, 34.0514], category: '祭り', icon: '🎊' },
          { name: '岩国港みなと祭花火大会', coordinates: [132.2200, 34.1667], category: '花火', icon: '🎆' },
          { name: '宇部まつり', coordinates: [131.2465, 33.9430], category: '祭り', icon: '🎪' },
          { name: '周南冬のツリーまつり', coordinates: [131.8058, 34.0556], category: 'イルミネーション', icon: '✨' }
        ]
      };
      
      const heatmapGeoJSON = toGeoJSON(generateSNSHeatmapForPrefecture(yamaguchiData), 'Point', ['intensity', 'category', 'sentiment']);
      return {
        accommodation: toGeoJSON(generateAccommodationForPrefecture(yamaguchiData), 'Point', ['height', 'occupancy_rate', 'avg_price']),
        hotels: toGeoJSON(generateAccommodationForPrefecture(yamaguchiData), 'Point', ['height', 'occupancy_rate', 'avg_price']), // Alias for compatibility
        consumption: toGeoJSON(generateConsumptionForPrefecture(yamaguchiData), 'Point', ['radius', 'amount', 'total_amount', 'height']),
        mobility: generateMobilityForPrefecture(yamaguchiData), // Already returns correct format
        landmarks: toGeoJSON(yamaguchiData.landmarks.map((l, idx) => ({
          id: `yamaguchi-landmark-${idx}`,
          ...l,
          city: '山口県',
          visitor_count: Math.floor(10000 + Math.random() * 50000)
        })), 'Point', ['height', 'color', 'name']),
        events: toGeoJSON(generateEventForPrefecture(yamaguchiData), 'Point', ['radius', 'color']),
        eventData: toGeoJSON(generateEventForPrefecture(yamaguchiData), 'Point', ['radius', 'color']), // Alias for compatibility
        heatmap: heatmapGeoJSON,
        bounds: yamaguchiData.bounds,
        statistics: generateStatisticsFromHeatmap(heatmapGeoJSON)
      };
    }
    
    default:
      return generateHiroshimaData();
  }
}

// Generate inter-prefecture mobility routes (Shinkansen, highways, etc.)
export function generateInterPrefectureMobilityRoutes() {
  const routes = [];
  
  // Major Shinkansen stations
  const shinkansenStations = {
    tokyo: { name: '東京駅', coordinates: [139.7671, 35.6812], prefecture: '東京都' },
    shinagawa: { name: '品川駅', coordinates: [139.7400, 35.6286], prefecture: '東京都' },
    shin_yokohama: { name: '新横浜駅', coordinates: [139.6177, 35.5073], prefecture: '神奈川県' },
    nagoya: { name: '名古屋駅', coordinates: [136.8816, 35.1709], prefecture: '愛知県' },
    kyoto: { name: '京都駅', coordinates: [135.7581, 34.9859], prefecture: '京都府' },
    shin_osaka: { name: '新大阪駅', coordinates: [135.5008, 34.7338], prefecture: '大阪府' },
    shin_kobe: { name: '新神戸駅', coordinates: [135.1955, 34.7073], prefecture: '兵庫県' },
    okayama: { name: '岡山駅', coordinates: [133.9180, 34.6664], prefecture: '岡山県' },
    hiroshima: { name: '広島駅', coordinates: [132.4757, 34.3972], prefecture: '広島県' },
    kokura: { name: '小倉駅', coordinates: [130.8842, 33.8858], prefecture: '福岡県' },
    hakata: { name: '博多駅', coordinates: [130.4205, 33.5897], prefecture: '福岡県' }
  };
  
  // Tokaido Shinkansen (Tokyo - Osaka)
  routes.push({
    id: 'shinkansen-tokaido-1',
    name: '東海道新幹線: 東京 - 品川',
    type: 'shinkansen',
    points: [shinkansenStations.tokyo.coordinates, shinkansenStations.shinagawa.coordinates],
    flow_count: 150000,
    speed: 285,
    category: '新幹線'
  });
  
  routes.push({
    id: 'shinkansen-tokaido-2',
    name: '東海道新幹線: 品川 - 新横浜',
    type: 'shinkansen',
    points: [shinkansenStations.shinagawa.coordinates, shinkansenStations.shin_yokohama.coordinates],
    flow_count: 145000,
    speed: 285,
    category: '新幹線'
  });
  
  routes.push({
    id: 'shinkansen-tokaido-3',
    name: '東海道新幹線: 新横浜 - 名古屋',
    type: 'shinkansen',
    points: [shinkansenStations.shin_yokohama.coordinates, shinkansenStations.nagoya.coordinates],
    flow_count: 130000,
    speed: 285,
    category: '新幹線'
  });
  
  routes.push({
    id: 'shinkansen-tokaido-4',
    name: '東海道新幹線: 名古屋 - 京都',
    type: 'shinkansen',
    points: [shinkansenStations.nagoya.coordinates, shinkansenStations.kyoto.coordinates],
    flow_count: 120000,
    speed: 285,
    category: '新幹線'
  });
  
  routes.push({
    id: 'shinkansen-tokaido-5',
    name: '東海道新幹線: 京都 - 新大阪',
    type: 'shinkansen',
    points: [shinkansenStations.kyoto.coordinates, shinkansenStations.shin_osaka.coordinates],
    flow_count: 140000,
    speed: 285,
    category: '新幹線'
  });
  
  // Sanyo Shinkansen (Osaka - Fukuoka)
  routes.push({
    id: 'shinkansen-sanyo-1',
    name: '山陽新幹線: 新大阪 - 新神戸',
    type: 'shinkansen',
    points: [shinkansenStations.shin_osaka.coordinates, shinkansenStations.shin_kobe.coordinates],
    flow_count: 110000,
    speed: 300,
    category: '新幹線'
  });
  
  routes.push({
    id: 'shinkansen-sanyo-2',
    name: '山陽新幹線: 新神戸 - 岡山',
    type: 'shinkansen',
    points: [shinkansenStations.shin_kobe.coordinates, shinkansenStations.okayama.coordinates],
    flow_count: 95000,
    speed: 300,
    category: '新幹線'
  });
  
  routes.push({
    id: 'shinkansen-sanyo-3',
    name: '山陽新幹線: 岡山 - 広島',
    type: 'shinkansen',
    points: [shinkansenStations.okayama.coordinates, shinkansenStations.hiroshima.coordinates],
    flow_count: 90000,
    speed: 300,
    category: '新幹線'
  });
  
  routes.push({
    id: 'shinkansen-sanyo-4',
    name: '山陽新幹線: 広島 - 小倉',
    type: 'shinkansen',
    points: [shinkansenStations.hiroshima.coordinates, shinkansenStations.kokura.coordinates],
    flow_count: 85000,
    speed: 300,
    category: '新幹線'
  });
  
  routes.push({
    id: 'shinkansen-sanyo-5',
    name: '山陽新幹線: 小倉 - 博多',
    type: 'shinkansen',
    points: [shinkansenStations.kokura.coordinates, shinkansenStations.hakata.coordinates],
    flow_count: 100000,
    speed: 300,
    category: '新幹線'
  });
  
  // Major Expressways
  const highwayRoutes = [
    {
      id: 'highway-tomei-1',
      name: '東名高速道路: 東京 - 横浜',
      type: 'highway',
      points: [[139.7670, 35.6812], [139.6380, 35.4437]],
      flow_count: 80000,
      speed: 80,
      category: '高速道路'
    },
    {
      id: 'highway-tomei-2',
      name: '東名高速道路: 横浜 - 名古屋',
      type: 'highway',
      points: [[139.6380, 35.4437], [136.9066, 35.1815]],
      flow_count: 65000,
      speed: 80,
      category: '高速道路'
    },
    {
      id: 'highway-meishin-1',
      name: '名神高速道路: 名古屋 - 京都',
      type: 'highway',
      points: [[136.9066, 35.1815], [135.7681, 35.0116]],
      flow_count: 60000,
      speed: 80,
      category: '高速道路'
    },
    {
      id: 'highway-meishin-2',
      name: '名神高速道路: 京都 - 大阪',
      type: 'highway',
      points: [[135.7681, 35.0116], [135.5022, 34.6937]],
      flow_count: 70000,
      speed: 80,
      category: '高速道路'
    },
    {
      id: 'highway-sanyo-1',
      name: '山陽自動車道: 大阪 - 神戸',
      type: 'highway',
      points: [[135.5022, 34.6937], [135.1830, 34.6901]],
      flow_count: 55000,
      speed: 80,
      category: '高速道路'
    },
    {
      id: 'highway-sanyo-2',
      name: '山陽自動車道: 神戸 - 岡山',
      type: 'highway',
      points: [[135.1830, 34.6901], [133.9350, 34.6618]],
      flow_count: 45000,
      speed: 80,
      category: '高速道路'
    },
    {
      id: 'highway-sanyo-3',
      name: '山陽自動車道: 岡山 - 広島',
      type: 'highway',
      points: [[133.9350, 34.6618], [132.4594, 34.3853]],
      flow_count: 40000,
      speed: 80,
      category: '高速道路'
    },
    {
      id: 'highway-sanyo-4',
      name: '山陽自動車道: 広島 - 山口',
      type: 'highway',
      points: [[132.4594, 34.3853], [131.4705, 34.1860]],
      flow_count: 35000,
      speed: 80,
      category: '高速道路'
    },
    {
      id: 'highway-kyushu-1',
      name: '九州自動車道: 山口 - 北九州',
      type: 'highway',
      points: [[131.4705, 34.1860], [130.8751, 33.8834]],
      flow_count: 40000,
      speed: 80,
      category: '高速道路'
    },
    {
      id: 'highway-kyushu-2',
      name: '九州自動車道: 北九州 - 福岡',
      type: 'highway',
      points: [[130.8751, 33.8834], [130.4017, 33.5904]],
      flow_count: 50000,
      speed: 80,
      category: '高速道路'
    }
  ];
  
  // Add highway routes
  routes.push(...highwayRoutes);
  
  // Air routes between major airports
  const airRoutes = [
    {
      id: 'air-haneda-itami',
      name: '航空路: 羽田 - 伊丹',
      type: 'air',
      points: [[139.7798, 35.5494], [135.4380, 34.7855]],
      flow_count: 25000,
      speed: 800,
      category: '航空路'
    },
    {
      id: 'air-haneda-fukuoka',
      name: '航空路: 羽田 - 福岡',
      type: 'air',
      points: [[139.7798, 35.5494], [130.4510, 33.5859]],
      flow_count: 20000,
      speed: 800,
      category: '航空路'
    },
    {
      id: 'air-haneda-hiroshima',
      name: '航空路: 羽田 - 広島',
      type: 'air',
      points: [[139.7798, 35.5494], [132.9194, 34.4361]],
      flow_count: 10000,
      speed: 800,
      category: '航空路'
    },
    {
      id: 'air-itami-fukuoka',
      name: '航空路: 伊丹 - 福岡',
      type: 'air',
      points: [[135.4380, 34.7855], [130.4510, 33.5859]],
      flow_count: 15000,
      speed: 800,
      category: '航空路'
    }
  ];
  
  // Add air routes
  routes.push(...airRoutes);
  
  return routes;
}

// Export bounds for each prefecture
export function getPrefectureBounds(prefectureName) {
  switch (prefectureName) {
    case '東京都':
      return TOKYO_DATA.bounds;
    case '大阪府':
      return OSAKA_DATA.bounds;
    case '福岡県':
      return FUKUOKA_DATA.bounds;
    case '山口県':
      return {
        north: 34.6,
        south: 33.7,
        east: 132.2,
        west: 130.8,
        center: [131.4705, 34.1858],
        defaultZoom: 9.5
      };
    case '広島県':
    default:
      return getHiroshimaPrefectureBounds();
  }
}