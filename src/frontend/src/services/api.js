/**
 * API通信サービス
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

const apiService = new ApiService();
export const apiClient = apiService;

// ヒートマップサービス
export const heatmapService = {
  getHeatmapPoints: (params) => apiService.get('/api/v1/heatmap/points', params),
  getDensityGrid: (params) => apiService.get('/api/v1/heatmap/density', params),
  getCategories: () => apiService.get('/api/v1/heatmap/categories'),
  getStatistics: (params) => apiService.get('/api/v1/statistics/summary', params),
};

// 気象サービス
export const weatherService = {
  getCurrentWeather: (lat, lon) => apiService.get('/api/v1/weather/current', { lat, lon }),
  getLandmarksWeather: () => apiService.get('/api/v1/weather/landmarks'),
  getForecast: (lat, lon, days = 5) => apiService.get('/api/v1/weather/forecast', { lat, lon, days }),
};

// ヘルスチェック
export const healthService = {
  check: () => apiService.get('/health'),
  detailed: () => apiService.get('/health/detailed'),
};

// 人流・宿泊・消費データサービス
export const mobilityService = {
  getFlows: (params) => apiService.get('/api/v1/mobility/flows', params),
  getHeatmap: (params) => apiService.get('/api/v1/mobility/heatmap', params),
  getAccommodation: (params) => apiService.get('/api/v1/mobility/accommodation', params),
  getConsumption: (params) => apiService.get('/api/v1/mobility/consumption', params),
};

// イベントサービス
export const eventService = {
  getEvents: (params) => apiService.get('/api/v1/events', params),
  getImpactZones: () => apiService.get('/api/v1/events/impact-zones'),
};

// 実データサービス
export const realDataService = {
  getAccommodation: (prefecture) => apiService.get(`/api/v1/real/accommodation/real/${prefecture}`),
  getMobility: (prefecture, cityOnly = false) => apiService.get(`/api/v1/real/mobility/real/${prefecture}`, { city_only: cityOnly }),
  getEvents: (prefecture) => apiService.get(`/api/v1/real/events/real/${prefecture}`),
  getTransportGTFS: () => apiService.get('/api/v1/real/transport/gtfs/hiroshima'),
  getTourismFacilities: () => apiService.get('/api/v1/real/tourism/facilities/yamaguchi'),
};

export default apiService;