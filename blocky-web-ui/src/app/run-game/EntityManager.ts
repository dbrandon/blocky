
import * as THREE from 'three';
import { GameEntity } from './GameEntity';
import { DoorEntity } from './DoorEntity';

export class EntityManager {
  private player_: GameEntity;
  private door_: DoorEntity;

  constructor(
    private scene_ : THREE.Scene
  ) {
    this.player_ = new GameEntity();
    this.scene_.add(this.getPlayerWireframe());
    console.log('added player wireframe');

    this.door_ = new DoorEntity(5, 0, 5);
    this.scene_.add(this.door_.mesh);
  }

  getEntityIntersect(aabb: THREE.Box3) {
    const test = this.player_.getAABB();
    const list: GameEntity[] = [];

    if(aabb.intersectsBox(test)) {
      list.push(this.player_);
    }

    return list;
  }

  getPlayerPosition() {
    return this.player_.position;
  }

  getPlayerCameraPosition() {
    return this.player_.cameraPosition;
  }

  getPlayerWireframe() {
    return this.player_.wireframe;
  }

  get distObserver() {
    return this.player_.distObserver;
  }

  adjustPositionUpdate(cur: THREE.Vector3, mesh: THREE.Object3D[]) {
    return this.player_.adjustPositionUpdate(cur, mesh);
  }

  setPlayerPosition(position: THREE.Vector3, heading: number) {
    this.player_.position = position;
    this.player_.heading = heading;
  }

  getDistanceTo(mesh: THREE.Object3D) {
    return this.player_.getDistanceTo(mesh);
  }

  toggleDoor() {
    this.door_.toggle();
  }
}