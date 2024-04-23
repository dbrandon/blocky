
import * as THREE from 'three';

export class GameCanvas {
  private camera: THREE.PerspectiveCamera;
  private geometry: THREE.BoxGeometry;
  private material: THREE.MeshNormalMaterial;
  private mesh: THREE.Mesh;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  private prevTime!: number;

  private gofwd = false;
  private goback = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.camera = new THREE.PerspectiveCamera(70, this.canvas.clientWidth / this.canvas.clientHeight, 0.01, 10);
    this.camera.position.z = 1;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x002040);

    this.geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    this.material = new THREE.MeshNormalMaterial();

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    const gl = this.canvas.getContext('webgl2') as WebGL2RenderingContext;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: this.canvas,
      context: gl});
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
    this.renderer.setAnimationLoop(this.animation.bind(this));

    canvas.addEventListener('pointerdown', e => console.log('pdown'));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));

    window.addEventListener('resize', this.handleResize.bind(this));
  }


  animation(time: number) {
    let delta = this.prevTime == null ? 0 : time - this.prevTime;

    this.prevTime = time;

    this.mesh.rotation.x = time / 2000;
    this.mesh.rotation.y = time / 1000;

    if(this.gofwd) {
      this.camera.position.z -= delta / 1000;
    }
    if(this.goback) {
      this.camera.position.z += delta / 1000;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private handleKeyDown(event: KeyboardEvent) {
    const focus = this.canvas == document.activeElement;
    console.log('active=' + document.activeElement);
    console.log('key down: ' + (event.altKey ? 'Alt+' : '') + (event.ctrlKey ? 'Ctrl+' : '') + (event.shiftKey ? 'Shift+' : '') + event.code + '; focus=' + focus);

    if(event.code == 'KeyW') {
      this.gofwd = true;
    }
    if(event.code == 'KeyS') {
      this.goback = true;
    }

    if(event.code == 'KeyF') {
      event.preventDefault();
    }
  }

  private handleKeyUp(event: KeyboardEvent) {
    if(event.code == 'KeyW') {
      this.gofwd = false;
    }
    if(event.code == 'KeyS') {
      this.goback = false;
    }
  }

  private handleResize(event: UIEvent) {
    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
  }
}