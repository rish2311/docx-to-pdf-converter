import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfExampleComponent } from './pdf-example.component';

describe('PdfExampleComponent', () => {
  let component: PdfExampleComponent;
  let fixture: ComponentFixture<PdfExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfExampleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfExampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
