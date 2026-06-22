import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";

export default function Landing() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Set up standard Three.js Scene with dark slate fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0b0d, 0.015);

    // Set up transparent/dark background
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0b0d, 1);
    mountRef.current.appendChild(renderer.domElement);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 0, 0);

    // Add ambient and directional lights
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);

    // Primary green accent light
    const dirLight1 = new THREE.DirectionalLight(0x00FF9C, 2.0);
    dirLight1.position.set(10, 10, 10);
    scene.add(dirLight1);

    // Fill dark-zinc light
    const dirLight2 = new THREE.DirectionalLight(0x3f3f46, 1.2);
    dirLight2.position.set(-10, -5, -10);
    scene.add(dirLight2);

    // Grid Floor using theme lines
    const gridHelper = new THREE.GridHelper(40, 40, 0x00FF9C, 0x26282B);
    gridHelper.position.y = -4;
    scene.add(gridHelper);

    // Create 3D Orbs representing threads
    const threadOrbs: { 
      mesh: THREE.Mesh; 
      glowMesh: THREE.Mesh;
      speed: number; 
      orbitRadius: number; 
      angle: number; 
      state: "IDLE" | "RUNNING"; 
    }[] = [];

    const orbGeometry = new THREE.SphereGeometry(1.0, 32, 32);
    const glowGeometry = new THREE.SphereGeometry(1.2, 16, 16);

    const activeCount = 5;
    for (let i = 0; i < activeCount; i++) {
      const state = i % 2 === 0 ? "RUNNING" : "IDLE";
      const color = state === "RUNNING" ? 0x00FF9C : 0x3f3f46;

      // Inner material
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.1,
        metalness: 0.8,
        emissive: color,
        emissiveIntensity: state === "RUNNING" ? 1.0 : 0.1,
      });

      // Outer glow material
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: state === "RUNNING" ? 0.4 : 0.1,
        wireframe: true
      });

      const mesh = new THREE.Mesh(orbGeometry, material);
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      mesh.add(glowMesh);

      const angle = (i / activeCount) * Math.PI * 2;
      const orbitRadius = 6 + Math.random() * 2;
      
      mesh.position.set(Math.cos(angle) * orbitRadius, Math.random() * 2 - 1, Math.sin(angle) * orbitRadius);
      scene.add(mesh);

      threadOrbs.push({
        mesh,
        glowMesh,
        speed: (state === "RUNNING" ? 1.5 : 0.4) * (Math.random() * 0.5 + 0.5),
        orbitRadius,
        angle,
        state
      });
    }

    // Create smaller cubes representing Flying Tasks
    const tasks: {
      mesh: THREE.Mesh;
      targetThread: THREE.Mesh;
      progress: number;
      speed: number;
    }[] = [];

    const taskGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const taskColors = [0x00FF9C, 0xd4d4d8, 0xa1a1aa, 0x141518];

    const createFlyingTask = () => {
      if (threadOrbs.length === 0) return;
      const material = new THREE.MeshStandardMaterial({
        color: taskColors[Math.floor(Math.random() * taskColors.length)],
        roughness: 0.2,
        metalness: 0.5,
        emissive: 0x004D2F,
      });

      const mesh = new THREE.Mesh(taskGeometry, material);
      // Spawn at queue zone (negative z, negative x)
      mesh.position.set(-15, -3, -10 + Math.random() * 5);
      scene.add(mesh);

      const target = threadOrbs[Math.floor(Math.random() * threadOrbs.length)].mesh;
      tasks.push({
        mesh,
        targetThread: target,
        progress: 0,
        speed: 0.01 + Math.random() * 0.015
      });
    };

    // Spawn task cubes regularly
    const taskSpawner = setInterval(createFlyingTask, 800);

    // Particle Trail for active threads
    const particlesCount = 200;
    const particlesGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 40;
      colors[i] = Math.random();
    }

    particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particlesGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.4
    });

    const starParticles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(starParticles);

    // Animation loop variables using high-precision performance timer
    let lastTime = performance.now();
    const startTime = performance.now();

    const animate = () => {
      const currentTime = performance.now();
      const delta = Math.min(0.1, (currentTime - lastTime) / 1000); // capped delta to prevent jumps
      const time = (currentTime - startTime) / 1000;
      lastTime = currentTime;

      // Orbit camera slowly around system
      const cameraRadius = 18;
      camera.position.x = Math.sin(time * 0.08) * cameraRadius;
      camera.position.z = Math.cos(time * 0.08) * cameraRadius;
      camera.position.y = 4 + Math.sin(time * 0.1) * 2;
      camera.lookAt(0, 1, 0);

      // Animate worker threads
      threadOrbs.forEach(orb => {
        // Orbit motion
        orb.angle += orb.speed * delta;
        orb.mesh.position.x = Math.cos(orb.angle) * orb.orbitRadius;
        orb.mesh.position.z = Math.sin(orb.angle) * orb.orbitRadius;
        
        // Spin matching state
        if (orb.state === "RUNNING") {
          orb.mesh.rotation.y += 3 * delta;
          orb.mesh.rotation.x += 1 * delta;
          
          // Fast pulse
          const pulse = 1.0 + Math.sin(time * 12) * 0.15;
          orb.glowMesh.scale.set(pulse, pulse, pulse);
        } else {
          orb.mesh.rotation.y += 0.5 * delta;
          
          // Slow pulse
          const pulse = 0.9 + Math.sin(time * 2.5) * 0.08;
          orb.glowMesh.scale.set(pulse, pulse, pulse);
        }
      });

      // Animate flying task cubes
      for (let i = tasks.length - 1; i >= 0; i--) {
        const task = tasks[i];
        task.progress += task.speed;

        // Quadratic bezier flight curve from spawn point towards target orb
        const start = new THREE.Vector3(-15, -3, -5);
        const end = task.targetThread.position;
        const control = new THREE.Vector3(-5, 8, 2); // fly upward

        // Lerp coordinates
        const p1 = new THREE.Vector3().lerpVectors(start, control, task.progress);
        const p2 = new THREE.Vector3().lerpVectors(control, end, task.progress);
        const finalPos = new THREE.Vector3().lerpVectors(p1, p2, task.progress);

        task.mesh.position.copy(finalPos);
        task.mesh.rotation.x += 1.5 * delta;
        task.mesh.rotation.y += 2.0 * delta;

        // Collision or target reached
        if (task.progress >= 1.0) {
          scene.remove(task.mesh);
          tasks.splice(i, 1);
        }
      }

      // Slowly rotate star background
      starParticles.rotation.y += delta * 0.02;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(taskSpawner);
      if (mountRef.current) {
        mountRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[100vh] bg-theme-bg text-[#E4E4E4] overflow-hidden font-sans">
      {/* 3D Background Canvas CONTAINER */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Decorative subtle vignette overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-transparent to-theme-bg/90 pointer-events-none z-10" />

      {/* Elegant HUD Grid Overlays in corner */}
      <div className="absolute top-8 left-8 z-20 pointer-events-none border-l border-t border-theme-line w-32 h-32 pt-2 pl-2">
        <p className="font-mono text-[10px] tracking-widest text-theme-accent/70">SYS_INT: CORE_OK</p>
        <p className="font-mono text-[9px] text-[#71717A]">POOL_ACTIVE_100%</p>
      </div>

      <div className="absolute top-8 right-8 z-20 pointer-events-none border-r border-t border-theme-line w-32 h-32 pt-2 pr-2 text-right">
        <p className="font-mono text-[9px] tracking-wider text-theme-accent/50">ENGINE V1.0.4</p>
        <p className="font-mono text-[9px] text-[#71717A]">LOCKS: REENTRANT</p>
      </div>

      {/* Floating Center Card Layout */}
      <div className="absolute inset-0 flex flex-col justify-center items-center z-20 text-center px-4 max-w-4xl mx-auto pointer-events-none">
        
        {/* Glowing visual tag */}
        <div className="inline-flex items-center gap-2 bg-theme-accent-dim/30 border border-theme-line px-4 py-1.5 rounded-md mb-6 py-1 px-3 backdrop-blur-md animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-ping" />
          <span className="font-mono text-[10px] sm:text-xs tracking-wider text-theme-accent uppercase font-bold">
            Systems Architecture Showcase
          </span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tighter text-white font-mono uppercase glow mb-4">
          Thread<span className="text-zinc-500">//</span>Forge
        </h1>
        
        <p className="text-theme-accent/90 font-mono text-sm sm:text-base tracking-widest uppercase mb-6 font-semibold">
          CONCURRENT TASK EXECUTION ENGINE
        </p>

        <p className="text-[#71717A] text-sm sm:text-base leading-relaxed max-w-xl mb-12 select-none font-sans">
          A handcrafted, performance-oriented system featuring non-blocking task queues, Custom Reentrant locks, dynamic worker pools, and visual diagnostics orchestration.
        </p>

        {/* Action Button CTA - Needs to capture page events, pointer enabled */}
        <div className="pointer-events-auto flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dashboard"
            className="px-8 py-3 rounded-md font-mono text-xs tracking-wider uppercase font-bold bg-theme-accent text-black hover:brightness-110 transition shadow-[0_0_15px_rgba(0,255,156,0.3)] hover:-translate-y-0.5 duration-200"
          >
            LAUNCH_LIVE_DASHBOARD
          </Link>
          <Link
            to="/about"
            className="px-8 py-3 rounded-md font-mono text-xs tracking-wider uppercase font-bold border border-theme-line bg-theme-panel/80 hover:bg-theme-panel text-[#E4E4E4] hover:text-white transition duration-200 backdrop-blur-sm"
          >
            SYSTEM_DESIGN
          </Link>
        </div>
      </div>

      {/* Footer stats tag */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-full text-center px-4">
        <p className="font-mono text-[10px] text-zinc-600 tracking-widest uppercase">
          SYS: [REENTRANT_LOCK_ACQUIRED] :: MEM: 256MB :: ENGINE: JVM v17
        </p>
      </div>
    </div>
  );
}
