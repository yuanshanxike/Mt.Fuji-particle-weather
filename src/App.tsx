import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useWeather } from '@/hooks/useWeather';
import HeroSection from '@/sections/HeroSection';
import LiveCamera from '@/sections/LiveCamera';
import WeatherForecast from '@/sections/WeatherForecast';
import Footer from '@/sections/Footer';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const weather = useWeather();

  useEffect(() => {
    // Initialize smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // Refresh ScrollTrigger on window resize
    const handleResize = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Particle Weather */}
      <HeroSection weather={weather} />

      {/* Live Camera Section */}
      <LiveCamera />

      {/* Weather Forecast Section */}
      <WeatherForecast forecast={weather.forecast} />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
