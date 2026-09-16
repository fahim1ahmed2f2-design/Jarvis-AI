import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { JarvisState } from '../../types/jarvis';
import { STATE_CONFIGS } from '../../animations/animationConfig';
import { createGlowTexture, createRingTexture, lerp, lerpColor } from '../../utils/math';
import { realtimeAudioAnalyzer } from '../../services/audioAnalyzer';

interface Jarvis3DCanvasProps {
  state: JarvisState;
  audioFrequencyData: number[];
}

/**
 * ADVANCED HIGH-TECH JARVIS ARC REACTOR & NEURAL CORE (WebGL / Three.js)
 * 
 * 5-LAYER HOLOGRAPHIC ENERGY REACTOR WITH DEEP VOICE-SYNCHRONIZED ACOUSTIC DYNAMICS:
 * - Layer 1: Central Deformable Geodesic Neural Sphere + Inner Plasma Nucleus + Synaptic Vertex Sparks + Dynamic Electric Arc Tendrils
 * - Layer 2: High-Precision Counter-Rotating HUD Gimbal Rings & Gyroscopic Voice Torque
 * - Layer 3: 56-Segment 360° Symmetrical Radial Vocal Equalizer (Dual-Wing Acoustic Reactor)
 * - Layer 4: Real-Time 160-Point Oscilloscope Waveform Ribbon & Technical Crosshair Spoke Brackets
 * - Layer 5: 1,800-Node 3D Toroidal Vortex Energy Particle Swarm with Acoustic Radiation Dispersion
 */
export const Jarvis3DCanvas: React.FC<Jarvis3DCanvasProps> = ({ state, audioFrequencyData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglError, setWebglError] = React.useState(false);
  const stateRef = useRef<JarvisState>(state);
  stateRef.current = state;

  const audioFreqRef = useRef<number[]>(audioFrequencyData);
  audioFreqRef.current = audioFrequencyData;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      // Check if WebGL is available
      const canvasTest = document.createElement('canvas');
      const gl = canvasTest.getContext('webgl') || canvasTest.getContext('experimental-webgl');
      if (!gl) {
        setWebglError(true);
        return;
      }

      // ─── 1. SCENE, CAMERA & RENDERER ──────────────────────────────────────────
      const initWidth = container.clientWidth || 600;
      const initHeight = container.clientHeight || 460;
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(45, initWidth / initHeight, 0.1, 1000);

      const calcCameraZ = (w: number, h: number) => {
        const targetCoreDiameterPx = Math.min(w * 0.72, Math.min(h * 0.82, 540));
        const coreWorldRadius = 4.0;
        const fovRad = (45 * Math.PI) / 360;
        const computedZ = (coreWorldRadius * 2 * h) / (Math.max(targetCoreDiameterPx, 300) * Math.tan(fovRad) * 2);
        return Math.max(9.5, Math.min(computedZ, 12.8));
      };

      camera.position.z = calcCameraZ(initWidth, initHeight);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(initWidth, initHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.4;
      container.appendChild(renderer.domElement);

      // ─── 2. PROCEDURAL TEXTURES & SHARED BUFFERS ─────────────────────────────
      const glowTexture = createGlowTexture(128, 0, 0.5);
      const ringTexture1 = createRingTexture(48, 0.65);
      const ringTexture2 = createRingTexture(72, 0.4);

      // Master Scene Groups
      const masterCoreGroup = new THREE.Group();
      scene.add(masterCoreGroup);

      const bgStarfieldGroup = new THREE.Group();
      scene.add(bgStarfieldGroup);

      // ─── 3. LAYER 1: CENTRAL NEURAL SPHERE & PLASMA NUCLEUS ─────────────────
      // A. Quantum Plasma Nucleus (Center Core)
      const innerNucleusGeo = new THREE.SphereGeometry(0.85, 32, 32);
      const innerNucleusMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#00ffff'),
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending
      });
      const innerNucleusMesh = new THREE.Mesh(innerNucleusGeo, innerNucleusMat);
      masterCoreGroup.add(innerNucleusMesh);

      // Deep White-Hot Singularity Nucleus Center
      const coreSingularityGeo = new THREE.SphereGeometry(0.38, 24, 24);
      const coreSingularityMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffffff'),
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
      });
      const coreSingularityMesh = new THREE.Mesh(coreSingularityGeo, coreSingularityMat);
      masterCoreGroup.add(coreSingularityMesh);

      // B. Internal Floating Constellation Nodes
      const nucleusNodeCount = 70;
      const nucleusNodeGeo = new THREE.BufferGeometry();
      const nucleusNodePos = new Float32Array(nucleusNodeCount * 3);
      for (let i = 0; i < nucleusNodeCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = Math.cbrt(Math.random()) * 0.80;
        const sinPhi = Math.sin(phi);
        nucleusNodePos[i * 3] = r * sinPhi * Math.cos(theta);
        nucleusNodePos[i * 3 + 1] = r * sinPhi * Math.sin(theta);
        nucleusNodePos[i * 3 + 2] = r * Math.cos(phi);
      }
      nucleusNodeGeo.setAttribute('position', new THREE.BufferAttribute(nucleusNodePos, 3));
      const nucleusNodeMat = new THREE.PointsMaterial({
        size: 0.11,
        map: glowTexture,
        color: new THREE.Color('#ffffff'),
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const nucleusNodes = new THREE.Points(nucleusNodeGeo, nucleusNodeMat);
      masterCoreGroup.add(nucleusNodes);

      // C. Inner Counter-Rotating Geodesic Wireframe Shell
      const innerGeoShell = new THREE.IcosahedronGeometry(1.15, 2);
      const innerGeoMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#00d9e8'),
        wireframe: true,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
      });
      const innerGeoMesh = new THREE.Mesh(innerGeoShell, innerGeoMat);
      masterCoreGroup.add(innerGeoMesh);

      // D. Primary Deformable Geodesic Neural Mesh (3D Faceted Wireframe)
      const neuralMeshGeo = new THREE.IcosahedronGeometry(1.45, 3);
      const origNeuralPositions = neuralMeshGeo.attributes.position.clone();
      const neuralMeshMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#00ffff'),
        wireframe: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      const neuralWireMesh = new THREE.Mesh(neuralMeshGeo, neuralMeshMat);
      masterCoreGroup.add(neuralWireMesh);

      // E. Synaptic Glowing Point Nodes on Every Mesh Vertex
      const synapticNodesMat = new THREE.PointsMaterial({
        size: 0.12,
        map: glowTexture,
        color: new THREE.Color('#ffffff'),
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const synapticNodes = new THREE.Points(neuralMeshGeo, synapticNodesMat);
      masterCoreGroup.add(synapticNodes);

      // F. Dynamic Electric Arc Tendrils (Plasma Discharge Lines)
      const arcCount = 12;
      const arcPointsPerLine = 6;
      const arcGeo = new THREE.BufferGeometry();
      const arcPos = new Float32Array(arcCount * arcPointsPerLine * 3);
      arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPos, 3));
      const arcMat = new THREE.LineBasicMaterial({
        color: new THREE.Color('#ffffff'),
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        linewidth: 2
      });
      const electricArcs = new THREE.LineSegments(arcGeo, arcMat);
      masterCoreGroup.add(electricArcs);

      // G. Volumetric Holographic Glow Halo
      const coronaGlowMat = new THREE.SpriteMaterial({
        map: glowTexture,
        color: new THREE.Color('#00f0ff'),
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending
      });
      const coronaGlowSprite = new THREE.Sprite(coronaGlowMat);
      coronaGlowSprite.scale.set(5.8, 5.8, 1);
      masterCoreGroup.add(coronaGlowSprite);

      // ─── 4. LAYER 2: INNER HIGH-TECH HUD GIMBAL RINGS ────────────────────────
      // Dial 1: Inner Circular HUD Frequency Gauge
      const dial1Geo = new THREE.RingGeometry(1.82, 1.95, 80);
      const dial1Mat = new THREE.MeshBasicMaterial({
        map: ringTexture1,
        color: new THREE.Color('#00ffff'),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      const dial1Mesh = new THREE.Mesh(dial1Geo, dial1Mat);
      masterCoreGroup.add(dial1Mesh);

      // Dial 2: Counter-Rotating Dashed Tech Dial
      const dial2Geo = new THREE.RingGeometry(2.10, 2.22, 96);
      const dial2Mat = new THREE.MeshBasicMaterial({
        map: ringTexture2,
        color: new THREE.Color('#0d9488'),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending
      });
      const dial2Mesh = new THREE.Mesh(dial2Geo, dial2Mat);
      masterCoreGroup.add(dial2Mesh);

      // 3D Orbital Gimbal Ring A (Tilted Plane)
      const gimbalAGroup = new THREE.Group();
      const gimbalAGeo = new THREE.RingGeometry(2.38, 2.46, 90);
      const gimbalAMat = new THREE.MeshBasicMaterial({
        map: ringTexture1,
        color: new THREE.Color('#00d9e8'),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending
      });
      const gimbalAMesh = new THREE.Mesh(gimbalAGeo, gimbalAMat);
      gimbalAGroup.add(gimbalAMesh);
      gimbalAGroup.rotation.x = Math.PI / 4.2;
      gimbalAGroup.rotation.y = Math.PI / 5.2;
      masterCoreGroup.add(gimbalAGroup);

      // 3D Orbital Gimbal Ring B (Cross-Tilted Plane)
      const gimbalBGroup = new THREE.Group();
      const gimbalBGeo = new THREE.RingGeometry(2.62, 2.70, 90);
      const gimbalBMat = new THREE.MeshBasicMaterial({
        map: ringTexture2,
        color: new THREE.Color('#0891b2'),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      });
      const gimbalBMesh = new THREE.Mesh(gimbalBGeo, gimbalBMat);
      gimbalBGroup.add(gimbalBMesh);
      gimbalBGroup.rotation.x = -Math.PI / 3.4;
      gimbalBGroup.rotation.z = Math.PI / 3.6;
      masterCoreGroup.add(gimbalBGroup);

      // ─── 5. LAYER 3: 56-SEGMENT 360° SYMMETRICAL VOCAL EQUALIZER RING ────────
      const segmentCount = 56;
      const segmentGroup = new THREE.Group();
      const segmentMeshes: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>[] = [];
      const baseSegmentRadius = 2.85;
      const segmentRadialWidth = 0.20;
      const segmentArc = (Math.PI * 2) / segmentCount;
      const segmentFillRatio = 0.72;

      for (let i = 0; i < segmentCount; i++) {
        const startAngle = i * segmentArc;
        const thetaLength = segmentArc * segmentFillRatio;
        const segGeo = new THREE.RingGeometry(
          baseSegmentRadius,
          baseSegmentRadius + segmentRadialWidth,
          12,
          1,
          startAngle,
          thetaLength
        );
        const isMajorTick = i % 7 === 0;
        const segMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(isMajorTick ? '#ffffff' : '#00ffff'),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isMajorTick ? 0.9 : 0.6,
          blending: THREE.AdditiveBlending
        });
        const segMesh = new THREE.Mesh(segGeo, segMat);
        segmentMeshes.push(segMesh);
        segmentGroup.add(segMesh);
      }
      masterCoreGroup.add(segmentGroup);

      // ─── 6. LAYER 4: REAL-TIME OSCILLOSCOPE WAVEFORM RIBBON & HUD CROSSBEAMS ─
      const wavePointsCount = 160;
      const waveGeo = new THREE.BufferGeometry();
      const wavePositions = new Float32Array(wavePointsCount * 3);
      const baseWaveRadius = 3.25;
      for (let i = 0; i < wavePointsCount; i++) {
        const angle = (i / wavePointsCount) * Math.PI * 2;
        wavePositions[i * 3] = Math.cos(angle) * baseWaveRadius;
        wavePositions[i * 3 + 1] = Math.sin(angle) * baseWaveRadius;
        wavePositions[i * 3 + 2] = 0;
      }
      waveGeo.setAttribute('position', new THREE.BufferAttribute(wavePositions, 3));
      const waveLineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color('#00ffff'),
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        linewidth: 2
      });
      const waveLineMesh = new THREE.LineLoop(waveGeo, waveLineMat);
      masterCoreGroup.add(waveLineMesh);

      // Radial Technical Crossbeams (8 Cardinal & Diagonal HUD Spokes)
      const crossbeamGroup = new THREE.Group();
      const spokeAngles = [
        0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4,
        Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4
      ];
      const spokeLines: THREE.Line[] = [];
      spokeAngles.forEach((ang) => {
        const spokeGeo = new THREE.BufferGeometry();
        const spokePos = new Float32Array([
          Math.cos(ang) * 3.18, Math.sin(ang) * 3.18, 0,
          Math.cos(ang) * 4.08, Math.sin(ang) * 4.08, 0
        ]);
        spokeGeo.setAttribute('position', new THREE.BufferAttribute(spokePos, 3));
        const spokeMat = new THREE.LineBasicMaterial({
          color: new THREE.Color('#00f0ff'),
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending
        });
        const l = new THREE.Line(spokeGeo, spokeMat);
        spokeLines.push(l);
        crossbeamGroup.add(l);
      });
      masterCoreGroup.add(crossbeamGroup);

      // Outer Perimeter Technical Frame
      const outerFrameGeo = new THREE.RingGeometry(3.80, 3.96, 120);
      const outerFrameMat = new THREE.MeshBasicMaterial({
        map: ringTexture1,
        color: new THREE.Color('#0891b2'),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.68,
        blending: THREE.AdditiveBlending
      });
      const outerFrameMesh = new THREE.Mesh(outerFrameGeo, outerFrameMat);
      masterCoreGroup.add(outerFrameMesh);

      // Outer Thin Orbit Bracket
      const outerBracketGeo = new THREE.RingGeometry(4.10, 4.14, 120);
      const outerBracketMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#00ffff'),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });
      const outerBracketMesh = new THREE.Mesh(outerBracketGeo, outerBracketMat);
      masterCoreGroup.add(outerBracketMesh);

      // ─── 7. LAYER 5: 3D SWARMING TOROIDAL ENERGY PARTICLE VORTEX ────────────
      const swarmCount = 900;
      const swarmGeo = new THREE.BufferGeometry();
      const swarmPos = new Float32Array(swarmCount * 3);
      const swarmAngles = new Float32Array(swarmCount);
      const swarmRadii = new Float32Array(swarmCount);
      const swarmSpeeds = new Float32Array(swarmCount);
      const swarmYOffsets = new Float32Array(swarmCount);
      const swarmInclinations = new Float32Array(swarmCount);

      for (let i = 0; i < swarmCount; i++) {
        swarmAngles[i] = Math.random() * Math.PI * 2;
        swarmRadii[i] = 1.6 + Math.pow(Math.random(), 1.5) * 2.3;
        swarmSpeeds[i] = (Math.random() * 0.7 + 0.35) * (Math.random() > 0.48 ? 1 : -1);
        swarmYOffsets[i] = (Math.random() - 0.5) * 2.0;
        swarmInclinations[i] = (Math.random() - 0.5) * 1.15;

        swarmPos[i * 3] = Math.cos(swarmAngles[i]) * swarmRadii[i];
        swarmPos[i * 3 + 1] = swarmYOffsets[i];
        swarmPos[i * 3 + 2] = Math.sin(swarmAngles[i]) * swarmRadii[i];
      }
      swarmGeo.setAttribute('position', new THREE.BufferAttribute(swarmPos, 3));

      const swarmMat = new THREE.PointsMaterial({
        size: 0.12,
        map: glowTexture,
        color: new THREE.Color('#00ffff'),
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const swarmParticles = new THREE.Points(swarmGeo, swarmMat);
      masterCoreGroup.add(swarmParticles);

      // Ambient Deep Quantum Space Dust (200 nodes)
      const dustCount = 200;
      const dustGeo = new THREE.BufferGeometry();
      const dustPos = new Float32Array(dustCount * 3);
      const dustVels = new Float32Array(dustCount * 3);

      for (let i = 0; i < dustCount; i++) {
        dustPos[i * 3] = (Math.random() - 0.5) * 32;
        dustPos[i * 3 + 1] = (Math.random() - 0.5) * 22;
        dustPos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2;

        dustVels[i * 3] = (Math.random() - 0.5) * 0.01;
        dustVels[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
        dustVels[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
      }
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

      const dustMat = new THREE.PointsMaterial({
        size: 0.12,
        map: glowTexture,
        color: new THREE.Color('#0891b2'),
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const dustParticles = new THREE.Points(dustGeo, dustMat);
      bgStarfieldGroup.add(dustParticles);

      // ─── 8. MOUSE PARALLAX ───────────────────────────────────────────────────
      const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
      const handleMouseMove = (e: MouseEvent) => {
        mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 0.48;
        mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 0.48;
      };
      window.addEventListener('mousemove', handleMouseMove);

      // ─── 9. ACOUSTIC HARMONIC OSCILLATOR SPRINGS ─────────────────────────────
      interface PhysicalSpring {
        pos: number;
        vel: number;
        target: number;
        stiffness: number;
        damping: number;
        mass: number;
      }

      const createSpring = (target: number, stiffness: number, damping: number, mass: number): PhysicalSpring => ({
        pos: target,
        vel: 0,
        target,
        stiffness,
        damping,
        mass
      });

      const stepSpring = (s: PhysicalSpring, dt: number, externalForce = 0): number => {
        const springForce = -s.stiffness * (s.pos - s.target);
        const dampingForce = -s.damping * s.vel;
        const accel = (springForce + dampingForce + externalForce) / s.mass;
        s.vel += accel * dt;
        s.pos += s.vel * dt;
        return s.pos;
      };

      const coreRadialSpring = createSpring(1.0, 72.0, 10.5, 1.0);
      const coreAxialSpring = createSpring(0.0, 55.0, 8.5, 1.0);
      const coronaScaleSpring = createSpring(5.8, 55.0, 8.5, 1.0);

      // 56 Springs for Radial Reactor Segments
      const segmentSprings: PhysicalSpring[] = [];
      const segmentPhosphors: number[] = new Array(segmentCount).fill(0.2);
      for (let i = 0; i < segmentCount; i++) {
        segmentSprings.push(createSpring(1.0, 72.0, 10.0, 0.85));
      }

      // Particle Vortex Kinematics
      const particleRadialVels = new Float32Array(swarmCount);
      const particleCurrentRadii = new Float32Array(swarmCount);
      for (let i = 0; i < swarmCount; i++) {
        particleCurrentRadii[i] = swarmRadii[i];
      }

      const currentPrimaryColor = new THREE.Color('#00ffff');
      const currentSecondaryColor = new THREE.Color('#00d9e8');
      const targetColorPrimary = new THREE.Color('#00ffff');
      const targetColorSecondary = new THREE.Color('#00d9e8');

      // Pre-allocated vertex buffers
      const origArray = origNeuralPositions.array as Float32Array;
      const vertexCount = (neuralMeshGeo.attributes.position as THREE.BufferAttribute).count;

      // ─── 10. 60 FPS MAIN PHYSICS & RENDERING LOOP ───────────────────────────
      let lastTime = performance.now();
      let animationFrameId: number;
      let elapsedTime = 0;
      let voicePulsePhase = 0;

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        const now = performance.now();
        const delta = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        elapsedTime += delta;

        const currentState = stateRef.current;
        const targetConfig = STATE_CONFIGS[currentState] || STATE_CONFIGS.IDLE;

        // ── Direct Hardware Audio Data Poll ──
        const acoustic = realtimeAudioAnalyzer.getAcousticPhysicsData();
        let audioFrequencies = acoustic.frequencies;

        if (audioFreqRef.current && audioFreqRef.current.length > 0) {
          let pSum = 0;
          for (let i = 0; i < Math.min(16, audioFreqRef.current.length); i++) {
            pSum += audioFreqRef.current[i];
          }
          if (pSum > 0.08) {
            audioFrequencies = audioFreqRef.current;
          }
        }

        const rawVol = acoustic.volume;
        const isVoiceActive = acoustic.isActive || (rawVol > 0.015);
        const gain = isVoiceActive ? (currentState === 'SPEAKING' ? 0.9 : 0.75) : 0.0;
        const reactIntensity = targetConfig.audioReactIntensity || 0.5;

        const rawBass = acoustic.bass * gain;
        const rawMid = acoustic.mid * gain;
        const rawHigh = acoustic.high * gain;
        const voiceVol = rawVol * gain;
        const attack = acoustic.attack * (isVoiceActive ? 0.8 : 0.0);

        if (isVoiceActive) {
          voicePulsePhase += delta * (2.2 + voiceVol * 4.0);
        }

        // ── Physical Force 1: Core Scale Harmonic Oscillator ──
        coreRadialSpring.target = targetConfig.coreScale;
        const radialAcousticForce = ((attack * 1.2) + (rawBass * 0.9) + (voiceVol * 0.8)) * reactIntensity;
        const physicalCoreScale = Math.min(1.05, Math.max(0.95, stepSpring(coreRadialSpring, delta, radialAcousticForce)));

        // ── Physical Force 2: Z-Axial Depth Recoil ──
        const axialShockForce = ((attack * 0.8) + (rawBass * 0.6)) * reactIntensity;
        const physicalZDisplacement = stepSpring(coreAxialSpring, delta, axialShockForce);
        masterCoreGroup.position.z = Math.max(-0.25, Math.min(0.25, physicalZDisplacement * 0.1));

        // ── Physical Force 3: Corona Glow Flare Spring ──
        coronaScaleSpring.target = 5.8 * targetConfig.ringGlowIntensity;
        const coronaForce = ((voiceVol * 1.0) + (attack * 1.2)) * reactIntensity;
        const physicalCoronaScale = Math.min(7.0, Math.max(4.2, stepSpring(coronaScaleSpring, delta, coronaForce)));

        // ── Physical Force 4: Smooth Cinematic Rotational Dynamics ──
        const baseSpin = targetConfig.rotationSpeedMultiplier || 0.45;
        const voiceTorque = (voiceVol * 0.5 + attack * 0.6) * reactIntensity;

        gimbalAGroup.rotation.z += (baseSpin * 0.85 + voiceTorque * 0.9) * delta;
        gimbalAGroup.rotation.x = Math.sin(elapsedTime * 0.4) * 0.12;
        gimbalBGroup.rotation.z -= (baseSpin * 0.95 + voiceTorque * 1.1) * delta;
        gimbalBGroup.rotation.y = Math.cos(elapsedTime * 0.35) * 0.14;
        segmentGroup.rotation.z += (baseSpin * 0.35 + voiceTorque * 0.5) * delta;
        outerFrameMesh.rotation.z -= (baseSpin * 0.25 + voiceTorque * 0.4) * delta;
        dial1Mesh.rotation.z += (baseSpin * 1.1 + voiceTorque * 1.4) * delta;
        dial2Mesh.rotation.z -= (baseSpin * 0.85 + voiceTorque * 1.2) * delta;

        neuralWireMesh.rotation.y += (baseSpin * 0.5 + voiceTorque * 0.6) * delta;
        neuralWireMesh.rotation.x = Math.sin(elapsedTime * 0.3) * 0.08;
        synapticNodes.rotation.copy(neuralWireMesh.rotation);
        innerGeoMesh.rotation.y -= (baseSpin * 0.45 + voiceTorque * 0.55) * delta;
        nucleusNodes.rotation.y += (baseSpin * 0.65 + voiceTorque * 0.7) * delta;

        // ── Physical Force 5: Geodesic Mesh Cymatics (Voice Driven Only) ──
        const posAttr = neuralMeshGeo.attributes.position as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;

        const voiceDeformStrength = Math.min(0.15, (voiceVol * 0.12 + attack * 0.10) * reactIntensity);
        if (voiceDeformStrength > 0.01) {
          const modalBass = rawBass * 0.12;
          const modalMid = rawMid * 0.10;

          for (let i = 0; i < vertexCount; i++) {
            const ox = origArray[i * 3];
            const oy = origArray[i * 3 + 1];
            const oz = origArray[i * 3 + 2];
            const r0 = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1.45;

            const theta = Math.acos(Math.max(-1, Math.min(1, oz / r0)));
            const phi = Math.atan2(oy, ox);

            const binIdx = Math.min(31, Math.floor((theta / Math.PI) * 31));
            const freqVal = audioFrequencies[binIdx] || 0;

            const quadrupole = (3 * Math.cos(theta) * Math.cos(theta) - 1) * Math.cos(2 * phi + voicePulsePhase);
            const displacement = 1.0 + ((quadrupole * modalBass + freqVal * modalMid) * voiceDeformStrength * 0.15);

            posArray[i * 3] = ox * displacement;
            posArray[i * 3 + 1] = oy * displacement;
            posArray[i * 3 + 2] = oz * displacement;
          }
          posAttr.needsUpdate = true;
        } else {
          // Perfectly clean resting sphere when no voice
          for (let i = 0; i < vertexCount * 3; i++) {
            posArray[i] = origArray[i];
          }
          posAttr.needsUpdate = true;
        }

        // Dynamic Synaptic Node Point Scaling on Harmonics
        synapticNodesMat.size = 0.12 + (voiceVol * 0.04 + attack * 0.03) * reactIntensity;

        // ── Physical Force 5.5: Dynamic Electric Plasma Tendril Arcs (On Vocal Bursts) ──
        const arcPosAttr = arcGeo.getAttribute('position') as THREE.BufferAttribute;
        const arcPosArr = arcPosAttr.array as Float32Array;
        const shouldFlashArcs = isVoiceActive && (voiceVol > 0.25 || attack > 0.3);

        if (shouldFlashArcs) {
          arcMat.opacity = THREE.MathUtils.lerp(arcMat.opacity, Math.min(0.75, voiceVol * 0.7 + attack * 0.5), delta * 20.0);

          for (let a = 0; a < arcCount; a++) {
            const vIdx = ((a * 17) + Math.floor(elapsedTime * 12)) % vertexCount;
            const targetX = posArray[vIdx * 3];
            const targetY = posArray[vIdx * 3 + 1];
            const targetZ = posArray[vIdx * 3 + 2];

            const origX = Math.sin(a * 1.5 + elapsedTime * 6) * 0.18;
            const origY = Math.cos(a * 2.2 + elapsedTime * 6) * 0.18;
            const origZ = Math.sin(a * 3.1 + elapsedTime * 6) * 0.18;

            const baseIdx = a * arcPointsPerLine * 3;
            for (let p = 0; p < arcPointsPerLine; p++) {
              const t = p / (arcPointsPerLine - 1);
              const jitter = t > 0 && t < 1 ? (Math.random() - 0.5) * 0.15 * (voiceVol + 0.1) : 0;
              arcPosArr[baseIdx + p * 3] = THREE.MathUtils.lerp(origX, targetX, t) + jitter;
              arcPosArr[baseIdx + p * 3 + 1] = THREE.MathUtils.lerp(origY, targetY, t) + jitter;
              arcPosArr[baseIdx + p * 3 + 2] = THREE.MathUtils.lerp(origZ, targetZ, t) + jitter;
            }
          }
          arcPosAttr.needsUpdate = true;
        } else {
          arcMat.opacity = THREE.MathUtils.lerp(arcMat.opacity, 0.0, delta * 12.0);
        }

        // ── Physical Force 6: 56 Radial Symmetrical Vocal Equalizer Segments ──
        for (let i = 0; i < segmentCount; i++) {
          const seg = segmentMeshes[i];
          const normAngle = (i / segmentCount) * Math.PI * 2;
          const distFromBottom = Math.abs(Math.sin(normAngle));
          const isUpperHalf = Math.sin(normAngle) > 0;

          let speechBandIdx: number;
          if (!isUpperHalf) {
            speechBandIdx = Math.floor(distFromBottom * 10);
          } else {
            speechBandIdx = Math.min(31, 10 + Math.floor((1 - distFromBottom) * 21));
          }

          const freqVal = isVoiceActive ? (audioFrequencies[speechBandIdx] || 0) : 0;
          const pistonForce = ((freqVal * 1.8) + (attack * 1.2) + (rawBass * 0.8)) * reactIntensity;
          const pistonDisp = stepSpring(segmentSprings[i], delta, pistonForce);

          const excitation = Math.min(1.0, freqVal * 1.2 + attack * 0.6);
          if (excitation > segmentPhosphors[i]) {
            segmentPhosphors[i] = excitation;
          } else {
            segmentPhosphors[i] = THREE.MathUtils.lerp(segmentPhosphors[i], isVoiceActive ? 0.2 : 0.08, delta * 6.0);
          }

          const isMajor = i % 7 === 0;
          seg.material.opacity = Math.min(1.0, segmentPhosphors[i] + (isMajor ? 0.35 : 0.2));

          if (excitation > 0.35 || attack > 0.22) {
            seg.material.color.set(isMajor ? '#ffffff' : '#e0ffff');
          } else {
            seg.material.color.set(isMajor ? '#ffffff' : currentSecondaryColor.getHexString());
          }

          const segScale = Math.min(1.03, Math.max(0.98, 1.0 + (pistonDisp - 1.0) * 0.03));
          seg.scale.set(segScale, segScale, 1);
        }

        // ── Physical Force 7: 160-Point Oscilloscope Waveform Ribbon ──
        const wavePosAttr = waveGeo.getAttribute('position') as THREE.BufferAttribute;
        const wavePosArray = wavePosAttr.array as Float32Array;
        const liveWave = acoustic.waveform;

        for (let i = 0; i < wavePointsCount; i++) {
          const angle = (i / wavePointsCount) * Math.PI * 2;
          const waveSample = (liveWave && liveWave.length > i && isVoiceActive) ? liveWave[i] : 0;

          // Real speech waveform modulation
          const physicalOffset = waveSample * (0.28 + voiceVol * 0.35);
          const r = baseWaveRadius + physicalOffset;

          wavePosArray[i * 3] = Math.cos(angle) * r;
          wavePosArray[i * 3 + 1] = Math.sin(angle) * r;
          wavePosArray[i * 3 + 2] = waveSample * 0.15;
        }
        wavePosAttr.needsUpdate = true;

        // Radial technical spokes breathing
        spokeLines.forEach((spoke) => {
          (spoke.material as THREE.LineBasicMaterial).opacity = 0.35 + (voiceVol * 0.2 + attack * 0.15) * reactIntensity;
        });

        // ── Physical Force 8: Particle Acoustic Radiation & Gravitational Attractor ──
        const pPosAttr = swarmGeo.getAttribute('position') as THREE.BufferAttribute;
        const pPosArray = pPosAttr.array as Float32Array;

        // Acoustic radiation force pushes particles outward during vocal bursts
        const radiationPush = ((rawHigh * 1.0) + (rawVol * 0.8) + (attack * 1.2)) * reactIntensity;

        for (let i = 0; i < swarmCount; i++) {
          const baseR = swarmRadii[i];
          let curR = particleCurrentRadii[i];

          // F_radiation - F_gravitational_restoration - damping
          const fRad = radiationPush * Math.exp(-(curR - 1.6) / 2.0);
          const fAttract = -25.0 * (curR - baseR);
          const damping = -9.0 * particleRadialVels[i];
          const accel = fRad + fAttract + damping;

          particleRadialVels[i] += accel * delta;
          curR += particleRadialVels[i] * delta;
          curR = Math.max(1.5, Math.min(4.0, curR));
          particleCurrentRadii[i] = curR;

          // Angular orbital acceleration with vocal tempo
          const angularSpeed = swarmSpeeds[i] * (baseR / Math.max(1.2, curR)) * (1.0 + rawMid * 0.4);
          swarmAngles[i] += angularSpeed * delta * targetConfig.particleSpeedMultiplier;

          const inc = swarmInclinations[i];
          pPosArray[i * 3] = Math.cos(swarmAngles[i]) * curR;
          pPosArray[i * 3 + 1] = swarmYOffsets[i] + Math.sin(swarmAngles[i]) * Math.sin(inc) * curR;
          pPosArray[i * 3 + 2] = Math.sin(swarmAngles[i]) * Math.cos(inc) * curR;
        }
        pPosAttr.needsUpdate = true;

        // Ambient Quantum Space Dust
        const bgPosAttr = dustGeo.getAttribute('position') as THREE.BufferAttribute;
        const bgPosArray = bgPosAttr.array as Float32Array;
        for (let i = 0; i < dustCount; i++) {
          bgPosArray[i * 3] += dustVels[i * 3];
          bgPosArray[i * 3 + 1] += dustVels[i * 3 + 1];
          bgPosArray[i * 3 + 2] += dustVels[i * 3 + 2];

          if (Math.abs(bgPosArray[i * 3]) > 16) dustVels[i * 3] *= -1;
          if (Math.abs(bgPosArray[i * 3 + 1]) > 11) dustVels[i * 3 + 1] *= -1;
          if (Math.abs(bgPosArray[i * 3 + 2]) > 8) dustVels[i * 3 + 2] *= -1;
        }
        bgPosAttr.needsUpdate = true;

        // ── Physical Scale Application to Core Geometries ──
        const idleBreathing = Math.sin(elapsedTime * (targetConfig.corePulseSpeed || 1.0) * 2.0) * 0.01;
        const totalScale = Math.min(1.06, physicalCoreScale * (1.0 + idleBreathing));

        innerNucleusMesh.scale.set(totalScale, totalScale, totalScale);
        coreSingularityMesh.scale.set(totalScale * (1.0 + voiceVol * 0.06), totalScale * (1.0 + voiceVol * 0.06), totalScale * (1.0 + voiceVol * 0.06));
        nucleusNodes.scale.set(totalScale, totalScale, totalScale);
        innerGeoMesh.scale.set(totalScale * 1.01, totalScale * 1.01, totalScale * 1.01);
        neuralWireMesh.scale.set(totalScale, totalScale, totalScale);
        synapticNodes.scale.set(totalScale, totalScale, totalScale);

        // Corona Sprite scale and opacity
        coronaGlowSprite.scale.set(physicalCoronaScale, physicalCoronaScale, 1);
        coronaGlowMat.opacity = Math.min(0.80, 0.48 + voiceVol * 0.18 + attack * 0.15);

        // Gimbal & Dial Rings Expansion & Audio Ripple
        const ringExpand = 1.0 + (physicalCoreScale - 1.0) * 0.1;
        dial1Mesh.scale.set(ringExpand, ringExpand, 1);
        dial2Mesh.scale.set(1.0 + rawMid * 0.03, 1.0 + rawMid * 0.03, 1);
        gimbalAGroup.scale.set(ringExpand, ringExpand, ringExpand);
        gimbalBGroup.scale.set(1.0 + rawMid * 0.03, 1.0 + rawMid * 0.03, 1.0 + rawMid * 0.03);

        // ── Color Temperature Shifts & Material Palette Updates ──
        targetColorPrimary.set(targetConfig.primaryColor);
        targetColorSecondary.set(targetConfig.secondaryColor);

        // On intense vocal transients, briefly heat up toward electric white-cyan
        if (attack > 0.28 || voiceVol > 0.5) {
          targetColorPrimary.lerp(new THREE.Color('#ffffff'), 0.5);
        }

        const lerpSpeed = Math.min(1.0, 6.5 * delta);
        lerpColor(currentPrimaryColor, targetColorPrimary, lerpSpeed, currentPrimaryColor);
        lerpColor(currentSecondaryColor, targetColorSecondary, lerpSpeed, currentSecondaryColor);

        innerNucleusMat.color.copy(currentPrimaryColor);
        innerGeoMat.color.copy(currentPrimaryColor);
        neuralMeshMat.color.copy(currentPrimaryColor);
        coronaGlowMat.color.copy(currentPrimaryColor);
        dial1Mat.color.copy(currentPrimaryColor);
        dial2Mat.color.copy(currentSecondaryColor);
        gimbalAMat.color.copy(currentPrimaryColor);
        gimbalBMat.color.copy(currentSecondaryColor);
        waveLineMat.color.copy(currentPrimaryColor);
        outerFrameMat.color.copy(currentSecondaryColor);
        outerBracketMat.color.copy(currentPrimaryColor);
        swarmMat.color.copy(currentPrimaryColor);

        // Smooth Parallax Mouse Tilt
        mouse.x = lerp(mouse.x, mouse.targetX, 0.06);
        mouse.y = lerp(mouse.y, mouse.targetY, 0.06);
        masterCoreGroup.rotation.y = mouse.x * 0.68;
        masterCoreGroup.rotation.x = -mouse.y * 0.68;
        bgStarfieldGroup.rotation.y = mouse.x * 0.22;
        bgStarfieldGroup.rotation.x = -mouse.y * 0.22;

        renderer.render(scene, camera);
      };

      animate();

      // ─── 11. RESIZE HANDLING ─────────────────────────────────────────────────
      const handleResize = () => {
        if (!container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) return;
        camera.aspect = width / height;
        camera.position.z = calcCameraZ(width, height);
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      };

      window.addEventListener('resize', handleResize);

      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          handleResize();
        });
        resizeObserver.observe(container);
      }

      // ─── 12. CLEAN DISPOSAL & RESOURCE CLEANUP ───────────────────────────────
      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }

        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }

        // Dispose geometries & materials
        innerNucleusGeo.dispose();
        innerNucleusMat.dispose();
        coreSingularityGeo.dispose();
        coreSingularityMat.dispose();
        nucleusNodeGeo.dispose();
        nucleusNodeMat.dispose();
        innerGeoShell.dispose();
        innerGeoMat.dispose();
        neuralMeshGeo.dispose();
        neuralMeshMat.dispose();
        synapticNodesMat.dispose();
        arcGeo.dispose();
        arcMat.dispose();
        coronaGlowMat.dispose();
        dial1Geo.dispose();
        dial1Mat.dispose();
        dial2Geo.dispose();
        dial2Mat.dispose();
        gimbalAGeo.dispose();
        gimbalAMat.dispose();
        gimbalBGeo.dispose();
        gimbalBMat.dispose();
        waveGeo.dispose();
        waveLineMat.dispose();
        outerFrameGeo.dispose();
        outerFrameMat.dispose();
        outerBracketGeo.dispose();
        outerBracketMat.dispose();
        swarmGeo.dispose();
        swarmMat.dispose();
        dustGeo.dispose();
        dustMat.dispose();

        segmentMeshes.forEach((seg) => {
          seg.geometry.dispose();
          seg.material.dispose();
        });

        renderer.dispose();
      };
    } catch (err) {
      console.warn('Jarvis3DCanvas WebGL initialization error:', err);
      setWebglError(true);
    }
  }, []);

  if (webglError) {
    const config = STATE_CONFIGS[state] || STATE_CONFIGS.IDLE;
    return (
      <div className="jarvis-3d-canvas-fallback">
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <defs>
            <radialGradient id="jarvis-nucleus-grad">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="35%" stopColor={config.primaryColor} stopOpacity="0.9" />
              <stop offset="70%" stopColor={config.secondaryColor} stopOpacity="0.5" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <filter id="jarvis-core-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle 
            cx="200" cy="200" r="175" 
            fill="none" 
            stroke={config.primaryColor} 
            strokeWidth="1.5" 
            strokeDasharray="16 10 4 10" 
            opacity="0.6"
            style={{ transformOrigin: '200px 200px', animation: 'spinClockwise 24s linear infinite' }}
          />

          <circle 
            cx="200" cy="200" r="145" 
            fill="none" 
            stroke={config.secondaryColor} 
            strokeWidth="2" 
            strokeDasharray="40 12 12 12" 
            opacity="0.75"
            style={{ transformOrigin: '200px 200px', animation: 'spinCounterClockwise 16s linear infinite' }}
          />

          <circle 
            cx="200" cy="200" r="115" 
            fill="none" 
            stroke={config.primaryColor} 
            strokeWidth="3.5" 
            strokeDasharray="8 6" 
            opacity="0.85"
            filter="url(#jarvis-core-glow)"
            style={{ transformOrigin: '200px 200px', animation: 'spinClockwise 10s linear infinite' }}
          />

          <circle 
            cx="200" cy="200" r="85" 
            fill="none" 
            stroke={config.primaryColor} 
            strokeWidth="2" 
            strokeDasharray="30 15 5 15" 
            opacity="0.9"
            style={{ transformOrigin: '200px 200px', animation: 'spinCounterClockwise 8s linear infinite' }}
          />

          <circle 
            cx="200" cy="200" r="60" 
            fill="url(#jarvis-nucleus-grad)"
            filter="url(#jarvis-core-glow)"
          />

          <circle 
            cx="200" cy="200" r="22" 
            fill={config.primaryColor} 
            opacity="0.95"
            filter="url(#jarvis-core-glow)"
          />
          <circle 
            cx="200" cy="200" r="10" 
            fill="#ffffff" 
            opacity="1"
          />

          <line x1="200" y1="15" x2="200" y2="45" stroke={config.primaryColor} strokeWidth="2" opacity="0.8" />
          <line x1="200" y1="355" x2="200" y2="385" stroke={config.primaryColor} strokeWidth="2" opacity="0.8" />
          <line x1="15" y1="200" x2="45" y2="200" stroke={config.primaryColor} strokeWidth="2" opacity="0.8" />
          <line x1="355" y1="200" x2="385" y2="200" stroke={config.primaryColor} strokeWidth="2" opacity="0.8" />
        </svg>
      </div>
    );
  }

  return <div ref={containerRef} className="jarvis-3d-canvas-container" />;
};
