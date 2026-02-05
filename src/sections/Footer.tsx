import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mountain, Home, Cloud, Image, Info } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const sectionRef = useRef<HTMLElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const seal = sealRef.current;
    const links = linksRef.current;
    const particles = particlesRef.current;

    if (!section || !seal || !links || !particles) return;

    const ctx = gsap.context(() => {
      // Initial states
      gsap.set(seal, { scale: 0 });
      gsap.set(links.children, { y: 20, opacity: 0 });
      gsap.set(particles.children, { scale: 0, opacity: 0 });

      // Scroll trigger animation
      ScrollTrigger.create({
        trigger: section,
        start: 'top 80%',
        onEnter: () => {
          const tl = gsap.timeline();
          tl.to(seal, {
            scale: 1,
            duration: 0.6,
            ease: 'back.out(2)',
          })
          .to(links.children, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
          }, '-=0.3')
          .to(particles.children, {
            scale: 1,
            opacity: 1,
            duration: 0.4,
            stagger: 0.05,
            ease: 'back.out(1.5)',
          }, '-=0.2');
        },
        once: true,
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const navLinks = [
    { label: '首页', icon: Home, href: '#' },
    { label: '天气', icon: Cloud, href: '#weather' },
    { label: '画廊', icon: Image, href: '#gallery' },
    { label: '关于', icon: Info, href: '#about' },
  ];

  return (
    <footer
      ref={sectionRef}
      className="relative w-full bg-white py-20 border-t border-gray-100 overflow-hidden"
    >
      {/* Floating particles decoration */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-200 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-8 md:px-16 relative z-10">
        {/* Main Footer Content */}
        <div className="flex flex-col items-center">
          {/* Red Seal (Hanko) */}
          <div
            ref={sealRef}
            className="relative w-24 h-24 mb-8"
            style={{ willChange: 'transform' }}
          >
            <div className="absolute inset-0 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
              <Mountain className="w-12 h-12 text-white" />
            </div>
            {/* Decorative ring */}
            <div className="absolute -inset-2 border-2 border-red-200 rounded-full" />
            <div className="absolute -inset-4 border border-red-100 rounded-full" />
            
            {/* Orbiting particles */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '10s' }}>
              <div className="absolute -top-1 left-1/2 w-2 h-2 bg-red-300 rounded-full" />
            </div>
          </div>

          {/* Brand Name */}
          <h2
            className="text-3xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: '"Noto Serif JP", serif' }}
          >
            富士山晴雨表
          </h2>
          <p className="text-gray-500 mb-2 text-center">
            粒子构成的数字浮世绘
          </p>
          <p className="text-gray-400 text-sm mb-8 text-center">
            山、水、云、雨 — 一切皆由粒子而生
          </p>

          {/* Navigation Links */}
          <div
            ref={linksRef}
            className="flex flex-wrap justify-center gap-6 md:gap-12 mb-12"
          >
            {navLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="group flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors duration-300"
              >
                <link.icon className="w-5 h-5" />
                <span className="relative">
                  {link.label}
                  {/* Underline animation */}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full" />
                </span>
              </a>
            ))}
          </div>

          {/* Divider */}
          <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />

          {/* Credits */}
          <div className="text-center text-sm text-gray-400 space-y-2">
            <p>天气数据: Open-Meteo API</p>
            <p>渲染引擎: Three.js + React Three Fiber</p>
            <p>总粒子数: 14,000+</p>
            <p>© 2024 富士山晴雨表. All rights reserved.</p>
          </div>

          {/* Particle count visualization */}
          <div className="mt-8 flex items-center gap-4">
            {[
              { count: '8K', label: '山体', color: 'bg-gray-400' },
              { count: '4K', label: '水面', color: 'bg-blue-400' },
              { count: '1.5K', label: '云层', color: 'bg-gray-300' },
              { count: '300+', label: '环境', color: 'bg-yellow-300' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-3 h-3 ${item.color} rounded-full mb-1`} />
                <span className="text-xs font-bold text-gray-600">{item.count}</span>
                <span className="text-xs text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
    </footer>
  );
}
