/**
 * 因果推論エンジン
 * DML (Double/Debiased Machine Learning) のモック実装
 */

// ヘルパー関数: ランダムノイズを加えたリアルな値を生成
const addNoise = (baseValue, noiseLevel = 0.1) => {
  const noise = (Math.random() - 0.5) * 2 * noiseLevel;
  return baseValue * (1 + noise);
};

// ヘルパー関数: 日付範囲を生成
const generateDateRange = (days) => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

/**
 * 過去データの因果分析
 * 各要因が訪問者数に与えた効果を分解
 */
export const analyzePastData = async ({ prefecture, timeRange, currentData, selectedEvent }) => {
  // シミュレーション用の遅延
  await new Promise(resolve => setTimeout(resolve, 1500));

  // イベント規模から適切なベースラインを算出
  let eventScale = 35000; // デフォルト値
  if (selectedEvent) {
    eventScale = selectedEvent.expected_attendees || selectedEvent.expectedVisitors || selectedEvent.attendees || 35000;
  }
  
  // イベント規模に基づいた実績的なベースライン（通常の日常訪問者数）
  let baseline;
  if (eventScale < 10000) {
    baseline = Math.round(eventScale * 0.25); // 小規模イベント: 日常訪問者は想定の25%程度
  } else if (eventScale < 50000) {
    baseline = Math.round(8000 + (eventScale - 10000) * 0.1); // 中規模イベント: 8,000-12,000人
  } else {
    baseline = Math.round(12000 + (eventScale - 50000) * 0.05); // 大規模イベント: 12,000人以上
  }

  // 因果効果の推定（イベント規模に比例した現実的な数値）
  const decomposition = {
    baseline: baseline,
    factors: [
      {
        name: '天候効果',
        icon: 'weather',
        effect: addNoise(eventScale < 20000 ? 1000 : eventScale < 50000 ? 2000 : 3000, 0.15),
        confidence: 0.92,
        description: '晴天による外出増加効果',
        details: '気温23度、湿度55%の快適な条件',
      },
      {
        name: 'SNSキャンペーン',
        icon: 'campaign',
        effect: addNoise(eventScale < 20000 ? 3000 : eventScale < 50000 ? 5500 : 8000, 0.2),
        confidence: 0.88,
        description: 'Instagram広告の直接効果',
        details: 'リーチ15万人、エンゲージメント率4.2%',
      },
      {
        name: selectedEvent ? selectedEvent.name : '地域イベント',
        icon: 'event',
        effect: selectedEvent ? 
          addNoise(eventScale < 20000 ? 2000 : eventScale < 50000 ? 3500 : 5000, 0.18) : 
          addNoise(3500, 0.18),
        confidence: 0.85,
        description: selectedEvent ? `${selectedEvent.name}による集客効果` : '地域イベントによる集客効果',
        details: selectedEvent ? `会場: ${selectedEvent.venue}` : `推定来場者${eventScale.toLocaleString()}人のイベント`,
      },
      {
        name: '交通アクセス改善',
        icon: 'transport',
        effect: addNoise(eventScale < 20000 ? 1000 : eventScale < 50000 ? 2000 : 3000, 0.12),
        confidence: 0.90,
        description: '臨時バス増便の効果',
        details: '主要駅からの直行バス30分間隔',
      },
      {
        name: '季節性',
        icon: 'season',
        effect: addNoise(eventScale < 20000 ? -2000 : eventScale < 50000 ? -3000 : -4000, 0.25),
        confidence: 0.78,
        description: '梅雨時期のマイナス効果',
        details: '例年比で15%の減少傾向',
      },
    ],
  };

  // 因果ネットワークの構築
  const causalNetwork = {
    nodes: [
      { id: 'visitors', label: '訪問者数', type: 'outcome' },
      { id: 'weather', label: '天候', type: 'treatment' },
      { id: 'campaign', label: 'SNS', type: 'treatment' },
      { id: 'event', label: 'イベント', type: 'treatment' },
      { id: 'transport', label: '交通', type: 'mediator' },
      { id: 'season', label: '季節', type: 'confounder' },
    ],
    edges: [
      { source: 'weather', target: 'visitors', strength: 0.75 },
      { source: 'campaign', target: 'visitors', strength: 0.92 },
      { source: 'event', target: 'visitors', strength: 0.85 },
      { source: 'transport', target: 'visitors', strength: 0.65 },
      { source: 'season', target: 'visitors', strength: -0.45 },
      { source: 'weather', target: 'transport', strength: 0.55 },
      { source: 'event', target: 'transport', strength: 0.78 },
      { source: 'season', target: 'weather', strength: 0.68 },
    ],
  };

  // 主要な洞察
  const insights = [
    `SNSキャンペーンが最も大きな効果（+${decomposition.factors[1].effect.toLocaleString()}人）を示し、ROIは3.2倍`,
    `天候と交通アクセスの相互作用により、追加で約1,200人の来訪者増加`,
    `イベント開催時は通常の週末比で2.3倍の訪問者数を記録`,
    `季節性の負の効果は、積極的なマーケティングで65%相殺可能`,
  ];

  return {
    decomposition,
    causalNetwork,
    insights,
    totalEffect: decomposition.factors.reduce((sum, f) => sum + f.effect, 0),
    confidence: 0.87,
  };
};

/**
 * 未来の訪問者数予測
 * DMLによる高精度予測と信頼区間の提供
 */
export const predictFuture = async ({ prefecture, days, eventType, weatherScenario }) => {
  // シミュレーション用の遅延
  await new Promise(resolve => setTimeout(resolve, 1200));

  const dates = generateDateRange(days);
  
  // ベースライン設定
  const baselineVisitors = {
    '広島県': 45000,
    '東京都': 120000,
    '大阪府': 85000,
    '福岡県': 55000,
  };

  const baseline = baselineVisitors[prefecture] || 45000;

  // イベント効果
  const eventEffects = {
    festival: 12000,
    campaign: 8000,
    none: 0,
  };

  // 天候効果
  const weatherEffects = {
    sunny: 3500,
    normal: 0,
    rainy: -4500,
  };

  // 予測データの生成
  const predictions = dates.map((date, index) => {
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // 曜日効果
    const weekdayEffect = isWeekend ? baseline * 0.3 : 0;
    
    // トレンド効果（わずかな上昇トレンド）
    const trendEffect = index * 50;
    
    // イベント効果（特定の日のみ）
    const hasEvent = eventType !== 'none' && (index === 3 || index === 10 || index === 17);
    const eventEffect = hasEvent ? eventEffects[eventType] : 0;
    
    // 総効果
    const totalEffect = weekdayEffect + trendEffect + eventEffect + weatherEffects[weatherScenario];
    
    // 予測値
    const prediction = baseline + totalEffect + addNoise(0, 0.1) * baseline;
    
    // 信頼区間（予測の不確実性を反映）
    const uncertainty = 0.15 + (index / days) * 0.05; // 将来ほど不確実性が増加
    const lowerBound = prediction * (1 - uncertainty);
    const upperBound = prediction * (1 + uncertainty);
    
    return {
      date,
      prediction: Math.round(prediction),
      lowerBound: Math.round(lowerBound),
      upperBound: Math.round(upperBound),
      hasEvent,
      isWeekend,
    };
  });

  // 要因別寄与度
  const contributions = {
    '基準値': baseline,
    '天候効果': weatherEffects[weatherScenario],
    'イベント効果': eventType !== 'none' ? eventEffects[eventType] * 0.3 : 0, // 平均効果
    '曜日効果': baseline * 0.1, // 週末効果の平均
    'トレンド': days * 25, // 平均的なトレンド効果
  };

  // 予測精度指標
  const accuracy = 0.85 + Math.random() * 0.1; // 85-95%の精度
  const mae = baseline * 0.08 + Math.random() * baseline * 0.02; // 平均絶対誤差

  return {
    predictions,
    contributions,
    accuracy,
    mae: Math.round(mae),
    summary: {
      averagePrediction: Math.round(predictions.reduce((sum, p) => sum + p.prediction, 0) / days),
      peakDay: predictions.reduce((max, p) => p.prediction > max.prediction ? p : max),
      totalVisitors: predictions.reduce((sum, p) => sum + p.prediction, 0),
    },
  };
};

/**
 * 反実仮想シナリオの生成
 * "もし〜だったら"の分析
 */
export const getCounterfactualScenarios = async ({ prefecture, baselineData }) => {
  // シミュレーション用の遅延
  await new Promise(resolve => setTimeout(resolve, 800));

  const baseline = baselineData.baseline;
  const actualTotal = baseline + baselineData.factors.reduce((sum, f) => sum + f.effect, 0);

  const scenarios = [
    {
      id: 'no-campaign',
      name: 'SNSキャンペーンなし',
      description: 'もしSNSキャンペーンを実施しなかったら',
      impact: -8200,
      visitors: actualTotal - 8200,
      probability: 0.92,
      recommendation: 'SNSマーケティングは必須。予算を30%増やすことで更に+3,500人見込み',
    },
    {
      id: 'bad-weather',
      name: '悪天候シナリオ',
      description: 'もし一日中雨が降っていたら',
      impact: -7000,
      visitors: actualTotal - 7000,
      probability: 0.15,
      recommendation: '屋内イベントの充実により、影響を50%軽減可能',
    },
    {
      id: 'double-event',
      name: '複数イベント同時開催',
      description: 'もし隣接エリアでも大型イベントがあったら',
      impact: 12500,
      visitors: actualTotal + 12500,
      probability: 0.78,
      recommendation: 'イベント連携により相乗効果が期待。共同プロモーション推奨',
    },
    {
      id: 'transport-issue',
      name: '交通障害発生',
      description: 'もし主要道路で事故による渋滞が発生したら',
      impact: -4800,
      visitors: actualTotal - 4800,
      probability: 0.08,
      recommendation: '代替ルートの事前告知とシャトルバス増便で対応',
    },
  ];

  return scenarios;
};

/**
 * リアルタイム因果効果の推定
 * ストリーミングデータからの動的な効果測定
 */
export const estimateRealtimeEffects = async (streamingData) => {
  // DMLアルゴリズムによるリアルタイム処理をシミュレート
  const effects = {
    immediate: {
      weather: addNoise(1200, 0.2),
      social: addNoise(450, 0.3),
      transport: addNoise(-200, 0.15),
    },
    cumulative: {
      weather: addNoise(3500, 0.15),
      social: addNoise(2800, 0.25),
      transport: addNoise(800, 0.1),
    },
    trend: 'increasing',
    confidence: 0.82,
  };

  return effects;
};

/**
 * 新しい予測システム用のイベント予測
 * 地方自治体職員向けの実用的な予測
 */
export const predictEventSuccess = async (eventParams) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const {
    targetAudience,
    eventCategory,
    eventDuration,
    advertisementBudget,
    snsStrategy,
    mediaStrategy,
    venueType,
    transportAccess,
    parkingAvailability,
  } = eventParams;
  
  // 基本的な予測値を計算
  let baseExpected = targetAudience;
  
  // 各要因の影響を計算
  const factors = {
    // 広告予算の影響
    advertisementBudget: {
      none: 0.7,
      small: 0.85,
      medium: 0.95,
      large: 1.05,
      xlarge: 1.15,
    },
    // SNS戦略の影響
    snsStrategy: {
      none: 0.8,
      basic: 0.9,
      active: 1.0,
      influencer: 1.15,
    },
    // メディア戦略の影響
    mediaStrategy: {
      none: 0.85,
      local: 0.95,
      national: 1.1,
    },
    // 会場タイプの影響
    venueType: {
      indoor: 0.9,
      outdoor: 0.85,
      hybrid: 0.95,
      online: 1.05,
    },
    // 交通アクセスの影響
    transportAccess: {
      station: 1.1,
      walk10: 1.0,
      bus: 0.9,
      car: 0.8,
    },
    // 駐車場の影響
    parkingAvailability: {
      sufficient: 1.05,
      limited: 0.9,
      none: 0.75,
    },
  };
  
  // 総合的な予測値を計算
  let multiplier = 1.0;
  multiplier *= factors.advertisementBudget[advertisementBudget] || 1.0;
  multiplier *= factors.snsStrategy[snsStrategy] || 1.0;
  multiplier *= factors.mediaStrategy[mediaStrategy] || 1.0;
  multiplier *= factors.venueType[venueType] || 1.0;
  multiplier *= factors.transportAccess[transportAccess] || 1.0;
  multiplier *= factors.parkingAvailability[parkingAvailability] || 1.0;
  
  // ランダムな変動を追加
  multiplier *= (0.9 + Math.random() * 0.2);
  
  const expectedVisitors = Math.round(baseExpected * multiplier);
  
  // 成功要因の分析
  const successFactors = [];
  if (snsStrategy === 'influencer' || snsStrategy === 'active') {
    successFactors.push({ factor: 'SNS戦略の効果', impact: 'high', score: 0.85 + Math.random() * 0.1 });
  }
  if (transportAccess === 'station' || transportAccess === 'walk10') {
    successFactors.push({ factor: '交通アクセスの良さ', impact: 'high', score: 0.78 + Math.random() * 0.1 });
  }
  if (advertisementBudget === 'large' || advertisementBudget === 'xlarge') {
    successFactors.push({ factor: '広告予算の適正配分', impact: 'medium', score: 0.68 + Math.random() * 0.1 });
  }
  successFactors.push({ factor: '過去の類似イベント実績', impact: 'medium', score: 0.72 + Math.random() * 0.1 });
  
  // リスク要因の分析
  const riskFactors = [];
  if (venueType === 'outdoor') {
    riskFactors.push({ factor: '天候リスク', severity: 'high', probability: 0.4 + Math.random() * 0.2 });
  } else {
    riskFactors.push({ factor: '天候リスク', severity: 'low', probability: 0.1 + Math.random() * 0.1 });
  }
  
  if (parkingAvailability === 'none' || parkingAvailability === 'limited') {
    riskFactors.push({ factor: '駐車場不足', severity: parkingAvailability === 'none' ? 'high' : 'medium', probability: 0.3 + Math.random() * 0.2 });
  }
  
  riskFactors.push({ factor: '競合イベントの可能性', severity: 'medium', probability: 0.15 + Math.random() * 0.1 });
  
  // 推奨アクション
  const recommendations = [];
  if (snsStrategy !== 'influencer') {
    recommendations.push('SNSでのインフルエンサー活用を検討');
  }
  if (venueType === 'outdoor') {
    recommendations.push('雨天時の代替プログラムを準備');
  }
  if (transportAccess === 'bus' || transportAccess === 'car') {
    recommendations.push('シャトルバスの運行を増便');
  }
  if (!recommendations.includes('早期割引チケットの導入を推奨')) {
    recommendations.push('早期割引チケットの導入を推奨');
  }
  
  // ROI計算
  const ticketPrice = eventCategory === 'concert' ? 5000 : eventCategory === 'sports' ? 3000 : 2500;
  const estimatedRevenue = expectedVisitors * ticketPrice;
  const baseCost = 10000000; // 基本コスト1000万円
  const adCost = advertisementBudget === 'none' ? 0 : advertisementBudget === 'small' ? 500000 : advertisementBudget === 'medium' ? 2000000 : advertisementBudget === 'large' ? 5000000 : 10000000;
  const estimatedCost = baseCost + adCost;
  const roiPercentage = ((estimatedRevenue - estimatedCost) / estimatedCost * 100);
  
  return {
    expectedVisitors,
    confidenceRange: {
      lower: Math.round(expectedVisitors * 0.8),
      upper: Math.round(expectedVisitors * 1.2),
    },
    successFactors: successFactors.sort((a, b) => b.score - a.score),
    riskFactors: riskFactors.sort((a, b) => b.probability - a.probability),
    recommendations,
    roi: {
      estimatedRevenue,
      estimatedCost,
      roiPercentage,
    },
  };
};