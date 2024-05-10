
import { Subject } from 'rxjs';
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
    this.size_ = new THREE.Vector3(.8, .8, .8);
    this.wireframeMesh_ = this.createWireframeMesh();
    this.position = new THREE.Vector3(1, 1.8, 1);
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

  adjustPositionUpdate(next: THREE.Vector3, mesh: THREE.Object3D) {
    const dirVect = next.clone().sub(this.position_).normalize();
    const ray = new THREE.Raycaster(this.position_, dirVect);
    const result = ray.intersectObject(mesh);

    if(result.length > 0) {
      const dist = this.position_.distanceTo(next);
      this.distObserver_.next(result[0].distance);

      if(dist >= result[0].distance) {
        // return result[0].point.clone().add(dirVect.multiplyScalar(-.2));
        const pt = this.position_.clone();
        pt.add(dirVect.multiplyScalar(result[0].distance * .9));
        return pt;
      }

      return next;
    }
    this.distObserver_.next(undefined);
    return next;
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

  get position() {
    return this.position_;
  }

  set position(position: THREE.Vector3) {
    this.position_ = position.clone();
    this.wireframeMesh_.position.set(position.x, position.y, position.z);
    // = new THREE.Vector3(position.x, position.y, position.z);
  }

  get wireframe() {
    return this.wireframeMesh_;
  }
}