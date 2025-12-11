"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import GalleryFrame from "./GalleryFrame";
import * as THREE from "three";

/**
 * Frame Carousel Component
 * 5 frames in rotating circular carousel with smooth animation
 */
export default function FrameCarousel({ isDarkMode = false }) {
  const carouselRef = useRef();

  // 5 artwork variations
  const artworks = isDarkMode ? [
    { colors: ["#9b5cff", "#ff6b9d", "#feca57"] }, // Purple-Pink-Yellow
    { colors: ["#00d2ff", "#3a7bd5", "#00d2ff"] }, // Cyan-Blue
    { colors: ["#f857a6", "#ff5858", "#feca57"] }, // Pink-Red-Yellow
    { colors: ["#43e97b", "#38f9d7", "#00d2ff"] }, // Green-Cyan-Blue
    { colors: ["#feca57", "#ff9ff3", "#feca57"] }, // Yellow-Pink
  ] : [
    { colors: ["#667eea", "#764ba2", "#f093fb"] }, // Blue-Purple-Pink
    { colors: ["#f093fb", "#f5576c", "#ffd140"] }, // Pink-Red-Yellow
    { colors: ["#4facfe", "#00f2fe", "#43e97b"] }, // Blue-Cyan-Green
    { colors: ["#fa709a", "#fee140", "#30cfd0"] }, // Pink-Yellow-Cyan
    { colors: ["#a18cd1", "#fbc2eb", "#ffecd2"] }, // Purple-Pink-Peach
  ];

  // Smooth continuous rotation animation
  useFrame((state) => {
    if (!carouselRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Continuous smooth rotation
    carouselRef.current.rotation.y = time * 0.2;
    
    // Gentle floating animation
    carouselRef.current.position.y = Math.sin(time * 0.5) * 0.15;
  });

  // Circular arrangement
  const radius = 5.5;
  const frameCount = artworks.length;

  return (
    <group ref={carouselRef}>
      {artworks.map((artwork, index) => {
        const angle = (index / frameCount) * Math.PI * 2;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        
        // Frames menghadap ke luar carousel dengan slight tilt
        const rotationY = angle;
        const tiltX = 0.1; // Slight tilt untuk better viewing

        return (
          <group 
            key={index} 
            position={[x, 0, z]} 
            rotation={[tiltX, rotationY, 0]}
          >
            <GalleryFrame
              isDarkMode={isDarkMode}
              position={[0, 0, 0]}
              artworkColors={artwork.colors}
              disableAnimation={false}
            />
          </group>
        );
      })}

      {/* Center glow light */}
      <pointLight
        position={[0, 0, 0]}
        intensity={isDarkMode ? 2 : 1.5}
        distance={20}
        color={isDarkMode ? "#9b5cff" : "#764ba2"}
      />
      
      {/* Top spotlight untuk dramatic effect */}
      <spotLight
        position={[0, 8, 0]}
        angle={1}
        penumbra={0.8}
        intensity={isDarkMode ? 1.5 : 1}
        color="#ffffff"
        castShadow
      />
    </group>
  );
}
