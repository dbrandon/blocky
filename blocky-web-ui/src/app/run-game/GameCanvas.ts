
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
  private rotRight = false;
  private rotLeft = false;
  private strafeRight = false;
  private strafeLeft = false;

  private heading = 0.0;
  private jumping = false;
  private vy = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.camera = new THREE.PerspectiveCamera(70, this.canvas.clientWidth / this.canvas.clientHeight, 0.01, 10);
    this.camera.position.z = 1;
    this.camera.position.y = .2;

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

    const grid = new THREE.GridHelper(10, 10);
    this.scene.add(grid);

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

    let repoint = false;
    if(this.rotLeft) {
      this.heading -= delta * Math.PI / 1800;
      repoint = true;
    }
    if(this.rotRight) {
      this.heading += delta * Math.PI / 1800;
      repoint = true;
    }

    if(this.strafeLeft) {
      this.camera.position.z += (delta / 1000) * Math.sin(this.heading - Math.PI/2);
      this.camera.position.x += (delta / 1000) * Math.cos(this.heading - Math.PI/2);
      repoint = true;
    }
    if(this.strafeRight) {
      this.camera.position.z += (delta / 1000) * Math.sin(this.heading + Math.PI/2);
      this.camera.position.x += (delta / 1000) * Math.cos(this.heading + Math.PI/2);
      repoint = true;
    }

    if(this.gofwd) {
      this.camera.position.z += (delta / 1000) * Math.sin(this.heading);
      this.camera.position.x += (delta / 1000) * Math.cos(this.heading);
      repoint = true;
    }
    if(this.goback) {
      this.camera.position.z -= (delta / 1000) * Math.sin(this.heading);
      this.camera.position.x -= (delta / 1000) * Math.cos(this.heading);
      repoint = true;
    }

    if(this.jumping) {
      this.camera.position.y += this.vy * (delta / 1000);
      this.vy -= (delta / 1000) * 9.8;
      if(this.camera.position.y <= 0.2) {
        this.camera.position.y = 0.2;
        this.jumping = false;
      }
      repoint = true;
    }

    if(repoint) {
      this.camera.lookAt(new THREE.Vector3(
        this.camera.position.x + Math.cos(this.heading),
        this.camera.position.y - 0.2,
        this.camera.position.z + Math.sin(this.heading)
      ))
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
    if(event.code == 'KeyA') {
      this.rotLeft = true;
    }
    if(event.code == 'KeyD') {
      this.rotRight = true;
    }

    if(event.code == 'KeyQ') {
      this.strafeLeft = true;
    }
    if(event.code == 'KeyE') {
      this.strafeRight = true;
    }

    if(event.code == 'Space' && !this.jumping) {
      this.jumping = true;
      this.vy = 2.5;
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
    if(event.code == 'KeyA') {
      this.rotLeft = false;
    }
    if(event.code == 'KeyD') {
      this.rotRight = false;
    }
    if(event.code == 'KeyQ') {
      this.strafeLeft = false;
    }
    if(event.code == 'KeyE') {
      this.strafeRight = false;
    }
  }

  private handleResize(event: UIEvent) {
    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
  }
}