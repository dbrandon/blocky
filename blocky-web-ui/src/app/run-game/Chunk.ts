
import random from 'random';

interface ChunkBlock {
  color: number;
  above: boolean;
  below: boolean;
  left: boolean;
  right: boolean;
  front: boolean;
  back: boolean;
}

export class Chunk {
  private static R = random.clone('test-seed');

  private params_ : ChunkBlock[][][] = [];
  private length_ = 0;

  static X = 8;
  static Y = 80;
  static Z = 8;

  constructor(private x_: number, private z_: number) {
    for(let x = 0; x < Chunk.X; x++) {
      this.params_[x] = [];

      for(let y = 0; y < Chunk.Y; y++) {
        this.params_[x][y] = [];

        for(let z = 0; z < Chunk.Z; z++) {
          if(Chunk.R.bool()) {
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
      above: false,
      below: false,
      back: false,
      front: false,
      left: false,
      right: false
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

          p.above = ((y+1) < Chunk.Y) && this.params_[x][y+1][z] != null;
          p.back = ((z+1) < Chunk.Z) && this.params_[x][y][z+1] != null;
          p.below = (y > 0) && this.params_[x][y-1][z] != null;
          p.front = (z > 0) && this.params_[x][y][z-1] != null;
          p.left = ((x+1) < Chunk.X) && this.params_[x+1][y][z] != null;
          p.right = (x > 0) && this.params_[x-1][y][z] != null;
        }
      }
    }
  }

  iterate(cb: (x: number, y: number, z: number, n: number, param: ChunkBlock) => void) {
    let n = 0;

    for(let x = 0; x < this.params_.length; x++) {
      for(let y = 0; y < this.params_[x].length; y++) {
        for(let z = 0; z < this.params_[x][y].length; z++) {
          if(this.params_[x][y][z]) {
            cb(x, y - Chunk.Y, z, n, this.params_[x][y][z]);
            n++;
          }
        }
      }
    }
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