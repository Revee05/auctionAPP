"use client";

/**
 * Adaptive Lighting Component
 * Gallery-style lighting dengan spotlight untuk artwork
 */
export default function Lighting({ isDarkMode = false }) {
  if (isDarkMode) {
    return (
      <>
        {/* Main Spotlight - Gallery style untuk artwork */}
        <spotLight
          position={[0, 5, 5]}
          angle={0.5}
          penumbra={0.5}
          intensity={3}
          castShadow
          shadow-mapSize={[2048, 2048]}
          color="#ffffff"
          target-position={[0, 0, 0]}
        />

        {/* Secondary Spotlight - dari samping */}
        <spotLight
          position={[-4, 3, 2]}
          angle={0.6}
          penumbra={0.6}
          intensity={1.5}
          color="#9b5cff"
        />

        {/* Rim Light - Aksen ungu brand */}
        <pointLight
          position={[-3, 2, -3]}
          intensity={1.2}
          color="#9b5cff"
          distance={10}
        />

        {/* Fill Light - Biru subtle */}
        <pointLight
          position={[3, -2, 3]}
          intensity={0.6}
          color="#6366f1"
          distance={8}
        />

        {/* Ambient Light - Lembut */}
        <ambientLight intensity={0.2} />

        {/* Hemisphere Light untuk gradasi natural */}
        <hemisphereLight
          color="#9b5cff"
          groundColor="#1a1a2e"
          intensity={0.5}
        />
      </>
    );
  }

  // Light mode
  return (
    <>
      {/* Main Spotlight - Gallery style untuk artwork */}
      <spotLight
        position={[0, 5, 5]}
        angle={0.5}
        penumbra={0.5}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        color="#ffffff"
        target-position={[0, 0, 0]}
      />

      {/* Secondary Spotlight - dari samping */}
      <spotLight
        position={[-4, 3, 2]}
        angle={0.6}
        penumbra={0.6}
        intensity={1}
        color="#764ba2"
      />

      {/* Rim Light - Aksen lebih lembut */}
      <pointLight
        position={[-3, 2, -3]}
        intensity={0.6}
        color="#c4b5fd"
        distance={10}
      />

      {/* Fill Light - Warm tone */}
      <pointLight
        position={[3, -2, 3]}
        intensity={0.4}
        color="#fde68a"
        distance={8}
      />

      {/* Ambient Light - Lebih terang */}
      <ambientLight intensity={0.6} />

      {/* Hemisphere Light untuk cahaya natural */}
      <hemisphereLight
        color="#ffffff"
        groundColor="#f5f5f5"
        intensity={0.6}
      />
    </>
  );
}
