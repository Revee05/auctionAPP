"use client";

import { useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import * as THREE from "three";

/**
 * Gallery Frame Component
 * 3D Picture frame dengan artwork canvas - mencerminkan art auction theme
 */
export default function GalleryFrame({ 
  isDarkMode = false, 
  position = [0, 0, 0],
  artworkColors = null,
  disableAnimation = false 
}) {
  const groupRef = useRef();
  const frameRef = useRef();
  const artworkRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Cursor styling saat hover
  useCursor(hovered);

  // Smooth rotation animation dengan floating effect (optional)
  useFrame((state) => {
    if (!groupRef.current || disableAnimation) return;

    const time = state.clock.getElapsedTime();

    // Floating: naik-turun halus
    groupRef.current.position.y = position[1] + Math.sin(time * 0.6) * 0.15;

    // Hover effect: scale
    if (hovered) {
      groupRef.current.scale.lerp(new THREE.Vector3(1.15, 1.15, 1.15), 0.1);
    } else {
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  // Frame material - gold/bronze untuk art gallery feel
  const frameMaterial = isDarkMode
    ? new THREE.MeshStandardMaterial({
        color: new THREE.Color("#d4af37"), // Gold
        metalness: 0.8,
        roughness: 0.2,
        emissive: new THREE.Color("#d4af37"),
        emissiveIntensity: 0.1,
      })
    : new THREE.MeshStandardMaterial({
        color: new THREE.Color("#8b7355"), // Bronze/wood
        metalness: 0.3,
        roughness: 0.4,
        emissive: new THREE.Color("#8b7355"),
        emissiveIntensity: 0.05,
      });

  // Artwork canvas material dengan gradient abstract art
  const canvasTexture = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");

    // Use custom colors or defaults
    const colors = artworkColors || (isDarkMode 
      ? ["#9b5cff", "#ff6b9d", "#feca57"]
      : ["#667eea", "#764ba2", "#f093fb"]);

    // Abstract gradient artwork
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add abstract shapes with fixed seed values
    ctx.globalAlpha = 0.3;
    const shapes = [
      { x: 0.2, y: 0.3, r: 150, alpha: 0.4 },
      { x: 0.7, y: 0.6, r: 200, alpha: 0.3 },
      { x: 0.5, y: 0.8, r: 120, alpha: 0.5 },
      { x: 0.8, y: 0.2, r: 180, alpha: 0.35 },
      { x: 0.3, y: 0.7, r: 140, alpha: 0.45 },
    ];
    
    shapes.forEach(shape => {
      ctx.beginPath();
      ctx.arc(
        shape.x * canvas.width,
        shape.y * canvas.height,
        shape.r,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(255, 255, 255, ${shape.alpha})`;
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  })();

  const artworkMaterial = new THREE.MeshStandardMaterial({
    map: canvasTexture,
    roughness: 0.6,
    metalness: 0.1,
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Frame Border - Top */}
      <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 0.3, 0.3]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>

      {/* Frame Border - Bottom */}
      <mesh position={[0, -2.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 0.3, 0.3]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>

      {/* Frame Border - Left */}
      <mesh position={[-2.2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 4.4, 0.3]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>

      {/* Frame Border - Right */}
      <mesh position={[2.2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 4.4, 0.3]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>

      {/* Artwork Canvas */}
      <mesh ref={artworkRef} position={[0, 0, -0.1]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <primitive object={artworkMaterial} attach="material" />
      </mesh>

      {/* Frame backing */}
      <mesh position={[0, 0, -0.15]} receiveShadow>
        <planeGeometry args={[4.2, 4.2]} />
        <meshStandardMaterial
          color={isDarkMode ? "#1a1a1a" : "#f5f5f5"}
          roughness={0.9}
        />
      </mesh>

      {/* Subtle rim light effect */}
      <pointLight
        position={[0, 0, 1]}
        intensity={hovered ? 2 : 1}
        distance={5}
        color={isDarkMode ? "#9b5cff" : "#764ba2"}
      />
    </group>
  );
}
