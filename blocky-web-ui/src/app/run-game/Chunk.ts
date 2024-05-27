
import random from 'random';
import { sprintf } from 'sprintf-js';
import * as THREE from 'three';
import { ChunkManager } from './ChunkManager';
import { BlockSelection } from './BlockSelection';

export class ChunkBlock {
  static TYPE_NORMAL = 1;
  static TYPE_DOOR = 20;

  constructor(
    public color: number,
    public x: number,
    public y: number,
    public z: number,
    public uvLookup: number[][],
    public type = ChunkBlock.TYPE_DOOR
  ) {

  }
  above: ChunkBlock | undefined;
  below: ChunkBlock | undefined;
  left: ChunkBlock | undefined;
  right: ChunkBlock | undefined;
  front: ChunkBlock | undefined;
  back: ChunkBlock | undefined;
}

export class OrientedChunkBlock extends ChunkBlock {
  orientation = new THREE.Vector3();
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

  private uvGrassBlock: number[][];
  private uvDirtBlock: number[][];
  private uvStoneBlock: number[][];
  private uvCoalBlock: number[][];
  private uvWoodDoor: number[][];

  private static toKey(x: number, y: number, z:number) {
    return '' + x + ':' + y + ':' + z;
  }

  constructor(private x_: number, private z_: number, sparseness = 0.05) {
    const sideUv = this.makeUvs(7, 5);
    const dirtUv = this.makeUvs(7, 4);
    const stoneUv = this.makeUvs(3, 5);
    const coal1 = this.makeUvs(3, 8);
    const coal2 = this.makeUvs(3, 9);
    const woodUv = this.makeUvs(1, 9);

    this.uvGrassBlock = [
      this.makeUvs(6, 8),
      dirtUv,
      sideUv, sideUv, sideUv, sideUv
    ];

    this.uvDirtBlock = [ dirtUv, dirtUv, dirtUv, dirtUv, dirtUv, dirtUv ];
    this.uvStoneBlock = [ stoneUv, stoneUv, stoneUv, stoneUv, stoneUv, stoneUv ];
    this.uvCoalBlock = [ coal1, coal2, coal1, coal2, coal1, coal2 ];
    this.uvWoodDoor = [ woodUv, woodUv, woodUv, woodUv, woodUv, woodUv ];

    for(let x = 0; x < Chunk.X; x++) {
      for(let y = Chunk.YMIN; y < Chunk.YMAX; y++) {
        for(let z = 0; z < Chunk.Z; z++) {
          const r = Chunk.R.float();
          const add = r >= sparseness;
          if(add) {
            let uv = this.uvGrassBlock;
            if(y < -3) {
              uv = (r > .9) ? this.uvCoalBlock : this.uvStoneBlock;
            }
            else if(y < -1) {
              uv = this.uvDirtBlock
            }
            this.paramMap_.add(this.makeBlock(x, y, z, (x_==0&&z_==0) ? 0x809040 : 0x209040, uv));
            this.length_++;
          }
        }
      }
    }
  }

  private makeUvs(u: number, v: number) {
    const voff = 1.5 / (10*128);
    const [u0, u1]= [u/9 + (1/(9*128)), (u+1)/9 - (1/(9*128))];
    const [v0, v1] = [v/10 + voff, (v+1)/10 - voff];

    return [ u1, v1,  u0, v1,  u0, v0,   u1, v0 ];
  }

  private makeBlock(x: number, y: number, z: number, color: number, uvLookup: number[][]): ChunkBlock {
    return {
      color: color,
      uvLookup: uvLookup,
      x: x,
      y: y,
      z: z,
      type: ChunkBlock.TYPE_NORMAL,
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
    }
  }

  private findBlock(x: number, y: number, z: number, manager: ChunkManager) {
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

    if(cx == this.x && cz == this.z) {
      return this.paramMap_.lookup(x, y, z);
    }

    return manager.getChunk(cx, cz)?.chunk.paramMap_.lookup(x, y, z);
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

  add(location: THREE.Vector3, selection: BlockSelection, manager: ChunkManager) {
    if(this.paramMap_.lookupVector(location) != null) {
      return false;
    }

    let uv = this.uvDirtBlock;
    let type = ChunkBlock.TYPE_NORMAL;
    if(selection.blockType == BlockSelection.TYPE_COAL) {
      uv = this.uvCoalBlock;
    }
    else if(selection.blockType == BlockSelection.TYPE_DIRT) {
      uv = this.uvDirtBlock;
    }
    else if(selection.blockType == BlockSelection.TYPE_GRASS) {
      uv = this.uvGrassBlock;
    }
    else if(selection.blockType == BlockSelection.TYPE_STONE) {
      uv = this.uvStoneBlock;
    }
    else if(selection.blockType == BlockSelection.TYPE_DOOR) {
      uv = this.uvWoodDoor;
      type = ChunkBlock.TYPE_DOOR;
    }
    else {
      console.log('unknown block type: ' + selection.blockType);
      return false;
    }

    const block = this.makeBlock(location.x, location.y, location.z, 0xFF00FF, uv);
    block.type = type;
    this.paramMap_.add(block);
    this.buildNeighbors(manager);
    return true;
  }

  remove(location: THREE.Vector3, manager: ChunkManager) {
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