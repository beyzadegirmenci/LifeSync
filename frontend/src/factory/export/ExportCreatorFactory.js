import { ExcelExportCreator } from './ExcelExportCreator';
import { PdfExportCreator } from './PdfExportCreator';

export class ExportCreatorFactory {
  static create(type) {
    const normalizedType = String(type || '').toLowerCase();

    if (normalizedType === 'excel') {
      return new ExcelExportCreator();
    }

    if (normalizedType === 'pdf') {
      return new PdfExportCreator();
    }

    throw new Error(`Desteklenmeyen export tipi: ${type}`);
  }
}
