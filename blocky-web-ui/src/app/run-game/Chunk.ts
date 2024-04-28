
import random from 'random';
import * as THREE from 'three';

export class Chunk {
  private group_ : THREE.Group;
  private x_: number;
  private z_: number;

  private static R = random.clone('test-seed');

  constructor(X: number, Z: number) {
    this.group_ = new THREE.Group();
    this.x_ = X;
    this.z_ = Z;

    for(let x = -4; x < 4; x++) { 
      for(let y = -14; y < 0; y++) {
        for(let z = -4; z < 4; z++) {
          if(Chunk.R.bool()) {
            this.group_.add(this.makeCube(x, y, z));
          }
        }
      }
    }
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

    // const dummy = new THREE.Object3D();
    // dummy.position.set( offset - x, offset - y, offset - z );
    // dummy.rotation.y = ( Math.sin( x / 4 + time ) + Math.sin( y / 4 + time ) + Math.sin( z / 4 + time ) );
    // dummy.rotation.z = dummy.rotation.y * 2;

    // dummy.updateMatrix();

    // mesh.setMatrixAt( i ++, dummy.matrix );

    cube.translate(.5 + x + (this.x_ << 3), .5 + y, .5 + z + (this.z_ << 3));

    let mesh = new THREE.Mesh(cube, mat);

    // mesh.add(
    //   new THREE.LineSegments(cube, new THREE.LineBasicMaterial({
    //     color: 0xff0000,
    //     // linewidth: 4,
    //     // polygonOffset: true,
    //     // polygonOffsetFactor: 1,
    //     // polygonOffsetUnits: 1
    //   }))
    // )

    return mesh;
  }
}