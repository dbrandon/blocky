import { Component } from '@angular/core';
import { sprintf } from 'sprintf-js';

import * as THREE from 'three';

@Component({
  selector: 'app-debug-overlay',
  templateUrl: './debug-overlay.component.html',
  styleUrl: './debug-overlay.component.css'
})
export class DebugOverlayComponent {
  private title_ = 'Hello';
  private hidden_ = false;

  private position_= {x: '', y: '', z: ''}

  get overlayHidden() {
    return this.hidden_;
  }

  set overlayHidden(hidden: boolean) {
    this.hidden_ = hidden;
  }

  get position() {
    return this.position_;
  }

  setPosition(position: THREE.Vector3) {
    this.position_ = {
      x: sprintf('%.4f', position.x),
      y: sprintf('%.4f', position.y),
      z: sprintf('%.4f', position.z)
    }
  }

  get title() {
    return this.title_;
  }

  set title(title: string) {
    this.title_ = title;
  }
}
