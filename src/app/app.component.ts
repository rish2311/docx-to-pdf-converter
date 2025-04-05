import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PdfMakeService } from './services/pdfmake.service';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import pdfMake from 'pdfmake/build/pdfmake';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'DOCX to PDF Converter';
  selectedFile: File | null = null;
  pdfPreviewUrl: SafeResourceUrl | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  fileName: string = '';
  // Store document definition for reuse in download
  private docDefinition: TDocumentDefinitions | null = null;
  // Store the URL object for cleanup
  private objectUrl: string | null = null;

  constructor(
    private pdfMakeService: PdfMakeService,
    private sanitizer: DomSanitizer
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.fileName = this.selectedFile.name.replace('.docx', '');
      this.errorMessage = null;

      // Clear previous preview
      if (this.pdfPreviewUrl) {
        this.clearPdfPreview();
      }
    }
  }

  async convertToPdf(): Promise<void> {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a DOCX file first';
      return;
    }

    // Check file size (example: limit to 5MB)
    const maxSizeInBytes = 5 * 1024 * 1024;
    if (this.selectedFile.size > maxSizeInBytes) {
      this.errorMessage =
        'File too large. Please select a file smaller than 5MB.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      // Convert DOCX to PDF definition
      this.docDefinition = await this.pdfMakeService.convertDocxToPdfDefinition(
        this.selectedFile
      );

      // Create PDF and get data URL
      const pdfDoc = pdfMake.createPdf(this.docDefinition);

      pdfDoc.getDataUrl((dataUrl: string) => {
        // Store the URL for later cleanup
        this.objectUrl = dataUrl;
        this.pdfPreviewUrl =
          this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl);
        this.isLoading = false;
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  downloadPdf(): void {
    if (!this.docDefinition) {
      this.errorMessage = 'No PDF available to download';
      return;
    }

    try {
      // Use the existing document definition
      const pdfDoc = pdfMake.createPdf(this.docDefinition);
      const filename = this.getFilename();
      pdfDoc.download(filename);
    } catch (error) {
      this.handleError(error);
    }
  }

  private getFilename(): string {
    return `${this.fileName || 'document'}.pdf`;
  }

  private handleError(error: any): void {
    console.error('PDF operation error:', error);
    this.errorMessage =
      error?.message || 'An error occurred processing the document';
    this.isLoading = false;
  }

  private clearPdfPreview(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.pdfPreviewUrl = null;
  }
}
