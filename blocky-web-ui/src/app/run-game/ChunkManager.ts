
import * as THREE from 'three';
import { Chunk } from './Chunk';
import { EdgeChunkMesh } from './EdgeChunkMesh';
import { sprintf } from 'sprintf-js';

export class ChunkManager {
  // private chunks_: Chunk[] = [];
  private mesh_: THREE.Group;
  private collisionMesh_: THREE.Group;
  private dirty_ = false;

  private chunkMap_ = new Map<string, Chunk>();
  private map = new Map<Chunk,EdgeChunkMesh>();

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

  private addChunk(chunk: Chunk) {
    this.chunkMap_.set('' + chunk.x + ':' + chunk.z, chunk);
    this.dirty_ = true;
  }

  getChunk(x: number, z: number) {
    return this.chunkMap_.get('' + x + ':' + z);
  }

  getEdgeMesh(x: number, z: number) {
    const chunk = this.getChunk(x, z);

    if(chunk) {
      return this.map.get(chunk);
    }
    return undefined;
  }

  private lookupChunk(intersect: THREE.Intersection) {
    for(let chunk of this.chunkMap_.values()) {
      const mesh = this.map.get(chunk);

      if(mesh == null) {
        continue;
      }
      if(intersect.object == mesh.getMesh()) {
        return chunk;
      }
    }

    return null;
  }

  private getMesh(intersect: THREE.Intersection): [Chunk|null, EdgeChunkMesh|null] {
    const chunk = this.lookupChunk(intersect);

    if(chunk === null) {
      return [null, null];
    }

    const mesh = this.map.get(chunk);
    if(mesh == null) {
      return [null, null];
    }

    return [chunk, mesh];
  }

  lookup(intersect: THREE.Intersection) {
    const [chunk, mesh] = this.getMesh(intersect);
    if(mesh == null) {
      return;
    }

    return mesh.lookupFromIndex(intersect.faceIndex);
  }

  addBlock(intersect: THREE.Intersection) {
    let [chunk, mesh] = this.getMesh(intersect);
    const lookup = mesh?.lookupFromIndex(intersect.faceIndex);
    let loc : THREE.Vector3 | null;

    if(chunk == null || mesh == null || lookup == null) {
      console.log('no chunk found');
      return;
    }

    [loc, chunk, mesh] = this.adjustChunk(chunk, lookup.addLocation);
    if(chunk == null || loc == null || mesh == null) {
      console.log('attempt to add outside of valid chunk boundary');
      return;
    }

    if(!chunk.add(loc, this)) {
      console.log('chunk already has block at location');
      return;
    }

    const rebuilds = this.getAffectedNeighbors(mesh, loc.x, loc.z);
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

  private adjustChunk(chunk: Chunk, location: THREE.Vector3): [null|THREE.Vector3, null|Chunk, null|EdgeChunkMesh] {
    const loc = location.clone();
    let ch: Chunk | undefined = chunk;

    if(loc.x < 0) {
      ch = this.chunkMap_.get('' + (ch.x-1) + ':' + ch.z);
      loc.x += Chunk.X;
    }
    else if(loc.x >= Chunk.X) {
      ch = this.chunkMap_.get('' + (ch.x + 1) + ':' + ch.z);
      loc.x -= Chunk.X;
    }
    if(ch == undefined) {
      return [null, null, null];
    }

    if(loc.z < 0) {
      ch = this.chunkMap_.get('' + ch.x + ':' + (ch.z-1));
      loc.z += Chunk.Z;
    }
    else if(loc.z >= Chunk.Z) {
      ch = this.chunkMap_.get('' + ch.x + ':' + (ch.z + 1));
      loc.z -= Chunk.Z;
    }
    if(ch == undefined) {
      return [null, null, null];
    }
    const mesh = this.map.get(ch);
    if(mesh == undefined) {
      return [null, null, null];
    }

    return [loc, ch, mesh];
  }

  removeBlock(intersect: THREE.Intersection) {
    const [chunk, mesh] = this.getMesh(intersect);
    if(chunk == null || mesh == null) {
      return;
    }

    const lookup = mesh.lookupFromIndex(intersect.faceIndex);
    if(lookup == null) {
      return false;
    }

    chunk.remove(lookup.location, this);
    this.rebuildMeshes(this.getAffectedNeighbors(mesh, lookup.location.x, lookup.location.z));

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
      this.map.set(mesh.chunk, m);
      this.mesh_.add(m.getMesh());
      this.collisionMesh_.add(m.getCollisionMesh());
    }
  }

  private rebuild() {
    this.mesh_.clear();
    this.collisionMesh_.clear();
    this.map.clear();

    for(let chunk of this.chunkMap_.values()) {
      chunk.buildNeighbors(this);
      const m = new EdgeChunkMesh(chunk);
      this.mesh_.add(m.getMesh());
      this.map.set(chunk, m);
      this.collisionMesh_.add(m.getCollisionMesh());
    }
    this.dirty_ = false;
  }
}