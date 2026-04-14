import { ExportCreator } from './ExportCreator';
import { PdfPlanExporter } from './PdfPlanExporter';

export class PdfExportCreator extends ExportCreator {
  createExporter() {
    return new PdfPlanExporter();
  }
}
