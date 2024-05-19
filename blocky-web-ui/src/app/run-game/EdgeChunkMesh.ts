
import * as THREE from 'three';
import { ChunkMesh } from './ChunkMesh';
import { Chunk } from './Chunk';
import { EdgeChunkGeometry } from './EdgeChunkGeometry';

export class EdgeChunkMesh extends ChunkMesh {
  private geometry_ : EdgeChunkGeometry;
  private mesh_ : THREE.Object3D;

  private collisionMesh_ : THREE.Object3D;
  private static texture = new THREE.TextureLoader().load('/assets/kennynl/voxel_pack/spritesheet_tiles.png');
  private static firstLoad = true;

  constructor(chunk: Chunk, private scalar = 1) {
    super(chunk);

    if(scalar < 1) scalar = 1;

    if(EdgeChunkMesh.firstLoad) {
      EdgeChunkMesh.firstLoad = false;
      EdgeChunkMesh.texture.colorSpace = THREE.SRGBColorSpace;
      EdgeChunkMesh.texture.wrapS = THREE.RepeatWrapping;
      EdgeChunkMesh.texture.wrapT = THREE.RepeatWrapping;
    }

    this.geometry_ = new EdgeChunkGeometry(chunk, scalar);
    // const mat = new THREE.MeshLambertMaterial({
    //   vertexColors: true,
    //   side: scalar > 1 ? THREE.DoubleSide : THREE.FrontSide
    // });
    const mat = new THREE.MeshPhongMaterial({
      map: EdgeChunkMesh.texture,
    })
    this.mesh_ = new THREE.Mesh(this.geometry_.meshGeometry, mat);
    this.mesh_.position.x = (this.chunk.x << 3) * scalar;
    this.mesh_.position.z = (this.chunk.z << 3) * scalar;
    this.mesh_.castShadow = true;
    this.mesh_.receiveShadow = true;

    this.collisionMesh_ = new THREE.Mesh(
      this.geometry_.collisionGeometry,
      new THREE.MeshBasicMaterial({
        color: 0xFF0000,
        wireframe: true
      })
    );
    this.collisionMesh_.position.x = (this.chunk.x << 3) * scalar;
    this.collisionMesh_.position.z = (this.chunk.z << 3) * scalar;
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
    const lookup = index == null ? null : this.geometry_.map.get(index);

    if(lookup == null) {
      return;
    }

    return lookup;
  }

  addBlock(index: number | undefined) {
    return index == null ? null : this.geometry_.map.get(index);
  }
}