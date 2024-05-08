
import * as THREE from 'three';
import { ChunkMesh } from './ChunkMesh';
import { Chunk, ChunkBlock } from './Chunk';

class IndexLookup {
  constructor(
      public location: THREE.Vector3,
      public addLocation: THREE.Vector3,
      public facePoints: THREE.Vector3[],
      public sidePoints: THREE.Vector3[]
  ) {

  }
}

export class EdgeChunkMesh extends ChunkMesh {
  private mesh_ : THREE.Object3D;
  private map = new Map<number, IndexLookup>();

  constructor(chunk: Chunk, private scalar = 1) {
    super(chunk);

    if(scalar < 1) scalar = 1;

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

    chunk.iterate((n, param) => {
      const r = ((param.color >> 16) & 0xFF) / 255;
      const g = ((param.color >> 8) & 0xFF) / 255;
      const b = (param.color & 0xFF) / 255;
      const xs = param.x * scalar;
      const ys = param.y * scalar;
      const zs = param.z * scalar;

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
        this.addLookups((indices.length/3)-2,  param, normals, vertices);
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
        this.addLookups((indices.length/3)-2, param, normals, vertices);
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
        this.addLookups((indices.length/3)-2,  param, normals, vertices);
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
        this.addLookups((indices.length/3)-2,  param, normals, vertices);
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
        this.addLookups((indices.length/3)-2,  param, normals, vertices);
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
        this.addLookups((indices.length/3)-2, param, normals, vertices);
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
      side: scalar > 1 ? THREE.DoubleSide : THREE.FrontSide
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

  lookupFromIndex(index: number | undefined) {
    const lookup = index == null ? null : this.map.get(index);

    if(lookup == null) {
      return;
    }

    return lookup;
  }

  addBlock(index: number | undefined) {
    return index == null ? null : this.map.get(index);
  }

  removeBlock(index: number | undefined) {
    const lookup = index == null ? null : this.map.get(index);
    if(lookup == null) {
      return false;
    }
    this.chunk.remove(lookup.location);
    return true;
  }

  private addLookups(index: number, params: ChunkBlock, normals: number[], v: number[]) {
    const side: THREE.Vector3[] = [];
    const L = v.length - 12;
    const cx = (this.chunk.x<<3) * this.scalar;
    const cz = (this.chunk.z<<3) * this.scalar;
    const norm = new THREE.Vector3(normals[L], normals[L+1], normals[L+2]);
    const location = new THREE.Vector3(params.x, params.y, params.z);
    const addLocation = location.clone().add(norm);

    const soffset = norm.clone().multiplyScalar(.0001);
    for(let s of [0, 1, 2, 3, 0]) {
      const i = L + (s*3);
      side.push(new THREE.Vector3(v[i] + cx, v[i+1], v[i+2] + cz).add(soffset));
    }

    this.map.set(index, {
      location: location,
      addLocation: addLocation,
      facePoints: this.makeFacePoints(v, true),
      sidePoints: side,
    });
    this.map.set(index+1, {
      location: location,
      addLocation: addLocation,
      facePoints: this.makeFacePoints(v, false),
      sidePoints: side
    })
  }

  private makeFacePoints(v: number[], one: boolean) {
    const o = v.length - 12;
    const set = one ? [0, 1, 2, 0] : [0, 2, 3, 0];
    const pts: THREE.Vector3[] = [];

    for(let s of set) {
      const S = o + (s * 3);
      pts.push(new THREE.Vector3(v[S+0], v[S+1], v[S+2]));
    }

    return pts;
  }
}