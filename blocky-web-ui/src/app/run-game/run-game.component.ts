import { Component, ElementRef, ViewChild } from '@angular/core';
import { GameCanvas } from './GameCanvas';
import { DebugOverlayComponent } from '../debug-overlay/debug-overlay.component';
import { Observable, Subscription, debounceTime, fromEvent, interval, sampleTime, take, tap } from 'rxjs';

@Component({
  selector: 'app-run-game',
  templateUrl: './run-game.component.html',
  styleUrl: './run-game.component.css'
})
export class RunGameComponent {
  @ViewChild('gameCanvas') gameCanvas!: ElementRef;
  @ViewChild('debugOverlay') debugOverlay!: DebugOverlayComponent;
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
    .subscribe(pos => this.debugOverlay.setPosition(pos));
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
