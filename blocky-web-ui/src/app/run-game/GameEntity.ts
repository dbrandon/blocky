
import { Subject } from 'rxjs';
import { sprintf } from 'sprintf-js';
import * as THREE from 'three';

class SamplePoint {
  private dir_!: THREE.Vector3;

  constructor(private offset_: number, public pos: THREE.Vector3, public target: THREE.Vector3) {
    this.set(pos, target);
  }

  get dir() {
    return this.dir_;
  }

  set(pos: THREE.Vector3, target: THREE.Vector3) {
    this.pos = pos.clone();
    this.target = target.clone();
    this.pos.y += this.offset_;
    this.target.y += this.offset_;

    this.dir_ = this.target.clone().sub(this.pos);
  }

  update(sample: SamplePoint, point: THREE.Vector3, norm: THREE.Vector3, proj: THREE.Vector3) {
    this.pos = point.clone();
    this.pos.y -= (sample.offset_ - this.offset_);
    this.pos.add(norm.clone().multiplyScalar(.0001));
    this.target = this.pos.clone().add(proj);

    this.dir_ = this.target.clone().sub(this.pos);
}
}

export class GameEntity {
  private size_ : THREE.Vector3;
  private position_ = new THREE.Vector3(0, 0, 0);
  private heading_ : number = 0;

  private vxz_ = 0;
  private vy_ = 0;

  private wireframeMesh_ : THREE.Mesh;

  private applyPushback_ = true;

  public distObserver_ = new Subject<number|undefined>();


  // Method for generating points on a sphere for firing rays for
  // object avoidance:
  //
  // https://stackoverflow.com/questions/9600801/evenly-distributing-n-points-on-a-sphere/44164075#44164075
  constructor() {
    this.size_ = new THREE.Vector3(.6, 1.4, .6);
    this.wireframeMesh_ = this.createWireframeMesh();
    this.position = new THREE.Vector3(0, 4, 0);
  }

  getAABB() {
    const sz = this.size_.clone().multiplyScalar(0.5);
    const min = this.position_.clone().sub(sz);
    const max = this.position_.clone().add(sz);

    return new THREE.Box3(min, max);
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

  adjustPositionUpdate(next: THREE.Vector3, mesh: THREE.Object3D[]) {
    let ray = new THREE.Raycaster();
    let sentDist = false;
    
    let samplePts = [
      new SamplePoint(0, this.position, next),
      new SamplePoint(1.3, this.position, next)
    ];

    for(;;) {
      let bestResult: THREE.Intersection[] = [];
      let sample: SamplePoint|undefined;

      for(let pt of samplePts) {
        ray.set(pt.pos, pt.dir.clone().normalize());
        const result = ray.intersectObjects(mesh);

        if(result.length == 0) {
          continue;
        }
        if(bestResult.length == 0 || bestResult[0].distance > result[0].distance) {
          bestResult = result;
          sample = pt;
        }
      }

      if(bestResult.length == 0 || sample === undefined) {
        break;
      }

      const dist = sample.pos.distanceTo(sample.target);
      if(dist <= bestResult[0].distance) {
        this.distObserver_.next(bestResult[0].distance);
        sentDist = true;
        break;
      }

      const norm = bestResult[0].normal;
      if(!norm) {
        break;
      }

      const proj = sample.dir.clone().projectOnPlane(norm);
      for(let pt of samplePts) {
        pt.update(sample, bestResult[0].point, norm, proj);
      }

      if(samplePts[0].dir.length() == 0) {
        break;
      }
    }

    if(!sentDist) {
      this.distObserver_.next(undefined);
    }

    this.position = samplePts[0].target;
    return samplePts[0].target.clone();
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
    pos.y += 1;
    return pos;
  }

  get position() {
    return this.position_.clone().sub(new THREE.Vector3(0, .5, 0));
  }

  set position(position: THREE.Vector3) {
    this.position_ = position.clone().add(new THREE.Vector3(0, .5, 0));
    this.wireframeMesh_.position.copy(this.position_);
  }

  get wireframe() {
    return this.wireframeMesh_;
  }
}