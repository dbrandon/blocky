
import * as THREE from 'three';
import { ChunkMesh } from './ChunkMesh';
import { Chunk } from './Chunk';

export class SimpleChunkMesh extends ChunkMesh {
  private mesh_ : THREE.Group;

  constructor(chunk: Chunk) {
    super(chunk);

    this.mesh_ = new THREE.Group();
    
    chunk.iterate((x, y, z, n, c) => this.mesh_.add(this.makeCube(x, y, z)));
  }

  override getMesh(): THREE.Object3D<THREE.Object3DEventMap> {
    return this.mesh_;
  }

  private makeCube(x: number, y: number, z: number) {
    let cube = new THREE.BoxGeometry(1, 1, 1);
    // let mat = new THREE.MeshBasicMaterial({color: 0x10b010});

    let mat = new THREE.MeshStandardMaterial({
      color: 0x209040,
    })

    cube.translate(.5 + x + (this.chunk.x << 3), .5 + y, .5 + z + (this.chunk.z << 3));

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