# 3D Hero Section - Setup & Installation Guide

## 📦 Dependencies yang Diperlukan

Untuk menjalankan 3D Hero Section ini, Anda perlu menginstall dependencies berikut:

```bash
npm install three @react-three/fiber @react-three/drei
```

### Package Details:
- **three**: Library 3D core untuk WebGL
- **@react-three/fiber**: React renderer untuk Three.js
- **@react-three/drei**: Helper components untuk R3F

---

## 📁 Struktur Folder

Berikut struktur folder yang telah dibuat:

```
fe-auction/
├── components/
│   └── 3d/
│       ├── AbstractShape.jsx      # Komponen 3D crystal/glass shape
│       ├── Lighting.jsx           # Lighting adaptif theme
│       ├── Hero3D.jsx             # Canvas & Scene 3D
│       └── HeroSection.jsx        # Hero section utama (layout + text)
├── app/
│   └── page.js                    # Homepage (sudah diupdate)
└── ...
```

---

## 🚀 Cara Menggunakan

### 1. Install Dependencies

Jalankan di terminal (di folder `fe-auction`):

```bash
npm install three @react-three/fiber @react-three/drei
```

### 2. Verifikasi File

Pastikan semua file berikut ada:
- ✅ `components/3d/AbstractShape.jsx`
- ✅ `components/3d/Lighting.jsx`
- ✅ `components/3d/Hero3D.jsx`
- ✅ `components/3d/HeroSection.jsx`
- ✅ `app/page.js` (sudah diupdate)

### 3. Jalankan Development Server

```bash
npm run dev
```

### 4. Buka Browser

Akses: `http://localhost:3000`

Hero section akan muncul dengan:
- ✨ 3D crystal floating animation
- 🌗 Adaptif dark/light mode
- 💫 Interactive hover effects
- 📱 Responsive layout

---

## 🎨 Fitur yang Sudah Diimplementasi

### ✅ Objek 3D
- Crystal/glass shape menggunakan `MeshTransmissionMaterial`
- Floating animation (naik-turun + rotasi)
- Hover tilt effect
- Material properties adaptif (dark/light mode)

### ✅ Lighting
- Key Light, Rim Light, Fill Light
- Ambient & Hemisphere lighting
- Otomatis berubah berdasarkan theme
- Dark mode: lebih dramatic & glowing
- Light mode: soft & reflective

### ✅ Environment
- Dark mode: "studio" preset
- Light mode: "sunset" preset
- Background transparan untuk blend dengan UI

### ✅ Interaksi
- Hover effect pada objek 3D
- Cursor pointer saat hover
- OrbitControls dengan damping
- Smooth animations

### ✅ Layout & UI
- Text hero dengan gradient title
- 2 CTA buttons (Primary + Secondary)
- Live auction badge dengan pulse animation
- Stats section (Artworks, Artists, Sales)
- Decorative gradient backgrounds
- Responsive grid layout

### ✅ Performance
- Dynamic import Canvas (ssr: false)
- Suspense boundary
- dpr optimization [1, 2]
- Minimal loader
- Smooth rendering

### ✅ Responsiveness
- Desktop: Text kiri, 3D kanan (grid 2 kolom)
- Mobile: Text atas, 3D bawah (stack vertical)
- Height: 80vh
- Adaptive spacing & typography

---

## 🎯 Customization

### Ubah Warna Brand

Edit di `components/3d/AbstractShape.jsx`:

```javascript
// Line ~58: Dark mode attenuation color
attenuationColor: new THREE.Color("#9b5cff"), // Ganti dengan warna brand Anda
```

Edit di `components/3d/Lighting.jsx`:

```javascript
// Line ~19: Rim light color
color="#9b5cff" // Ganti dengan warna brand Anda
```

Edit di `components/3d/HeroSection.jsx`:

```javascript
// Line ~74: Gradient text
from-purple-600 via-pink-600 to-purple-600 // Sesuaikan gradient
```

### Ubah Bentuk 3D

Edit di `components/3d/AbstractShape.jsx` (line ~95):

```javascript
// Ganti icosahedronGeometry dengan bentuk lain:
<dodecahedronGeometry args={[2, 0]} />  // Dodecahedron
<torusKnotGeometry args={[1, 0.3, 128, 16]} />  // Torus Knot
<octahedronGeometry args={[2, 0]} />  // Octahedron
```

### Ubah Animation Speed

Edit di `components/3d/AbstractShape.jsx` (line ~22-27):

```javascript
// Floating speed
meshRef.current.position.y = Math.sin(time * 0.5) * 0.3; // 0.5 = speed

// Rotation speed
meshRef.current.rotation.y += 0.005; // Ubah nilai ini
```

---

## 🐛 Troubleshooting

### Issue: "Module not found: Can't resolve '@react-three/fiber'"

**Solusi:**
```bash
npm install three @react-three/fiber @react-three/drei
```

### Issue: "Hydration error" atau "Text content mismatch"

**Solusi:** Pastikan `Hero3D` sudah diimport dengan `dynamic` dan `ssr: false`:
```javascript
const Hero3D = dynamic(() => import("@/components/3d/Hero3D"), {
  ssr: false, // ✅ Penting!
});
```

### Issue: 3D tidak muncul atau canvas hitam

**Solusi:**
1. Check console untuk error
2. Pastikan semua dependencies terinstall
3. Clear `.next` cache: `rm -rf .next` (atau `rmdir /s .next` di Windows)
4. Restart dev server

### Issue: Performance lambat

**Solusi:**
1. Reduce geometry detail:
   ```javascript
   <icosahedronGeometry args={[2, 0]} /> // Detail 1 → 0
   ```
2. Disable shadows jika tidak perlu:
   ```javascript
   <Canvas shadows={false}>
   ```

---

## 📚 Resources

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Drei Helpers](https://github.com/pmndrs/drei)
- [Three.js Manual](https://threejs.org/manual/)
- [MeshTransmissionMaterial](https://github.com/pmndrs/drei#meshtransmissionmaterial)

---

## ✨ Next Steps

Setelah hero section berjalan, Anda bisa:
1. Tambahkan lebih banyak 3D objects
2. Implementasikan scroll animations
3. Tambahkan particle effects
4. Integrasikan dengan data auction real-time
5. Tambahkan sound effects untuk interaksi

---

**Selamat mencoba! 🚀**
