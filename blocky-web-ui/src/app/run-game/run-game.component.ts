import { Component, ElementRef, ViewChild } from '@angular/core';
import { GameCanvas } from './GameCanvas';

@Component({
  selector: 'app-run-game',
  // standalone: true,
  // imports: [],
  templateUrl: './run-game.component.html',
  styleUrl: './run-game.component.css'
})
export class RunGameComponent {
  @ViewChild('gameCanvas') gameCanvas!: ElementRef;
  private canvas!: GameCanvas;

  ngOnInit() {
    // console.log('nginit');
  }

  ngAfterViewInit() {
    this.canvas = new GameCanvas(this.gameCanvas.nativeElement as HTMLCanvasElement);
  }
}
