"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** Lightweight floating accents over the store hero (desktop only) */
export function StoreHeroAccents({ accent = "#d4527a" }: { accent?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !mountRef.current) return;
    if (window.matchMedia("(max-width: 1023px)").matches) return;

    let disposed = false;
    let raf = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let renderer: any = null;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      if (disposed || !mountRef.current) return;

      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 50);
      camera.position.z = 4.5;

      const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      r.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      r.setSize(w, h);
      mountRef.current.appendChild(r.domElement);
      renderer = r;

      scene.add(new THREE.AmbientLight(0xffffff, 0.9));
      const light = new THREE.DirectionalLight(0xffe8d6, 1.2);
      light.position.set(2, 3, 4);
      scene.add(light);

      const color = new THREE.Color(accent);
      const mats = [
        new THREE.MeshPhysicalMaterial({
          color,
          roughness: 0.3,
          metalness: 0.1,
          clearcoat: 0.6,
          transparent: true,
          opacity: 0.92,
        }),
        new THREE.MeshPhysicalMaterial({
          color: 0xffd9b8,
          roughness: 0.4,
          clearcoat: 0.4,
          transparent: true,
          opacity: 0.9,
        }),
        new THREE.MeshPhysicalMaterial({
          color: 0xffe0ea,
          roughness: 0.35,
          clearcoat: 0.5,
          transparent: true,
          opacity: 0.88,
        }),
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meshes: any[] = [];
      const geos = [
        new THREE.SphereGeometry(0.45, 32, 32),
        new THREE.TorusGeometry(0.32, 0.12, 20, 40),
        new THREE.IcosahedronGeometry(0.32, 0),
      ];
      const positions: [number, number, number][] = [
        [0.9, 0.5, 0],
        [1.5, -0.3, -0.4],
        [0.5, -0.6, 0.3],
      ];

      geos.forEach((geo, i) => {
        const mesh = new THREE.Mesh(geo, mats[i]);
        mesh.position.set(...positions[i]);
        scene.add(mesh);
        meshes.push({ mesh, base: positions[i], phase: i * 1.2 });
      });

      const onResize = () => {
        if (!mountRef.current || !renderer) return;
        const nw = mountRef.current.clientWidth;
        const nh = mountRef.current.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener("resize", onResize);
      cleanup = () => window.removeEventListener("resize", onResize);

      const t0 = performance.now();
      const tick = (t: number) => {
        if (disposed) return;
        const e = (t - t0) / 1000;
        meshes.forEach((m, i) => {
          m.mesh.position.y = m.base[1] + Math.sin(e * 0.8 + m.phase) * 0.15;
          m.mesh.rotation.y = e * (0.3 + i * 0.1);
          m.mesh.rotation.x = e * 0.2;
        });
        r.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanup?.();
      if (renderer && mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer?.dispose();
    };
  }, [reduced, accent]);

  if (reduced) return null;

  return (
    <div
      ref={mountRef}
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[45%] lg:block"
      aria-hidden
    />
  );
}
