/**
 * Multi-Prefecture Data Generator
 * Generates realistic dummy data for multiple prefectures
 */

import { 
  generateAllPrefectureData as generateHiroshimaData,
  getHiroshimaPrefectureBounds 
} from './hiroshimaPrefectureDataGenerator';

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
    { name: '隅田川花火大会', coordinates: [139.8107, 35.7101], category: '花火', icon: '🎆' },
    { name: 'コミックマーケット', coordinates: [139.7917, 35.6301], category: '展示会', icon: '🎨' },
    { name: '東京マラソン', coordinates: [139.7540, 35.6812], category: 'スポーツ', icon: '⚽' },
    { name: '神田祭', coordinates: [139.7671, 35.6989], category: '祭り', icon: '🎊' },
    { name: '三社祭', coordinates: [139.7966, 35.7147], category: '祭り', icon: '🎊' }
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
    { name: '天神祭', coordinates: [135.5131, 34.6959], category: '祭り', icon: '🎊' },
    { name: 'なにわ淀川花火大会', coordinates: [135.4850, 34.7206], category: '花火', icon: '🎆' },
    { name: '岸和田だんじり祭', coordinates: [135.3714, 34.4606], category: '祭り', icon: '🎊' },
    { name: '大阪マラソン', coordinates: [135.5256, 34.6873], category: 'スポーツ', icon: '⚽' },
    { name: '今宮戎十日戎', coordinates: [135.4963, 34.6500], category: '祭り', icon: '🎊' }
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
    { name: '博多どんたく', coordinates: [130.4017, 33.5904], category: '祭り', icon: '🎊' },
    { name: '博多祇園山笠', coordinates: [130.4108, 33.5930], category: '祭り', icon: '🎊' },
    { name: '西日本大濠花火大会', coordinates: [130.3760, 33.5850], category: '花火', icon: '🎆' },
    { name: '放生会', coordinates: [130.4252, 33.6170], category: '祭り', icon: '🎊' },
    { name: '福岡マラソン', coordinates: [130.4017, 33.5904], category: 'スポーツ', icon: '⚽' }
  ]
};

// Generate accommodation data for a prefecture
function generateAccommodationForPrefecture(prefectureData) {
  const accommodations = [];
  
  Object.values(prefectureData.cities).forEach(city => {
    city.districts.forEach(district => {
      // Generate more hotels for major cities (15-25 per district based on population)
      const baseHotelCount = city.population > 300000 ? 15 : 10;
      const hotelCount = Math.floor(baseHotelCount + (district.population / 30000) * 5);
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
                      'コンラッド', 'アンダーズ', 'ハイアットリージェンシー'],
          'ビジネスホテル': ['東横イン', 'アパホテル', 'スーパーホテル', 'ルートイン', 
                       'ドーミーイン', 'リッチモンドホテル', 'ダイワロイネット', 
                       'ホテルサンルート', 'ワシントンホテル', 'コンフォートホテル'],
          'カプセルホテル': ['ナインアワーズ', 'ファーストキャビン', 'カプセルイン', 
                       'グランパーク・イン', 'ベイサイドホテル アジュール'],
          'ゲストハウス': ['ホステル', 'バックパッカーズ', 'ゲストハウス', 
                      'K\'s House', 'サクラホステル', 'カオサン'],
          '旅館': ['旅館', '温泉旅館', '料亭旅館', '和風旅館']
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
    
    // Add extra hotels near tourist spots
    if (city.touristSpots) {
      city.touristSpots.slice(0, 5).forEach((spot, spotIdx) => {
        const touristHotels = Math.floor(3 + Math.random() * 3);
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
            district: city.districts[0].name,
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
  
  Object.values(prefectureData.cities).forEach(city => {
    // Generate consumption data for commercial areas with increased density
    city.commercialAreas.forEach(area => {
      // More points for larger cities (15-40 points per area)
      const basePoints = city.population > 500000 ? 20 : 12;
      const pointCount = Math.floor(basePoints + (city.population / 30000) * 5);
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
        const locationVariation = area.includes('駅') ? 1.4 : 1.0;
        const randomVariation = 0.3 + Math.random() * 1.2;
        
        const amount = baseAmount * categoryMultiplier[category] * timeVariation * 
                      locationVariation * randomVariation;
        
        consumptionData.push({
          id: `${city.nameEn}-${area}-consumption-${idx}`,
          coordinates: coord,
          amount: Math.floor(amount),
          category: category,
          area: area,
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
  });
  
  return consumptionData;
}

// Generate mobility data for a prefecture
function generateMobilityForPrefecture(prefectureData) {
  const mobilityData = {
    routes: [],
    congestionPoints: []
  };
  
  // Generate routes between major areas
  const cities = Object.values(prefectureData.cities);
  for (let i = 0; i < cities.length - 1; i++) {
    for (let j = i + 1; j < cities.length; j++) {
      const congestionLevel = 0.5 + Math.random() * 0.4;
      mobilityData.routes.push({
        id: `route-${cities[i].nameEn}-${cities[j].nameEn}`,
        name: `${cities[i].name} - ${cities[j].name}`,
        type: 'highway',
        points: [cities[i].center, cities[j].center],
        congestion: congestionLevel,
        flow_speed: 60 - (congestionLevel * 30)
      });
    }
  }
  
  // Add congestion points
  cities.forEach(city => {
    mobilityData.congestionPoints.push({
      coordinates: city.center,
      level: 0.6 + Math.random() * 0.3,
      radius: city.population > 200000 ? 0.015 : 0.008,
      type: 'station',
      name: `${city.name}駅周辺`
    });
    
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
  });
  
  return mobilityData;
}

// Generate event data for a prefecture
function generateEventForPrefecture(prefectureData) {
  const events = [];
  
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
    
    events.push({
      id: `event-${idx}`,
      coordinates: event.coordinates,
      name: event.name,
      category: event.category,
      icon: event.icon,
      impact_radius: impactRadius,
      expected_attendance: Math.floor(attendance),
      city: city ? city.name : '不明',
      venue_type: event.category
    });
  });
  
  return events;
}

// Generate SNS heatmap data for a prefecture
function generateSNSHeatmapForPrefecture(prefectureData) {
  const heatmapPoints = [];
  const categories = ['観光', 'グルメ', 'ショッピング', 'イベント', '交通'];
  
  Object.values(prefectureData.cities).forEach(city => {
    city.districts.forEach(district => {
      const pointCount = Math.floor((district.population / 10000) * 3);
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
  });
  
  return heatmapPoints;
}

// Main function to generate data for all prefectures
export function generateAllPrefectureData(prefectureName = '広島県') {
  switch (prefectureName) {
    case '広島県':
      return generateHiroshimaData();
      
    case '東京都': {
      const tokyoLandmarks = TOKYO_DATA.landmarks.map((l, idx) => ({
        id: `tokyo-landmark-${idx}`,
        ...l,
        city: '東京都',
        visitor_count: Math.floor(50000 + Math.random() * 200000),
        category: l.height > 300 ? '超高層建築' : l.height > 100 ? '高層建築' : '建築物'
      }));
      
      return {
        accommodation: generateAccommodationForPrefecture(TOKYO_DATA),
        consumption: generateConsumptionForPrefecture(TOKYO_DATA),
        mobility: generateMobilityForPrefecture(TOKYO_DATA),
        landmarks: tokyoLandmarks,
        events: generateEventForPrefecture(TOKYO_DATA),
        heatmap: generateSNSHeatmapForPrefecture(TOKYO_DATA),
        bounds: TOKYO_DATA.bounds
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
      
      return {
        accommodation: generateAccommodationForPrefecture(OSAKA_DATA),
        consumption: generateConsumptionForPrefecture(OSAKA_DATA),
        mobility: generateMobilityForPrefecture(OSAKA_DATA),
        landmarks: osakaLandmarks,
        events: generateEventForPrefecture(OSAKA_DATA),
        heatmap: generateSNSHeatmapForPrefecture(OSAKA_DATA),
        bounds: OSAKA_DATA.bounds
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
      
      return {
        accommodation: generateAccommodationForPrefecture(FUKUOKA_DATA),
        consumption: generateConsumptionForPrefecture(FUKUOKA_DATA),
        mobility: generateMobilityForPrefecture(FUKUOKA_DATA),
        landmarks: fukuokaLandmarks,
        events: generateEventForPrefecture(FUKUOKA_DATA),
        heatmap: generateSNSHeatmapForPrefecture(FUKUOKA_DATA),
        bounds: FUKUOKA_DATA.bounds
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
    case '広島県':
    default:
      return getHiroshimaPrefectureBounds();
  }
}