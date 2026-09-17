import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * VirusBackground3D — True Camera Focal Length & Depth-of-Field (DOF) Cellular Scene
 * 
 * Implements an authentic optical camera depth-of-field effect:
 * 1. Out-of-Focus Bokeh Plane (Hardware GPU Blur):
 *    - Extreme foreground cell (close to camera lens): wide bokeh blur & sweeping parallax
 *    - Deep background cells (far distance): soft atmospheric blur & subtle parallax
 *    - Distant floating antibodies & micro-motes
 * 2. In-Focus Plane (Razor Sharp):
 *    - Subject virus cell positioned right at the camera focal plane (Z: 0)
 *    - Sharp glycoprotein spikes, clearcoat transmission, and crisp faceted lighting
 * 3. Color Palette:
 *    - Ultra-light frosted glass / pastel pearl (soft lilac, soft blush rose, frosted crystal)
 *    - Matches the clean white clinical theme of /patient/intake
 * 4. Parallax & Performance:
 *    - Synchronized dual-plane mouse parallax with distance damping
 *    - 60 FPS locked, complete memory disposal on unmount
 */
export const VirusBackground3D = ({ className = '' }) => {
  const containerRef = useRef(null);
  const blurContainerRef = useRef(null);
  const sharpContainerRef = useRef(null);

  useEffect(() => {
    const blurContainer = blurContainerRef.current;
    const sharpContainer = sharpContainerRef.current;
    if (!blurContainer || !sharpContainer) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // =========================================================================
    // 1. SHARED GEOMETRIES & BUILDER UTILITIES
    // =========================================================================
    const cleanupGeometries = [];
    const cleanupMaterials = [];

    const createVirusMesh = ({
      radius = 1.0,
      spikeCount = 52,
      coreColor = 0xf3e8ff,
      spikeColor = 0xfce7f3,
      opacity = 0.6,
      roughness = 0.28,
      transmission = 0.72,
    }) => {
      const group = new THREE.Group();

      const capsidGeo = new THREE.IcosahedronGeometry(radius, 4);
      const capsidMat = new THREE.MeshPhysicalMaterial({
        color: coreColor,
        emissive: 0xfdf4ff,
        emissiveIntensity: 0.1,
        roughness: roughness,
        metalness: 0.05,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12,
        transmission: transmission,
        ior: 1.35,
        transparent: true,
        opacity: opacity,
      });
      const capsidMesh = new THREE.Mesh(capsidGeo, capsidMat);
      group.add(capsidMesh);

      const stemHeight = radius * 0.32;
      const stemGeo = new THREE.CylinderGeometry(radius * 0.032, radius * 0.048, stemHeight, 8);
      stemGeo.translate(0, stemHeight / 2, 0);

      const capRadius = radius * 0.078;
      const capGeo = new THREE.SphereGeometry(capRadius, 8, 8);
      capGeo.translate(0, stemHeight + capRadius * 0.6, 0);

      const spikeMat = new THREE.MeshPhysicalMaterial({
        color: spikeColor,
        emissive: 0xfdf2f8,
        emissiveIntensity: 0.15,
        roughness: 0.22,
        metalness: 0.05,
        clearcoat: 0.95,
        transmission: transmission * 0.85,
        transparent: true,
        opacity: opacity * 1.1,
      });

      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      for (let i = 0; i < spikeCount; i++) {
        const theta = (2 * Math.PI * i) / goldenRatio;
        const phi = Math.acos(1 - (2 * (i + 0.5)) / spikeCount);

        const x = Math.cos(theta) * Math.sin(phi);
        const y = Math.sin(theta) * Math.sin(phi);
        const z = Math.cos(phi);

        const normal = new THREE.Vector3(x, y, z).normalize();
        const surfacePos = normal.clone().multiplyScalar(radius * 0.98);

        const spikeObj = new THREE.Group();
        const stemMesh = new THREE.Mesh(stemGeo, spikeMat);
        const capMesh = new THREE.Mesh(capGeo, spikeMat);
        spikeObj.add(stemMesh);
        spikeObj.add(capMesh);

        spikeObj.position.copy(surfacePos);

        const up = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion().setFromUnitVectors(up, normal);
        spikeObj.setRotationFromQuaternion(quat);

        group.add(spikeObj);
      }

      cleanupGeometries.push(capsidGeo, stemGeo, capGeo);
      cleanupMaterials.push(capsidMat, spikeMat);

      return { group };
    };

    const createAntibodyMesh = ({ scale = 0.32, colorHex = 0xfecdd3, opacity = 0.65 }) => {
      const group = new THREE.Group();
      const armGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.45, 8);
      const mat = new THREE.MeshPhysicalMaterial({
        color: colorHex,
        emissive: 0xfff1f2,
        emissiveIntensity: 0.15,
        roughness: 0.25,
        clearcoat: 0.8,
        transparent: true,
        opacity: opacity,
      });

      const stem = new THREE.Mesh(armGeo, mat);
      stem.position.set(0, -0.22, 0);
      group.add(stem);

      const leftArm = new THREE.Mesh(armGeo, mat);
      leftArm.position.set(-0.16, 0.16, 0);
      leftArm.rotation.z = Math.PI / 4;
      group.add(leftArm);

      const rightArm = new THREE.Mesh(armGeo, mat);
      rightArm.position.set(0.16, 0.16, 0);
      rightArm.rotation.z = -Math.PI / 4;
      group.add(rightArm);

      group.scale.set(scale, scale, scale);

      cleanupGeometries.push(armGeo);
      cleanupMaterials.push(mat);

      return { group };
    };

    // Setup studio lighting for any scene
    const addStudioLighting = (targetScene) => {
      const ambient = new THREE.AmbientLight(0xffffff, 2.6);
      targetScene.add(ambient);

      const main = new THREE.DirectionalLight(0xffffff, 1.8);
      main.position.set(6, 8, 7);
      targetScene.add(main);

      const fill = new THREE.DirectionalLight(0xfdf2f8, 1.2);
      fill.position.set(-6, -3, 4);
      targetScene.add(fill);

      const rim = new THREE.PointLight(0xf5d0fe, 2.0, 18);
      rim.position.set(0, 5, 2);
      targetScene.add(rim);
    };

    // =========================================================================
    // 2. SCENE A: OUT-OF-FOCUS (DISTANT & FOREGROUND BOKEH)
    // =========================================================================
    const blurScene = new THREE.Scene();
    blurScene.fog = new THREE.Fog(0xffffff, 5, 14);
    addStudioLighting(blurScene);

    const blurCamera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    blurCamera.position.set(0, 0, 8.5);

    const blurRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    blurRenderer.setSize(width, height);
    blurRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    blurRenderer.outputColorSpace = THREE.SRGBColorSpace;
    blurContainer.appendChild(blurRenderer.domElement);

    // Distant Cell 1 (Far Top-Left, deep in background blur)
    const vDistantTop = createVirusMesh({
      radius: 0.85,
      spikeCount: 44,
      coreColor: 0xf5f3ff,
      spikeColor: 0xfae8ff,
      opacity: 0.42,
      roughness: 0.45,
      transmission: 0.82,
    });
    vDistantTop.group.position.set(-2.2, 3.4, -4.5);
    blurScene.add(vDistantTop.group);

    // Distant Cell 2 (Far Bottom-Right, deep in background blur)
    const vDistantBottom = createVirusMesh({
      radius: 0.95,
      spikeCount: 46,
      coreColor: 0xfce7f3,
      spikeColor: 0xf3e8ff,
      opacity: 0.38,
      roughness: 0.45,
      transmission: 0.8,
    });
    vDistantBottom.group.position.set(3.8, -3.2, -3.8);
    blurScene.add(vDistantBottom.group);

    // Foreground Cell 3 (Extreme Close-Up Macro Bokeh, Bottom-Left)
    const vForeground = createVirusMesh({
      radius: 1.65,
      spikeCount: 56,
      coreColor: 0xf3e8ff,
      spikeColor: 0xfbcfe8,
      opacity: 0.45,
      roughness: 0.4,
      transmission: 0.78,
    });
    vForeground.group.position.set(-5.2, -1.8, 1.8);
    blurScene.add(vForeground.group);

    // Blurred Distant Antibodies
    const abDistant1 = createAntibodyMesh({ scale: 0.35, colorHex: 0xfecdd3, opacity: 0.45 });
    abDistant1.group.position.set(-3.2, 2.0, -2.5);
    blurScene.add(abDistant1.group);

    const abDistant2 = createAntibodyMesh({ scale: 0.3, colorHex: 0xfef08a, opacity: 0.45 });
    abDistant2.group.position.set(2.8, 2.8, -2.2);
    blurScene.add(abDistant2.group);

    // Atmospheric Micro-Particles
    const moteGeo = new THREE.BufferGeometry();
    const motePos = new Float32Array(150 * 3);
    for (let i = 0; i < 150; i++) {
      motePos[i * 3] = (Math.random() - 0.5) * 16;
      motePos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      motePos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xe9d5ff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const moteCloud = new THREE.Points(moteGeo, moteMat);
    blurScene.add(moteCloud);
    cleanupGeometries.push(moteGeo);
    cleanupMaterials.push(moteMat);

    // =========================================================================
    // 3. SCENE B: IN-FOCUS (SHARP FOCAL PLANE)
    // =========================================================================
    const sharpScene = new THREE.Scene();
    addStudioLighting(sharpScene);

    const sharpCamera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    sharpCamera.position.set(0, 0, 8.5);

    const sharpRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    sharpRenderer.setSize(width, height);
    sharpRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    sharpRenderer.outputColorSpace = THREE.SRGBColorSpace;
    sharpContainer.appendChild(sharpRenderer.domElement);

    // The Main In-Focus Virus (Right Edge, exactly at camera focal plane Z: 0.0)
    const vInFocus = createVirusMesh({
      radius: 1.28,
      spikeCount: 58,
      coreColor: 0xe0e7ff, // Clear soft periwinkle
      spikeColor: 0xf5d0fe, // Clear soft lilac
      opacity: 0.7,
      roughness: 0.22,
      transmission: 0.65,
    });
    vInFocus.group.position.set(4.7, 0.4, 0.0);
    sharpScene.add(vInFocus.group);

    // In-Focus Floating Antibody (Crisp molecular arms)
    const abInFocus = createAntibodyMesh({ scale: 0.38, colorHex: 0xfecdd3, opacity: 0.75 });
    abInFocus.group.position.set(-3.6, -1.0, 0.2);
    abInFocus.group.rotation.set(0.4, 0.3, 0.6);
    sharpScene.add(abInFocus.group);

    // =========================================================================
    // 4. SYNCHRONIZED MOUSE PARALLAX & ANIMATION LOOP
    // =========================================================================
    let targetX = 0;
    let targetY = 0;
    const handlePointerMove = (e) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', handlePointerMove);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      blurCamera.aspect = w / h;
      blurCamera.updateProjectionMatrix();
      blurRenderer.setSize(w, h);

      sharpCamera.aspect = w / h;
      sharpCamera.updateProjectionMatrix();
      sharpRenderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let animationFrameId;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) * 0.001;

      // Rotations
      vInFocus.group.rotation.y -= 0.0024;
      vInFocus.group.rotation.z += 0.0015;

      vForeground.group.rotation.y += 0.002;
      vForeground.group.rotation.x += 0.0012;

      vDistantTop.group.rotation.y += 0.003;
      vDistantBottom.group.rotation.x -= 0.002;

      abInFocus.group.rotation.x += 0.007;
      abInFocus.group.rotation.y += 0.005;

      abDistant1.group.rotation.x += 0.005;
      abDistant2.group.rotation.z += 0.006;

      moteCloud.rotation.y += 0.0003;

      // Parallax Damping
      // 1. In-Focus Plane
      vInFocus.group.position.x += (4.7 + targetX * 0.45 - vInFocus.group.position.x) * 0.04;
      vInFocus.group.position.y += (0.4 + targetY * 0.35 - vInFocus.group.position.y) * 0.04;

      abInFocus.group.position.x += (-3.6 + targetX * 0.5 - abInFocus.group.position.x) * 0.045;
      abInFocus.group.position.y += (-1.0 + targetY * 0.4 + Math.sin(elapsed * 1.5) * 0.06 - abInFocus.group.position.y) * 0.045;

      // 2. Out-of-Focus Foreground (High sweeping parallax)
      vForeground.group.position.x += (-5.2 + targetX * 0.7 - vForeground.group.position.x) * 0.035;
      vForeground.group.position.y += (-1.8 + targetY * 0.6 - vForeground.group.position.y) * 0.035;

      // 3. Out-of-Focus Distant Background (Low subtle parallax)
      vDistantTop.group.position.x += (-2.2 + targetX * 0.12 - vDistantTop.group.position.x) * 0.03;
      vDistantTop.group.position.y += (3.4 + targetY * 0.1 - vDistantTop.group.position.y) * 0.03;

      vDistantBottom.group.position.x += (3.8 + targetX * 0.15 - vDistantBottom.group.position.x) * 0.03;
      vDistantBottom.group.position.y += (-3.2 + targetY * 0.12 - vDistantBottom.group.position.y) * 0.03;

      // Render both passes synchronously
      blurRenderer.render(blurScene, blurCamera);
      sharpRenderer.render(sharpScene, sharpCamera);
    };

    animate();

    // =========================================================================
    // 5. RESOURCE CLEANUP
    // =========================================================================
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      if (blurRenderer.domElement && blurContainer.contains(blurRenderer.domElement)) {
        blurContainer.removeChild(blurRenderer.domElement);
      }
      if (sharpRenderer.domElement && sharpContainer.contains(sharpRenderer.domElement)) {
        sharpContainer.removeChild(sharpRenderer.domElement);
      }

      cleanupGeometries.forEach((g) => g.dispose());
      cleanupMaterials.forEach((m) => m.dispose());

      blurRenderer.dispose();
      sharpRenderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* LAYER 1: Optical Bokeh Depth-of-Field (Distant & Near-field elements blurred by camera lens) */}
      <div
        ref={blurContainerRef}
        className="absolute inset-0 filter blur-[9px] opacity-75 scale-105 pointer-events-none"
      />

      {/* LAYER 2: Focal Plane (Crisp in-focus cell & molecule at camera focal distance) */}
      <div
        ref={sharpContainerRef}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
};

export default VirusBackground3D;
