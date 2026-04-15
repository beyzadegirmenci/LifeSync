import * as XLSX from 'xlsx';
import { PlanExporter } from './PlanExporter';

export class ExcelPlanExporter extends PlanExporter {
  export(payload, options) {
    const dataType = options?.dataType || 'plan';

    if (dataType === 'survey') {
      this.exportSurvey(payload, options);
      return;
    }

    this.exportPlan(payload, options);
  }

  exportPlan(planData, options) {
    if (!planData || !planData.periods || !planData.rows) {
      throw new Error('Plan verisi export icin uygun degil');
    }

    const { duration, planType } = options;
    const { periods, rows } = planData;

    const header = [planType === 'diet' ? 'Ogun / Gun' : 'Egzersiz / Gun', ...periods];
    const data = [header];

    rows.forEach((row) => {
      data.push([row.title, ...row.items]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 18 }, ...periods.map(() => ({ wch: 30 }))];

    const wb = XLSX.utils.book_new();
    const sheetLabel = planType === 'diet' ? 'Diyet Plani' : 'Egzersiz Plani';
    XLSX.utils.book_append_sheet(wb, ws, sheetLabel);

    const fileName = `lifesync_${planType === 'diet' ? 'diyet' : 'egzersiz'}_${duration}_plan.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  exportSurvey(surveyData, options) {
    if (!surveyData || !surveyData.classification || !surveyData.recommendation) {
      throw new Error('Anket sonucu export icin uygun degil');
    }

    const { classification, recommendation } = surveyData;
    const rows = [
      ['Alan', 'Deger'],
      ['BMI', classification.bmi ?? '-'],
      ['Seviye', classification.levelLabelTr ?? classification.level ?? '-'],
      ['Skor', classification.score ?? '-'],
      ['Model', recommendation?.metadata?.model ?? '-']
    ];

    if (Array.isArray(classification.reasons) && classification.reasons.length > 0) {
      rows.push([]);
      rows.push(['Degerlendirme Nedenleri', '']);
      classification.reasons.forEach((reason, i) => {
        rows.push([`Neden ${i + 1}`, reason]);
      });
    }

    rows.push([]);
    rows.push(['Kisisellestirilmis Oneriler', '']);
    const recommendationLines = String(recommendation?.raw_text || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (recommendationLines.length === 0) {
      rows.push(['Oneri', '-']);
    } else {
      recommendationLines.forEach((line, i) => {
        rows.push([`Satir ${i + 1}`, line]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 30 }, { wch: 120 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Anket Sonucu');

    const label = options?.label ? String(options.label).toLowerCase() : 'anket';
    const fileName = `lifesync_${label}_sonuc.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
}
