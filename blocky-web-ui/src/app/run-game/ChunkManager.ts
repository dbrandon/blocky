
import * as THREE from 'three';
import { Chunk } from './Chunk';
import { EdgeChunkMesh } from './EdgeChunkMesh';
import { sprintf } from 'sprintf-js';

export class ChunkManager {
  private chunks_: Chunk[] = [];
  private mesh_: THREE.Group;
  private dirty_ = false;

  private map = new Map<Chunk,EdgeChunkMesh>();

  constructor() {
    this.mesh_ = new THREE.Group();
  }

  add(chunk: Chunk) {
    this.chunks_.push(chunk);
    this.dirty_ = true;
  }

  private findChunk(point: THREE.Vector3) {
    for(let chunk of this.chunks_) {
      const xm = chunk.x << 3;
      const zm = chunk.z << 3;

      if(point.x >= xm && point.x < (xm+8) && point.z >= zm && point.z < (zm+8)) {
        return chunk;
      }
    }

    return null;
  }

  private lookupChunk(intersect: THREE.Intersection) {
    for(let chunk of this.chunks_) {
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
    const [chunk, mesh] = this.getMesh(intersect);
    const lookup = mesh?.lookupFromIndex(intersect.faceIndex);

    if(chunk == null || mesh == null || lookup == null) {
      return;
    }

    const loc = lookup.addLocation;
    chunk.add(lookup.addLocation);
    this.mesh_.remove(mesh?.getMesh());
    const m = new EdgeChunkMesh(chunk);
    this.map.set(chunk, m);
    this.mesh_.add(m.getMesh());
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

    for(let chunk of this.chunks_) {
      const m = new EdgeChunkMesh(chunk);
      this.mesh_.add(m.getMesh());
      this.map.set(chunk, m);
    }
    this.dirty_ = false;
  }
}