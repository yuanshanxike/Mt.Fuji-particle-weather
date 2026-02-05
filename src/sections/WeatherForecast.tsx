import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ForecastItem } from '@/hooks/useWeather';
import { getWeatherType } from '@/hooks/useWeather';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface WeatherForecastProps {
  forecast: ForecastItem[];
}

function WeatherIcon({ code }: { code: number }) {
  const type = getWeatherType(code);
  const iconClass = "w-8 h-8";
  
  switch (type) {
    case 'sunny':
      return <Sun className={`${iconClass} text-yellow-500`} />;
    case 'cloudy':
      return <Cloud className={`${iconClass} text-gray-500`} />;
    case 'rainy':
      return <CloudRain className={`${iconClass} text-blue-500`} />;
    case 'snowy':
      return <CloudSnow className={`${iconClass} text-cyan-400`} />;
    default:
      return <Sun className={`${iconClass} text-yellow-500`} />;
  }
}

function AnimatedWeatherIcon({ code }: { code: number }) {
  const type = getWeatherType(code);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!iconRef.current) return;

    const ctx = gsap.context(() => {
      if (type === 'sunny') {
        gsap.to(iconRef.current, {
          rotation: 360,
          duration: 10,
          repeat: -1,
          ease: 'none',
        });
      } else if (type === 'cloudy') {
        gsap.to(iconRef.current, {
          x: 5,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      } else if (type === 'rainy' || type === 'snowy') {
        gsap.to(iconRef.current, {
          y: 3,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    });

    return () => ctx.revert();
  }, [type]);

  return (
    <div ref={iconRef} className="inline-block">
      <WeatherIcon code={code} />
    </div>
  );
}

export default function WeatherForecast({ forecast }: WeatherForecastProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const cards = cardsRef.current;

    if (!section || !track || !cards) return;

    const ctx = gsap.context(() => {
      // Horizontal scroll on vertical scroll
      const totalWidth = cards.scrollWidth - track.clientWidth;

      ScrollTrigger.create({
        trigger: section,
        start: 'top 20%',
        end: `+=${totalWidth}`,
        pin: true,
        scrub: 1,
        onUpdate: (self) => {
          gsap.to(cards, {
            x: -self.progress * totalWidth,
            duration: 0.1,
            ease: 'none',
          });
        },
      });
    }, section);

    return () => ctx.revert();
  }, [forecast]);

  // Default forecast if loading
  const displayForecast = forecast.length > 0 ? forecast : [
    { time: '00:00', temperature: -5, weatherCode: 71, weatherDescription: '小雪' },
    { time: '03:00', temperature: -6, weatherCode: 71, weatherDescription: '小雪' },
    { time: '06:00', temperature: -4, weatherCode: 2, weatherDescription: '多云' },
    { time: '09:00', temperature: -1, weatherCode: 1, weatherDescription: '大部晴朗' },
    { time: '12:00', temperature: 2, weatherCode: 0, weatherDescription: '晴朗' },
    { time: '15:00', temperature: 1, weatherCode: 0, weatherDescription: '晴朗' },
    { time: '18:00', temperature: -2, weatherCode: 61, weatherDescription: '小雨' },
    { time: '21:00', temperature: -4, weatherCode: 71, weatherDescription: '小雪' },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen bg-gradient-to-b from-white to-gray-50 py-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-8 md:px-16">
        {/* Section Header */}
        <div className="mb-12">
          <h2
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: '"Noto Serif JP", serif' }}
          >
            今日预报
          </h2>
          <p className="text-xl text-gray-600">
            富士山地区24小时天气变化 · 影响粒子场景渲染
          </p>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div ref={trackRef} className="relative w-full overflow-hidden">
        <div
          ref={cardsRef}
          className="flex gap-6 px-8 md:px-16"
          style={{ willChange: 'transform' }}
        >
          {displayForecast.map((item, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-48 md:w-56"
            >
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-gray-100 hover:border-red-200 transition-colors duration-300 h-full">
                {/* Time */}
                <div className="text-center mb-4">
                  <span className="text-2xl font-bold text-gray-800">
                    {item.time}
                  </span>
                </div>

                {/* Animated Icon */}
                <div className="flex justify-center mb-4 h-12 items-center">
                  <AnimatedWeatherIcon code={item.weatherCode} />
                </div>

                {/* Temperature */}
                <div className="text-center mb-3">
                  <span className="text-4xl font-bold text-red-500">
                    {item.temperature}°
                  </span>
                </div>

                {/* Description */}
                <div className="text-center">
                  <span className="text-sm text-gray-600">
                    {item.weatherDescription}
                  </span>
                </div>

                {/* Particle effect indicator */}
                <div className="mt-4 flex justify-center">
                  <div className={`w-2 h-2 rounded-full ${
                    getWeatherType(item.weatherCode) === 'sunny' ? 'bg-yellow-400' :
                    getWeatherType(item.weatherCode) === 'cloudy' ? 'bg-gray-400' :
                    getWeatherType(item.weatherCode) === 'rainy' ? 'bg-blue-400' :
                    'bg-cyan-400'
                  } animate-pulse`} />
                </div>

                {/* Decorative line */}
                <div className="mt-4 h-1 bg-gradient-to-r from-transparent via-red-200 to-transparent rounded-full" />
              </div>
            </div>
          ))}

          {/* End card */}
          <div className="flex-shrink-0 w-48 md:w-56">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-6 shadow-xl h-full flex flex-col justify-center items-center text-white">
              <CloudLightning className="w-12 h-12 mb-4" />
              <p className="text-center text-sm">
                数据来自 Open-Meteo
              </p>
              <p className="text-center text-xs mt-2 opacity-80">
                每30分钟更新
              </p>
              <div className="mt-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="max-w-7xl mx-auto px-8 md:px-16 mt-8">
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <div className="w-8 h-1 bg-gray-300 rounded-full" />
          <span className="text-sm">向下滚动查看更多</span>
          <div className="w-8 h-1 bg-gray-300 rounded-full" />
        </div>
      </div>

      {/* Weather Legend */}
      <div className="max-w-7xl mx-auto px-8 md:px-16 mt-16">
        <div className="bg-gray-50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">天气与粒子效果对应</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Sun, label: '晴朗', color: 'text-yellow-500', particles: '金色光点' },
              { icon: Cloud, label: '多云', color: 'text-gray-500', particles: '灰色云层' },
              { icon: CloudRain, label: '雨天', color: 'text-blue-500', particles: '蓝色雨线' },
              { icon: CloudSnow, label: '雪天', color: 'text-cyan-400', particles: '白色雪花' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <item.icon className={`w-6 h-6 ${item.color} flex-shrink-0 mt-0.5`} />
                <div>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <span className="text-xs text-gray-500 block">{item.particles}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
