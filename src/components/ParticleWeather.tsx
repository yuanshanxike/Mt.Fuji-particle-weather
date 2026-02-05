import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWeatherType } from '@/hooks/useWeather';

interface ParticleSystemProps {
  weatherCode: number;
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
}

function ParticleSystem({ weatherCode, mousePosition }: ParticleSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const weatherType = getWeatherType(weatherCode);
  
  const particleCount = useMemo(() => {
    switch (weatherType) {
      case 'sunny': return 150;
      case 'cloudy': return 80;
      case 'rainy': return 800;
      case 'snowy': return 400;
      default: return 150;
    }
  }, [weatherType]);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < particleCount; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 10,
        ],
        velocity: [
          (Math.random() - 0.5) * 0.02,
          weatherType === 'rainy' ? -0.1 - Math.random() * 0.1 :
          weatherType === 'snowy' ? -0.02 - Math.random() * 0.03 :
          weatherType === 'sunny' ? 0.01 + Math.random() * 0.01 :
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
        ],
        scale: weatherType === 'rainy' ? 0.02 :
               weatherType === 'snowy' ? 0.05 + Math.random() * 0.05 :
               0.1 + Math.random() * 0.1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
      });
    }
    return temp;
  }, [particleCount, weatherType]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => {
    switch (weatherType) {
      case 'sunny': return new THREE.Color(0xFFD700);
      case 'cloudy': return new THREE.Color(0xAAAAAA);
      case 'rainy': return new THREE.Color(0x87CEEB);
      case 'snowy': return new THREE.Color(0xFFFFFF);
      default: return new THREE.Color(0xFFD700);
    }
  }, [weatherType]);

  useFrame(() => {
    if (!meshRef.current) return;

    const mouseX = mousePosition.current.x * 10;
    const mouseY = mousePosition.current.y * 10;

    particles.forEach((particle, i) => {
      // Update position
      particle.position[0] += particle.velocity[0];
      particle.position[1] += particle.velocity[1];
      particle.position[2] += particle.velocity[2];

      // Mouse repulsion
      const dx = particle.position[0] - mouseX;
      const dy = particle.position[1] - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 2) {
        const force = (2 - dist) * 0.01;
        particle.position[0] += dx * force;
        particle.position[1] += dy * force;
      }

      // Rotation for snow
      if (weatherType === 'snowy') {
        particle.rotation += particle.rotationSpeed;
      }

      // Reset particles that go out of bounds
      if (particle.position[1] < -10) {
        particle.position[1] = 10;
        particle.position[0] = (Math.random() - 0.5) * 20;
      }
      if (particle.position[0] > 10) particle.position[0] = -10;
      if (particle.position[0] < -10) particle.position[0] = 10;
      if (weatherType === 'sunny' && particle.position[1] > 10) {
        particle.position[1] = -10;
      }

      // Update dummy object
      dummy.position.set(
        particle.position[0],
        particle.position[1],
        particle.position[2]
      );
      dummy.scale.setScalar(particle.scale);
      dummy.rotation.z = particle.rotation;
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Set colors
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < particleCount; i++) {
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [color, particleCount]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <planeGeometry args={[1, weatherType === 'rainy' ? 4 : 1]} />
      <meshBasicMaterial
        transparent
        opacity={weatherType === 'sunny' ? 0.6 : 0.8}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

interface ParticleWeatherProps {
  weatherCode: number;
}

export default function ParticleWeather({ weatherCode }: ParticleWeatherProps) {
  const mousePosition = useRef({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent) => {
    mousePosition.current = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1,
    };
  };

  return (
    <div
      className="absolute inset-0 pointer-events-auto"
      onMouseMove={handleMouseMove}
      style={{ zIndex: 10 }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ParticleSystem weatherCode={weatherCode} mousePosition={mousePosition} />
      </Canvas>
    </div>
  );
}
