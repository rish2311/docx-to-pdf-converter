import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PdfExampleComponent } from './components/pdf-example/pdf-example.component';
import { Calls } from './models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PdfExampleComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'docx-to-pdf-converter';
  constructor(private modalService: NgbModal) {}

  openThplDocument(call: Calls): void {
    const modalRef = this.modalService.open(PdfExampleComponent, {
      fullscreen: true,
      scrollable: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.call = call;
  }
}
