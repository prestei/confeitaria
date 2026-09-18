"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** Rich pastry-inspired Three.js hero — marketing landing only */
export function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !mountRef.current) return;
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    if (isMobile) return;

    let disposed = false;
    let raf = 0;
    let cleanupExtras: (() => void) | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let renderer: any = null;

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    (async () => {
      const THREE = await import("three");
      if (disposed || !mountRef.current) return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      const scene = new THREE.Scene();
      const fog = new THREE.FogExp2(0xffe4ea, 0.045);
      scene.fog = fog;

      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0.15, 5.2);

      const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      r.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      r.setSize(width, height);
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.toneMappingExposure = 1.15;
      mountRef.current.appendChild(r.domElement);
      renderer = r;

      const key = new THREE.DirectionalLight(0xfff5ec, 1.6);
      key.position.set(3, 4, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xff8fb5, 0.85);
      rim.position.set(-3, 1, -2);
      scene.add(rim);
      scene.add(new THREE.AmbientLight(0xffe0ea, 0.7));
      const point = new THREE.PointLight(0xffc4a0, 1.2, 12);
      point.position.set(0, 1.2, 2);
      scene.add(point);

      const group = new THREE.Group();
      scene.add(group);

      type Piece = {
        mesh: InstanceType<typeof THREE.Mesh>;
        base: [number, number, number];
        speed: number;
        phase: number;
        rot: [number, number, number];
      };
      const pieces: Piece[] = [];

      const mkMat = (color: number, roughness = 0.35, metalness = 0.08) =>
        new THREE.MeshPhysicalMaterial({
          color,
          roughness,
          metalness,
          clearcoat: 0.55,
          clearcoatRoughness: 0.25,
        });

      const specs: Array<{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        geo: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mat: any;
        pos: [number, number, number];
        scale?: number;
        speed: number;
        rot: [number, number, number];
      }> = [
        {
          geo: new THREE.SphereGeometry(0.72, 48, 48),
          mat: mkMat(0xd4527a, 0.3, 0.12),
          pos: [-1.15, 0.2, 0],
          speed: 0.55,
          rot: [0.15, 0.4, 0],
        },
        {
          geo: new THREE.TorusGeometry(0.55, 0.2, 32, 64),
          mat: mkMat(0xffd9b8, 0.4, 0.05),
          pos: [1.05, -0.2, -0.35],
          speed: 0.7,
          rot: [0.5, 0.2, 0.35],
        },
        {
          geo: new THREE.IcosahedronGeometry(0.48, 0),
          mat: mkMat(0xf2a0b8, 0.28, 0.1),
          pos: [0.15, 0.95, -0.9],
          speed: 0.85,
          rot: [0.2, 0.55, 0.1],
        },
        {
          geo: new THREE.TorusKnotGeometry(0.28, 0.09, 100, 16),
          mat: mkMat(0xe8a06a, 0.32, 0.15),
          pos: [-0.35, -0.75, 0.4],
          scale: 1.1,
          speed: 0.6,
          rot: [0.4, 0.3, 0.2],
        },
        {
          geo: new THREE.SphereGeometry(0.22, 24, 24),
          mat: mkMat(0xff8fb5, 0.25, 0.05),
          pos: [1.45, 0.75, 0.2],
          speed: 1.1,
          rot: [0, 0.8, 0],
        },
        {
          geo: new THREE.OctahedronGeometry(0.28, 0),
          mat: mkMat(0xfff0e0, 0.45, 0.02),
          pos: [-1.5, -0.45, -0.5],
          speed: 0.9,
          rot: [0.3, 0.5, 0.15],
        },
      ];

      specs.forEach((s, i) => {
        const mesh = new THREE.Mesh(s.geo, s.mat);
        mesh.position.set(...s.pos);
        if (s.scale) mesh.scale.setScalar(s.scale);
        group.add(mesh);
        pieces.push({
          mesh,
          base: s.pos,
          speed: s.speed,
          phase: i * 0.9,
          rot: s.rot,
        });
      });

      const onPointer = (e: PointerEvent) => {
        const rect = mountRef.current!.getBoundingClientRect();
        pointer.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.ty = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      };
      mountRef.current.addEventListener("pointermove", onPointer);

      const onResize = () => {
        if (!mountRef.current || !renderer) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);
      cleanupExtras = () => {
        window.removeEventListener("resize", onResize);
        mountRef.current?.removeEventListener("pointermove", onPointer);
      };

      const start = performance.now();
      const tick = (t: number) => {
        if (disposed) return;
        const elapsed = (t - start) / 1000;
        pointer.x += (pointer.tx - pointer.x) * 0.06;
        pointer.y += (pointer.ty - pointer.y) * 0.06;

        group.rotation.y = pointer.x * 0.35;
        group.rotation.x = pointer.y * 0.18;

        for (const p of pieces) {
          const bob = Math.sin(elapsed * p.speed + p.phase) * 0.12;
          p.mesh.position.y = p.base[1] + bob;
          p.mesh.rotation.x = elapsed * p.rot[0];
          p.mesh.rotation.y = elapsed * p.rot[1];
          p.mesh.rotation.z = elapsed * p.rot[2];
        }

        camera.position.x = pointer.x * 0.25;
        camera.position.y = 0.15 + pointer.y * 0.12;
        camera.lookAt(0, 0.1, 0);

        r.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanupExtras?.();
      if (renderer && mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer?.dispose();
    };
  }, [reduced]);

  if (reduced) {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1400&q=80)",
        }}
      />
    );
  }

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#ffc4d6_0%,transparent_50%),radial-gradient(ellipse_at_80%_70%,#ffd9b8_0%,transparent_45%),linear-gradient(145deg,#ffe0ea,#fff6f1_55%,#ffe8d0)]"
      aria-hidden
    />
  );
}
