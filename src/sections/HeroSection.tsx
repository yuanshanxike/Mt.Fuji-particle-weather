import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ParticleScene from '@/components/ParticleScene';
import type { WeatherData } from '@/hooks/useWeather';
import { Cloud, Eye, Wind } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionProps {
  weather: WeatherData;
}

export default function HeroSection({ weather }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    const subtitle = subtitleRef.current;
    const cards = cardsRef.current;
    const overlay = overlayRef.current;

    if (!section || !title || !subtitle || !cards || !overlay) return;

    const ctx = gsap.context(() => {
      // Initial states
      gsap.set(title.children, { y: '100%', opacity: 0 });
      gsap.set(subtitle, { y: 30, opacity: 0 });
      gsap.set(cards.children, { x: -50, opacity: 0 });
      gsap.set(overlay, { opacity: 0 });

      // Entry animation timeline
      const tl = gsap.timeline({ delay: 0.5 });

      tl.to(overlay, {
        opacity: 1,
        duration: 1.5,
        ease: 'power2.out',
      })
      .to(title.children, {
        y: '0%',
        opacity: 1,
        duration: 1.2,
        stagger: 0.05,
        ease: 'back.out(1.7)',
      }, '-=0.8')
      .to(subtitle, {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
      }, '-=0.8')
      .to(cards.children, {
        x: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.1,
        ease: 'power2.out',
      }, '-=0.6');

      // Scroll fade out
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '50% top',
        scrub: true,
        onUpdate: (self) => {
          gsap.to([title, subtitle, cards], {
            opacity: 1 - self.progress,
            duration: 0.1,
          });
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  // Temperature pulse animation
  useEffect(() => {
    const tempElement = document.querySelector('.temp-pulse');
    if (!tempElement) return;

    const pulse = gsap.to(tempElement, {
      scale: 1.05,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    return () => {
      pulse.kill();
    };
  }, []);

  const titleChars = '富士山晴雨表'.split('');

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden"
    >
      {/* 3D Particle Scene - Mountain, Water, Clouds */}
      {!weather.loading && (
        <ParticleScene weatherCode={weather.weatherCode} />
      )}

      {/* Loading State */}
      {weather.loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-blue-400 to-blue-200">
          <div className="text-white text-2xl font-bold animate-pulse">
            加载粒子场景中...
          </div>
        </div>
      )}

      {/* Content Overlay */}
      <div
        ref={overlayRef}
        className="relative z-20 h-full flex flex-col justify-center px-8 md:px-16 lg:px-24"
        style={{ willChange: 'opacity' }}
      >
        <div className="max-w-xl">
          {/* Title */}
          <h1
            ref={titleRef}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4 overflow-hidden"
            style={{
              textShadow: '0 4px 30px rgba(0,0,0,0.5)',
              fontFamily: '"Noto Serif JP", serif',
            }}
          >
            {titleChars.map((char, i) => (
              <span key={i} className="inline-block" style={{ willChange: 'transform, opacity' }}>
                {char}
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <p
            ref={subtitleRef}
            className="text-xl md:text-2xl text-white/90 mb-8"
            style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              fontFamily: '"Noto Sans JP", sans-serif',
            }}
          >
            粒子构成的数字浮世绘
          </p>

          {/* Weather Data Cards */}
          <div ref={cardsRef} className="grid grid-cols-2 gap-4">
            {/* Temperature */}
            <div
              className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30"
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center">
                  <span className="text-white text-sm">°C</span>
                </div>
                <span className="text-white/80 text-sm">温度</span>
              </div>
              <div className="temp-pulse text-4xl font-bold text-white">
                {weather.loading ? '--' : `${weather.temperature}°C`}
              </div>
            </div>

            {/* Weather Condition */}
            <div
              className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30"
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="w-6 h-6 text-white" />
                <span className="text-white/80 text-sm">天气</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {weather.loading ? '--' : weather.weatherDescription}
              </div>
            </div>

            {/* Visibility */}
            <div
              className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30"
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-6 h-6 text-white" />
                <span className="text-white/80 text-sm">能见度</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {weather.loading ? '--' : `${weather.visibility} km`}
              </div>
            </div>

            {/* Wind Speed */}
            <div
              className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30"
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Wind className="w-6 h-6 text-white" />
                <span className="text-white/80 text-sm">风速</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {weather.loading ? '--' : `${weather.windSpeed} km/h`}
              </div>
            </div>
          </div>

          {/* Particle Legend */}
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { color: '#FFFFFF', label: '雪山' },
              { color: '#4A90A4', label: '湖水' },
              { color: '#D1D5DB', label: '云朵' },
              { color: '#87CEEB', label: '雨雪' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-white/80 text-xs">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-30 pointer-events-none" />
    </section>
  );
}
