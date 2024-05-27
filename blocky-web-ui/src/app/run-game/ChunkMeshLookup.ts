
import * as THREE from 'three';

export class ChunkMeshLookup {
  constructor(
    public location: THREE.Vector3,
    public addLocation: THREE.Vector3,
    public selectionPoints: THREE.Vector3[]
  ) {

  }
}