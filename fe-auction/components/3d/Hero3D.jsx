"use client";

import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei";
import AbstractShape from "./AbstractShape";
import Lighting from "./Lighting";

/**
 * Hero 3D Scene Component
 * Canvas dengan kontrol, environment, dan scene 3D
 */
function Scene({ isDarkMode }) {
  const cameraRef = useRef();

  return (
    <>
      {/* Camera dengan FOV optimal */}
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[0, 0, 8]}
        fov={45}
      />

      {/* Orbit Controls dengan parallax subtle */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
        autoRotate={false}
        enableDamping
        dampingFactor={0.05}
      />

      {/* Environment preset berdasarkan theme */}
      <Environment
        preset={isDarkMode ? "studio" : "sunset"}
        background={false}
        blur={0.8}
      />

      {/* Lighting Component */}
      <Lighting isDarkMode={isDarkMode} />

      {/* Abstract Shape */}
      <AbstractShape isDarkMode={isDarkMode} />
    </>
  );
}

/**
 * Fallback loader minimal
 */
function Loader() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
    </div>
  );
}

/**
 * Main Hero3D Component
 */
export default function Hero3D({ isDarkMode = false, className = "" }) {
  return (
    <div className={`h-full w-full ${className}`}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
        }}
        style={{
          background: "transparent",
        }}
      >
        <Suspense fallback={null}>
          <Scene isDarkMode={isDarkMode} />
        </Suspense>
      </Canvas>
    </div>
  );
}
