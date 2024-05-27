import { FactoryTarget } from '@angular/compiler';
import * as THREE from 'three';

export class DoorGeometry {
  static CORNERS = [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 1, 1),
    new THREE.Vector3(1, 1, 1),
    new THREE.Vector3(1, 1, 0),

    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(1, 0, 1),
    new THREE.Vector3(1, 0, 0)
  ];

  private indices: number[] = [];
  private vertices: number[] = [];
  private normals: number[] = [];
  private uvs: number[] = [];
  private offset = 0;

  constructor(private uvMap: number[][], private width = 1, private height = 2, private thichness = 0.0625, center?: THREE.Vector3) {
    if(center == null) {
      center = new THREE.Vector3(0, 0, 0);
      // center = new THREE.Vector3(width/2, height/2, thichness/2);
    }
    this.addFace(center, [0, 1, 0], [1, 2, 3, 0], 0);
    this.addFace(center, [0, -1, 0], [4, 7, 6, 5], 1);
    this.addFace(center, [0, 0, -1], [0, 3, 7, 4], 2);
    this.addFace(center, [0, 0, 1], [2, 1, 5, 6], 3);
    this.addFace(center, [-1, 0, 0], [1, 0, 4, 5], 4);
    this.addFace(center, [1, 0, 0], [3, 2, 6, 7], 5);
  }

  build() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.vertices), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.normals), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.uvs), 2));
    geo.setIndex(this.indices);

    return geo;
  }

  private addFace(c: THREE.Vector3, n: number[], pts: number[], uvIndex: number) {
    const w2 = this.width;
    const h2 = this.height;
    const t2 = this.thichness;

    for(let p of pts) {
      const pt = DoorGeometry.CORNERS[p];

      this.vertices.push(c.x + (pt.x * w2), c.y + (pt.y * h2), c.z + (pt.z * t2));
      this.normals.push(n[0], n[1], n[2]);
    }

    for(let u = 0; u < this.uvMap[uvIndex].length; u++) {
      this.uvs.push(this.uvMap[uvIndex][u]);
    }

    const o = this.offset;
    this.indices.push(o, o+1, o+2, o, o+2, o+3);
    this.offset += pts.length;
  }
}

export class DoorEntity {
  private hinge_ : THREE.Vector3;
  private mesh_ : THREE.Mesh;
  private open_ = false;

  constructor(x_: number, y_: number, z_: number) {
    const uvWood = this.makeUvs(1, 9);
    const uvs = [ uvWood, uvWood, uvWood, uvWood, uvWood, uvWood ];
    const geo = new DoorGeometry(uvs).build();
    const texture = new THREE.TextureLoader().load('/assets/kennynl/voxel_pack/spritesheet_tiles.png');
    texture.colorSpace = THREE.SRGBColorSpace;

    this.hinge_ = new THREE.Vector3(x_, y_, z_);
    this.mesh_ = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({map: texture}));
    this.mesh_.position.copy(this.hinge_);
  }

  get mesh() {
    return this.mesh_;
  }

  toggle() {
    this.open_ = !this.open_;
    this.mesh.position.copy(this.open_ ? this.hinge_.clone().add(new THREE.Vector3(.0625, 0, 0)) : this.hinge_);
    this.mesh_.rotation.y = this.open_ ? -Math.PI/2 : 0;
  }

  private makeUvs(u: number, v: number) {
    const voff = 1.5 / (10*128);
    const [u0, u1]= [u/9 + (1/(9*128)), (u+1)/9 - (1/(9*128))];
    const [v0, v1] = [v/10 + voff, (v+1)/10 - voff];

    return [ u1, v1,  u0, v1,  u0, v0,   u1, v0 ];
  }
}