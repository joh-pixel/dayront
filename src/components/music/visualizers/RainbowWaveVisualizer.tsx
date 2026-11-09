import { useEffect, useRef } from 'preact/hooks';
import * as THREE from 'three';

export type RainbowWaveOptions = {
  background?: string;
  colors?: [string, string, string, string, string, string];
  rows?: number;
  pointsPerRow?: number;
  amplitude?: number;
  sensitivity?: number;
  speed?: number;
  spacing?: number;
  glow?: number;
  cameraTilt?: number;
};

type Props = {
  audioData: Uint8Array;
  options?: RainbowWaveOptions;
  className?: string;
  canvasRef: any;
};

const defaults: Required<RainbowWaveOptions> = {
  background: "#03030b",
  colors: ["#703cff", "#00f5ff", "#168bff", "#00ffcc", "#ffe45c", "#ff36c8"],
  rows: 70,            // High density for a solid mountain landscape look
  pointsPerRow: 250,   // Smooth resolution for sharp peaks
  amplitude: 6.5,      // Dramatic, towering peaks
  sensitivity: 1.2,
  speed: 0.6,
  spacing: 0.28,
  glow: 1.8,
  cameraTilt: 0.35,
};

const vertexShader = `
uniform float uTime;
uniform float uAmplitude;
uniform float uSensitivity;
uniform float uSpeed;
uniform sampler2D uAudioTexture;
uniform float uRow;
uniform float uRows;

varying float vHeight;
varying float vDepth;
varying float vXPos;

void main() {
  vec3 p = position;
  float x = p.x;
  float depth = uRow / max(1.0, uRows - 1.0);
  vDepth = depth;
  vXPos = (x + 18.0) / 36.0;

  // Organic background wave undulations
  float waveA = sin(x * 0.4 + uTime * uSpeed + depth * 6.0) * 0.4;
  float waveB = cos(x * 1.1 - uTime * uSpeed * 0.7 + depth * 4.0) * 0.15;

  // Sample and sharpen audio texture for distinct frequency spikes
  float rawAudio = texture2D(uAudioTexture, vec2(vXPos, 0.5)).r;
  float audioPeak = pow(rawAudio, 1.4); // Sharpen peaks

  // Front rows are taller, back rows fade into distance
  float audioHeight = audioPeak * uAmplitude * uSensitivity * (0.3 + depth * 1.4);

  // Apply displacement
  p.y += waveA + waveB + audioHeight;
  vHeight = p.y;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const fragmentShader = `
uniform vec3 uColors[6];
uniform float uGlow;
varying float vHeight;
varying float vDepth;
varying float vXPos;

void main() {
  // Map height and position to vibrant synthwave color gradient
  float colorMixFactor = clamp((vHeight + 2.0) / 12.0, 0.0, 0.999);
  float segment = colorMixFactor * 5.0;
  int i = int(floor(segment));
  float f = fract(segment);

  vec3 baseColor = mix(uColors[i], uColors[min(i + 1, 5)], f);

  // Depth shading (atmosphere fade for background ridges)
  float depthShading = mix(0.4, 1.0, vDepth);

  // Peak luminescence and ridge shading effect
  float peakGlow = smoothstep(2.0, 8.0, vHeight) * 0.6;
  vec3 finalColor = baseColor * depthShading + vec3(peakGlow);

  gl_FragColor = vec4(finalColor * uGlow, 1.0);
}
`;

export default function RainbowWaveVisualizer({ audioData, options = {}, className, canvasRef }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const optsRef = useRef({ ...defaults, ...options });
  const dataRef = useRef(audioData);

  useEffect(() => { dataRef.current = audioData; }, [audioData]);
  useEffect(() => { optsRef.current = { ...defaults, ...options }; }, [options]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const opts = { ...defaults, ...optsRef.current };
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      preserveDrawingBuffer: true, 
      powerPreference: "high-performance" 
    });
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(opts.background, 1);
    
    if (canvasRef) canvasRef.current = renderer.domElement;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 8, 18);
    camera.rotation.x = -opts.cameraTilt;

    const colorUniforms = opts.colors.map(c => new THREE.Color(c));

    // Audio Texture setup (64 frequency bins)
    const audioTexData = new Uint8Array(64);
    const audioTexture = new THREE.DataTexture(audioTexData, 64, 1, THREE.RedFormat);
    audioTexture.needsUpdate = true;

    const baseMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: opts.amplitude },
        uSensitivity: { value: opts.sensitivity },
        uSpeed: { value: opts.speed },
        uAudioTexture: { value: audioTexture },
        uRow: { value: 0 },
        uRows: { value: opts.rows },
        uColors: { value: colorUniforms },
        uGlow: { value: opts.glow },
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
    });

    const group = new THREE.Group();
    scene.add(group);
    
    const rowCount = opts.rows;
    const pointCount = opts.pointsPerRow;
    const widthSpan = 36;
    const stripHeight = 0.8; // Vertical height extrusion for solid ribbon look

    // Construct solid 3D ribbon strips for each row to match the dense filled look
    for (let row = 0; row < rowCount; row++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(pointCount * 2 * 3);
      const uvs = new Float32Array(pointCount * 2 * 2);
      const indices = [];

      for (let i = 0; i < pointCount; i++) {
        const x = (i / (pointCount - 1) - 0.5) * widthSpan;
        const z = (row - (rowCount - 1) / 2) * opts.spacing;

        // Top vertex and bottom baseline vertex for ribbon extrusion
        const idx = i * 2;
        positions[idx * 3] = x;
        positions[idx * 3 + 1] = 0;
        positions[idx * 3 + 2] = z;

        positions[(idx + 1) * 3] = x;
        positions[(idx + 1) * 3 + 1] = -stripHeight; // Extends downward to form solid ridges
        positions[(idx + 1) * 3 + 2] = z;

        uvs[idx * 2] = i / (pointCount - 1);
        uvs[idx * 2 + 1] = 1;

        uvs[(idx + 1) * 2] = i / (pointCount - 1);
        uvs[(idx + 1) * 2 + 1] = 0;

        if (i < pointCount - 1) {
          const base = idx;
          indices.push(base, base + 2, base + 1);
          indices.push(base + 1, base + 2, base + 3);
        }
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      geometry.setIndex(indices);

      const rowMaterial = baseMaterial.clone();
      rowMaterial.uniforms = THREE.UniformsUtils.clone(baseMaterial.uniforms);
      rowMaterial.uniforms.uAudioTexture.value = audioTexture;
      rowMaterial.uniforms.uRow.value = row;
      rowMaterial.uniforms.uRows.value = rowCount;

      const mesh = new THREE.Mesh(geometry, rowMaterial);
      group.add(mesh);
    }

    let raf = 0;
    const clock = new THREE.Clock();
    
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      
      group.children.forEach((child: any) => {
        if (child.material && child.material.uniforms) {
          child.material.uniforms.uTime.value = time;
          child.material.uniforms.uAmplitude.value = optsRef.current.amplitude;
          child.material.uniforms.uSensitivity.value = optsRef.current.sensitivity;
          child.material.uniforms.uSpeed.value = optsRef.current.speed;
          child.material.uniforms.uGlow.value = optsRef.current.glow;
        }
      });

      if (dataRef.current) {
        for (let i = 0; i < 64; i++) {
          audioTexData[i] = dataRef.current[i] || 0;
        }
        audioTexture.needsUpdate = true;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className={className} style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%", overflow: "hidden" }} />
    </div>
  );
}
