import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameUiOverlayComponent } from './game-ui-overlay.component';

describe('GameUiOverlayComponent', () => {
  let component: GameUiOverlayComponent;
  let fixture: ComponentFixture<GameUiOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameUiOverlayComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GameUiOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
