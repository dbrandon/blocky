import { Chunk } from "./Chunk";
import { ChunkMesh } from "./ChunkMesh";

import * as THREE from 'three';


export class InstancedChunkMesh extends ChunkMesh {
  private mesh_ : THREE.InstancedMesh;

  constructor(chunk: Chunk) {
    super(chunk);

    const mat = new THREE.MeshStandardMaterial({color: 0x404040})

    this.mesh_ = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      mat,
      chunk.length
    );

    const temp = new THREE.Object3D();
    const cx = this.chunk.x << 3;
    const cz = this.chunk.z << 3;

    chunk.iterate((x, y, z, n, param) => {
      if(n == 0) {
        mat.color = new THREE.Color(param.color);
      }
      temp.position.set(
        .5 + ((x + cx) * 1.1),
        .5 + y,
        .5 + ((z + cz) * 1.1));
      temp.updateMatrix();
      this.mesh_.setMatrixAt(n, temp.matrix);
    });
  }
  override getMesh(): THREE.Object3D {
    return this.mesh_;
  }
}