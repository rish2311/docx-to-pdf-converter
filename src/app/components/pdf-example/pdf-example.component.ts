import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PdfMakeService } from '../../services/pdfmake.service';
import { Calls } from '../../models';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

@Component({
  selector: 'app-pdf-example',
  templateUrl: './pdf-example.component.html',
  styleUrls: ['./pdf-example.component.css'],
  standalone: true,
})
export class PdfExampleComponent {
  @Input() call!: Calls;
  selectedFile: File | null = null;
  pdfPreviewUrl: SafeResourceUrl | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private pdfMakeService: PdfMakeService,
    private sanitizer: DomSanitizer
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
    this.errorMessage = null;
  }

  async convertToPdf(): Promise<void> {
    if (!this.selectedFile) return;

    this.isLoading = true;
    this.errorMessage = null;

    try {
      const docDefinition =
        await this.pdfMakeService.convertDocxToPdfDefinition(this.selectedFile);
      const pdfDoc = pdfMake.createPdf(docDefinition);

      pdfDoc.getDataUrl((dataUrl: string) => {
        this.pdfPreviewUrl =
          this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl);
        this.isLoading = false;
      });
    } catch (error) {
      this.errorMessage = 'Failed to convert document';
      this.isLoading = false;
      console.error('Conversion error:', error);
    }
  }

  downloadPdf(): void {
    if (!this.pdfPreviewUrl) return;

    const pdfDoc = pdfMake.createPdf({
      content: ['Your PDF content here'], // You might want to store the docDefinition
      defaultStyle: { font: 'Roboto' },
    });

    pdfDoc.download(`document-${this.call.id}.pdf`); // Example filename using call ID
  }
}
