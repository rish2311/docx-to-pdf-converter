import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as mammoth from 'mammoth';
import {
  TDocumentDefinitions as PdfTDocumentDefinitions,
  PageOrientation,
  Content as PdfMakeContent,
} from 'pdfmake/interfaces';

// Assign vfs immediately after imports - trying direct access
pdfMake.vfs = pdfFonts.vfs;

@Injectable({
  providedIn: 'root',
})
export class PdfMakeService {
  constructor() {
    // No need to assign vfs here anymore
  }

  async convertDocxToPdfDefinition(
    file: File
  ): Promise<PdfTDocumentDefinitions> {
    try {
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      const result = await mammoth.convertToHtml({ arrayBuffer });

      // Get document metadata if available
      const metadata = {
        title: file.name.replace('.docx', ''),
        author: 'Document Converter',
        subject: 'Converted Document',
        keywords: 'docx, pdf, convert',
        creator: 'DOCX to PDF Converter',
        producer: 'PdfMake & Mammoth.js',
      };

      return {
        content: this.convertHtmlToPdfContent(result.value),
        defaultStyle: {
          font: 'Roboto',
          fontSize: 12,
          lineHeight: 1.2,
        },
        styles: this.getDocumentStyles(),
        info: metadata,
        pageSize: 'A4',
        pageOrientation: 'portrait' as PageOrientation, // Use type assertion here
        pageMargins: [40, 60, 40, 60],
        header: (currentPage: number, pageCount: number) => {
          return {
            text: currentPage > 1 ? metadata.title : '',
            style: 'header',
            alignment: 'center',
            margin: [0, 20, 0, 0],
          };
        },
        footer: (currentPage: number, pageCount: number) => {
          return {
            text: `Page ${currentPage} of ${pageCount}`,
            alignment: 'center',
            style: 'footer',
          };
        },
      };
    } catch (error) {
      console.error('Error converting docx to pdf:', error);
      throw new Error(
        'Failed to convert document: ' +
          (error instanceof Error ? error.message : String(error))
      );
    }
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = (e) =>
        reject(new Error('Failed to read file: ' + e.target?.error?.message));
      reader.readAsArrayBuffer(file);
    });
  }

  private convertHtmlToPdfContent(html: string): PdfMakeContent[] {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      return this.processNodes(doc.body.childNodes);
    } catch (error) {
      console.error('HTML parsing error:', error);
      // Fallback to simple text content if parsing fails
      return [{ text: html.replace(/<[^>]*>/g, ' ').trim() }];
    }
  }

  private processNodes(nodes: NodeListOf<ChildNode>): PdfMakeContent[] {
    const contents: PdfMakeContent[] = [];

    Array.from(nodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          contents.push({ text });
        }
        return;
      }

      if (node instanceof HTMLElement) {
        const element = node;
        const tagName = element.tagName.toLowerCase();

        // Handle lists specially
        if (tagName === 'ul' || tagName === 'ol') {
          contents.push(this.processList(element, tagName));
          return;
        }

        // Handle tables specially
        if (tagName === 'table') {
          contents.push(this.processTable(element));
          return;
        }

        // Handle images
        if (tagName === 'img') {
          // Note: actual image handling would require additional work
          contents.push({ text: '[Image placeholder]', style: 'image' });
          return;
        }

        // Process standard elements
        const textContent = element.textContent?.trim();
        if (textContent) {
          const styles = this.getElementStyles(element);
          const baseContent: PdfMakeContent = { text: textContent };
          const contentItem: PdfMakeContent = Object.assign(
            {},
            baseContent,
            styles
          );
          contents.push(contentItem);
        }
      }
    });

    return contents.filter(
      (c) =>
        (typeof c === 'string' && c.trim() !== '') ||
        (typeof c === 'object' &&
          'text' in c &&
          (c.text as string)?.trim() !== '')
    );
  }

  private processList(listElement: HTMLElement, type: string): PdfMakeContent {
    const items = Array.from(listElement.querySelectorAll('li')).map((item) => {
      // Simplify list item to basic text content
      return { text: item.textContent?.trim() || '' };
    });

    // Initialize listContent correctly based on type
    let listContent: PdfMakeContent;
    if (type === 'ul') {
      listContent = { ul: items, margin: [0, 5, 0, 10] };
    } else {
      listContent = { ol: items, margin: [0, 5, 0, 10] };
    }
    return listContent;
  }

  private processTable(tableElement: HTMLElement): PdfMakeContent {
    const rows = Array.from(tableElement.querySelectorAll('tr'));
    const body: PdfMakeContent[][] = [];

    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll('td, th'));
      const rowData: PdfMakeContent[] = cells.map((cell) => {
        const cellContent: PdfMakeContent = {
          text: cell.textContent?.trim() || '',
        };
        if (cell.tagName.toLowerCase() === 'th' || rowIndex === 0) {
          cellContent.bold = true;
        }
        return cellContent;
      });
      body.push(rowData);
    });

    if (body.length === 0 || body[0].length === 0) {
      return { text: '[Empty Table]' };
    }

    return {
      table: {
        headerRows: tableElement.querySelector('th') ? 1 : 0,
        widths: Array(body[0]?.length || 0).fill('*'),
        body,
      },
      layout: 'lightHorizontalLines',
      margin: [0, 5, 0, 15],
    };
  }

  private getElementStyles(element: HTMLElement): Partial<PdfMakeContent> {
    const styles: Partial<PdfMakeContent> = {};
    const tagName = element.tagName.toLowerCase();

    if (tagName.match(/^h[1-6]$/)) {
      styles.style = tagName;
    }

    if (tagName === 'strong' || tagName === 'b') {
      styles.bold = true;
    }

    if (tagName === 'em' || tagName === 'i') {
      styles.italics = true;
    }

    if (tagName === 'u') {
      styles.decoration = 'underline';
    }

    if (tagName === 'p') {
      styles.margin = [0, 5, 0, 5];
    }

    const textAlign = element.style.textAlign;
    if (
      textAlign === 'left' ||
      textAlign === 'right' ||
      textAlign === 'center' ||
      textAlign === 'justify'
    ) {
      styles.alignment = textAlign;
    }

    return styles;
  }

  private getDocumentStyles(): Record<string, any> {
    return {
      header: {
        fontSize: 10,
        color: '#666666',
        italics: true,
      },
      footer: {
        fontSize: 10,
        color: '#666666',
        italics: true,
      },
      h1: {
        fontSize: 24,
        bold: true,
        margin: [0, 15, 0, 8],
      },
      h2: {
        fontSize: 22,
        bold: true,
        margin: [0, 12, 0, 6],
      },
      h3: {
        fontSize: 20,
        bold: true,
        margin: [0, 10, 0, 5],
      },
      h4: {
        fontSize: 18,
        bold: true,
        margin: [0, 10, 0, 5],
      },
      h5: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5],
      },
      h6: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5],
      },
      image: {
        italics: true,
        color: '#666666',
      },
    };
  }
}
