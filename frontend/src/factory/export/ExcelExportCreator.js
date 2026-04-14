import { ExportCreator } from './ExportCreator';
import { ExcelPlanExporter } from './ExcelPlanExporter';

export class ExcelExportCreator extends ExportCreator {
  createExporter() {
    return new ExcelPlanExporter();
  }
}
