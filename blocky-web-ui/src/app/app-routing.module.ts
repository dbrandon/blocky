import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { RunGameComponent } from "./run-game/run-game.component";
import { GameSelectComponent } from "./game-select/game-select.component";

const routes: Routes = [
  { path: '', redirectTo: '/select-game', pathMatch: 'full' },
  { path: 'run-game', component: RunGameComponent },
  { path: 'select-game', component: GameSelectComponent },
]

@NgModule({
  declarations: [],
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }