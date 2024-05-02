
import random from 'random';
import * as THREE from 'three';
import { Chunk } from './Chunk';

export abstract class ChunkMesh {
  private chunk_: Chunk;

  protected constructor(chunk: Chunk) {
    this.chunk_ = chunk;
  }

  get chunk() {
    return this.chunk_;
  }

  abstract getMesh(): THREE.Object3D;
}