import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Clouds, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { getWeatherType } from '@/hooks/useWeather';
import { useSunPosition } from '@/hooks/useSunPosition';

interface ParticleSceneProps {
  weatherCode: number;
  useMesh?: boolean;
}

// Mount Fuji shape function - returns height at x, z position
function getMountainHeight(x: number, z: number): number {
  const distance = Math.sqrt(x * x + z * z);
  const angle = Math.atan2(z, x);
  
  // Base mountain shape - conical
  let baseHeight = Math.max(0, 15 - distance * 0.8);
  
  // Add crater effect (Mt. Fuji's summit is a caldera)
  // If we are close to the center and high up, we "carve out" a crater
  const craterRadius = 1.8;
  const craterDepth = 1.2;
  if (distance < craterRadius && baseHeight > 13) {
    const craterFactor = 1 - Math.cos((distance / craterRadius) * (Math.PI / 2));
    baseHeight -= (1 - craterFactor) * craterDepth;
  }

  // Add some noise/irregularity
  const noise = Math.sin(x * 2) * Math.cos(z * 2) * 0.3 + 
                Math.sin(x * 5 + z * 3) * 0.1;
  
  // Make it slightly asymmetrical like real Fuji
  const asymmetry = Math.cos(angle) * 0.5;
  
  return Math.max(0, baseHeight + noise + asymmetry * 0.3);
}

// Mountain Mesh Component
function MountainMesh({ isNight }: { isNight?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const segments = 128;
  const size = 40;
  
  const { geometry, colors } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2); // Lay flat
    
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const snowThreshold = 6;
    
    const snowColorArr = isNight ? [0.81, 0.85, 0.88] : [1, 1, 1]; // #d0d9e1 vs #ffffff
    const baseColorArr = isNight ? [0.17, 0.20, 0.21] : [0.29, 0.30, 0.41]; // #2d3436 vs #4a4e69

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = getMountainHeight(x, z);
      
      // We subtract 5 to match particle scene offset (y - 5)
      pos.setY(i, h - 5);
      
      // Color based on height
      const isSnow = h > snowThreshold;
      const color = isSnow ? snowColorArr : baseColorArr;
      
      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];
    }
    
    geo.computeVertexNormals();
    return { geometry: geo, colors };
  }, [isNight]);

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow castShadow>
      <bufferAttribute
        attach="geometry-attributes-color"
        args={[colors, 3]}
      />
      <meshPhongMaterial 
        vertexColors 
        shininess={10} 
        emissive={isNight ? 0x050510 : 0x000000}
      />
    </mesh>
  );
}

// Mountain Mesh (Flat Shaded / Low Poly) Component
function MountainMeshFlat({ isNight }: { isNight?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const segments = 64; // Lower segments for a more "mesh" look
  const size = 40;
  
  const { geometry, colors } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const snowThreshold = 6;
    
    const snowColorArr = isNight ? [0.81, 0.85, 0.88] : [1, 1, 1];
    const baseColorArr = isNight ? [0.17, 0.20, 0.21] : [0.29, 0.30, 0.41];

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = getMountainHeight(x, z);
      pos.setY(i, h - 5);
      
      const isSnow = h > snowThreshold;
      const color = isSnow ? snowColorArr : baseColorArr;
      
      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];
    }
    
    geo.computeVertexNormals();
    return { geometry: geo, colors };
  }, [isNight]);

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow castShadow>
      <bufferAttribute
        attach="geometry-attributes-color"
        args={[colors, 3]}
      />
      <meshStandardMaterial 
        vertexColors 
        flatShading={true} // Crucial for "untextured mesh" look
        roughness={0.8}
        metalness={0.2}
        emissive={isNight ? 0x050510 : 0x000000}
      />
    </mesh>
  );
}

// Lake configuration representing the Fuji Five Lakes
// Camera is at (0, 2, 25) looking at (0, 3, 0), so +Z is South, -Z is North.
const LAKE_DATA = [
  { name: 'Yamanakako', x: 12, z: 5, width: 6, depth: 8, count: 1200 }, // ESE
  { name: 'Kawaguchiko', x: 2, z: -10, width: 10, depth: 5, count: 1500 }, // N
  { name: 'Saiko', x: -6, z: -10, width: 5, depth: 4, count: 800 }, // NNW
  { name: 'Shojiko', x: -10, z: -8, width: 3, depth: 3, count: 500 }, // NW
  { name: 'Motosuko', x: -14, z: -5, width: 5, depth: 6, count: 1000 }, // WNW
];

// Single Lake Component
function LakeParticles({ x: lakeX, z: lakeZ, width, depth, count, isNight }: { 
  x: number; z: number; width: number; depth: number; count: number; isNight?: boolean 
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const { positions, initialY } = useMemo(() => {
    const positions: number[] = [];
    const initialY: number[] = [];
    
    for (let i = 0; i < count; i++) {
      // Create an oval/organic shape for each lake
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()); // Uniform distribution in circle
      
      const localX = r * Math.cos(angle) * (width / 2);
      const localZ = r * Math.sin(angle) * (depth / 2);
      
      const posX = lakeX + localX;
      const posZ = lakeZ + localZ;
      const posY = -5 + Math.random() * 0.2; // Slightly varied water level
      
      positions.push(posX, posY, posZ);
      initialY.push(posY);
    }
    
    return { positions, initialY };
  }, [lakeX, lakeZ, width, depth, count]);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorWater = useMemo(() => {
    return isNight ? new THREE.Color(0x2a3a5a) : new THREE.Color(0x4A90A4);
  }, [isNight]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const px = positions[idx];
      const pz = positions[idx + 2];
      
      // Gentle wave motion
      const waveY = Math.sin(time * 0.8 + px * 0.5 + pz * 0.3) * 0.08 +
                    Math.sin(time * 0.5 + px * 0.3) * 0.05;
      
      dummy.position.set(
        px,
        initialY[i] + waveY,
        pz
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
    for (let i = 0; i < count; i++) {
      meshRef.current.setColorAt(i, colorWater);
    }
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [colorWater, count]);
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 5, 5]} />
      <meshPhongMaterial transparent opacity={0.7} />
    </instancedMesh>
  );
}

// Main Water Component wrapping all lakes
function WaterParticles({ isNight }: { isNight?: boolean }) {
  return (
    <>
      {LAKE_DATA.map((lake) => (
        <LakeParticles
          key={lake.name}
          x={lake.x}
          z={lake.z}
          width={lake.width}
          depth={lake.depth}
          count={lake.count}
          isNight={isNight}
        />
      ))}
    </>
  );
}

// Surrounding Land Mesh
function LandMesh({ isNight }: { isNight?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const segments = 64;
  const size = 100; // Larger than mountain to fill horizon
  
  const { geometry, colors } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    
    // Earthy tones
    // Day: #3d405b (Neutral dark blue-grey/earth)
    // Night: #1a1c29 (Darker)
    const baseColorDay = new THREE.Color('#3d405b');
    const baseColorNight = new THREE.Color('#1a1c29');
    
    // Secondary tone for variation (slightly lighter)
    const varColorDay = new THREE.Color('#555975');
    const varColorNight = new THREE.Color('#252838');

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      
      // Gentle rolling hills, low frequency
      let h = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 1.5 +
              Math.sin(x * 0.3 + z * 0.2) * 0.5;
              
      // Flatten near the mountain base (radius < 20) to blend
      if (dist < 20) {
        h *= (dist / 20) * (dist / 20); // Smooth falloff to 0 at center
      }
      
      // Position at base level (-5)
      // We position it slightly above -5 (-4.8) to cover the flat "skirt" of the MountainMesh
      // which sits at -5.0. The mountain cone will rise out of this land.
      pos.setY(i, h - 4.8); 
      
      // Color variation based on height
      const noise = Math.random();
      const isVar = h > 0.5 || noise > 0.7;
      
      const c1 = isNight ? baseColorNight : baseColorDay;
      const c2 = isNight ? varColorNight : varColorDay;
      const finalColor = isVar ? c2 : c1;
      
      colors[i * 3] = finalColor.r;
      colors[i * 3 + 1] = finalColor.g;
      colors[i * 3 + 2] = finalColor.b;
    }
    
    geo.computeVertexNormals();
    return { geometry: geo, colors };
  }, [isNight]);

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      <bufferAttribute
        attach="geometry-attributes-color"
        args={[colors, 3]}
      />
      <meshStandardMaterial 
        vertexColors 
        roughness={0.9}
        metalness={0.1}
        emissive={isNight ? 0x050510 : 0x000000}
      />
    </mesh>
  );
}

// Volumetric Cloud Component
function VolumetricClouds({ weatherCode, isNight }: { weatherCode: number; isNight?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const weatherType = getWeatherType(weatherCode);
  
  const config = useMemo(() => {
    // Default: Sunny
    let segments = 20;
    let bounds: [number, number, number] = [30, 4, 30];
    let volume = 10;
    let color = new THREE.Color('#fff8db'); // Warm white
    let opacity = 0.5;
    let driftSpeed = 0.2; // Speed of the group moving
    let cloudSpeed = 0.1; // Internal animation speed
    let growth = 4;
    let position: [number, number, number] = [0, 12, 0];

    if (weatherType === 'rainy') {
      segments = 60;
      volume = 15;
      color.set('#5a6473'); // Dark slate gray
      opacity = 0.8;
      driftSpeed = 1.0;
      cloudSpeed = 0.5;
      growth = 6;
      position = [0, 10, 0]; // Lower clouds
    } else if (weatherType === 'cloudy') {
      segments = 50;
      volume = 12;
      color.set('#c4c4c4'); // Light gray
      opacity = 0.7;
      driftSpeed = 0.5;
      cloudSpeed = 0.2;
      growth = 5;
    } else if (weatherType === 'snowy') {
      segments = 40;
      volume = 12;
      color.set('#e8ebed');
      opacity = 0.7;
      driftSpeed = 0.3;
      cloudSpeed = 0.1;
      growth = 5;
    }

    if (isNight) {
      // Nighttime adjustments
      color.multiplyScalar(0.15); // Much darker
      opacity *= 0.6; // Less visible
    }

    return { segments, bounds, volume, color, opacity, driftSpeed, cloudSpeed, growth, position };
  }, [weatherType, isNight]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Drift the entire cloud system
      groupRef.current.position.x += config.driftSpeed * delta;
      
      // Wrap around for continuous drift
      if (groupRef.current.position.x > 30) {
        groupRef.current.position.x = -30;
      }
    }
  });

  return (
    <group ref={groupRef} position={new THREE.Vector3(...config.position)}>
      <Clouds material={THREE.MeshLambertMaterial} limit={400}>
        <Cloud
          seed={1}
          segments={config.segments}
          bounds={config.bounds}
          volume={config.volume}
          color={config.color}
          opacity={config.opacity}
          growth={config.growth}
          speed={config.cloudSpeed}
          fade={10}
        />
        {/* Second layer for depth if not sunny */}
        {weatherType !== 'sunny' && (
          <Cloud
            seed={2}
            segments={config.segments / 2}
            bounds={[config.bounds[0], config.bounds[1] * 1.5, config.bounds[2]]}
            volume={config.volume}
            color={config.color}
            opacity={config.opacity * 0.8}
            growth={config.growth * 1.2}
            position={[5, 2, 5]}
            speed={config.cloudSpeed}
            fade={10}
          />
        )}
      </Clouds>
    </group>
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
function SceneContent({ weatherCode, useMesh }: { weatherCode: number; useMesh?: boolean }) {
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
      
      {/* Mountain - Mesh or Flat Mesh */}
      {useMesh ? (
        <MountainMesh isNight={sun.isNight} />
      ) : (
        <MountainMeshFlat isNight={sun.isNight} />
      )}
      
      {/* Surrounding Land */}
      <LandMesh isNight={sun.isNight} />
      
      {/* Water - made of particles representing the 5 lakes */}
      <WaterParticles isNight={sun.isNight} />
      
      {/* Clouds - Volumetric */}
      <VolumetricClouds weatherCode={weatherCode} isNight={sun.isNight} />
      
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
export default function ParticleScene({ weatherCode, useMesh }: ParticleSceneProps) {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 2, 25], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        shadows
      >
        <SceneContent weatherCode={weatherCode} useMesh={useMesh} />
      </Canvas>
    </div>
  );
}
