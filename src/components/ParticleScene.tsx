import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getWeatherType } from '@/hooks/useWeather';
import { useSunPosition } from '@/hooks/useSunPosition';

interface ParticleSceneProps {
  weatherCode: number;
}

// Mount Fuji shape function - returns height at x, z position
function getMountainHeight(x: number, z: number): number {
  const distance = Math.sqrt(x * x + z * z);
  const angle = Math.atan2(z, x);
  
  // Base mountain shape - conical with some asymmetry
  let baseHeight = Math.max(0, 15 - distance * 0.8);
  
  // Add some noise/irregularity
  const noise = Math.sin(x * 2) * Math.cos(z * 2) * 0.3 + 
                Math.sin(x * 5 + z * 3) * 0.1;
  
  // Make it slightly asymmetrical like real Fuji
  const asymmetry = Math.cos(angle) * 0.5;
  
  return Math.max(0, baseHeight + noise + asymmetry * 0.3);
}

// Mountain Particles Component
function MountainParticles({ isNight }: { isNight?: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particleCount = 8000;
  
  const { positions, scales } = useMemo(() => {
    const positions: number[] = [];
    const scales: number[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Random position in a circle
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 18;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Get mountain height at this position
      const height = getMountainHeight(x, z);
      
      // Distribute particles vertically up to the height
      const y = Math.random() * height;
      
      positions.push(x, y - 5, z);
      
      // Scale based on position (smaller particles higher up)
      const scale = 0.08 + Math.random() * 0.06;
      scales.push(scale);
    }
    
    return { positions, scales };
  }, []);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Subtle mountain breathing animation
    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];
      
      dummy.position.set(
        x + Math.sin(time * 0.2 + y * 0.1) * 0.02,
        y,
        z + Math.cos(time * 0.15 + x * 0.1) * 0.02
      );
      dummy.scale.setScalar(scales[i]);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Set mountain color - darker at night with snow top
  useEffect(() => {
    if (!meshRef.current) return;
    
    const color = new THREE.Color();
    const snowThreshold = 6; // Height threshold for snow top
    
    for (let i = 0; i < particleCount; i++) {
      const y = positions[i * 3 + 1];
      
      if (y > snowThreshold) {
        // Snow top
        color.set(isNight ? 0xd0d9e1 : 0xffffff);
      } else {
        // Mountain base
        color.set(isNight ? 0x2d3436 : 0x4a4e69);
      }
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [isNight, positions]);
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshPhongMaterial emissive={isNight ? 0x050510 : 0x000000} />
    </instancedMesh>
  );
}

// Water/Lake Particles Component
function WaterParticles({ isNight }: { isNight?: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particleCount = 4000;
  
  const { positions, initialY } = useMemo(() => {
    const positions: number[] = [];
    const initialY: number[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Create a lake in front of the mountain
      const angle = Math.random() * Math.PI;
      const radius = 3 + Math.random() * 12;
      const x = Math.cos(angle + Math.PI) * radius;
      const z = Math.sin(angle + Math.PI) * radius + 8;
      
      const y = -5 + Math.random() * 0.3;
      
      positions.push(x, y, z);
      initialY.push(y);
    }
    
    return { positions, initialY };
  }, []);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorWater = useMemo(() => {
    return isNight ? new THREE.Color(0x2a3a5a) : new THREE.Color(0x4A90A4);
  }, [isNight]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const x = positions[idx];
      const z = positions[idx + 2];
      
      // Gentle wave motion
      const waveY = Math.sin(time * 0.8 + x * 0.5 + z * 0.3) * 0.08 +
                    Math.sin(time * 0.5 + x * 0.3) * 0.05;
      
      dummy.position.set(
        x,
        initialY[i] + waveY,
        z
      );
      dummy.scale.setScalar(0.1);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  // Set water color
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < particleCount; i++) {
      meshRef.current.setColorAt(i, colorWater);
    }
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [colorWater]);
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[1, 5, 5]} />
      <meshPhongMaterial transparent opacity={0.7} />
    </instancedMesh>
  );
}

// Cloud Particles Component
function CloudParticles({ weatherCode, isNight }: { weatherCode: number; isNight?: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particleCount = 1500;
  const weatherType = getWeatherType(weatherCode);
  
  const initialPositions = useMemo(() => {
    const arr: number[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Clouds around mountain
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 15;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 8 + Math.random() * 6;
      
      arr.push(x, y, z);
    }
    
    return arr;
  }, []);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorCloud = useMemo(() => {
    let baseColor;
    if (weatherType === 'rainy') baseColor = new THREE.Color(0x6B7280);
    else if (weatherType === 'cloudy') baseColor = new THREE.Color(0xD1D5DB);
    else baseColor = new THREE.Color(0xFFFFFF);
    
    if (isNight) {
      baseColor.multiplyScalar(0.4); // Darker at night
    }
    return baseColor;
  }, [weatherType, isNight]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const initialX = initialPositions[idx];
      const initialY = initialPositions[idx + 1];
      const initialZ = initialPositions[idx + 2];
      
      // Cloud drift
      const driftX = Math.sin(time * 0.1 + i * 0.01) * 0.5;
      const driftZ = Math.cos(time * 0.08 + i * 0.01) * 0.3;
      
      dummy.position.set(
        initialX + driftX + time * 0.2, // Move with time
        initialY + Math.sin(time * 0.2 + i * 0.1) * 0.2,
        initialZ + driftZ
      );
      
      // Wrap around
      if (dummy.position.x > 25) {
        dummy.position.x -= 50;
      }
      
      dummy.scale.setScalar(0.15 + Math.sin(time + i) * 0.03);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < particleCount; i++) {
      meshRef.current.setColorAt(i, colorCloud);
    }
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [colorCloud]);
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshPhongMaterial transparent opacity={0.6} />
    </instancedMesh>
  );
}

// Weather particles (Rain/Snow)
function WeatherParticles({ weatherCode, isNight }: { weatherCode: number; isNight?: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const weatherType = getWeatherType(weatherCode);
  
  const particleCount = useMemo(() => {
    if (weatherType === 'rainy') return 2000;
    if (weatherType === 'snowy') return 1500;
    return 0;
  }, [weatherType]);
  
  const particles = useMemo(() => {
    const arr: { x: number; y: number; z: number; speed: number; offset: number }[] = [];
    for (let i = 0; i < particleCount; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 40,
        y: Math.random() * 30,
        z: (Math.random() - 0.5) * 40,
        speed: weatherType === 'rainy' ? 0.3 + Math.random() * 0.2 : 0.05 + Math.random() * 0.05,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [particleCount, weatherType]);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => {
    let baseColor;
    if (weatherType === 'rainy') baseColor = new THREE.Color(0x87CEEB);
    else if (weatherType === 'snowy') baseColor = new THREE.Color(0xFFFFFF);
    else baseColor = new THREE.Color(0xFFFFFF);
    
    if (isNight) {
      baseColor.multiplyScalar(0.6);
    }
    return baseColor;
  }, [weatherType, isNight]);
  
  useFrame((state) => {
    if (!meshRef.current || particleCount === 0) return;
    
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      
      // Fall down
      p.y -= p.speed;
      
      // Reset when hitting bottom
      if (p.y < -10) {
        p.y = 20;
        p.x = (Math.random() - 0.5) * 40;
        p.z = (Math.random() - 0.5) * 40;
      }
      
      // Snow sway
      const swayX = weatherType === 'snowy' ? Math.sin(time + p.offset) * 0.5 : 0;
      const swayZ = weatherType === 'snowy' ? Math.cos(time + p.offset * 0.7) * 0.3 : 0;
      
      dummy.position.set(p.x + swayX, p.y, p.z + swayZ);
      
      // Scale based on type
      const scale = weatherType === 'rainy' ? 0.02 : 0.08;
      dummy.scale.set(
        weatherType === 'rainy' ? 0.01 : scale,
        weatherType === 'rainy' ? 0.15 : scale,
        weatherType === 'rainy' ? 0.01 : scale
      );
      
      // Rotation for snow
      if (weatherType === 'snowy') {
        dummy.rotation.set(
          time + p.offset,
          time * 0.5 + p.offset,
          0
        );
      }
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  useEffect(() => {
    if (!meshRef.current || particleCount === 0) return;
    for (let i = 0; i < particleCount; i++) {
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [color, particleCount]);
  
  if (particleCount === 0) return null;
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshPhongMaterial transparent opacity={0.7} />
    </instancedMesh>
  );
}

// Ambient particles (for sunny weather)
function AmbientParticles({ weatherCode, isNight }: { weatherCode: number; isNight?: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const weatherType = getWeatherType(weatherCode);
  
  const particleCount = useMemo(() => {
    return weatherType === 'sunny' ? 300 : 100;
  }, [weatherType]);
  
  const particles = useMemo(() => {
    const arr: { x: number; y: number; z: number; speed: number; phase: number }[] = [];
    for (let i = 0; i < particleCount; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 30,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 30,
        speed: 0.01 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [particleCount]);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => {
    const baseColor = new THREE.Color(0xFFD700);
    if (isNight) baseColor.setHex(0x5f5f5f);
    return baseColor;
  }, [isNight]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      
      // Gentle floating
      const y = p.y + Math.sin(time * p.speed + p.phase) * 0.5;
      const x = p.x + Math.cos(time * p.speed * 0.7 + p.phase) * 0.2;
      
      dummy.position.set(x, y, p.z);
      dummy.scale.setScalar(0.05 + Math.sin(time + p.phase) * 0.02);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < particleCount; i++) {
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [color, particleCount]);
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshPhongMaterial transparent opacity={0.5} />
    </instancedMesh>
  );
}

// Camera Controller
function CameraController() {
  const { camera } = useThree();
  const mouseRef = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  useFrame(() => {
    // Gentle camera movement based on mouse
    const targetX = mouseRef.current.x * 2;
    const targetY = mouseRef.current.y * 1 + 2;
    
    camera.position.x += (targetX - camera.position.x) * 0.02;
    camera.position.y += (targetY - camera.position.y) * 0.02;
    camera.lookAt(0, 3, 0);
  });
  
  return null;
}

// Scene Content
function SceneContent({ weatherCode }: { weatherCode: number }) {
  const sun = useSunPosition();
  
  // Background and fog colors based on time of day
  const bgColor = useMemo(() => {
    if (sun.isNight) return '#0a0a23'; // Night: Dark navy
    
    // Check for Golden Hour (elevation is low but > 0)
    // In useSunPosition, elevation < 0.2 is warm orange
    // sun.position[1] is Y (elevation) * 100
    const y = sun.position[1];
    if (y > 0 && y < 20) return '#ff9e22'; // Golden Hour: Warm orange
    
    return '#87CEEB'; // Clear/Sunny Day: Sky blue
  }, [sun.isNight, sun.position]);

  return (
    <>
      <CameraController />
      
      {/* Lighting */}
      <ambientLight intensity={sun.ambientIntensity} />
      <directionalLight 
        position={sun.position} 
        intensity={sun.intensity} 
        color={sun.color}
        castShadow
      />
      
      {/* Mountain - made of particles */}
      <MountainParticles isNight={sun.isNight} />
      
      {/* Water - made of particles */}
      <WaterParticles isNight={sun.isNight} />
      
      {/* Clouds - made of particles */}
      <CloudParticles weatherCode={weatherCode} isNight={sun.isNight} />
      
      {/* Weather particles (rain/snow) */}
      <WeatherParticles weatherCode={weatherCode} isNight={sun.isNight} />
      
      {/* Ambient particles */}
      <AmbientParticles weatherCode={weatherCode} isNight={sun.isNight} />
      
      {/* Background gradient */}
      <color attach="background" args={[bgColor]} />
      
      {/* Fog for depth */}
      <fog attach="fog" args={[bgColor, 15, 50]} />
    </>
  );
}

// Main Particle Scene Component
export default function ParticleScene({ weatherCode }: ParticleSceneProps) {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 2, 25], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <SceneContent weatherCode={weatherCode} />
      </Canvas>
    </div>
  );
}
