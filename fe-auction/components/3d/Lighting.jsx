"use client";

/**
 * Adaptive Lighting Component
 * Menyesuaikan pencahayaan berdasarkan dark/light mode
 */
export default function Lighting({ isDarkMode = false }) {
  if (isDarkMode) {
    return (
      <>
        {/* Key Light - Lebih kuat di dark mode */}
        <directionalLight
          position={[5, 5, 5]}
          intensity={2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        {/* Rim Light - Aksen ungu brand */}
        <pointLight
          position={[-3, 2, -3]}
          intensity={1.5}
          color="#9b5cff"
          distance={10}
        />

        {/* Fill Light - Biru subtle */}
        <pointLight
          position={[3, -2, 3]}
          intensity={0.8}
          color="#6366f1"
          distance={8}
        />

        {/* Ambient Light - Lembut */}
        <ambientLight intensity={0.3} />

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
      {/* Key Light - Lebih soft di light mode */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Rim Light - Aksen lebih lembut */}
      <pointLight
        position={[-3, 2, -3]}
        intensity={0.8}
        color="#c4b5fd"
        distance={10}
      />

      {/* Fill Light - Warm tone */}
      <pointLight
        position={[3, -2, 3]}
        intensity={0.5}
        color="#fde68a"
        distance={8}
      />

      {/* Ambient Light - Lebih terang */}
      <ambientLight intensity={0.8} />

      {/* Hemisphere Light untuk cahaya natural */}
      <hemisphereLight
        color="#ffffff"
        groundColor="#f5f5f5"
        intensity={0.6}
      />
    </>
  );
}
