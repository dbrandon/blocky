
import * as THREE from 'three';
import { GameEntity } from './GameEntity';

export class EntityManager {
  private player_: GameEntity;

  constructor(
    private scene_ : THREE.Scene
  ) {
    this.player_ = new GameEntity();
    this.scene_.add(this.getPlayerWireframe());
    console.log('added player wireframe');
  }

  getPlayerWireframe() {
    return this.player_.wireframe;
  }

  setPlayerPosition(position: THREE.Vector3, heading: number) {
    this.player_.position = position;
    this.player_.heading = heading;
  }

  getDistanceTo(mesh: THREE.Object3D) {
    return this.player_.getDistanceTo(mesh);
  }
}