
import { Subject } from 'rxjs';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
import * as Line2 from 'three/examples/jsm/lines/Line2';
import * as LineGeometry from 'three/examples/jsm/lines/LineGeometry';
import * as LineMaterial from 'three/examples/jsm/lines/LineMaterial';
import { PointAvg } from './PointAvg';
import { ChunkManager } from './ChunkManager';
import { EntityManager } from './EntityManager';

export class PosInfo {
  constructor(
    public position: THREE.Vector3,
    public heading: number
  ) {

  }
}

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

  private heading = 0;
  private pitch = 0;
  private jumping = false;
  private vy = 0;

  private posObserver: Subject<PosInfo>;
  private fpsObserver_: Subject<number>;

  private traveller!: THREE.Mesh;
  private carArray: THREE.Mesh[] = [];
  private travellerSpeed = .25;
  private followTraveller = false;

  private camPos = new PointAvg(50);

  private chunkManager = new ChunkManager();
  private entityManager;

  constructor(private canvas: HTMLCanvasElement) {
    this.camera = new THREE.PerspectiveCamera(70, this.canvas.clientWidth / this.canvas.clientHeight, 0.01, 100);
    // this.camera.position.x = 1;
    // this.camera.position.z = 1;
    // this.camera.position.y = .4;

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

    const grid = new THREE.GridHelper(10, 10);
    this.scene.add(grid);

    const g2 = new THREE.GridHelper(10, 10);
    g2.translateY(10);
    this.scene.add(g2);

    document.addEventListener('mousedown', this.handlePointerDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));

    document.body.oncontextmenu = () => {
      return false;
    }

    window.addEventListener('blur', this.handleVisibilityChange.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));

    this.posObserver = new Subject<PosInfo>();
    this.fpsObserver_ = new Subject<number>();

    this.addBez();
    this.addTraveller();

    // Good information on setting up the shadow map:
    // https://mofu-dev.com/en/blog/threejs-shadow-map/
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    light.castShadow = true;

    const frustumSize = 20;
    light.shadow.camera = new THREE.OrthographicCamera(
      -frustumSize / 2,
      frustumSize / 2,
      frustumSize / 2,
      -frustumSize / 2,
      1,
      frustumSize 
    );
    light.shadow.camera.position.copy(light.position);
    light.shadow.camera.lookAt(this.scene.position);

    light.shadow.mapSize.x = 2048;
    light.shadow.mapSize.y = 2048;

    this.scene.add(light);

    const amb = new THREE.AmbientLight(0xffffff, .05);
    this.scene.add(amb);

    this.scene.add(this.chunkManager.mesh);
    this.scene.add(this.chunkManager.collisionMesh);
    // this.chunkManager.collisionMesh.visible = false;

    this.entityManager = new EntityManager(this.scene);

    // this.renderer.shadowMap.enabled = true;
    // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.addCatmullRomCurve();
    this.updatePosition(0);
  }

  private addCatmullRomCurve() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(.5, .05, 10.5),
      new THREE.Vector3(5, 2, 12),
      new THREE.Vector3(2, 1, 15),
      new THREE.Vector3(.5, -.8, 15.5),
      new THREE.Vector3(-1.3, .2, 14.5),
      new THREE.Vector3(-7, 3.5, 11.5),
    ], true);

    const options: THREE.ExtrudeGeometryOptions = {
      steps: 100,
      bevelEnabled: false,
      extrudePath: curve
    }

    const pts: THREE.Vector2[] = [];
    const xx = .05;
    const zz = .1;
    pts.push(new THREE.Vector2(xx, zz));
    pts.push(new THREE.Vector2(xx, -zz));
    pts.push(new THREE.Vector2(.04, -zz));
    pts.push(new THREE.Vector2(0.04, zz));

    const shape = new THREE.Shape(pts);
    const geometry = new THREE.ExtrudeGeometry(shape, options);
    const mat = new THREE.MeshLambertMaterial( {color: 0x80c0, wireframe: false});
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    this.scene.add(mesh);

    // const points = curve.getPoints(50);
    // const geometry = new THREE.BufferGeometry().setFromPoints(points);
    // const mat = new THREE.LineBasicMaterial({color: 0x40ff })

    // const obj = new THREE.Line(geometry, mat);
    // this.scene.add(obj);

    this.curve = curve;
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
    this.traveller.castShadow = true;
    this.scene.add(this.traveller);

    const c2 = new THREE.CylinderGeometry(0.04, 0.06, .3, 10);
    c2.scale(.5, .5, .5);
    c2.rotateY(Math.PI/2);
    c2.rotateX(Math.PI/2);

    for(let i = 0; i < 8; i++) {
      const car = new THREE.Mesh(c2, mat);
      car.castShadow = true;
      this.carArray.push(car);
      this.scene.add(car);
    }
  }

  private curve!: THREE.Curve<THREE.Vector3>;

  private addBez() {
    this.curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3( -4, 0, 0),
      new THREE.Vector3( -2, 1, 2),
      new THREE.Vector3(  0, -1, -2),
      new THREE.Vector3( -4, 0, 0)
    );

    const points = this.curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial( {color: 0xffff00} );
    const curveObj = new THREE.Line(geometry, mat);
    curveObj.castShadow = true;

    this.scene.add(curveObj);
  }

  get positionObserver() {
    return this.posObserver;
  }

  get fpsObserver() {
    return this.fpsObserver_;
  }

  private frame = 0;
  private requestFrame(time: number) {
    requestAnimationFrame(this.requestFrame.bind(this));
    this.animation(time);
  }

  private frameSamples: number[] = [];
  private animation(time: number) {
    let delta = this.prevTime == null ? 0 : time - this.prevTime;

    const now = new Date().getTime();
    this.frameSamples.push(now);
    while(this.frameSamples.length > 0) {
      if(this.frameSamples[0] >= (now - 1000)) {
        break;
      }
      this.frameSamples.shift();
    }
    if(this.frameSamples.length == 0) {
      this.fpsObserver.next(0);
    }
    else {
      const diff = now - this.frameSamples[0];
      this.fpsObserver.next(this.frameSamples.length * 1000 / diff);
    }

    this.prevTime = time;

    this.mesh.rotation.x = time / 2000;
    this.mesh.rotation.y = time / 1000;

    this.updatePosition(delta / 1000);

    this.updateTraveller(delta / 1000);

    this.renderer.render(this.scene, this.camera);
  }

  private baseHeight = 1.8;
  private camSpeed = 2.5;

  get distObserver() {
    return this.entityManager.distObserver;
  }

  private blockUntil = 0;
  private updatePosition(millis: number) {
    if(performance.now() < this.blockUntil) {
      this.blockUntil = 0;
      return;
    }
    const newPosition = this.entityManager.getPlayerPosition().clone();
    const origy = newPosition.y;

    if(this.rotLeft) {
      this.heading -= millis * Math.PI / 1.8;
    }
    if(this.rotRight) {
      this.heading += millis * Math.PI / 1.8;
    }

    if(this.strafeLeft) {
      newPosition.z += this.camSpeed * millis * Math.sin(this.heading - Math.PI/2);
      newPosition.x += this.camSpeed * millis * Math.cos(this.heading - Math.PI/2);
    }
    if(this.strafeRight) {
      newPosition.z += this.camSpeed * millis * Math.sin(this.heading + Math.PI/2);
      newPosition.x += this.camSpeed * millis * Math.cos(this.heading + Math.PI/2);
    }

    if(this.gofwd) {
      newPosition.z += this.camSpeed * millis * Math.sin(this.heading);
      newPosition.x += this.camSpeed * millis * Math.cos(this.heading);
    }
    if(this.goback) {
      newPosition.z -= this.camSpeed * millis * Math.sin(this.heading);
      newPosition.x -= this.camSpeed * millis * Math.cos(this.heading);
    }

    this.vy -= millis * 9.8;
    newPosition.y += this.vy * millis;

    const p = (this.pitch == Math.PI/2 ? (Math.PI/2-.001) : (this.pitch == (-Math.PI/2) ? (-Math.PI/2 + 0.001) : this.pitch));
    const yc = Math.cos(p);

    const np = this.entityManager.adjustPositionUpdate(newPosition, this.chunkManager.collisionMesh);
    const dvy = origy - np.y;
    if(dvy == 0) {
      this.jumping = false;
      this.vy = 0;
    }
    this.camera.position.copy(this.entityManager.getPlayerCameraPosition());
    this.camera.lookAt(new THREE.Vector3(
      this.camera.position.x + (Math.cos(this.heading) * yc),
      this.camera.position.y + Math.sin(this.pitch),// - this.baseHeight,
      this.camera.position.z + (Math.sin(this.heading) * yc)
    ))
    this.posObserver.next(new PosInfo(
      new THREE.Vector3(this.camera.position.x, this.camera.position.y, this.camera.position.z),
      this.heading));

    // this.entityManager.setPlayerPosition(this.camera.position, this.heading);
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

  private dirMesh: THREE.Line | null = null;

  private updateTravellerPos(mesh: THREE.Mesh, frame: number, pt: THREE.Vector3) {
    mesh.position.copy(pt);
    // This approach is simple and seems to work well enough:
    const next = this.curve.getPoint((frame+1)/GameCanvas.FRAMES);
    mesh.lookAt(next);

    if(mesh == this.traveller) {
      const F = 40;
      const rot = this.curve.getTangent(frame / GameCanvas.FRAMES).normalize();
      let f2 = frame + 100; if(f2 >= GameCanvas.FRAMES) f2 -= GameCanvas.FRAMES;
      const n = this.curve.getPoint(f2 / GameCanvas.FRAMES);
      const v1 = new THREE.Vector2(n.x-pt.x, n.z-pt.z).normalize();
      const v2 = new THREE.Vector2(rot.x, rot.z).normalize();

      let ang = Math.acos(v1.dot(v2));
      ang *= (this.travellerSpeed * this.travellerSpeed);
      if(ang > (Math.PI/2)) ang = Math.PI/2;
      if(ang < (-Math.PI/2)) ang = -Math.PI/2;
      mesh.rotateZ(-ang);
    }

    // This travels the path but may rotate about the axis of the path.  It
    // works very well when the mesh is symmetrical about the axis but otherwise
    // may cause the mesh to spin in undesirable ways:
    // const axis = new THREE.Vector3();
    // const up = new THREE.Vector3(0, 1, 0);
    // axis.crossVectors(up, rot).normalize();
    // const rad = Math.acos(up.dot(rot));
    // this.traveller.quaternion.setFromAxisAngle(axis, rad);

    if(mesh == this.traveller) {
      const rot = this.curve.getTangent(frame / GameCanvas.FRAMES).normalize();
      const axis = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);
      axis.crossVectors(up, rot).normalize();


      // if(this.dirMesh != null) {
      //   this.scene.remove(this.dirMesh);
      //   this.dirMesh = null;
      // }

      // const pts: THREE.Vector3[] = [];
      // // pts.push(new THREE.Vector3(pt.x, pt.y + 2, pt.z));
      // pts.push(new THREE.Vector3(pt.x, pt.y, pt.z));
      // // pts.push(new THREE.Vector3(pt.x + (2*axis.x), pt.y + (2*axis.y), pt.z + (2*axis.z)));
      // // pts.push(new THREE.Vector3(pt.x, pt.y, pt.z));
      // pts.push(new THREE.Vector3(pt.x + (2*rot.x), pt.y + (2*rot.y), pt.z + (2*rot.z)));
      // const geo = new THREE.BufferGeometry().setFromPoints(pts);
      // const mat = new THREE.LineBasicMaterial( {color: 0xffff00} );
      // this.scene.add(this.dirMesh = new THREE.Line(geo, mat));
    }

    if(this.followTraveller && mesh == this.traveller) {
      this.camera.position.copy(pt);
      this.camera.position.y = pt.y + 0.1;

      this.posObserver.next(new PosInfo(this.camera.position.clone(), this.heading));

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
    }
    if(event.code == 'KeyC') {
      this.pitch += Math.PI / 50;
      if(this.pitch > (Math.PI/2)) {
        this.pitch = Math.PI/2;
      }
    }

    if(event.code == 'Space' && !this.jumping) {
      this.jumping = true;
      this.vy = 9.8/2;
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

  private faceLine: THREE.Object3D | null = null;

  private handleMouseMove(event: MouseEvent) {
    const isect = this.getIntersect(event);

    if(isect != null) {
      const lookup = this.chunkManager.lookup(isect);
      const pts = this.chunkManager.lookup(isect)?.sidePoints;

      if(pts != null) {
        let rawpts: number[] = [];
        for(let pt of pts) {
          rawpts.push(pt.x, pt.y, pt.z);
        }
        // const geometry = new THREE.BufferGeometry().setFromPoints(pts);
        const geometry = new LineGeometry.LineGeometry();
        geometry.setPositions(rawpts);
        const mat = new LineMaterial.LineMaterial({
          color: 0xffffff,
          linewidth: .002,
          visible: true,
        })
        // const mat = new THREE.LineBasicMaterial( {
        //   color: 0xffffff,
        //   polygonOffset: true,
        //   polygonOffsetFactor: 1,
        //   polygonOffsetUnits: 1
        // });
        // this.faceLine = new THREE.Line(geometry, mat);
        this.faceLine = new Line2.Line2(geometry, mat);
        this.scene.add(this.faceLine);
      }
    }
  }

  private handlePointerDown(event: MouseEvent) {
    console.log('btn: ' + event.button + ', ' + event.altKey + ', ' + event.detail);
    event.stopPropagation();

    const isect = this.getIntersect(event);
    if(isect == null) {
      return;
    }

    const now = performance.now();
    if(event.button == 0) {
      this.chunkManager.removeBlock(isect);
      this.blockUntil = performance.now() + 250;
    }
    else if(event.button == 2) {
      this.chunkManager.addBlock(isect);
      this.blockUntil = performance.now() + 250;
    }
    const duration = performance.now() - now;
    console.log('click time: ' + duration);
  }

  private getIntersect(event: MouseEvent) {
    const x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    const y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
    const ray = new THREE.Raycaster();

    if(this.faceLine != null) {
      this.scene.remove(this.faceLine);
      this.faceLine = null;
    }

    ray.setFromCamera(new THREE.Vector2(x, y), this.camera);
    const isect = ray.intersectObjects([this.chunkManager.mesh], true);

    if(isect.length == 0 || isect[0].distance > 7) {
      return null;
    }

    return isect.length == 0 ? null : isect[0];
  }

  private handleResize(event: UIEvent) {
    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
  }
}