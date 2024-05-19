
import * as THREE from 'three';
import { Chunk } from './Chunk';
import { EdgeChunkMesh } from './EdgeChunkMesh';
import { sprintf } from 'sprintf-js';

class ChunkInfo {
  constructor(public chunk: Chunk, public mesh: EdgeChunkMesh) {}
}

export class ChunkManager {
  private mesh_: THREE.Group;
  private collisionMesh_: THREE.Group;
  private dirty_ = false;

  private map_ = new Map<string, ChunkInfo>();
  private list_: Chunk[] = [];
  // private chunkMap_ = new Map<string, Chunk>();
  // private map = new Map<Chunk,EdgeChunkMesh>();

  constructor() {
    this.mesh_ = new THREE.Group();
    this.collisionMesh_ = new THREE.Group();

    for(let xx = -5; xx < 5; xx++) {
      for(let zz = -5; zz < 5; zz++) {
        this.addChunk(new Chunk(xx, zz));
      }
    }

    // this.addChunk(new Chunk(0, 0));
    // this.addChunk(new Chunk(-1, 0));
  }

  private toKey(x: number, z: number) {
    return '' + x + ':' + z;
  }

  private addChunk(chunk: Chunk) {
    this.list_.push(chunk);
    // this.map_.set(this.toKey(chunk.x, chunk.z), new ChunkInfo(chunk));
    this.dirty_ = true;
  }

  setLocation(pos: THREE.Vector3) {
    const cx = Math.floor(pos.x) >> 3;
    const cz = Math.floor(pos.z) >> 3;

    for(let info of this.map_.values()) {
      const visible = (info.chunk.x >= cx-2 && info.chunk.x <= cx+2) && (info.chunk.z >= cz-2 && info.chunk.z <= cz+2);
      info.mesh.getMesh().visible = visible
    }
  }

  getChunk(x: number, z: number) {
    return this.map_.get(this.toKey(x, z));
  }

  getEdgeMesh(x: number, z: number) {
    return this.getChunk(x, z)?.mesh;
    // const chunk = this.getChunk(x, z);

    // if(chunk) {
    //   return this.map.get(chunk);
    // }
    // return undefined;
  }

  /**
   * Returns the list of meshes to search given the position
   * @param pos 
   */
  getSelectionMesh(pos: THREE.Vector3) {
    // return [ this.mesh_ ];
    const xmin = Math.floor((pos.x-5) / 8);
    const xmax = Math.floor((pos.x+5) / 8);
    const zmin = Math.floor((pos.z-5) / 8);
    const zmax = Math.floor((pos.z+5) / 8);
    const list: THREE.Object3D[] = [];

    for(let xx = xmin; xx <= xmax; xx++) {
      for(let zz = zmin; zz <= zmax; zz++) {
        const info = this.getChunk(xx, zz);

        if(info) {
          list.push(info.mesh.getMesh());
          // const m = this.map.get(chunk)?.getMesh();
          // if(m) {
          //   list.push(m);
          // }
        }
      }
    }
    console.log('nchunk=' + list.length);

    return list;
  }

  private lookupChunkInfo(intersect: THREE.Intersection) {
    for(let info of this.map_.values()) {
      if(info == null) {
        continue;
      }
      if(intersect.object == info.mesh.getMesh()) {
        return info;
      }
    }

    return null;
  }

  // private getMesh(intersect: THREE.Intersection): [Chunk|null, EdgeChunkMesh|null] {
  //   const info = this.lookupChunkInfo(intersect);

  //   if(info === null) {
  //     return [null, null];
  //   }

  //   const info = this.map.get(chunk);
  //   if(mesh == null) {
  //     return [null, null];
  //   }

  //   return [chunk, mesh];
  // }

  lookup(intersect: THREE.Intersection) {
    const info = this.lookupChunkInfo(intersect);
    // const [chunk, mesh] = this.getMesh(intersect);
    // if(mesh == null) {
    //   return;
    // }

    return info?.mesh.lookupFromIndex(intersect.faceIndex);
  }

  addBlock(intersect: THREE.Intersection) {
    let info = this.lookupChunkInfo(intersect);
    // let [chunk, mesh] = this.getMesh(intersect);
    const lookup = info?.mesh.lookupFromIndex(intersect.faceIndex);
    let loc : THREE.Vector3 | null;

    if(info?.chunk == null || info?.mesh == null || lookup == undefined) {
      console.log('no chunk found');
      return;
    }

    [loc, info] = this.adjustChunk(info, lookup.addLocation);
    if(info == null || loc == null) {
      console.log('attempt to add outside of valid chunk boundary');
      return;
    }

    if(!info.chunk.add(loc, this)) {
      console.log('chunk already has block at location');
      return;
    }

    const rebuilds = this.getAffectedNeighbors(info.mesh, loc.x, loc.z);
    this.rebuildMeshes(rebuilds);
  }

  getAffectedNeighbors(mesh: EdgeChunkMesh, x: number, z: number) {
    const neighbors = [mesh];
    let m: EdgeChunkMesh|undefined;

    if(x == (Chunk.X-1)) {
      m = this.getEdgeMesh(mesh.chunk.x + 1, mesh.chunk.z);
      if(m) {
        neighbors.push(m);
      }
    }
    if( x == 0) {
      m = this.getEdgeMesh(mesh.chunk.x - 1, mesh.chunk.z);
      if(m) {
        neighbors.push(m);
      }
    }
    if(z == (Chunk.Z-1)) {
      m = this.getEdgeMesh(mesh.chunk.x, mesh.chunk.z + 1);
      if(m) {
        neighbors.push(m);
      }
    }
    if(z == 0) {
      m = this.getEdgeMesh(mesh.chunk.x, mesh.chunk.z - 1);
      if(m) {
        neighbors.push(m);
      }
    }

    return neighbors;
  }

  private adjustChunk(chunkInfo: ChunkInfo, location: THREE.Vector3): [null|THREE.Vector3, null|ChunkInfo] {
    const loc = location.clone();
    let [cx, cz] = [chunkInfo.chunk.x, chunkInfo.chunk.z];
    // let ch = chunkInfo;

    if(loc.x < 0) {
      cx--;
      // ch = this.getChunk(ch.x-1, ch.z);
      loc.x += Chunk.X;
    }
    else if(loc.x >= Chunk.X) {
      cx++;
      // ch = this.chunkMap_.get('' + (ch.x + 1) + ':' + ch.z);
      loc.x -= Chunk.X;
    }
    // if(ch == undefined) {
    //   return [null, null, null];
    // }

    if(loc.z < 0) {
      cz--;
      // ch = this.chunkMap_.get('' + ch.x + ':' + (ch.z-1));
      loc.z += Chunk.Z;
    }
    else if(loc.z >= Chunk.Z) {
      cz++;
      // ch = this.chunkMap_.get('' + ch.x + ':' + (ch.z + 1));
      loc.z -= Chunk.Z;
    }

    let ch = this.getChunk(cx, cz);
    if(ch == undefined) {
      return [null, null];
    }
    // const mesh = this.map.get(ch);
    // if(mesh == undefined) {
    //   return [null, null, null];
    // }

    return [loc, ch];
  }

  removeBlock(intersect: THREE.Intersection) {
    const info = this.lookupChunkInfo(intersect);
    if(info == null) {
      return;
    }

    const lookup = info.mesh.lookupFromIndex(intersect.faceIndex);
    if(lookup == null) {
      return false;
    }

    info.chunk.remove(lookup.location, this);
    this.rebuildMeshes(this.getAffectedNeighbors(info.mesh, lookup.location.x, lookup.location.z));

    return true;
  }

  get collisionMesh() {
    if(this.dirty_) {
      this.rebuild();
    }
    return this.collisionMesh_;
  }

  get mesh(): THREE.Object3D {
    if(this.dirty_) {
      this.rebuild();
    }
    return this.mesh_;
  }

  private rebuildMeshes(list: EdgeChunkMesh[]) {
    for(let mesh of list) {
      mesh.chunk.buildNeighbors(this);
      this.mesh_.remove(mesh.getMesh());
      this.collisionMesh_.remove(mesh.getCollisionMesh());
      const m = new EdgeChunkMesh(mesh.chunk);
      this.map_.set(this.toKey(mesh.chunk.x, mesh.chunk.z), new ChunkInfo(mesh.chunk, m));
      // this.map.set(mesh.chunk, m);
      this.mesh_.add(m.getMesh());
      this.collisionMesh_.add(m.getCollisionMesh());
    }
  }

  private rebuild() {
    this.mesh_.clear();
    this.collisionMesh_.clear();

    this.map_.clear();

    for(let chunk of this.list_) {
      chunk.buildNeighbors(this);
      const m = new EdgeChunkMesh(chunk);
      this.mesh_.add(m.getMesh());
      this.map_.set(this.toKey(chunk.x, chunk.z), new ChunkInfo(chunk, m));
      this.collisionMesh_.add(m.getCollisionMesh());
    }
    this.dirty_ = false;
  }
}