
import * as THREE from 'three';
import { Chunk } from './Chunk';
import { EdgeChunkMesh } from './EdgeChunkMesh';
import { sprintf } from 'sprintf-js';
import { EntityManager } from './EntityManager';

class ChunkInfo {
  constructor(public chunk: Chunk, public mesh: EdgeChunkMesh) {}
}

export class ChunkManager {
  private mesh_: THREE.Group;
  private collisionMesh_: THREE.Group;
  private dirty_ = false;

  private map_ = new Map<string, ChunkInfo>();

  constructor() {
    this.mesh_ = new THREE.Group();
    this.collisionMesh_ = new THREE.Group();

    for(let xx = -5; xx < 5; xx++) {
      for(let zz = -5; zz < 5; zz++) {
        this.addChunk(new Chunk(xx, zz));
      }
    }
  }

  private toKey(x: number, z: number) {
    return '' + x + ':' + z;
  }

  private addChunk(chunk: Chunk) {
    this.map_.set(this.toKey(chunk.x, chunk.z), new ChunkInfo(chunk, new EdgeChunkMesh(chunk)));
    this.dirty_ = true;
  }

  setLocation(pos: THREE.Vector3) {
    const cx = Math.floor(pos.x) >> 3;
    const cz = Math.floor(pos.z) >> 3;

    for(let info of this.map_.values()) {
      const visible = (info.chunk.x >= cx-5 && info.chunk.x <= cx+5) && (info.chunk.z >= cz-5 && info.chunk.z <= cz+5);
      info.mesh.getMesh().visible = visible
    }
  }

  getChunk(x: number, z: number) {
    return this.map_.get(this.toKey(x, z));
  }

  getEdgeMesh(x: number, z: number) {
    return this.getChunk(x, z)?.mesh;
  }

  /**
   * Returns the list of meshes to search given the position
   * @param pos 
   */
  getSelectionMesh(pos: THREE.Vector3) {
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
        }
      }
    }

    return list;
  }

  private lookupChunkInfo(intersect: THREE.Intersection) {
    for(let info of this.map_.values()) {
      if(info == null) {
        continue;
      }
      if(info.mesh.containsObject(intersect.object)) {
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
    return info?.mesh.lookupFromIndex(intersect.faceIndex);
  }

  addBlock(intersect: THREE.Intersection, entityManager: EntityManager) {
    let info = this.lookupChunkInfo(intersect);
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

    const bounds = this.getBoundingBox(loc, info.chunk);
    if(entityManager.getEntityIntersect(bounds).length > 0) {
      console.log('New block overlaps with entity');
      return;
    }

    if(!info.chunk.add(loc, this)) {
      console.log('chunk already has block at location');
      return;
    }

    const rebuilds = this.getAffectedNeighbors(info.mesh, loc.x, loc.z);
    this.rebuildMeshes(rebuilds);
  }

  private getBoundingBox(location: THREE.Vector3, chunk: Chunk) {
    const min = location.clone();
    min.x += chunk.x * Chunk.X;
    min.z += chunk.z * Chunk.Z;

    const offset = 1;
    const max = min.clone().add(new THREE.Vector3(1, 1, 1));

    return new THREE.Box3(min, max);
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

    if(loc.x < 0) {
      cx--;
      loc.x += Chunk.X;
    }
    else if(loc.x >= Chunk.X) {
      cx++;
      loc.x -= Chunk.X;
    }

    if(loc.z < 0) {
      cz--;
      loc.z += Chunk.Z;
    }
    else if(loc.z >= Chunk.Z) {
      cz++;
      loc.z -= Chunk.Z;
    }

    let ch = this.getChunk(cx, cz);
    if(ch == undefined) {
      return [null, null];
    }

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
    }
    for(let mesh of list) {
      mesh.rebuild();
    }
    // for(let mesh of list) {
    //   mesh.chunk.buildNeighbors(this);
    //   this.mesh_.remove(mesh.getMesh());
    //   this.collisionMesh_.remove(mesh.getCollisionMesh());
    //   const m = new EdgeChunkMesh(mesh.chunk);
    //   this.map_.set(this.toKey(mesh.chunk.x, mesh.chunk.z), new ChunkInfo(mesh.chunk, m));
    //   this.mesh_.add(m.getMesh());
    //   this.collisionMesh_.add(m.getCollisionMesh());
    // }
  }

  private rebuild() {
    this.mesh_.clear();
    this.collisionMesh_.clear();

    // this.map_.clear();

    for(let info of this.map_.values()) {
      info.chunk.buildNeighbors(this);
    }

    for(let info of this.map_.values()) {
      info.mesh.rebuild();
      // const m = new EdgeChunkMesh(chunk);
      this.mesh_.add(info.mesh.getMesh());
      // this.map_.set(this.toKey(info.chunk.x, chunk.z), new ChunkInfo(chunk, m));
      this.collisionMesh_.add(info.mesh.getCollisionMesh());
    }
    this.dirty_ = false;
  }
}