import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Info, Layers, ExternalLink } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function LiveCamera() {
  const sectionRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const section = sectionRef.current;
    const stats = statsRef.current;
    const info = infoRef.current;

    if (!section || !stats || !info) return;

    const ctx = gsap.context(() => {
      // Initial states
      gsap.set(stats.children, { y: 50, opacity: 0 });
      gsap.set(info.children, { x: -30, opacity: 0 });

      // Scroll trigger animation
      ScrollTrigger.create({
        trigger: section,
        start: 'top 70%',
        onEnter: () => {
          const tl = gsap.timeline();
          tl.to(stats.children, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power2.out',
          })
          .to(info.children, {
            x: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
          }, '-=0.4');
        },
        once: true,
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Particle system stats
  const particleStats = [
    { label: '山体粒子', value: '8,000', color: 'from-gray-400 to-white' },
    { label: '水面粒子', value: '4,000', color: 'from-blue-400 to-cyan-300' },
    { label: '云层粒子', value: '1,500', color: 'from-gray-300 to-white' },
    { label: '环境粒子', value: '300+', color: 'from-yellow-300 to-yellow-100' },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen bg-white py-20"
    >
      <div className="max-w-7xl mx-auto px-8 md:px-16">
        {/* Section Header */}
        <div className="mb-12">
          <h2
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: '"Noto Serif JP", serif' }}
          >
            粒子构成世界
          </h2>
          <p className="text-xl text-gray-600">
            每一个像素都是独立的生命体
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Particle Stats Visualization */}
          <div
            ref={statsRef}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 p-8"
            onMouseMove={handleMouseMove}
          >
            {/* Spotlight effect */}
            <div
              className="absolute pointer-events-none transition-opacity duration-300"
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(240, 10, 10, 0.2) 0%, transparent 70%)',
                left: mousePos.x - 100,
                top: mousePos.y - 100,
              }}
            />

            <h3 className="text-white text-2xl font-bold mb-6 flex items-center gap-2">
              <Layers className="w-6 h-6 text-red-500" />
              粒子统计
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {particleStats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-white/30 transition-colors"
                >
                  <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Decorative particles */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
            <div className="absolute bottom-8 right-8 w-3 h-3 bg-red-500/50 rounded-full animate-ping" />
            <div className="absolute top-1/2 right-12 w-1.5 h-1.5 bg-blue-400/50 rounded-full animate-bounce" />
          </div>

          {/* Technical Info */}
          <div ref={infoRef} className="space-y-4">
            {[
              {
                title: '山体生成算法',
                description: '使用圆锥函数结合噪声算法，模拟富士山的对称锥形结构。粒子根据高度分布，顶部为雪、中部为岩、底部为林。',
                icon: MapPin,
              },
              {
                title: '水面波动效果',
                description: '正弦波叠加算法驱动水面粒子上下浮动，模拟湖水的自然波纹。每个粒子都有独立的相位和振幅。',
                icon: Info,
              },
              {
                title: '云层漂移系统',
                description: '云层粒子沿风向缓慢移动，超出边界后循环重置。天气状况影响云的颜色和密度。',
                icon: Layers,
              },
              {
                title: '天气响应机制',
                description: '根据实时天气数据切换粒子效果：晴天时金色光点飘浮，雨天时蓝色线条落下，雪天时白色薄片旋转飘落。',
                icon: Info,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-6 hover:bg-red-50 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500 transition-colors">
                    <item.icon className="w-5 h-5 text-red-500 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* External Resources */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 mb-6">实时影像资源</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: '御来光馆',
                description: '八合五勺位置，观赏日出的最佳地点',
                link: 'https://www.goraikoukan.jp/livecamera',
              },
              {
                title: '富士山五合目',
                description: '登山口起点，综合管理中心',
                link: 'http://www.fujiyama5.jp/index04.html',
              },
              {
                title: '山梨县直播',
                description: '官方YouTube实时直播频道',
                link: 'https://www.youtube.com/@yamanashipref',
              },
            ].map((item, index) => (
              <a
                key={index}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-gray-50 hover:bg-red-50 rounded-2xl p-6 transition-colors duration-300"
              >
                <h4 className="text-lg font-bold text-gray-900 group-hover:text-red-600 mb-2 transition-colors">
                  {item.title}
                </h4>
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                <div className="flex items-center text-red-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>访问网站</span>
                  <ExternalLink className="w-4 h-4 ml-1" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
