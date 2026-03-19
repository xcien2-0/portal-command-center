import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type ImpactMonth, generateImpactNarrative } from '@/data/mockImpactData';

const COCO_GREEN = '#1d9e75';
const DARK = '#1a1a2e';

export function generateImpactPDF(data: ImpactMonth) {
  const doc = new jsPDF('p', 'mm', 'letter');
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const periodo = `${data.mes} ${data.year}`;

  // ===== Cover =====
  doc.setFillColor(COCO_GREEN);
  doc.rect(0, 0, w, h, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('Coco WiFi Comunitario', w / 2, 55, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Internet para comunidades rurales de México', w / 2, 65, { align: 'center' });
  doc.setFontSize(24);
  doc.text('Reporte Mensual', w / 2, 105, { align: 'center' });
  doc.text('de Impacto', w / 2, 118, { align: 'center' });
  doc.setFontSize(14);
  doc.text(periodo, w / 2, 142, { align: 'center' });
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, w / 2, 200, { align: 'center' });

  // ===== Page 2: KPIs =====
  doc.addPage();
  doc.setTextColor(DARK);
  doc.setFontSize(18);
  doc.text('Indicadores Clave', 20, 30);
  doc.setDrawColor(COCO_GREEN);
  doc.setLineWidth(0.8);
  doc.line(20, 34, w - 20, 34);

  const kpis = [
    ['Comunidades conectadas', String(data.comunidadesConectadas)],
    ['Usuarios únicos', data.usuariosUnicos.toLocaleString('es-MX')],
    ['Horas totales de conexión', data.horasTotalesConexion.toLocaleString('es-MX')],
    ['Estados con presencia', data.estados.join(', ')],
    ['Afiliados activos', String(data.afiliadosActivos)],
    ['Municipios con cobertura nueva', String(data.municipiosNuevos)],
    ['Personas con internet por 1ª vez', data.primeraVezInternet.toLocaleString('es-MX')],
    ['Coco Boxes activas', String(data.cocoBoxesActivas)],
    ['Ingreso bruto mensual', `$${data.ingresoBruto.toLocaleString('es-MX')} MXN`],
  ];

  autoTable(doc, {
    startY: 42,
    head: [['Indicador', 'Valor']],
    body: kpis,
    styles: { fontSize: 10, textColor: DARK, cellPadding: 4 },
    headStyles: { fillColor: COCO_GREEN, textColor: [255, 255, 255], fontSize: 10 },
    alternateRowStyles: { fillColor: [235, 250, 244] },
    columnStyles: { 1: { fontStyle: 'bold' } },
  });

  // ===== Page 3: Narrative =====
  doc.addPage();
  doc.setTextColor(DARK);
  doc.setFontSize(18);
  doc.text('Narrativa de Impacto', 20, 30);
  doc.setDrawColor(COCO_GREEN);
  doc.line(20, 34, w - 20, 34);

  const narrative = generateImpactNarrative(data);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(narrative, 25, 48, { maxWidth: w - 50 });

  // Footer note
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Este reporte fue generado automáticamente. Los datos provienen de las Coco Boxes, Odoo y el NOC de Coco.',
    w / 2, h - 20, { align: 'center', maxWidth: w - 40 },
  );

  doc.save(`Reporte_Impacto_Coco_${data.mes}_${data.year}.pdf`);
}
