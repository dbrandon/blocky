
import { Observable, Subject } from 'rxjs';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
import { PointAvg } from './PointAvg';
import { Chunk } from './Chunk';

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

  private heading = -Math.PI/2;
  private pitch = 0;
  private jumping = false;
  private vy = 0;

  private posObserver: Subject<THREE.Vector3>;

  private traveller!: THREE.Mesh;
  private carArray: THREE.Mesh[] = [];
  private travellerSpeed = .25;
  private followTraveller = false;

  private camPos = new PointAvg(50);

  constructor(private canvas: HTMLCanvasElement) {
    this.camera = new THREE.PerspectiveCamera(70, this.canvas.clientWidth / this.canvas.clientHeight, 0.01, 100);
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

    requestAnimationFrame(this.requestFrame.bind(this));
    // this.renderer.setAnimationLoop(this.animation.bind(this));

    const grid = new THREE.GridHelper(10, 10);
    this.scene.add(grid);

    const g2 = new THREE.GridHelper(10, 10);
    g2.translateY(10);
    this.scene.add(g2);

    canvas.addEventListener('pointerdown', e => console.log('pdown'));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));

    window.addEventListener('blur', this.handleVisibilityChange.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));

    this.posObserver = new Subject<THREE.Vector3>();

    this.updatePosition(0, true);

    this.addBez();
    this.addTraveller();

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    this.scene.add(light);

    const amb = new THREE.AmbientLight(0xffffff, .05);
    this.scene.add(amb);

    this.scene.add(new Chunk().group);
  }

  private addTraveller() {
    const mat = new THREE.MeshNormalMaterial();
    const coneGeom = new THREE.ConeGeometry(0.1, 0.2, 10);
    coneGeom.translate(0, .25, 0);

    const box = new THREE.BoxGeometry(.2, .1, .1);
    box.translate(.1, 0, 0);

    const cylinder = BufferGeometryUtils.mergeGeometries([
      coneGeom,
      box,
      new THREE.CylinderGeometry(0.04, 0.06, .3, 10)
    ]);

    cylinder.scale(.5, .5, .5);
    cylinder.rotateY(Math.PI/2);
    cylinder.rotateX(Math.PI/2);

    this.traveller = new THREE.Mesh(cylinder, mat);
    this.traveller.position.copy(new THREE.Vector3(2, 0, 2));
    this.scene.add(this.traveller);

    const c2 = new THREE.CylinderGeometry(0.04, 0.06, .3, 10);
    c2.scale(.5, .5, .5);
    c2.rotateY(Math.PI/2);
    c2.rotateX(Math.PI/2);

    for(let i = 0; i < 8; i++) {
      const car = new THREE.Mesh(c2, mat);
      this.carArray.push(car);
      this.scene.add(car);
    }
  }

  private curve!: THREE.CubicBezierCurve3;

  private addBez() {
    this.curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3( -4, 0, 0),
      new THREE.Vector3( -2, 1, 30),
      new THREE.Vector3( 28, -1, -2),
      new THREE.Vector3( -4, 0, 0)
    );

    const points = this.curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial( {color: 0xffff00} );
    const curveObj = new THREE.Line(geometry, mat);

    this.scene.add(curveObj);
  }

  get positionObserver() {
    return this.posObserver;
  }


  private frame = 0;
  private repointNext = false;
  private requestFrame(time: number) {
    requestAnimationFrame(this.requestFrame.bind(this));
    this.animation(time);
  }
  animation(time: number) {
    let delta = this.prevTime == null ? 0 : time - this.prevTime;

    this.prevTime = time;

    this.mesh.rotation.x = time / 2000;
    this.mesh.rotation.y = time / 1000;

    this.updatePosition(delta / 1000, this.repointNext);
    this.repointNext = false;

    this.updateTraveller(delta / 1000);

    this.renderer.render(this.scene, this.camera);
  }

  private baseHeight = 1.8;
  private camSpeed = 2.5;

  private updatePosition(millis: number, repoint?: boolean) {
    if(repoint == null) {
      repoint = false;
    }
    if(this.rotLeft) {
      this.heading -= millis * Math.PI / 1.8;
      repoint = true;
    }
    if(this.rotRight) {
      this.heading += millis * Math.PI / 1.8;
      repoint = true;
    }

    if(this.strafeLeft) {
      this.camera.position.z += this.camSpeed * millis * Math.sin(this.heading - Math.PI/2);
      this.camera.position.x += this.camSpeed * millis * Math.cos(this.heading - Math.PI/2);
      repoint = true;
    }
    if(this.strafeRight) {
      this.camera.position.z += this.camSpeed * millis * Math.sin(this.heading + Math.PI/2);
      this.camera.position.x += this.camSpeed * millis * Math.cos(this.heading + Math.PI/2);
      repoint = true;
    }

    if(this.gofwd) {
      this.camera.position.z += this.camSpeed * millis * Math.sin(this.heading);
      this.camera.position.x += this.camSpeed * millis * Math.cos(this.heading);
      repoint = true;
    }
    if(this.goback) {
      this.camera.position.z -= this.camSpeed * millis * Math.sin(this.heading);
      this.camera.position.x -= this.camSpeed * millis * Math.cos(this.heading);
      repoint = true;
    }

    if(this.jumping) {
      this.camera.position.y += this.vy * millis;
      this.vy -= millis * 19.6;
      if(this.camera.position.y <= this.baseHeight) {
        this.camera.position.y = this.baseHeight;
        this.jumping = false;
      }
      repoint = true;
    }

    if(repoint) {
      const p = (this.pitch == Math.PI/2 ? (Math.PI/2-.001) : (this.pitch == (-Math.PI/2) ? (-Math.PI/2 + 0.001) : this.pitch));
      const yc = Math.cos(p);
      this.camera.lookAt(new THREE.Vector3(
        this.camera.position.x + (Math.cos(this.heading) * yc),
        this.camera.position.y + Math.sin(this.pitch),// - this.baseHeight,
        this.camera.position.z + (Math.sin(this.heading) * yc)
      ))
      this.posObserver.next(new THREE.Vector3(this.camera.position.x, this.camera.position.y, this.camera.position.z));
    }
  }

  private static FRAMES = 5000;

  private updateTraveller(dt: number) {
    let dist = 0;
    const goal = dt * this.travellerSpeed;
    let pt = new THREE.Vector3(0, 0, 0);
    let prev = this.traveller.position;

    if(goal == 0) return;

    while(dist < goal && (this.frame < GameCanvas.FRAMES)) {
      pt = this.curve.getPoint(this.frame / GameCanvas.FRAMES);
      dist += pt.distanceTo(prev);
      prev = pt;
      this.frame++;
    }

    this.updateTravellerPos(this.traveller, this.frame, pt);

    let f = this.frame;

    for(let i = 0; i < this.carArray.length; i++) {
      let car = pt.clone();
      let prev = pt;
      dist = 0;
      while(dist < 0.2) {
        car = this.curve.getPoint(f / GameCanvas.FRAMES);
        dist += car.distanceTo(prev);
        prev = car;
        f--; if(f < 0) f += GameCanvas.FRAMES;
      }
      this.updateTravellerPos(this.carArray[i], f+1, car);
      pt = car;
    }

    if(this.frame >= GameCanvas.FRAMES) {
      this.frame = 0;
    }
  }

  private updateTravellerPos(mesh: THREE.Mesh, frame: number, pt: THREE.Vector3) {
    mesh.position.copy(pt);

    // This travels the path but may rotate about the axis of the path.  It
    // works very well when the mesh is symmetrical about the axis but otherwise
    // may cause the mesh to spin in undesirable ways:
    // const axis = new THREE.Vector3();
    // const up = new THREE.Vector3(0, 1, 0);
    // axis.crossVectors(up, rot).normalize();
    // const rad = Math.acos(up.dot(rot));
    // this.traveller.quaternion.setFromAxisAngle(axis, rad);

    // This approach is simple and seems to work well enough:
    const next = this.curve.getPoint((frame+1)/GameCanvas.FRAMES);
    mesh.lookAt(next);
    if(this.followTraveller && mesh == this.traveller) {
      // this.camPos.add(pt);
      // const cpt = this.camPos.average;
      this.camera.position.copy(pt);
      this.camera.position.y = pt.y + 0.1;

      this.posObserver.next(this.camera.position);

      // const n = new THREE.Vector3();
      // n.copy(next);
      // n.y += 0.1;
      this.camPos.add(next);
      const cpt = this.camPos.average;
      cpt.x += 2*(next.x - cpt.x);
      cpt.z += 2*(next.z - cpt.z);
      cpt.y = next.y;
      this.camera.lookAt(cpt);
    }
  }

  private handleVisibilityChange() {
    console.log('vis change!');
    this.gofwd = false;
    this.goback = false;
    this.strafeLeft = false;
    this.strafeRight = false;
    this.rotLeft = false;
    this.rotRight = false;
  }

  private handleKeyDown(event: KeyboardEvent) {
    const focus = this.canvas == document.activeElement;
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

    if(event.code == 'KeyZ') {
      this.pitch -= Math.PI / 50;
      if(this.pitch < (-Math.PI/2)) {
        this.pitch = -Math.PI/2;
      }
      this.repointNext = true;
    }
    if(event.code == 'KeyC') {
      this.pitch += Math.PI / 50;
      if(this.pitch > (Math.PI/2)) {
        this.pitch = Math.PI/2;
      }
      this.repointNext = true;
    }

    if(event.code == 'Space' && !this.jumping) {
      this.jumping = true;
      this.vy = 4.5;
    }

    if(event.code == 'KeyF') {
      event.preventDefault();
      this.followTraveller = !this.followTraveller;
    }

    if(event.code == 'NumpadAdd') {
      this.travellerSpeed += 0.1;
      if(this.travellerSpeed > 10) this.travellerSpeed = 10;
    }
    if(event.code == 'NumpadSubtract') {
      this.travellerSpeed -= 0.1;
      if(this.travellerSpeed < 0) this.travellerSpeed = 0;
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