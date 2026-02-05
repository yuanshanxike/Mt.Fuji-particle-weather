import { useState, useEffect } from 'react';

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  weatherDescription: string;
  visibility: number;
  windSpeed: number;
  humidity: number;
  forecast: ForecastItem[];
  loading: boolean;
  error: string | null;
}

export interface ForecastItem {
  time: string;
  temperature: number;
  weatherCode: number;
  weatherDescription: string;
}

// WMO Weather interpretation codes (WW)
const weatherCodeMap: Record<number, string> = {
  0: '晴朗',
  1: '大部晴朗',
  2: '多云',
  3: '阴天',
  45: '雾',
  48: '雾凇',
  51: '毛毛雨',
  53: '中雨',
  55: '大雨',
  61: '小雨',
  63: '中雨',
  65: '暴雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '雪粒',
  80: '阵雨',
  81: '强阵雨',
  82: '暴雨',
  85: '阵雪',
  86: '强阵雪',
  95: '雷雨',
  96: '雷伴冰雹',
  99: '强雷伴冰雹',
};

export function getWeatherDescription(code: number): string {
  return weatherCodeMap[code] || '未知';
}

export function getWeatherType(code: number): 'sunny' | 'cloudy' | 'rainy' | 'snowy' {
  if (code === 0 || code === 1) return 'sunny';
  if (code === 2 || code === 3 || code === 45 || code === 48) return 'cloudy';
  if (code >= 51 && code <= 67) return 'rainy';
  if (code >= 71 && code <= 77) return 'snowy';
  if (code >= 80 && code <= 82) return 'rainy';
  if (code >= 85 && code <= 86) return 'snowy';
  if (code >= 95) return 'rainy';
  return 'sunny';
}

export function useWeather(): WeatherData {
  const [data, setData] = useState<WeatherData>({
    temperature: 0,
    weatherCode: 0,
    weatherDescription: '加载中...',
    visibility: 0,
    windSpeed: 0,
    humidity: 0,
    forecast: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Mount Fuji coordinates: 35.3606° N, 138.7274° E
        const lat = 35.3606;
        const lon = 138.7274;

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,visibility,wind_speed_10m&hourly=temperature_2m,weather_code&timezone=Asia%2FTokyo&forecast_days=1`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }

        const result = await response.json();

        // Process forecast data (every 3 hours)
        const forecast: ForecastItem[] = [];
        const currentHour = new Date().getHours();
        for (let i = 0; i < 8; i++) {
          const hourIndex = Math.floor(currentHour / 3) * 3 + i * 3;
          if (hourIndex < 24) {
            const timeStr = `${hourIndex.toString().padStart(2, '0')}:00`;
            forecast.push({
              time: timeStr,
              temperature: Math.round(result.hourly.temperature_2m[hourIndex]),
              weatherCode: result.hourly.weather_code[hourIndex],
              weatherDescription: getWeatherDescription(result.hourly.weather_code[hourIndex]),
            });
          }
        }

        setData({
          temperature: Math.round(result.current.temperature_2m),
          weatherCode: result.current.weather_code,
          weatherDescription: getWeatherDescription(result.current.weather_code),
          visibility: Math.round(result.current.visibility / 1000),
          windSpeed: Math.round(result.current.wind_speed_10m),
          humidity: result.current.relative_humidity_2m,
          forecast,
          loading: false,
          error: null,
        });
      } catch (err) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }));
      }
    };

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return data;
}
