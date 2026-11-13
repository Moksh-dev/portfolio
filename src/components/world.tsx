"use client";

/* R3F updates GPU resources and shared animation refs outside React's render cycle. */
/* eslint-disable react-hooks/immutability */

import { Component, useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import type { PublicEntry } from "@/content/portfolio";
import { constellationEdges, displayPosition, mix, seededRandom, smoothRange } from "@/lib/world";

export interface SceneBridge { progress: number; invalidate: () => void }
interface WorldProps {
  entries: PublicEntry[];
  bridge: MutableRefObject<SceneBridge>;
  reducedMotion: boolean;
  journeyVisible: boolean;
  selectedId: string | null;
  hoveredId: string | null;
  explored: Set<string>;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onReady: () => void;
  onError: () => void;
  hideLabels: boolean;
}

const sphereVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;
const sphereFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uDark;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  float hash(vec3 p) { p = fract(p * .3183099 + vec3(.1,.2,.3)); p *= 17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float noise(vec3 x) {
    vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  void main() {
    vec3 n=normalize(vNormal);
    vec3 light=normalize(vec3(-.7,.85,1.1));
    float diffuse=max(0.,dot(n,light));
    float clouds=noise(vPosition*4.3+vec3(uTime*.018,0.,0.));
    clouds += .35*noise(vPosition*15.);
    float bands=sin(vPosition.y*11. + clouds*3.8)*.018;
    vec3 shadow=mix(vec3(.30,.32,.34),vec3(.09,.12,.20),uDark);
    vec3 lightColor=vec3(.94,.91,.84);
    vec3 color=mix(shadow,lightColor,smoothstep(-.18,1.,diffuse));
    color+=(clouds-.5)*.065+bands;
    float rim=pow(1.-max(0.,dot(n,normalize(vViewPosition))),3.);
    color+=vec3(.18,.14,.08)*rim;
    gl_FragColor=vec4(color,uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const glowVertex = /* glsl */ `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const glowFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main(){ float d=length(vUv-.5)*2.; float glow=pow(max(0.,1.-d),3.5); gl_FragColor=vec4(uColor,glow*uOpacity); }
`;

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function World(props: WorldProps) {
  return <SceneBoundary onError={props.onError}>
    <Canvas dpr={[1, 1.5]} camera={{ fov: 38, position: [0, 0, 11], near: 0.1, far: 90 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} frameloop={props.reducedMotion ? "demand" : "always"} onCreated={({ gl }) => {
      gl.setClearColor(0x000000, 0);
      props.onReady();
    }} fallback={null}>
      <Scene {...props} />
    </Canvas>
  </SceneBoundary>;
}

function Scene(props: WorldProps) {
  const { bridge, reducedMotion, selectedId, entries, onError } = props;
  const { invalidate, gl, size, camera } = useThree();
  const compact = size.width < 760;
  const planet = useRef<THREE.Group>(null);
  const planetMaterial = useRef<THREE.ShaderMaterial>(null);
  const haloMaterial = useRef<THREE.ShaderMaterial>(null);
  const orbits = useRef<THREE.Group>(null);
  const constellation = useRef<THREE.Group>(null);
  const horizon = useRef<THREE.Mesh>(null);
  const horizonMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const orbitMaterials = useRef<THREE.LineBasicMaterial[]>([]);
  const targetPosition = useMemo(() => new THREE.Vector3(), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const smoothProgress = useRef(bridge.current.progress);
  const elapsed = useRef(0);
  const sphereUniforms = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 1 }, uDark: { value: 0 } }), []);
  const haloUniforms = useMemo(() => ({ uColor: { value: new THREE.Color("#ccb17b") }, uOpacity: { value: 0.24 } }), []);
  const orbitLines = useMemo(() => Array.from({ length: 5 }, (_, index) => {
    const points = Array.from({ length: 241 }, (_, point) => {
      const angle = point / 240 * Math.PI * 2;
      const radius = 2.38 + index * 0.43;
      return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * (0.34 + index * 0.035), Math.sin(angle) * (0.2 + index * 0.2));
    });
    return points;
  }), []);

  useEffect(() => {
    const sceneBridge = bridge.current;
    sceneBridge.invalidate = invalidate;
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onError(); };
    canvas.addEventListener("webglcontextlost", lost);
    const visibility = () => { if (!document.hidden) invalidate(); };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      sceneBridge.invalidate = () => {};
      canvas.removeEventListener("webglcontextlost", lost);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [bridge, invalidate, gl, onError]);

  useEffect(() => { invalidate(); }, [selectedId, props.hoveredId, props.explored, reducedMotion, invalidate]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!reducedMotion && !document.hidden) elapsed.current += dt;
    const time = elapsed.current;
    smoothProgress.current = reducedMotion ? bridge.current.progress : THREE.MathUtils.damp(smoothProgress.current, bridge.current.progress, 10, dt);
    const p = smoothProgress.current;
    const transform = smoothRange(0.08, 0.84, p);
    const arrival = smoothRange(0.55, 0.97, p);
    const depart = smoothRange(0.24, 0.8, p);
    const selected = entries.find((entry) => entry.id === selectedId);
    const targetStar = selected ? displayPosition(selected.visual.position, compact) : null;
    const parallaxX = reducedMotion ? 0 : state.pointer.x * 0.12;
    const parallaxY = reducedMotion ? 0 : state.pointer.y * 0.08;
    const cameraDistance = compact ? mix(10, 12.8, arrival) : mix(11, 9.5, arrival);
    if (targetStar) {
      targetPosition.set(targetStar[0] - (compact ? 0 : 1.35), targetStar[1] + (compact ? 1.9 : 0.1), targetStar[2] + (compact ? 8 : 5.4));
      targetLook.set(targetStar[0] - (compact ? 0 : 1.35), targetStar[1] + (compact ? 1.9 : 0.1), targetStar[2]);
    } else {
      targetPosition.set(parallaxX + Math.sin(transform * Math.PI) * 0.7, parallaxY + Math.sin(transform * Math.PI) * 0.28, cameraDistance - Math.sin(transform * Math.PI) * 1.5);
      targetLook.set(parallaxX * 0.25, parallaxY * 0.25, 0);
    }
    const blend = reducedMotion ? 1 : 1 - Math.exp(-dt * 4.4);
    camera.position.lerp(targetPosition, blend);
    look.lerp(targetLook, blend);
    camera.lookAt(look);

    if (planet.current) {
      planet.current.position.set(mix(compact ? 0.65 : 2.4, 0.1, transform), mix(compact ? 1.15 : 0.05, 0.4, transform), mix(0, -9, depart));
      planet.current.scale.setScalar((compact ? 0.76 : 1) * mix(1, 0.32, depart));
      planet.current.rotation.y = time * 0.035;
      planet.current.rotation.z = -0.12;
    }
    if (planetMaterial.current) {
      planetMaterial.current.uniforms.uTime.value = time;
      planetMaterial.current.uniforms.uOpacity.value = 1 - depart;
      planetMaterial.current.uniforms.uDark.value = transform;
    }
    if (haloMaterial.current) haloMaterial.current.uniforms.uOpacity.value = (1 - depart) * 0.23;
    if (orbits.current) {
      orbits.current.position.set(mix(compact ? 0.65 : 2.4, 0, transform), mix(compact ? 1.15 : 0.05, 0, transform), -transform * 2);
      orbits.current.rotation.set(-0.4 + transform * 0.7, -0.3 + transform * 0.7, -0.48 + time * 0.009);
      orbits.current.scale.setScalar((compact ? 0.73 : 1) * (1 + transform * 2.6));
      orbits.current.visible = p < 0.96;
    }
    orbitMaterials.current.forEach((material, index) => {
      material.opacity = (0.19 - index * 0.018) * (1 - smoothRange(0.52, 0.93, p));
      material.color.set(transform > 0.5 ? "#b0bad1" : "#968262");
    });
    if (constellation.current) {
      constellation.current.scale.setScalar(mix(0.67, 1, arrival));
      constellation.current.position.z = mix(-9, 0, arrival);
      constellation.current.position.y = compact ? 0.1 : -0.25;
      constellation.current.rotation.y = reducedMotion ? 0 : Math.sin(time * 0.065) * 0.055;
      constellation.current.rotation.z = reducedMotion ? 0 : Math.sin(time * 0.045) * 0.017;
      constellation.current.visible = p > 0.38;
    }
    if (horizon.current && horizonMaterial.current) {
      horizon.current.scale.set(12 + transform * 10, 0.008 + Math.sin(transform * Math.PI) * 0.018, 1);
      horizon.current.position.set(0, mix(-0.7, 2.3, transform), -4);
      horizonMaterial.current.opacity = Math.sin(smoothRange(0.21, 0.8, p) * Math.PI) * 0.2;
    }
    if (reducedMotion && !camera.position.equals(targetPosition)) invalidate();
  });

  return <>
    <group ref={planet}>
      <mesh><sphereGeometry args={[1.18, 64, 48]} /><shaderMaterial ref={planetMaterial} vertexShader={sphereVertex} fragmentShader={sphereFragment} uniforms={sphereUniforms} transparent /></mesh>
      <mesh position={[0, 0, -0.25]} scale={5.3}><planeGeometry /><shaderMaterial ref={haloMaterial} vertexShader={glowVertex} fragmentShader={glowFragment} uniforms={haloUniforms} transparent depthWrite={false} /></mesh>
    </group>
    <group ref={orbits}>
      {orbitLines.map((points, index) => <OrbitCurve key={index} points={points} index={index} materials={orbitMaterials} />)}
      <OrbitSatellite reducedMotion={reducedMotion} radius={2.38} offset={0.5} size={0.065} speed={0.11} />
      <OrbitSatellite reducedMotion={reducedMotion} radius={3.24} offset={2.5} size={0.035} speed={-0.075} />
      <OrbitSatellite reducedMotion={reducedMotion} radius={4.1} offset={4.2} size={0.026} speed={0.055} />
    </group>
    <Dust bridge={bridge} reducedMotion={reducedMotion} compact={compact} />
    <mesh ref={horizon}><planeGeometry /><meshBasicMaterial ref={horizonMaterial} color="#d0b58c" transparent depthWrite={false} /></mesh>
    <group ref={constellation}>
      <Connections entries={entries} compact={compact} hoveredId={props.hoveredId} selectedId={selectedId} explored={props.explored} bridge={bridge} />
      {entries.map((entry, index) => <Star key={entry.id} entry={entry} index={index} compact={compact} bridge={bridge} active={props.hoveredId === entry.id || selectedId === entry.id} explored={props.explored.has(entry.id)} labelsVisible={props.journeyVisible && !selectedId && !props.hideLabels} reducedMotion={reducedMotion} onSelect={props.onSelect} onHover={props.onHover} />)}
      <CentralLight bridge={bridge} reducedMotion={reducedMotion} />
    </group>
  </>;
}

function OrbitCurve({ points, index, materials }: { points: THREE.Vector3[]; index: number; materials: MutableRefObject<THREE.LineBasicMaterial[]> }) {
  const object = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: "#968262", transparent: true, opacity: 0.18, depthWrite: false });
    return new THREE.Line(geometry, material);
  }, [points]);
  useEffect(() => {
    materials.current[index] = object.material;
    return () => { object.geometry.dispose(); object.material.dispose(); };
  }, [object, index, materials]);
  return <primitive object={object} rotation={[index * 0.15, index * 0.09, index * 0.22]} />;
}

function OrbitSatellite({ reducedMotion, radius, offset, size, speed }: { reducedMotion: boolean; radius: number; offset: number; size: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (!reducedMotion && !document.hidden) elapsed.current += Math.min(delta, 0.05);
    const a = elapsed.current * speed + offset;
    ref.current?.position.set(Math.cos(a) * radius, Math.sin(a) * radius * 0.4, Math.sin(a) * 0.7);
  });
  return <mesh ref={ref}><sphereGeometry args={[size, 16, 12]} /><meshBasicMaterial color="#b69b70" /></mesh>;
}

function Dust({ bridge, reducedMotion, compact }: { bridge: MutableRefObject<SceneBridge>; reducedMotion: boolean; compact: boolean }) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const elapsed = useRef(0);
  const count = compact ? 300 : 680;
  const { positions, destinations, orbits, seeds } = useMemo(() => {
    const random = seededRandom(173);
    const positions = new Float32Array(count * 3);
    const destinations = new Float32Array(count * 3);
    const orbits = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      seeds[i] = random();
      const a = random() * Math.PI * 2;
      const r = 1.8 + random() * 5.6;
      orbits[i * 3] = a;
      orbits[i * 3 + 1] = r;
      orbits[i * 3 + 2] = (random() - 0.5) * 7;
      destinations[i * 3] = (random() - 0.5) * 30;
      destinations[i * 3 + 1] = (random() - 0.5) * 22;
      destinations[i * 3 + 2] = -random() * 25 + 2;
    }
    return { positions, destinations, orbits, seeds };
  }, [count]);
  const uniforms = useMemo(() => ({ uDark: { value: 0 }, uTime: { value: 0 }, uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) } }), []);
  useFrame((_, delta) => {
    if (!reducedMotion && !document.hidden) elapsed.current += Math.min(delta, 0.05);
    const time = elapsed.current;
    const p = smoothRange(0.04, 0.88, bridge.current.progress);
    for (let i = 0; i < count; i++) {
      const a = orbits[i * 3] + time * (0.012 + seeds[i] * 0.023);
      const r = orbits[i * 3 + 1];
      positions[i * 3] = mix(Math.cos(a) * r + (compact ? 0.65 : 2.4), destinations[i * 3], p);
      positions[i * 3 + 1] = mix(Math.sin(a) * r * 0.48 + (compact ? 1.15 : 0), destinations[i * 3 + 1], p);
      positions[i * 3 + 2] = mix(orbits[i * 3 + 2], destinations[i * 3 + 2] + Math.sin(time * 0.05 + i) * 0.12, p);
    }
    if (points.current) points.current.geometry.attributes.position.needsUpdate = true;
    if (material.current) { material.current.uniforms.uDark.value = p; material.current.uniforms.uTime.value = time; }
  });
  return <points ref={points} frustumCulled={false}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /><bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} /></bufferGeometry>
    <shaderMaterial ref={material} uniforms={uniforms} transparent depthWrite={false} vertexShader={/* glsl */ `
      attribute float aSeed; uniform float uPixelRatio; uniform float uTime; varying float vSeed;
      void main(){vSeed=aSeed; vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=(1.2+aSeed*2.8)*uPixelRatio*(7./max(3.,-mv.z));}
    `} fragmentShader={/* glsl */ `
      uniform float uDark; uniform float uTime; varying float vSeed;
      void main(){float d=length(gl_PointCoord-.5)*2.; if(d>1.)discard; vec3 color=mix(vec3(.52,.43,.29),vec3(.67,.75,.96),uDark); float pulse=.7+.3*sin(uTime*(.3+vSeed*.3)+vSeed*40.); gl_FragColor=vec4(color,(1.-smoothstep(.1,1.,d))*mix(.3,.72,uDark)*pulse);}
    `} />
  </points>;
}

function Star({ entry, index, compact, bridge, active, explored, labelsVisible, reducedMotion, onSelect, onHover }: { entry: PublicEntry; index: number; compact: boolean; bridge: MutableRefObject<SceneBridge>; active: boolean; explored: boolean; labelsVisible: boolean; reducedMotion: boolean; onSelect: (id: string) => void; onHover: (id: string | null) => void }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.MeshBasicMaterial>(null);
  const halo = useRef<THREE.ShaderMaterial>(null);
  const elapsed = useRef(0);
  const position = displayPosition(entry.visual.position, compact);
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color(entry.visual.color) }, uOpacity: { value: 0.45 } }), [entry.visual.color]);
  const left = compact ? position[0] > 0.5 : entry.visual.labelSide === "left";
  useFrame(({ camera }, delta) => {
    if (!reducedMotion && !document.hidden) elapsed.current += Math.min(delta, 0.05);
    const time = elapsed.current;
    const opacity = smoothRange(0.47, 0.87, bridge.current.progress);
    const pulse = reducedMotion ? 1 : 0.9 + Math.sin(time * 0.65 + index * 2) * 0.1;
    if (group.current) {
      group.current.position.set(position[0], position[1] + (reducedMotion ? 0 : Math.sin(time * 0.18 + index) * 0.035), position[2]);
      const glow = group.current.children[0];
      glow.quaternion.copy(camera.quaternion);
    }
    if (core.current) core.current.opacity = opacity;
    if (halo.current) halo.current.uniforms.uOpacity.value = opacity * pulse * (active ? 0.95 : explored ? 0.72 : 0.36);
  });
  return <group ref={group} position={position}>
    <mesh scale={entry.visual.size * (active ? 0.85 : 0.65)}><planeGeometry /><shaderMaterial ref={halo} vertexShader={glowVertex} fragmentShader={glowFragment} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
    <mesh><sphereGeometry args={[0.027 * entry.visual.size * (active ? 1.4 : 1), 12, 10]} /><meshBasicMaterial ref={core} color={entry.visual.color} transparent /></mesh>
    {labelsVisible && <mesh onClick={(event) => { event.stopPropagation(); onSelect(entry.id); }} onPointerOver={(event) => { event.stopPropagation(); onHover(entry.id); }} onPointerOut={() => onHover(null)}><sphereGeometry args={[0.16, 8, 6]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>}
    {labelsVisible && <Html position={[left ? -0.12 : 0.12, -0.03, 0]} zIndexRange={[30, 20]} style={{ pointerEvents: "auto" }}>
      <button className={`star-label ${left ? "label-left" : ""} ${active ? "is-active" : ""} ${explored ? "is-explored" : ""} ${entry.kind === "foundation" ? "is-small" : ""}`} data-star-id={entry.id} onClick={() => onSelect(entry.id)} onPointerEnter={() => onHover(entry.id)} onPointerLeave={() => onHover(null)} onFocus={() => onHover(entry.id)} onBlur={() => onHover(null)} aria-label={`Explore ${entry.title}${explored ? ", previously explored" : ""}`}>
        <span>{entry.shortTitle ?? entry.title}</span><small>{entry.category.split(" / ")[0]}{explored ? " · explored" : ""}</small>
      </button>
    </Html>}
  </group>;
}

function Connections({ entries, compact, hoveredId, selectedId, explored, bridge }: { entries: PublicEntry[]; compact: boolean; hoveredId: string | null; selectedId: string | null; explored: Set<string>; bridge: MutableRefObject<SceneBridge> }) {
  const group = useRef<THREE.Group>(null);
  const edges = useMemo(() => constellationEdges(entries), [entries]);
  useFrame(() => {
    group.current?.children.forEach((child, index) => {
      const edge = edges[index];
      if (!edge) return;
      const relevant = edge.from === hoveredId || edge.to === hoveredId || edge.from === selectedId || edge.to === selectedId;
      const discovered = explored.has(edge.from) && explored.has(edge.to);
      const line = child as THREE.Line;
      const mat = line.material as THREE.Material;
      mat.opacity = smoothRange(0.55, 0.95, bridge.current.progress) * (relevant ? 0.65 : discovered ? 0.4 : 0.14);
    });
  });
  return <group ref={group}>{edges.map((edge) => {
    const from = entries.find((entry) => entry.id === edge.from)!;
    const to = entries.find((entry) => entry.id === edge.to)!;
    const a = displayPosition(from.visual.position, compact);
    const b = displayPosition(to.visual.position, compact);
    const mid: [number, number, number] = [mix(a[0], b[0], 0.5), mix(a[1], b[1], 0.5) + 0.12, mix(a[2], b[2], 0.5) - 0.3];
    const points = new THREE.CatmullRomCurve3([new THREE.Vector3(...a), new THREE.Vector3(...mid), new THREE.Vector3(...b)]).getPoints(32);
    return <Line key={edge.id} points={points} color="#94a9d8" transparent opacity={0.16} lineWidth={0.65} depthWrite={false} />;
  })}</group>;
}

function CentralLight({ bridge, reducedMotion }: { bridge: MutableRefObject<SceneBridge>; reducedMotion: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color("#475680") }, uOpacity: { value: 0.4 } }), []);
  useFrame(({ camera }) => {
    mesh.current?.quaternion.copy(camera.quaternion);
    if (material.current) material.current.uniforms.uOpacity.value = smoothRange(0.5, 0.98, bridge.current.progress) * (reducedMotion ? 0.22 : 0.3);
  });
  return <mesh ref={mesh} scale={[11, 7, 1]} position={[0, -0.1, -3]}><planeGeometry /><shaderMaterial ref={material} vertexShader={glowVertex} fragmentShader={glowFragment} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>;
}
