
import * as THREE from 'three';
import { ChunkMesh } from './ChunkMesh';
import { Chunk } from './Chunk';
import { EdgeChunkGeometry, EdgeIndexLookup } from './EdgeChunkGeometry';

export class EdgeChunkMesh extends ChunkMesh {
  // private geometry_ : EdgeChunkGeometry;
  private mesh_ = new THREE.Group();
  private map_ = new Map<number, EdgeIndexLookup>();

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
    console.log('test: length=' + this.mesh_.children.length);
    for(let i = 0; i < this.mesh_.children.length; i++) {
      if(this.mesh_.children[i] == object) {
        return true;
      }
    }
    return false;
  }

  rebuild() {
    this.map_.clear();
    const geometry = new EdgeChunkGeometry(this.chunk, this.scalar, this.map_);
    // const mat = new THREE.MeshLambertMaterial({
    //   vertexColors: true,
    //   side: scalar > 1 ? THREE.DoubleSide : THREE.FrontSide
    // });
    const mat = new THREE.MeshLambertMaterial({
      map: EdgeChunkMesh.texture,
      side: this.scalar > 1 ? THREE.DoubleSide : THREE.FrontSide
    })

    this.mesh_.clear();
    for(let geo of geometry.meshMap.values()) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.x = (this.chunk.x << 3) * this.scalar;
      mesh.position.z = (this.chunk.z << 3) * this.scalar;
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

  lookupFromIndex(index: number | undefined) {
    const lookup = index == null ? null : this.map_.get(index);

    if(lookup == null) {
      return;
    }

    return lookup;
  }
}