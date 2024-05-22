
import * as THREE from 'three'

export class CrosshairSprite extends THREE.Sprite {
  constructor() {
    super(new THREE.SpriteMaterial({map: CrosshairSprite.createTexture()}));

    this.center.set(0.5, 0.5);
    this.scale.set(32, 32, 1);
  }

  private static createTexture() {
    let oc = new OffscreenCanvas(32, 32);
    let occtx = oc.getContext('2d');
    if(occtx != null) {
      occtx.strokeStyle = '#000000'
      occtx.lineWidth = 4;
      occtx.beginPath();
      occtx.moveTo(16, 0);
      occtx.lineTo(16, 32);
      occtx.moveTo(0, 16);
      occtx.lineTo(31, 16);
      occtx.stroke();

      occtx.strokeStyle = '#ffffff';
      occtx.lineWidth = 2;
      occtx.beginPath();
      occtx.moveTo(16, 2);
      occtx.lineTo(16, 29);
      occtx.moveTo(2, 16);
      occtx.lineTo(29, 16);
      occtx.stroke();
    }
    return new THREE.CanvasTexture(oc);
  }
}