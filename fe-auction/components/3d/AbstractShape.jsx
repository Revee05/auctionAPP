"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, useCursor } from "@react-three/drei";
import * as THREE from "three";

/**
 * Abstract Glass/Crystal Shape Component
 * Adaptif terhadap dark/light mode dengan animasi floating & rotation
 */
export default function AbstractShape({ isDarkMode = false }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Cursor styling saat hover
  useCursor(hovered);

  // Floating animation: naik-turun + rotasi
  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    // Floating: naik-turun halus
    meshRef.current.position.y = Math.sin(time * 0.5) * 0.3;

    // Rotasi perlahan
    meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
    meshRef.current.rotation.y += 0.005;

    // Hover effect: tilt
    if (hovered) {
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z,
        Math.sin(time * 2) * 0.1,
        0.05
      );
    } else {
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z,
        0,
        0.05
      );
    }
  });

  // Material properties berdasarkan theme
  const materialProps = isDarkMode
    ? {
        // Dark mode: lebih glow dan transmissive
        transmission: 1,
        thickness: 1.5,
        roughness: 0.1,
        chromaticAberration: 0.5,
        anisotropy: 0.5,
        distortion: 0.3,
        distortionScale: 0.5,
        temporalDistortion: 0.1,
        clearcoat: 1,
        attenuationDistance: 0.5,
        attenuationColor: new THREE.Color("#9b5cff"),
        color: new THREE.Color("#ffffff"),
        ior: 1.5,
      }
    : {
        // Light mode: soft shadow, refleksi lembut
        transmission: 0.95,
        thickness: 1.0,
        roughness: 0.2,
        chromaticAberration: 0.3,
        anisotropy: 0.3,
        distortion: 0.2,
        distortionScale: 0.3,
        temporalDistortion: 0.05,
        clearcoat: 0.8,
        attenuationDistance: 0.8,
        attenuationColor: new THREE.Color("#e0e0e0"),
        color: new THREE.Color("#fafafa"),
        ior: 1.3,
      };

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
      receiveShadow
    >
      {/* Bentuk: Icosahedron (crystal-like) */}
      <icosahedronGeometry args={[2, 1]} />
      
      {/* Material transmission glass/crystal */}
      <MeshTransmissionMaterial {...materialProps} />
    </mesh>
  );
}
