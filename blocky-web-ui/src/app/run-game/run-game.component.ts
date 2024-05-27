import { Component, ElementRef, ViewChild } from '@angular/core';
import { GameCanvas } from './GameCanvas';
import { DebugOverlayComponent } from '../debug-overlay/debug-overlay.component';
import { Subscription, fromEvent, interval, sampleTime, timeout, timer } from 'rxjs';
import { GameUiOverlayComponent } from '../game-ui-overlay/game-ui-overlay.component';

@Component({
  selector: 'app-run-game',
  templateUrl: './run-game.component.html',
  styleUrl: './run-game.component.css'
})
export class RunGameComponent {
  @ViewChild('gameCanvas') gameCanvas!: ElementRef;
  @ViewChild('debugOverlay') debugOverlay!: DebugOverlayComponent;
  @ViewChild('uiOverlay') uiOverlay!: GameUiOverlayComponent;
  private canvas!: GameCanvas;

  private timer$!: Subscription;

  ngOnInit() {
    this.timer$ = interval(1000).subscribe(this.handleTimer.bind(this));
  }

  ngAfterViewInit() {
    this.canvas = new GameCanvas(this.gameCanvas.nativeElement as HTMLCanvasElement);

    fromEvent<KeyboardEvent>(document, 'keydown')
        .subscribe(this.handleKeyDown.bind(this));

    this.canvas.positionObserver.pipe(
      sampleTime(100)
    )
    .subscribe(info => this.debugOverlay.setPositionInfo(info));

    this.canvas.fpsObserver.pipe(
      sampleTime(25)
    ).subscribe(fps => this.debugOverlay.fps = Math.round(fps));

    this.canvas.distObserver.pipe(
      sampleTime(100)
    ).subscribe(dist => this.debugOverlay.setDistToTarget(dist));

    this.canvas.blockSelectionObserver.subscribe(info => this.uiOverlay.setBlockSelectionUrl(info));
    timer(100).subscribe(() => this.uiOverlay.setBlockSelectionUrl(this.canvas.placementImgUrl));
  }

  private handleTimer() {
    this.debugOverlay.title = new Date().toTimeString();
  }

  private handleKeyDown(e: KeyboardEvent) {
    if(e.code === 'KeyO') {
      this.debugOverlay.overlayHidden = !this.debugOverlay.overlayHidden;
    }
  }
}
