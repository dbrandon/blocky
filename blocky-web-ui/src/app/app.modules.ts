import { NgModule } from "@angular/core";
import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app-routing.module";
import { BrowserModule } from "@angular/platform-browser";
import { RunGameComponent } from "./run-game/run-game.component";
import { DebugOverlayComponent } from "./debug-overlay/debug-overlay.component";
import { GameUiOverlayComponent } from "./game-ui-overlay/game-ui-overlay.component";

@NgModule({
  declarations: [
    AppComponent,
    GameUiOverlayComponent,
    RunGameComponent,
    DebugOverlayComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }