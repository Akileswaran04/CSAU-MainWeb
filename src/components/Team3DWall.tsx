"use client";

import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import type { TeamMember } from "@/app/team/members";
import { initials } from "@/app/team/members";

/* ============================================================
   TEAM 3D WALL — helical member ribbon around a cylinder.

   The featured members spiral a FULL wrap around a vertical
   cylinder. Scrolling advances the helix like a screw:
     • the whole ribbon rotates around the axis
     • and translates upward at the same time
     • each member swings around the front where it faces the
       camera dead-centre, enlarged
     • role / name / dept / links crossfade beside the front
       panel as each member takes the stage
     • panels that pass behind the cylinder are hidden

   White stage — matches the site's light theme.
   ============================================================ */

interface Team3DWallProps {
  members: TeamMember[];
}

/* Draw a member portrait (photo or initials card) onto a canvas →
   dataURL texture. Keeps photos crisp, avoids WebGL/CORS tainting. */
function portraitDataURL(member: TeamMember, size = 512): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size * 1.25; // portrait 4:5
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve("");

    const paintFallback = () => {
      const g = ctx.createLinearGradient(0, 0, size, size * 1.25);
      g.addColorStop(0, "#e8e7f1");
      g.addColorStop(1, "#dad9e3");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size * 1.25);
      ctx.fillStyle = "rgba(26,27,34,.28)";
      ctx.font = `700 ${size * 0.24}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initials(member.name), size / 2, size * 0.62);
      resolve(canvas.toDataURL("image/png"));
    };

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const s = Math.min(img.width, img.height);
        const sx = (img.width - s) / 2;
        const sy = (img.height - s) / 2;
        ctx.filter = "grayscale(.35) contrast(1.05)";
        ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
        ctx.filter = "none";
        // soft fade into the panel base
        ctx.fillStyle = "rgba(255,255,255,.18)";
        ctx.fillRect(0, size * 0.82, size, size * 0.43);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        paintFallback();
      }
    };
    img.onerror = paintFallback;
    img.src = member.photo;
  });
}

export default function Team3DWall({ members }: Team3DWallProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [textureUrls, setTextureUrls] = useState<string[]>([]);
  const [active, setActive] = useState(0);

  const N = members.length;

  /* Pre-generate the portrait textures (client-side canvases) */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const urls = await Promise.all(members.map((m) => portraitDataURL(m)));
      if (!cancelled) setTextureUrls(urls);
    })();
    return () => {
      cancelled = true;
    };
  }, [members]);

  const sceneReady = textureUrls.length === N && N > 0;

  /* Three.js scene — once textures are ready */
  useEffect(() => {
    if (!sceneReady) return;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      if (disposed || !stage || !canvas) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
      });
      renderer.setClearColor(0x000000, 0);
      if ("outputColorSpace" in THREE) renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
      camera.position.set(0, 0, 12.5);

      /* ── Geometry ────────────────────────────────────────────
         RADIUS    — cylinder radius the panels wrap around
         ARC       — each panel is a slice of the cylinder
         PITCH     — vertical step between consecutive members
         STEP_ANG  — angular step between consecutive members
         (a full wrap: N members span 2π · WRAPS)                  */
      const RADIUS = 4.8;
      const ARC = Math.PI * 0.24; // ~0.24π ≈ 43° slice per panel
      const PANEL_H = 4.4;
      const PITCH = 2.7;
      const WRAPS = 1.1;
      const STEP_ANG = (2 * Math.PI * WRAPS) / N;

      /* Helix group — rotates around Y and translates along Y */
      const helix = new THREE.Group();
      scene.add(helix);

      /* Curved slice of the cylinder (registered Gallery look) */
      const geometry = new THREE.CylinderGeometry(
        RADIUS,
        RADIUS,
        PANEL_H,
        64,
        1,
        true,
        -ARC / 2,
        ARC
      );

      const makeTexture = (url: string) => {
        const t = new THREE.TextureLoader().load(url);
        if ("colorSpace" in THREE) t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        return t;
      };

      const textures = textureUrls.map(makeTexture);
      const materials = textures.map(
        (map) =>
          new THREE.MeshBasicMaterial({
            map,
            side: THREE.DoubleSide,
            toneMapped: false,
            transparent: true,
            opacity: 1,
          })
      );

      /* Each member sits on the helix at angle θ_i and height y_i.
         Member i+1 is BELOW member i so the flow reads upward:
         as the helix rotates, later members rise into the front. */
      const panels: THREE.Mesh[] = [];
      const pivots: THREE.Group[] = [];
      materials.forEach((material, i) => {
        const pivot = new THREE.Group();
        const panel = new THREE.Mesh(geometry, material.clone());
        pivot.rotation.y = i * STEP_ANG;
        pivot.position.y = ((N - 1) / 2 - i) * PITCH;
        pivot.add(panel);
        helix.add(pivot);
        panels.push(panel);
        pivots.push(pivot);
      });

      /* Thin central rail — sells the "cylinder" read */
      const railGeo = new THREE.CylinderGeometry(0.035, 0.035, 60, 8, 1, true);
      const railMat = new THREE.MeshBasicMaterial({
        color: 0x77767b,
        transparent: true,
        opacity: 0.4,
      });
      const railMesh = new THREE.Mesh(railGeo, railMat);
      scene.add(railMesh);
      /* faint equator rings */
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xc7c6cb,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const rings: THREE.Mesh[] = [];
      for (let r = -1; r <= 1; r++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(RADIUS + 0.02, 0.008, 8, 96), ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = r * 2.1;
        scene.add(ring);
        rings.push(ring);
      }

      /* Tracked objects for cleanup */
      const disposables = {
        railGeo,
        railMat,
        ringMat,
        geometry,
        materials,
        textures,
        rings: rings.map((r) => r.geometry),
      };

      /* Scroll progress → rotate + raise the helix as one motion */
      let s = 0; // continuous member index
      let targetS = 0;
      const onScroll = () => {
        const holder = holderRef.current;
        if (!holder) return;
        const rect = holder.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        if (total <= 0) return;
        const p = Math.min(1, Math.max(0, -rect.top / total));
        targetS = p * (N - 1);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      /* Pointer parallax — subtle, adds depth while scrolling */
      let px = 0;
      let py = 0;
      let tx = 0;
      let ty = 0;
      const onPointer = (e: PointerEvent) => {
        tx = (e.clientX / window.innerWidth - 0.5) * 1.4;
        ty = (e.clientY / window.innerHeight - 0.5) * 1.2;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      const resize = () => {
        const rect = stage.getBoundingClientRect();
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(stage);
      resize();

      let raf = 0;
      const animFrame = () => {
        if (disposed) return;
        /* ease scroll progress */
        s += (targetS - s) * 0.09;
        const idx = Math.min(N - 1, Math.max(0, Math.round(s)));
        setActive(idx);

        /* helix position: front member dead-centre */
        helix.rotation.y = -s * STEP_ANG;
        helix.position.y = (s - (N - 1) / 2) * PITCH;

        /* gentle camera parallax */
        px += (tx - px) * 0.04;
        py += (ty - py) * 0.04;
        camera.position.x = px * 0.7;
        camera.position.y = py * 0.5;
        camera.position.z = 12.5;
        camera.lookAt(0, 0, 0);

        /* per-panel focus: front-facing + near the active member */
        const tmpVec = new THREE.Vector3();
        panels.forEach((panel, i) => {
          const mat = panel.material as THREE.MeshBasicMaterial;
          const world = panel.getWorldPosition(tmpVec);
          const ang = Math.atan2(world.x, world.z); // 0 = camera front
          const frontness = Math.max(0, Math.cos(ang)) ** 1.4;
          const idxDist = Math.abs(i - idx);
          let op = frontness * Math.max(0.05, 1 - idxDist * 0.34);
          if (i === idx) op = Math.max(op, 1);
          mat.opacity = op;
          const scl = i === idx ? 1.06 : 0.82;
          panel.scale.set(scl, scl, 1);
          panel.renderOrder = i === idx ? 10 : 0;
        });

        renderer.render(scene, camera);
        raf = requestAnimationFrame(animFrame);
      };
      raf = requestAnimationFrame(animFrame);

      cleanup = () => {
        disposed = true;
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pointermove", onPointer);
        ro.disconnect();
        helix.clear();
        rings.forEach((r) => scene.remove(r));
        scene.remove(railMesh);
        (["railGeo", "railMat", "ringMat", "geometry"] as const).forEach((k) =>
          disposables[k].dispose()
        );
        materials.forEach((m) => m.dispose());
        textures.forEach((t) => t.dispose());
        rings.forEach((r) => r.geometry.dispose());
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneReady, textureUrls]);

  const member = members[Math.min(active, N - 1)];

  return (
    <div
      ref={holderRef}
      data-team-wall
      style={{ height: `${N * 100}vh`, position: "relative" }}
    >
      <div
        ref={stageRef}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          background:
            "radial-gradient(ellipse at 50% 40%, #ffffff 0%, #f4f2fd 55%, #eeedf7 100%)",
        }}
      >
        {/* paper-grid backdrop */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(26,27,34,.1) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
            pointerEvents: "none",
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />

        {/* text overlay — role left, name/dept/links right */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            padding: "9vh 5vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          {/* Left: role */}
          <div style={{ width: "24%", minWidth: 150 }}>
            <div
              data-wall-counter
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: ".3em",
                color: "var(--outline)",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
            </div>
            <div
              key={member.name + "-role"}
              style={{
                fontFamily: "'Ethnocentric', 'Sector034', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(15px, 2vw, 24px)",
                letterSpacing: ".06em",
                lineHeight: 1.2,
                color: "var(--on-surface)",
                animation: "tw-fade-in .6s ease both",
              }}
            >
              {member.role.toUpperCase()}
            </div>
          </div>

          {/* Right: name, dept, links */}
          <div style={{ width: "30%", minWidth: 220, textAlign: "right" }}>
            <div
              key={member.name + "-name"}
              style={{
                fontFamily: "'CremeEspana', 'Syne', sans-serif",
                fontSize: "clamp(30px, 4.4vw, 58px)",
                lineHeight: 1.05,
                color: "var(--on-surface)",
                animation: "tw-fade-in .6s ease .05s both",
              }}
            >
              {member.name}
            </div>
            <div
              key={member.name + "-dept"}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "var(--on-surface-variant)",
                marginTop: 12,
                animation: "tw-fade-in .6s ease .15s both",
              }}
            >
              {member.dept}
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 18,
                justifyContent: "flex-end",
                animation: "tw-fade-in .6s ease .25s both",
              }}
            >
              {["X / TWITTER", "LINKEDIN", "GITHUB"].map((label) => (
                <span
                  key={label}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8.5,
                    letterSpacing: ".14em",
                    color: "var(--on-surface-variant)",
                    border: "1px solid var(--outline-variant)",
                    borderRadius: 999,
                    padding: "6px 12px",
                    whiteSpace: "nowrap",
                    transition: "color .3s ease, border-color .3s ease",
                    pointerEvents: "auto",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--on-surface)";
                    e.currentTarget.style.borderColor = "var(--primary-container)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--on-surface-variant)";
                    e.currentTarget.style.borderColor = "var(--outline-variant)";
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* progress bar */}
        <div
          style={{
            position: "absolute",
            left: "5vw",
            right: "5vw",
            bottom: 34,
            height: 2,
            background: "rgba(26,27,34,.14)",
            borderRadius: 2,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: `${((active + 1) / N) * 100}%`,
              height: "100%",
              background: "var(--on-surface)",
              transition: "width .5s ease",
            }}
          />
        </div>

        <style>{`
          @keyframes tw-fade-in {
            from { opacity: 0; transform: translateY(14px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}