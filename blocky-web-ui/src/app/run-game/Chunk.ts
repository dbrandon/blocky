
import * as THREE from 'three';

export class Chunk {
  private group_ : THREE.Group;

  constructor() {
    this.group_ = new THREE.Group();

    this.group_.add(this.makeCube(2, -1, -2));
  }

  get group() {
    return this.group_;
  }

  private makeCube(x: number, y: number, z: number) {
    let cube = new THREE.BoxGeometry(1, 1, 1);
    // let mat = new THREE.MeshBasicMaterial({color: 0x10b010});

    let mat = new THREE.MeshStandardMaterial({
      color: 0x209040,
  })
    
    cube.translate(.5 + x, .5 + y, .5 + z);

    let mesh = new THREE.Mesh(cube, mat);

    mesh.add(
      new THREE.LineSegments(cube, new THREE.LineBasicMaterial({
        color: 0xff0000,
        // linewidth: 4,
        // polygonOffset: true,
        // polygonOffsetFactor: 1,
        // polygonOffsetUnits: 1
      }))
    )

    return mesh;
  }
}