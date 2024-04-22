import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-game-select',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './game-select.component.html',
  styleUrl: './game-select.component.css'
})
export class GameSelectComponent {

}
