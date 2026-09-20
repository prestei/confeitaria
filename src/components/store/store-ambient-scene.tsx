"use client";

import { useEffect, useRef } from "react";

/** Low-cost organic orbs — texture suggestion, not floating UI toys */
export function StoreAmbientScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    if (window.matchMedia("(max-width: 1023px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let raf = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let renderer: any = null;

    (async () => {
      const THREE = await import("three");
      if (disposed || !mountRef.current) return;

      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 40);
      camera.position.set(0, 0.2, 6);

      const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      r.setPixelRatio(Math.min(window.devicePixelRatio, 1.4));
      r.setSize(w, h);
      mountRef.current.appendChild(r.domElement);
      renderer = r;

      scene.add(new THREE.AmbientLight(0xfff8f2, 0.85));
      const key = new THREE.DirectionalLight(0xf3e8e6, 0.55);
      key.position.set(2, 3, 4);
      scene.add(key);

      const mats = [
        new THREE.MeshPhysicalMaterial({
          color: 0xb96f7d,
          roughness: 0.55,
          metalness: 0.04,
          transparent: true,
          opacity: 0.45,
        }),
        new THREE.MeshPhysicalMaterial({
          color: 0xc98f86,
          roughness: 0.6,
          metalness: 0.02,
          transparent: true,
          opacity: 0.35,
        }),
        new THREE.MeshPhysicalMaterial({
          color: 0xa8b2a0,
          roughness: 0.65,
          metalness: 0.02,
          transparent: true,
          opacity: 0.3,
        }),
      ];

      const meshes = [
        { geo: new THREE.SphereGeometry(0.9, 32, 32), mat: mats[0], pos: [-2.2, 0.3, -1] as const },
        { geo: new THREE.SphereGeometry(0.55, 28, 28), mat: mats[1], pos: [1.8, -0.4, -0.5] as const },
        { geo: new THREE.SphereGeometry(0.4, 24, 24), mat: mats[2], pos: [0.2, 0.9, -1.4] as const },
      ].map((s) => {
        const mesh = new THREE.Mesh(s.geo, s.mat);
        mesh.position.set(...s.pos);
        scene.add(mesh);
        return mesh;
      });

      const start = performance.now();
      const tick = (t: number) => {
        if (disposed) return;
        const e = (t - start) / 1000;
        meshes[0].position.y = 0.3 + Math.sin(e * 0.35) * 0.08;
        meshes[1].position.y = -0.4 + Math.cos(e * 0.28) * 0.07;
        meshes[2].position.y = 0.9 + Math.sin(e * 0.42 + 1) * 0.06;
        r.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (renderer && mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer?.dispose();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" />;
}
