import { Chunk, ChunkBlock } from "./Chunk";
import * as THREE from 'three';
import { DoorGeometry } from "./DoorEntity";
import { ChunkMeshLookup } from "./ChunkMeshLookup";

class EdgeGeoBuilder {
  indices: number[] = [];
  normals: number[] = [];
  vertices: number[] = [];
  // colors: number[] = [];
  uvs: number[] = [];
  useUvs = true;
  // useColor = false;
  size = .5;
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

  constructor(private chunk: Chunk, private scalar: number, private map_?: Map<number, ChunkMeshLookup>) {

  }

  get map() {
    return this.map_;
  }

  addBlock(params: ChunkBlock) {
    const center = new THREE.Vector3((params.x * this.scalar)+.5, (params.y * this.scalar) + .5, (params.z * this.scalar) + .5);

    if(!params.above || params.above.type != ChunkBlock.TYPE_NORMAL) {
      this.addFace(center, [0, 1, 0], [1, 2, 3, 0], 0, params);
    }
    if(!params.below || params.below.type != ChunkBlock.TYPE_NORMAL) {
      this.addFace(center, [0, -1, 0], [4, 7, 6, 5], 1, params);
    }
    if(!params.front || params.front.type != ChunkBlock.TYPE_NORMAL) {
      this.addFace(center, [0, 0, -1], [0, 3, 7, 4], 2, params);
    }
    if(!params.back || params.back.type != ChunkBlock.TYPE_NORMAL) {
      this.addFace(center, [0, 0, 1], [2, 1, 5, 6], 3, params);
    }
    if(!params.right || params.right.type != ChunkBlock.TYPE_NORMAL) {
      this.addFace(center, [-1, 0, 0], [1, 0, 4, 5], 4, params);
    }
    if(!params.left || params.left.type != ChunkBlock.TYPE_NORMAL) {
      this.addFace(center, [1, 0, 0], [3, 2, 6, 7], 5, params);
    }
  }

  build() {
    const geometry_ = new THREE.BufferGeometry();
    geometry_.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.vertices), 3))
    // if(this.useColor) {
    //   geometry_.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.colors), 3));
    // }
    geometry_.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.normals), 3));
    if(this.useUvs) {
      geometry_.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.uvs), 2));
    }
    geometry_.setIndex(this.indices);

    return geometry_;
  }

  addFace(
    center: THREE.Vector3,
    normal: number[],
    pts: number[],
    faceNum: number,
    params: ChunkBlock
  ) {
    for(let p of pts) {
      const pt = EdgeGeoBuilder.CORNERS[p];
      this.vertices.push(center.x + (pt.x*this.size), center.y + (pt.y*this.size), center.z + (pt.z*this.size));
      this.normals.push(normal[0], normal[1], normal[2]);

      // if(!this.useColor) {
      //   continue;
      // }
      // if(pt.y > 0) {
      //   this.colors.push(this.grass.r, this.grass.g + this.getVariance(), this.grass.b);
      // }
      // else {
      //   this.colors.push(this.dirt.r, this.dirt.g, this.dirt.b);
      // }
    }

    if(this.useUvs) {
      for(let u = 0; u < params.uvLookup[faceNum].length; u++) {
        this.uvs.push(params.uvLookup[faceNum][u]);
      }
    }

    const o = this.offset;
    this.indices.push(o, o+1, o+2);
    this.indices.push(o, o+2, o+3);

    if(this.map_) {
      this.addLookups((this.indices.length/3)-2, params);
    }

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

    if(this.map_) {
      this.map_.set(index, {
        location: location,
        addLocation: addLocation,
        selectionPoints: side,
      });
      this.map_.set(index+1, {
        location: location,
        addLocation: addLocation,
        selectionPoints: side
      })
    }
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
  static Y = 8;

  private meshMap_ = new Map<number, {geo: THREE.BufferGeometry, map: Map<number, ChunkMeshLookup>}>();
  private collisionMap_ = new Map<number, THREE.BufferGeometry>();

  private doorList_: {geo: THREE.BufferGeometry, params: ChunkBlock}[] = [];

  constructor(chunk: Chunk, scalar: number) {
    const visMap = new Map<number, EdgeGeoBuilder>();
    const colMap = new Map<number, EdgeGeoBuilder>();

    chunk.iterate((n, params) => {
      if(params.type != ChunkBlock.TYPE_NORMAL) {
        const geo = new DoorGeometry(params.uvLookup).build();
        this.doorList_.push({geo: geo, params: params});
        return;
      }
      const y = Math.floor(params.y / EdgeChunkGeometry.Y);
      let col = colMap.get(y);
      let vis = visMap.get(y);

      if(!vis) {
        vis = new EdgeGeoBuilder(chunk, scalar, new Map<number, ChunkMeshLookup>());
        visMap.set(y, vis);
      }
      if(!col) {
        col = new EdgeGeoBuilder(chunk, scalar);
        col.useUvs = false;
        col.size = 0.7999;
        colMap.set(y, col);
      }

      vis.addBlock(params);
      col.addBlock(params);
    });

    visMap.forEach((val, key) => {
      this.meshMap_.set(key, {geo: val.build(), map: val.map as Map<number,ChunkMeshLookup>});
    })
    colMap.forEach((val, key) => {
      this.collisionMap_.set(key, val.build());
    })
  }

  get collisioNMap() {
    return this.collisionMap_;
  }

  get doorList() {
    return this.doorList_;
  }

  get meshMap() {
    return this.meshMap_;
  }
}