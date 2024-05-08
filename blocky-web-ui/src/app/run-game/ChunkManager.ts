
import * as THREE from 'three';
import { Chunk } from './Chunk';
import { EdgeChunkMesh } from './EdgeChunkMesh';
import { sprintf } from 'sprintf-js';

export class ChunkManager {
  // private chunks_: Chunk[] = [];
  private mesh_: THREE.Group;
  private dirty_ = false;

  private chunkMap_ = new Map<string, Chunk>();
  private map = new Map<Chunk,EdgeChunkMesh>();

  constructor() {
    this.mesh_ = new THREE.Group();

    // for(let xx = -8; xx <= 8; xx++) {
    //   for(let zz = -8; zz <= 8; zz++) {
    //     this.chunks_.push(new Chunk(xx, zz));
    //   }
    // }

    this.addChunk(new Chunk(0, 0));
    this.addChunk(new Chunk(-1, 0));

    // this.chunks_.push(new Chunk(0, 0));
    this.dirty_ = true;
  }

  private addChunk(chunk: Chunk) {
    this.chunkMap_.set('' + chunk.x + ':' + chunk.z, chunk);
  }

  private findChunk(point: THREE.Vector3) {
    for(let chunk of this.chunkMap_.values()) {
      const xm = chunk.x << 3;
      const zm = chunk.z << 3;

      if(point.x >= xm && point.x < (xm+8) && point.z >= zm && point.z < (zm+8)) {
        return chunk;
      }
    }

    return null;
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
    if(chunk == null || loc == null) {
      console.log('attempt to add outside of valid chunk boundary');
      return;
    }

    if(!chunk.add(loc)) {
      console.log('chunk already has block at location');
      return;
    }

    if(mesh != null) {
      this.mesh_.remove(mesh.getMesh());
    }
    const m = new EdgeChunkMesh(chunk);
    this.map.set(chunk, m);
    this.mesh_.add(m.getMesh());
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

    if(mesh.removeBlock(intersect.faceIndex)) {
      this.mesh_.remove(mesh.getMesh());
      const m = new EdgeChunkMesh(chunk);
      this.map.set(chunk, m);
      this.mesh_.add(m.getMesh());
    }
  }

  get mesh(): THREE.Object3D {
    if(this.dirty_) {
      this.rebuild();
    }
    return this.mesh_;
  }

  private rebuild() {
    this.mesh_.clear();
    this.map.clear();

    for(let chunk of this.chunkMap_.values()) {
      const m = new EdgeChunkMesh(chunk);
      this.mesh_.add(m.getMesh());
      this.map.set(chunk, m);
    }
    this.dirty_ = false;
  }
}