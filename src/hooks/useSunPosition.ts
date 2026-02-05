import { useState, useEffect } from 'react';

interface SunPosition {
  position: [number, number, number];
  intensity: number;
  color: string;
  ambientIntensity: number;
  isNight: boolean;
}

/**
 * useSunPosition hook
 * Calculates sun position for Mt. Fuji (approx 35.3606° N, 138.7274° E)
 * Current time in Asia/Tokyo (UTC+9)
 */
export const useSunPosition = (): SunPosition => {
  const [sunData, setSunData] = useState<SunPosition>({
    position: [0, 100, 0],
    intensity: 1,
    color: '#ffffff',
    ambientIntensity: 0.5,
    isNight: false,
  });

  useEffect(() => {
    const updateSun = () => {
      // Current time in JST (UTC+9)
      const now = new Date();
      const jstOffset = 9 * 60; // minutes
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const jstDate = new Date(utc + jstOffset * 60000);

      const hours = jstDate.getHours() + jstDate.getMinutes() / 60;
      
      // Simplified sun path calculation
      // 0:00 -> -90 deg (Bottom)
      // 6:00 -> 0 deg (East sunrise)
      // 12:00 -> 90 deg (Zenith)
      // 18:00 -> 180 deg (West sunset)
      // 24:00 -> 270 deg
      
      const angle = ((hours - 6) / 24) * 2 * Math.PI;
      
      const elevation = Math.sin(angle); // -1 to 1
      const isNight = elevation < 0;
      
      // Calculate position
      let x, y, z;
      if (!isNight) {
        // Sun position
        x = Math.cos(angle) * 100;
        y = Math.sin(angle) * 100;
        z = 0;
      } else {
        // Moon position: 12-hour offset from sun
        // angle + Math.PI gives the opposite position
        const moonAngle = angle + Math.PI;
        x = Math.cos(moonAngle) * 100;
        y = Math.sin(moonAngle) * 100;
        z = 0;
      }

      // Intensity and color logic
      let intensity = 0;
      let ambientIntensity = 0.1;
      let color = '#ffffff';

      if (!isNight) {
        // Day time
        intensity = Math.min(elevation * 1.5, 1);
        ambientIntensity = 0.2 + elevation * 0.4;

        // Color logic
        if (elevation < 0.2) {
          // Sunrise/Sunset (Golden hour)
          color = '#ff9e22'; // Warm orange
        } else if (elevation < 0.5) {
          color = '#ffcf8a'; // Soft yellow
        } else {
          color = '#ffffff'; // White noon
        }
      } else {
        // Night time (Moonlight)
        intensity = 0.4;
        color = '#b9c6d2';
        ambientIntensity = 0.15;
      }

      setSunData({
        position: [x, y, z],
        intensity,
        color,
        ambientIntensity,
        isNight,
      });
    };

    updateSun();
    const interval = setInterval(updateSun, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return sunData;
};
