
import * as THREE from 'three';
import { ChunkMesh } from './ChunkMesh';
import { Chunk, ChunkBlock } from './Chunk';
import { EdgeChunkGeometry, EdgeIndexLookup } from './EdgeChunkGeometry';

export class EdgeChunkMesh extends ChunkMesh {
  private geometry_ : EdgeChunkGeometry;
  private mesh_ : THREE.Object3D;

  constructor(chunk: Chunk, private scalar = 1) {
    super(chunk);

    if(scalar < 1) scalar = 1;

    this.geometry_ = new EdgeChunkGeometry(chunk, scalar);
    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: scalar > 1 ? THREE.DoubleSide : THREE.FrontSide
    });
    this.mesh_ = new THREE.Mesh(this.geometry_.geometry, mat);
    this.mesh_.position.x = (this.chunk.x << 3) * scalar;
    this.mesh_.position.z = (this.chunk.z << 3) * scalar;
    this.mesh_.castShadow = true;
    this.mesh_.receiveShadow = true;
  }

  getVariance() {
    return (Math.random() * .8) - .4;
  }

  override getMesh(): THREE.Object3D<THREE.Object3DEventMap> {
    return this.mesh_;
  }

  lookupFromIndex(index: number | undefined) {
    const lookup = index == null ? null : this.geometry_.map.get(index);

    if(lookup == null) {
      return;
    }

    return lookup;
  }

  addBlock(index: number | undefined) {
    return index == null ? null : this.geometry_.map.get(index);
  }

  removeBlock(index: number | undefined) {
    const lookup = index == null ? null : this.geometry_.map.get(index);
    if(lookup == null) {
      return false;
    }
    this.chunk.remove(lookup.location);
    return true;
  }
}