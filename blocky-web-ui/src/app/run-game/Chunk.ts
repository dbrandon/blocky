
import random from 'random';
import { sprintf } from 'sprintf-js';
import * as THREE from 'three';
import { ChunkManager } from './ChunkManager';

export interface ChunkBlock {
  color: number;
  x: number;
  y: number;
  z: number;
  above: ChunkBlock | undefined;
  below: ChunkBlock | undefined;
  left: ChunkBlock | undefined;
  right: ChunkBlock | undefined;
  front: ChunkBlock | undefined;
  back: ChunkBlock | undefined;
}

class ParamMap extends Map<string, ChunkBlock> {
  add(block: ChunkBlock) {
    this.set(this.toKey(block.x, block.y, block.z), block);
  }

  lookup(x: number, y: number, z: number) {
    return this.get(this.toKey(x, y, z));
  }

  lookupVector(v: THREE.Vector3) {
    return this.get(this.vectorToKey(v));
  }

  remove(v: THREE.Vector3) {
    this.delete(this.vectorToKey(v));
  }

  toKey(x: number, y: number, z: number) {
    return '' + x + ':' + y + ':' + z;
  }

  vectorToKey(v: THREE.Vector3) {
    return '' + v.x + ':' + v.y + ':' + v.z;
  }
}

export class Chunk {
  private static R = random.clone('test-seed');

  private paramMap_ = new ParamMap();
  private length_ = 0;

  static X = 8;
  static YMIN = -80;
  static YMAX = 0;
  static Z = 8;

  private static toKey(x: number, y: number, z:number) {
    return '' + x + ':' + y + ':' + z;
  }

  constructor(private x_: number, private z_: number, sparseness = 0.5) {
    for(let x = 0; x < Chunk.X; x++) {
      for(let y = Chunk.YMIN; y < Chunk.YMAX; y++) {
        for(let z = 0; z < Chunk.Z; z++) {
          // const add = Chunk.R.float() >= sparseness;
          // if(add) {
            this.paramMap_.add(this.makeBlock(x, y, z, (x_==0&&z_==0) ? 0x809040 : 0x209040));
            this.length_++;
          // }
        }
      }
    }

    // this.buildNeighbors();
  }

  private makeBlock(x: number, y: number, z: number, color: number): ChunkBlock {
    return {
      color: color,
      x: x,
      y: y,
      z: z,
      above: undefined,
      below: undefined,
      back: undefined,
      front: undefined,
      left: undefined,
      right: undefined
    }
  }

  buildNeighbors(manager: ChunkManager) {
    for(let key of this.paramMap_.keys()) {
      const p = this.paramMap_.get(key);
      if(p == null) {
        continue;
      }

      p.above = this.findBlock(p.x, p.y+1, p.z, manager);
      p.back = this.findBlock(p.x, p.y, p.z+1, manager);
      p.below = this.findBlock(p.x, p.y-1, p.z, manager);
      p.front = this.findBlock(p.x, p.y, p.z-1, manager);
      p.left = this.findBlock(p.x+1, p.y, p.z, manager);
      p.right = this.findBlock(p.x-1, p.y, p.z, manager);
      // p.above = this.paramMap_.lookup(p.x, p.y+1, p.z);
      // p.back = this.paramMap_.lookup(p.x, p.y, p.z+1);
      // p.below = this.paramMap_.lookup(p.x, p.y-1, p.z);
      // p.front = this.paramMap_.lookup(p.x, p.y, p.z-1);
      // p.left = this.paramMap_.lookup(p.x+1, p.y, p.z);
      // p.right = this.paramMap_.lookup(p.x-1, p.y, p.z);
    }
  }

  private findBlock(x: number, y: number, z: number, manager: ChunkManager) {
    let chunk: Chunk|undefined = this;
    let cx = this.x;
    let cz = this.z;

    if(x < 0) {
      x += Chunk.X;
      cx--;
    }
    else if(x >= Chunk.X) {
      x -= Chunk.X;
      cx++;
    }
    if(z < 0) {
      z += Chunk.Z;
      cz--;
    }
    else if(z >= Chunk.Z) {
      z -= Chunk.Z;
      cz++;
    }

    if(cx != this.x || cz != this.z) {
      chunk = manager.getChunk(cx, cz);
    }

    return chunk?.paramMap_.lookup(x, y, z);
  }

  iterate(cb: (n: number, param: ChunkBlock) => void) {
    let n = 0;

    for(let key of this.paramMap_.keys()) {
      const p = this.paramMap_.get(key);
      if(p != null) {
        cb(n, p);
        n++;
      }
    }
  }

  add(location: THREE.Vector3, manager: ChunkManager) {
    if(this.paramMap_.lookupVector(location) != null) {
      return false;
    }
    this.paramMap_.add(this.makeBlock(location.x, location.y, location.z, 0xFF00FF));
    this.buildNeighbors(manager);
    return true;
  }

  remove(location: THREE.Vector3, manager: ChunkManager) {
    console.log('remove: ' + location.x + ', ' + location.y + ', ' + location.z);
    this.paramMap_.remove(location);
    this.buildNeighbors(manager);
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