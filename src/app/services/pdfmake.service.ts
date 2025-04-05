import { Injectable } from '@angular/core';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as mammoth from 'mammoth';

// Define interfaces for pdfMake
interface TDocumentDefinitions {
  content: any[];
  defaultStyle?: any;
  styles?: Record<string, any>;
  [key: string]: any;
}

interface Content {
  text?: string;
  style?: string;
  bold?: boolean;
  italics?: boolean;
  fontSize?: number;
  margin?: number[];
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class PdfMakeService {
  constructor() {
    (window as any).pdfMake = pdfMake;
    (window as any).pdfMake.vfs = (pdfFonts as any).pdfMake?.vfs;
  }

  async convertDocxToPdfDefinition(file: File): Promise<TDocumentDefinitions> {
    const arrayBuffer = await this.readFileAsArrayBuffer(file);
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return {
      content: this.convertHtmlToPdfContent(result.value),
      defaultStyle: { font: 'Roboto' },
    };
  }

  private async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  private convertHtmlToPdfContent(html: string): Content[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return this.processNodes(doc.body.childNodes);
  }

  private processNodes(nodes: NodeListOf<ChildNode>): Content[] {
    return Array.from(nodes).map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return { text: node.textContent?.trim() || '' };
      }

      if (node instanceof HTMLElement) {
        const element = node;
        return {
          text: element.textContent?.trim() || '',
          ...this.getElementStyles(element),
        };
      }

      return { text: '' };
    });
  }

  private getElementStyles(element: HTMLElement): Content {
    switch (element.tagName.toLowerCase()) {
      case 'h1':
        return { fontSize: 24, bold: true, margin: [0, 10, 0, 5] };
      case 'h2':
        return { fontSize: 22, bold: true, margin: [0, 10, 0, 5] };
      case 'strong':
        return { bold: true };
      case 'em':
        return { italics: true };
      case 'p':
        return { margin: [0, 5, 0, 5] };
      default:
        return {};
    }
  }
}
