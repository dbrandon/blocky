import { Component } from '@angular/core';
import { sprintf } from 'sprintf-js';

import * as THREE from 'three';
import { PosInfo } from '../run-game/GameCanvas';

@Component({
  selector: 'app-debug-overlay',
  templateUrl: './debug-overlay.component.html',
  styleUrl: './debug-overlay.component.css'
})
export class DebugOverlayComponent {
  private title_ = 'Hello';
  private hidden_ = false;
  private fps_ = 0;

  private position_= {x: '', y: '', z: ''}
  private heading_ = '';

  get fps() {
    return this.fps_;
  }

  set fps(fps: number) {
    this.fps_ = fps;
  }

  get overlayHidden() {
    return this.hidden_;
  }

  set overlayHidden(hidden: boolean) {
    this.hidden_ = hidden;
  }

  get heading() {
    return this.heading_;
  }

  get position() {
    return this.position_;
  }

  setPositionInfo(info: PosInfo) {
    this.position_ = {
      x: sprintf('%.4f', info.position.x),
      y: sprintf('%.4f', info.position.y),
      z: sprintf('%.4f', info.position.z)
    }
    this.heading_ = sprintf('%.4f', (180 * info.heading)/Math.PI);
  }

  get title() {
    return this.title_;
  }

  set title(title: string) {
    this.title_ = title;
  }
}
