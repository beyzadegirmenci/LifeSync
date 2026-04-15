import { jsPDF } from 'jspdf';
import { PlanExporter } from './PlanExporter';

const mapText = (text) => {
  if (!text) return '-';
  return String(text)
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C');
};

export class PdfPlanExporter extends PlanExporter {
  export(payload, options) {
    const dataType = options?.dataType || 'plan';

    if (dataType === 'survey') {
      this.exportSurvey(payload, options);
      return;
    }

    this.exportPlan(payload, options);
  }

  createDoc() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let y = 12;
    const writeLine = (line, isBold = false) => {
      const content = mapText(line);
      const lines = doc.splitTextToSize(content, pageWidth - 20);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');

      lines.forEach((part) => {
        if (y > pageHeight - 10) {
          doc.addPage();
          y = 12;
        }
        doc.text(part, 10, y);
        y += 5;
      });
    };

    return { doc, writeLine, getY: () => y, setY: (nextY) => { y = nextY; } };
  }

  exportPlan(planData, options) {
    if (!planData || !planData.periods || !planData.rows) {
      throw new Error('Plan verisi export icin uygun degil');
    }

    const { duration, planType } = options;
    const { periods, rows } = planData;

    const { doc, writeLine, getY, setY } = this.createDoc();
    const title = `${planType === 'diet' ? 'Diyet' : 'Egzersiz'} Plani - ${duration}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(mapText(title), 10, getY());
    setY(getY() + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    rows.forEach((row) => {
      writeLine(row.title, true);
      periods.forEach((period, i) => {
        const value = row.items?.[i] ? row.items[i] : '-';
        writeLine(`  ${period}: ${value}`);
      });
      setY(getY() + 2);
    });

    const fileName = `lifesync_${planType === 'diet' ? 'diyet' : 'egzersiz'}_${duration}_plan.pdf`;
    doc.save(fileName);
  }

  exportSurvey(surveyData, options) {
    if (!surveyData || !surveyData.classification || !surveyData.recommendation) {
      throw new Error('Anket sonucu export icin uygun degil');
    }

    const { classification, recommendation } = surveyData;
    const { doc, writeLine, getY, setY } = this.createDoc();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Anket Sonucu', 10, getY());
    setY(getY() + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    writeLine(`BMI: ${classification.bmi ?? '-'}`);
    writeLine(
      `Seviye: ${classification.levelLabelTr ?? classification.level ?? '-'}`
    );
    writeLine(`Skor: ${classification.score ?? '-'}`);
    writeLine(`Model: ${recommendation?.metadata?.model ?? '-'}`);
    setY(getY() + 3);

    writeLine('Degerlendirme Nedenleri', true);
    if (Array.isArray(classification.reasons) && classification.reasons.length > 0) {
      classification.reasons.forEach((reason, i) => {
        writeLine(`${i + 1}. ${reason}`);
      });
    } else {
      writeLine('-');
    }

    setY(getY() + 3);
    writeLine('Kisisellestirilmis Oneriler', true);
    const recommendationLines = String(recommendation?.raw_text || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (recommendationLines.length === 0) {
      writeLine('-');
    } else {
      recommendationLines.forEach((line) => writeLine(line));
    }

    const label = options?.label ? String(options.label).toLowerCase() : 'anket';
    const fileName = `lifesync_${label}_sonuc.pdf`;
    doc.save(fileName);
  }
}
