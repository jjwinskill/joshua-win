// The heavy page's WebGL scene: one torus knot with a few satellites, modest enough for a real piece.
// Only HeavyScene loads this, and only when it's near the viewport, so three.js stays out of first load.
import {
  AmbientLight,
  DirectionalLight,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  TorusKnotGeometry,
  WebGLRenderer,
} from 'three';

export interface SceneRenderer {
  // Draws one frame without animating, for reduced motion and the paused state.
  drawStill(): void;
  start(): void;
  stop(): void;
  destroy(): void;
}

export function createSceneRenderer(canvas: HTMLCanvasElement): SceneRenderer {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.z = 5;
  scene.add(new AmbientLight(0xffffff, 1.1));
  const sun = new DirectionalLight(0xffffff, 2.4);
  sun.position.set(3, 4, 5);
  scene.add(sun);

  const knotGeometry = new TorusKnotGeometry(1, 0.32, 160, 24);
  const knotMaterial = new MeshStandardMaterial({ color: 0xb83d0b, roughness: 0.4 });
  const knot = new Mesh(knotGeometry, knotMaterial);
  scene.add(knot);

  const satelliteGeometry = new IcosahedronGeometry(0.22, 2);
  const satelliteMaterial = new MeshStandardMaterial({ color: 0x9bd1c5, roughness: 0.5 });
  const satellites = new Group();
  for (let i = 0; i < 6; i++) {
    const satellite = new Mesh(satelliteGeometry, satelliteMaterial);
    const angle = (i / 6) * Math.PI * 2;
    satellite.position.set(Math.cos(angle) * 2, Math.sin(angle) * 1.2, Math.sin(angle * 2) * 0.6);
    satellites.add(satellite);
  }
  scene.add(satellites);

  const draw = () => renderer.render(scene, camera);

  const resize = new ResizeObserver(() => {
    const { clientWidth, clientHeight } = canvas;
    if (!clientWidth || !clientHeight) return;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    draw();
  });
  resize.observe(canvas);

  let frame = 0;
  let last = 0;
  const animate = (now: number) => {
    const seconds = Math.min((now - last) / 1000, 0.1);
    last = now;
    knot.rotation.x += seconds * 0.4;
    knot.rotation.y += seconds * 0.6;
    satellites.rotation.z += seconds * 0.3;
    draw();
    frame = requestAnimationFrame(animate);
  };

  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };

  return {
    drawStill: draw,
    start() {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(animate);
    },
    stop,
    destroy() {
      stop();
      resize.disconnect();
      knotGeometry.dispose();
      knotMaterial.dispose();
      satelliteGeometry.dispose();
      satelliteMaterial.dispose();
      renderer.dispose();
    },
  };
}
