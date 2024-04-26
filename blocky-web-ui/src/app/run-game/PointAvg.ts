
import * as THREE from 'three';

export class PointAvg {
  private pts: THREE.Vector3[] = [];
  private max_;

  constructor(max: number = 10) {
    this.max_ = max;
  }

  add(pt: THREE.Vector3) {
    this.pts.push(pt.clone());
    while(this.pts.length > this.max) {
      this.pts.shift();
    }
  }

  get average() {
    let avg = new THREE.Vector3();

    for(let pt of this.pts) {
      avg.add(pt);
    }
    avg.x /= this.pts.length;
    avg.y /= this.pts.length;
    avg.z /= this.pts.length;

    return avg;
  }

  get max() {
    return this.max_;
  }

  set max(max: number) {
    this.max_ = max;
  }
}