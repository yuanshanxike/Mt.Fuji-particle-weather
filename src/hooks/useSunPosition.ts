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
      
      // Default view: Camera at X+, looking West (towards -X)
      // East is at some direction. Let's map hours to a 3D orbit.
      // At 6:00 (East), Sun should be at some position.
      // If we are at X+ looking West (-X), then:
      // -X is West
      // +X is East
      // +Y is Up
      // +/-Z is North/South
      
      // We'll rotate in the XY plane for simplicity (Sun rises East +X, sets West -X)
      // x = cos(angle), y = sin(angle)
      // However, we want it to be highest at 12:00.
      // At 12:00, hours=12, angle = (6/24)*2pi = pi/2. cos(pi/2)=0, sin(pi/2)=1. Correct (Up).
      // At 6:00, hours=6, angle = 0. cos(0)=1, sin(0)=0. Correct (East/+X).
      // At 18:00, hours=18, angle = pi. cos(pi)=-1, sin(pi)=0. Correct (West/-X).
      
      const x = Math.cos(angle) * 100;
      const y = Math.sin(angle) * 100;
      const z = 0; // Keeping it simple on the prime vertical for now

      const elevation = Math.sin(angle); // -1 to 1
      const isNight = elevation < 0;
      
      // Intensity logic
      let intensity = 0;
      let ambientIntensity = 0.1;
      let color = '#ffffff';

      if (elevation > 0) {
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
        // Night time
        intensity = 0;
        ambientIntensity = 0.05;
        color = '#1a1a2e'; // Dark blue/purple night light
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
