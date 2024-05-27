import { Component } from '@angular/core';

@Component({
  selector: 'app-game-ui-overlay',
  templateUrl: './game-ui-overlay.component.html',
  styleUrl: './game-ui-overlay.component.css'
})
export class GameUiOverlayComponent {
  overlayHidden = false;

  placementImgSource = '/assets/kennynl/voxel_pack/redstone_sand.png';

  setBlockSelectionUrl(url: string) {
    this.placementImgSource = url;
  }
}
