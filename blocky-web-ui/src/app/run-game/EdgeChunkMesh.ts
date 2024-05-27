
import * as THREE from 'three';
import { ChunkMesh } from './ChunkMesh';
import { Chunk } from './Chunk';
import { EdgeChunkGeometry } from './EdgeChunkGeometry';
import { ChunkMeshLookup } from './ChunkMeshLookup';

class EdgeMesh extends THREE.Mesh {
  lookupMap: Map<number, ChunkMeshLookup>;

  constructor(geo: THREE.BufferGeometry, mat: THREE.Material, map?: Map<number, ChunkMeshLookup>) {
    super(geo, mat);
    this.lookupMap = map ? map : new Map<number, ChunkMeshLookup>();
  }
}

interface ChunkMeshGroup extends THREE.Group {
  children: EdgeMesh[];
}

export class EdgeChunkMesh extends ChunkMesh {
  private mesh_ = new THREE.Group() as ChunkMeshGroup;

  private collisionMesh_ = new THREE.Group();
  private static texture = new THREE.TextureLoader().load('/assets/kennynl/voxel_pack/spritesheet_tiles.png');
  private static firstLoad = true;

  private static COLLISION_MAT = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    wireframe: true
  });

  constructor(chunk: Chunk, private scalar = 1) {
    super(chunk);

    if(scalar < 1) scalar = 1;

    if(EdgeChunkMesh.firstLoad) {
      EdgeChunkMesh.firstLoad = false;
      EdgeChunkMesh.texture.colorSpace = THREE.SRGBColorSpace;
      EdgeChunkMesh.texture.wrapS = THREE.RepeatWrapping;
      EdgeChunkMesh.texture.wrapT = THREE.RepeatWrapping;
    }
  }

  containsObject(object: THREE.Object3D) {
    for(let i = 0; i < this.mesh_.children.length; i++) {
      if(this.mesh_.children[i] == object) {
        return true;
      }
    }
    return false;
  }

  rebuild() {
    const geometry = new EdgeChunkGeometry(this.chunk, this.scalar);
    // const mat = new THREE.MeshLambertMaterial({
    //   vertexColors: true,
    //   side: scalar > 1 ? THREE.DoubleSide : THREE.FrontSide
    // });
    const mat = new THREE.MeshLambertMaterial({
      map: EdgeChunkMesh.texture,
      side: this.scalar > 1 ? THREE.DoubleSide : THREE.FrontSide
    })

    this.mesh_.clear();
    for(let info of geometry.meshMap.values()) {
      const mesh = new EdgeMesh(info.geo, mat, info.map);
      mesh.position.x = (this.chunk.x << 3) * this.scalar;
      mesh.position.z = (this.chunk.z << 3) * this.scalar;
      mesh.lookupMap = info.map;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.mesh_.add(mesh);
    }
 
    this.collisionMesh_.clear();
    for(let geo of geometry.collisioNMap.values()) {
      const cmesh = new THREE.Mesh(geo, EdgeChunkMesh.COLLISION_MAT);
      cmesh.position.x = (this.chunk.x << 3) * this.scalar;
      cmesh.position.z = (this.chunk.z << 3) * this.scalar;
      this.collisionMesh_.add(cmesh);
    }

    for(let door of geometry.doorList) {
      // const hinge = new THREE.Vector3(door.params.x, door.params.y, door.params.z);
      const mesh = new EdgeMesh(door.geo, mat);
      mesh.position.x = ((this.chunk.x << 3) + door.params.x) * this.scalar;
      mesh.position.z = ((this.chunk.z << 3) + door.params.z) * this.scalar;
      mesh.position.y = door.params.y * this.scalar;

      this.mesh_.add(mesh);

      const cm = new THREE.Mesh(door.geo, mat);
      cm.position.copy(mesh.position);
      this.collisionMesh_.add(cm);
    }
  }

  getVariance() {
    return (Math.random() * .8) - .4;
  }

  getCollisionMesh() {
    return this.collisionMesh_;
  }

  override getMesh(): THREE.Object3D<THREE.Object3DEventMap> {
    return this.mesh_;
  }

  lookupFromIntersect(intersect: THREE.Intersection | undefined) {
    if(!intersect || intersect.faceIndex == undefined) {
      return;
    }

    for(let child of this.mesh_.children) {
      if(child == intersect.object) {
        return child.lookupMap.get(intersect.faceIndex);
      }
    }

    return;
    // const lookup = index == null ? null : this.map_.get(index);

    // if(lookup == null) {
    //   return;
    // }

    // return lookup;
  }
}