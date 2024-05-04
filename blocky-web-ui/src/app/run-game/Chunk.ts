
import random from 'random';
import { sprintf } from 'sprintf-js';
import * as THREE from 'three';

interface ChunkBlock {
  color: number;
  above: ChunkBlock | null;
  below: ChunkBlock | null;
  left: ChunkBlock | null;
  right: ChunkBlock | null;
  front: ChunkBlock | null;
  back: ChunkBlock | null;
}

export class Chunk {
  private static R = random.clone('test-seed');

  private params_ : (ChunkBlock|null)[][][] = [];
  private length_ = 0;

  static X = 8;
  static Y = 2;
  static Z = 8;

  constructor(private x_: number, private z_: number, sparseness = 0.5) {
    for(let x = 0; x < Chunk.X; x++) {
      this.params_[x] = [];

      for(let y = 0; y < Chunk.Y; y++) {
        this.params_[x][y] = [];

        for(let z = 0; z < Chunk.Z; z++) {
          const add = Chunk.R.float() >= sparseness;
          if(add) {
            this.params_[x][y][z] = this.makeBlock((x_==0&&z_==0) ? 0x809040 : 0x209040);
            this.length_++;
          }
        }
      }
    }

    this.buildNeighbors();
  }

  private makeBlock(color: number): ChunkBlock {
    return {
      color: color,
      above: null,
      below: null,
      back: null,
      front: null,
      left: null,
      right: null
    }
  }

  buildNeighbors() {
    for(let x = 0; x < Chunk.X; x++) {
      for(let y = 0; y < Chunk.Y; y++) {
        for(let z = 0; z < Chunk.Z; z++) {
          const p = this.params_[x][y][z];
          if(p == null) {
            continue;
          }

          p.above = ((y+1) < Chunk.Y) ? this.params_[x][y+1][z] : null;
          p.back = ((z+1) < Chunk.Z) ? this.params_[x][y][z+1] : null;
          p.below = (y > 0) ? this.params_[x][y-1][z] : null;
          p.front = (z > 0) ? this.params_[x][y][z-1] : null;
          p.left = ((x+1) < Chunk.X) ? this.params_[x+1][y][z] : null;
          p.right = (x > 0) ? this.params_[x-1][y][z] : null;
        }
      }
    }
  }

  iterate(cb: (x: number, y: number, z: number, n: number, param: ChunkBlock) => void) {
    let n = 0;

    for(let x = 0; x < this.params_.length; x++) {
      for(let y = 0; y < this.params_[x].length; y++) {
        for(let z = 0; z < this.params_[x][y].length; z++) {
          const p = this.params_[x][y][z];

          if(p != null) {
            cb(x, y - Chunk.Y, z, n, p);
            n++;
          }
        }
      }
    }
  }

  remove(location: THREE.Vector3) {
     console.log('remove: ' + location.x + ', ' + location.y + ', ' + location.z);
    this.params_[location.x][location.y+Chunk.Y][location.z] = null;
    this.buildNeighbors();
  }

  get length() {
    return this.length_;
  }

  get x() {
    return this.x_;
  }

  get z() {
    return this.z_;
  }
}