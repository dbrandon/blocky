import { Chunk, ChunkBlock } from "./Chunk";
import * as THREE from 'three';

export class EdgeIndexLookup {
  constructor(
      public location: THREE.Vector3,
      public addLocation: THREE.Vector3,
      public facePoints: THREE.Vector3[],
      public sidePoints: THREE.Vector3[]
  ) {

  }
}

class EdgeGeoBuilder {
  indices: number[] = [];
  normals: number[] = [];
  vertices: number[] = [];
  colors: number[] = [];
  offset = 0;

  private grass = new THREE.Color(0x7cfc00);
  private dirt = new THREE.Color(0x211405);

  static CORNERS = [
    new THREE.Vector3(-1, 1, -1,),
    new THREE.Vector3(-1, 1, 1),
    new THREE.Vector3(1, 1, 1),
    new THREE.Vector3(1, 1, -1),

    new THREE.Vector3(-1, -1, -1),
    new THREE.Vector3(-1, -1, 1),
    new THREE.Vector3(1, -1, 1),
    new THREE.Vector3(1, -1, -1)
  ];

  constructor(private chunk: Chunk, private scalar: number, private map_: Map<number, EdgeIndexLookup>) {

  }

  build() {
    this.chunk.iterate((n, params) => {
      const center = new THREE.Vector3((params.x * this.scalar)+.5, (params.y * this.scalar) + .5, (params.z * this.scalar) + .5);

      if(!params.above) {
        this.addFace(center, [0, 1, 0], [0, 1, 2, 3], .5, params);
      }
      if(!params.below) {
        this.addFace(center, [0, -1, 0], [4, 7, 6, 5], .5, params);
      }
      if(!params.front) {
        this.addFace(center, [0, 0, -1], [0, 3, 7, 4], .5, params);
      }
      if(!params.back) {
        this.addFace(center, [0, 0, 1], [2, 1, 5, 6], .5, params);
      }
      if(!params.right) {
        this.addFace(center, [-1, 0, 0], [1, 0, 4, 5], 0.5, params);
      }
      if(!params.left) {
        this.addFace(center, [1, 0, 0], [3, 2, 6, 7], .5, params);
      }
    });

    const geometry_ = new THREE.BufferGeometry();
    geometry_.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.vertices), 3))
    geometry_.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.colors), 3));
    geometry_.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.normals), 3));
    geometry_.setIndex(this.indices);

    return geometry_;
  }

  addFace(
    center: THREE.Vector3,
    normal: number[],
    pts: number[],
    scale: number,
    params: ChunkBlock
  ) {
    for(let p of pts) {
      const pt = EdgeGeoBuilder.CORNERS[p];
      this.vertices.push(center.x + (pt.x*scale), center.y + (pt.y*scale), center.z + (pt.z*scale));
      this.normals.push(normal[0], normal[1], normal[2]);

      if(this.colors == null) {
        continue;
      }
      if(pt.y > 0) {
        this.colors.push(this.grass.r, this.grass.g + this.getVariance(), this.grass.b);
      }
      else {
        this.colors.push(this.dirt.r, this.dirt.g, this.dirt.b);
      }
    }

    const o = this.offset;
    this.indices.push(o, o+1, o+2);
    this.indices.push(o, o+2, o+3);

    this.addLookups((this.indices.length/3)-2, params);

    this.offset += 4;
  }

  private addLookups(index: number, params: ChunkBlock) {
    const side: THREE.Vector3[] = [];
    const v = this.vertices;
    const L = this.vertices.length - 12;
    const cx = (this.chunk.x<<3) * this.scalar;
    const cz = (this.chunk.z<<3) * this.scalar;
    const norm = new THREE.Vector3(this.normals[L], this.normals[L+1], this.normals[L+2]);
    const location = new THREE.Vector3(params.x, params.y, params.z);
    const addLocation = location.clone().add(norm);

    const soffset = norm.clone().multiplyScalar(.0001);
    for(let s of [0, 1, 2, 3, 0]) {
      const i = L + (s*3);
      side.push(new THREE.Vector3(v[i] + cx, v[i+1], v[i+2] + cz).add(soffset));
    }

    this.map_.set(index, {
      location: location,
      addLocation: addLocation,
      facePoints: this.makeFacePoints(v, true),
      sidePoints: side,
    });
    this.map_.set(index+1, {
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

  private getVariance() {
    return (Math.random() * .8) - .4;
  }
}

export class EdgeChunkGeometry {

  private geometry_: THREE.BufferGeometry;
  private map_ = new Map<number, EdgeIndexLookup>();

  constructor(chunk: Chunk, scalar: number) {
    this.geometry_ = new EdgeGeoBuilder(chunk, scalar, this.map_).build();
  }

  get geometry() {
    return this.geometry_;
  }

  get map() {
    return this.map_;
  }
}