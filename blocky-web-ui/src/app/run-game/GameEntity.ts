
import { Subject } from 'rxjs';
import { sprintf } from 'sprintf-js';
import * as THREE from 'three';

export class GameEntity {
  private size_ : THREE.Vector3;
  private position_ = new THREE.Vector3(0, 0, 0);
  private heading_ : number = 0;

  private vxz_ = 0;
  private vy_ = 0;

  private wireframeMesh_ : THREE.Mesh;

  public distObserver_ = new Subject<number|undefined>();


  // Method for generating points on a sphere for firing rays for
  // object avoidance:
  //
  // https://stackoverflow.com/questions/9600801/evenly-distributing-n-points-on-a-sphere/44164075#44164075
  constructor() {
    this.size_ = new THREE.Vector3(.6, .6, .6);
    this.wireframeMesh_ = this.createWireframeMesh();
    this.position = new THREE.Vector3(1, 3, 1);
  }

  private createWireframeMesh() {
    const geo = new THREE.BoxGeometry(this.size_.x, this.size_.y, this.size_.z);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true
    })

    return new THREE.Mesh(geo, mat);
  }

  get distObserver() {
    return this.distObserver_;
  }

  v2str(v: THREE.Vector3) {
    return sprintf('[%7.4f, %7.4f, %7.4f]', v.x, v.y, v.z);
  }

  adjustPositionUpdate(next: THREE.Vector3, mesh: THREE.Object3D) {
    let target = next.clone();
    let pos = this.position_.clone();
    let ray = new THREE.Raycaster();
    let sentDist = false;
    pos.y += 0.0001;
    target.y += 0.0001;

    for(;;) {
      const dir = target.clone().sub(pos);
      ray.set(pos, dir.clone().normalize());
      const result = ray.intersectObject(mesh);

      if(result.length == 0) {
        break;
      }

      const dist = pos.distanceTo(next);
      if(dist <= result[0].distance) {
        this.distObserver_.next(result[0].distance);
        sentDist = true;
        break;
      }

      const norm = result[0].normal;
      if(!norm) {
        break;
      }

      const proj = dir.clone().projectOnPlane(norm);
      // if(proj.length() < 0.000001) {
      //   this.distObserver_.next(0);
      //   sentDist = true;
      //   break;
      // }
      pos = result[0].point;
      target = pos.clone().add(proj);
    }

    if(!sentDist) {
      this.distObserver_.next(undefined);
    }

    this.position = target;

    return target;
  }

  getDistanceTo(mesh: THREE.Object3D) {
    const angle = this.heading_ + (Math.PI/2);
    let pos = this.wireframeMesh_.geometry.getAttribute('position') as THREE.Float32BufferAttribute;
    let dirVect = new THREE.Vector3(Math.sin(angle), 0, -Math.cos(angle)).normalize();
    let closest: THREE.Intersection | null = null;

    for(let i = 0; i < pos.array.length; i+= 3) {
      const vert = new THREE.Vector3(pos.array[i], pos.array[i+1], pos.array[i+2]);
      const gv = vert.applyMatrix4(this.wireframeMesh_.matrix);
      const ray = new THREE.Raycaster(gv, dirVect);
      const result = ray.intersectObject(mesh);

      if(result.length > 0) {
        closest = (closest == null || closest.distance > result[0].distance) ? result[0] : closest;
      }
    }

    return closest?.distance;
  }

  get heading() {
    return this.heading_;
  }

  set heading(heading: number) {
    this.heading_ = heading;
    this.wireframeMesh_.rotation.y = -heading;
  }

  get cameraPosition() {
    const pos = this.position_.clone();
    pos.y += 1.5;
    return pos;
  }

  get position() {
    return this.position_.clone();
  }

  set position(position: THREE.Vector3) {
    this.position_ = position.clone();
    this.wireframeMesh_.position.set(position.x, position.y, position.z);
  }

  get wireframe() {
    return this.wireframeMesh_;
  }
}