import { TestBed } from '@angular/core/testing';

import { PdfMakeService } from './pdfmake.service';

describe('PdfMakeService', () => {
  let service: PdfMakeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfMakeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
