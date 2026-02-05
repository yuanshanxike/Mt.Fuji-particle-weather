# Mt.Fuji Particle Weather - Project Guide

## 🗻 Project Overview
A React-based web application that visualizes real-time weather at Mount Fuji using advanced particle systems. It combines 3D graphics with practical weather data for a unique user experience.

## 🛠 Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **3D Graphics**: Three.js, React Three Fiber (R3F)
- **Animation**: GSAP (GreenSock Animation Platform)
- **Styling**: Tailwind CSS, PostCSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Data Fetching**: Open-Meteo API
- **Smooth Scrolling**: Lenis

## 📁 Project Structure
```text
mt-fuji-weather/
├── src/
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── ParticleScene.tsx # Main 3D particle logic
│   │   └── ParticleWeather.tsx
│   ├── hooks/
│   │   ├── useWeather.ts     # Open-Meteo API integration
│   │   └── use-mobile.ts
│   ├── lib/
│   │   └── utils.ts          # Tailwind merge utilities
│   ├── sections/
│   │   ├── HeroSection.tsx   # Top section with 3D scene
│   │   ├── LiveCamera.tsx    # Fuji live cam view
│   │   ├── WeatherForecast.tsx # Hourly forecast cards
│   │   └── Footer.tsx
│   ├── App.tsx               # Main layout & GSAP init
│   └── main.tsx              # Entry point
├── public/                   # Static assets (mountain images)
├── components.json           # shadcn/ui config
└── package.json              # Dependencies & Scripts
```

## ❄️ Key Features & Logic

### 1. Particle System (`ParticleScene.tsx`)
- **Mount Fuji**: Generated using 8000 spheres distributed based on a mathematical height function (`getMountainHeight`).
- **Dynamic Weather**: Particles change state based on the `weatherType` (Sunny, Cloudy, Rainy, Snowy).
- **Water Reflection**: Simulates a lake in front of the mountain with sine-wave motion.
- **Interactive Camera**: Parallax effect where the camera follows mouse movement.

### 2. Weather Logic (`useWeather.ts`)
- Fetches data for coordinates **35.3606° N, 138.7274° E** (Mt. Fuji).
- Maps WMO codes to localized Chinese descriptions and categories (sunny/rainy/etc).
- Auto-refreshes every 30 minutes.

### 3. Animations (`App.tsx` & `sections/`)
- Uses GSAP for scroll-triggered animations.
- Tailwind Animate for UI transitions.

## 🚀 Getting Started
1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Build for production: `npm run build`

## 📝 Development Notes
- The particle count is optimized for performance, but adding more complex shaders or post-processing might impact mobile users.
- Coordinates are fixed to Mt. Fuji but could be parameterized for other locations in the future.
