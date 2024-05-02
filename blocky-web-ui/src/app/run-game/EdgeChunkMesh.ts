
import * as THREE from 'three';
import { ChunkMesh } from './ChunkMesh';
import { Chunk } from './Chunk';

export class EdgeChunkMesh extends ChunkMesh {
  private mesh_ : THREE.Object3D;

  constructor(chunk: Chunk, scalar = 1) {
    super(chunk);

    this.mesh_ = new THREE.Object3D();

    const indices: number[] = [];
    const normals: number[] = [];
    const vertices: number[] = [];
    const colors: number[] = [];

    const offset = [0];

    let grass = new THREE.Color(0x7cfc00);

    let dirt = new THREE.Color(0);
    dirt.r = .13;
    dirt.g = .08;
    dirt.b = .02;

    chunk.iterate((x, y, z, n, param) => {
      const r = ((param.color >> 16) & 0xFF) / 255;
      const g = ((param.color >> 8) & 0xFF) / 255;
      const b = (param.color & 0xFF) / 255;
      const xs = x * scalar;
      const ys = y * scalar;
      const zs = z * scalar;

      let o = offset[0];
      
      // top
      if(!param.above) {
        vertices.push(xs, ys+1, zs);
        vertices.push(xs, ys+1, zs+1);
        vertices.push(xs+1, ys+1, zs+1);
        vertices.push(xs+1, ys+1, zs);
        colors.push(grass.r, grass.g + this.getVariance(), grass.b);
        colors.push(grass.r, grass.g + this.getVariance(), grass.b);
        colors.push(grass.r, grass.g + this.getVariance(), grass.b);
        colors.push(grass.r, grass.g + this.getVariance(), grass.b);
        normals.push(0, 1, 0);
        normals.push(0, 1, 0);
        normals.push(0, 1, 0);
        normals.push(0, 1, 0);
        indices.push(o, o+1, o+2);
        indices.push(o, o+2, o+3);
        o += 4;
      }
      // front
      if(!param.front) {
        vertices.push(xs, ys+1, zs);
        vertices.push(xs+1, ys+1, zs);
        vertices.push(xs+1, ys, zs);
        vertices.push(xs, ys, zs);
        colors.push(grass.r, grass.g + this.getVariance(), grass.b);
        colors.push(grass.r, grass.g + this.getVariance(), grass.b);
        colors.push(dirt.r, dirt.g, dirt.b);
        colors.push(dirt.r, dirt.g, dirt.b);
        normals.push(0, 0, -1);
        normals.push(0, 0, -1);
        normals.push(0, 0, -1);
        normals.push(0, 0, -1);
        indices.push(o, o+1, o+2);
        indices.push(o, o+2, o+3);
        o += 4;
      }
      // // left
      if(!param.left) {
        vertices.push(xs+1, ys+1, zs);
        vertices.push(xs+1, ys+1, zs+1);
        vertices.push(xs+1, ys, zs+1);
        vertices.push(xs+1, ys, zs);
        colors.push(grass.r, grass.g + this.getVariance(), grass.b);
        colors.push(grass.r, grass.g + this.getVariance(), grass.b);
        colors.push(dirt.r, dirt.g, dirt.b);
        colors.push(dirt.r, dirt.g, dirt.b);
        normals.push(1, 0, 0);
        normals.push(1, 0, 0);
        normals.push(1, 0, 0);
        normals.push(1, 0, 0);
        indices.push(o, o+1, o+2);
        indices.push(o, o+2, o+3);
        o += 4;
      }
      // // back
      if(!param.back) {
        vertices.push(xs+1, ys+1, zs+1);
        vertices.push(xs, ys+1, zs+1);
        vertices.push(xs, ys, zs+1);
        vertices.push(xs+1, ys, zs+1);
        colors.push(grass.r, grass.g + this.getVariance(), grass.b);
        colors.push(grass.r, grass.g + this.getVariance(), grass.b);
        colors.push(dirt.r, dirt.g, dirt.b);
        colors.push(dirt.r, dirt.g, dirt.b);
        normals.push(0, 0, 1);
        normals.push(0, 0, 1);
        normals.push(0, 0, 1);
        normals.push(0, 0, 1);
        indices.push(o, o+1, o+2);
        indices.push(o, o+2, o+3);
        o += 4;
      }
      // // right
      if(!param.right) {
        vertices.push(xs, ys+1, zs+1);
        vertices.push(xs, ys+1, zs);
        vertices.push(xs, ys, zs);
        vertices.push(xs, ys, zs+1);
        colors.push(grass.r, grass.g + this.getVariance(), grass.b);
        colors.push(grass.r, grass.g + this.getVariance(), grass.b);
        colors.push(dirt.r, dirt.g, dirt.b);
        colors.push(dirt.r, dirt.g, dirt.b);
        normals.push(-1, 0, 0);
        normals.push(-1, 0, 0);
        normals.push(-1, 0, 0);
        normals.push(-1, 0, 0);
        indices.push(o, o+1, o+2);
        indices.push(o, o+2, o+3);
        o += 4;
      }
      // // bottom
      if(!param.below) {
        vertices.push(xs, ys, zs);
        vertices.push(xs+1, ys, zs);
        vertices.push(xs+1, ys, zs+1);
        vertices.push(xs, ys, zs+1);
        colors.push(dirt.r, dirt.g, dirt.b);
        colors.push(dirt.r, dirt.g, dirt.b);
        colors.push(dirt.r, dirt.g, dirt.b);
        colors.push(dirt.r, dirt.g, dirt.b);
        normals.push(0, -1, 0);
        normals.push(0, -1, 0);
        normals.push(0, -1, 0);
        normals.push(0, -1, 0);
        indices.push(o, o+1, o+2);
        indices.push(o, o+2, o+3);
        o += 4;
      }

      offset[0] = o;
    })

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
    geometry.setIndex(indices);

    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      // side: THREE.DoubleSide
    });
    this.mesh_ = new THREE.Mesh(geometry, mat);
    this.mesh_.position.x = (this.chunk.x << 3) * scalar;
    this.mesh_.position.z = (this.chunk.z << 3) * scalar;
    this.mesh_.castShadow = true;
    this.mesh_.receiveShadow = true;
  }

  getVariance() {
    return (Math.random() * .8) - .4;
  }

  override getMesh(): THREE.Object3D<THREE.Object3DEventMap> {
    return this.mesh_;
  }
}