import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DailyAvailability, GobIncident, SLATerm } from '@/data/mockGobiernoData';
import { GOB_CLIENT, MONTHS_ES } from '@/data/mockGobiernoData';

const NAVY = '#1a3a5c';
const FOOTER_TEXT = 'CONFIDENCIAL — Este documento contiene información privilegiada. Queda prohibida su reproducción o distribución sin autorización escrita.';

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const h = doc.internal.pageSize.getHeight();
  const w = doc.internal.pageSize.getWidth();
  doc.setDrawColor(NAVY);
  doc.setLineWidth(0.3);
  doc.line(20, h - 20, w - 20, h - 20);
  doc.setFontSize(6);
  doc.setTextColor(NAVY);
  doc.text(FOOTER_TEXT, w / 2, h - 15, { align: 'center', maxWidth: w - 40 });
  doc.text(`Página ${pageNum} de ${totalPages}`, w - 20, h - 10, { align: 'right' });
}

export function generateGobPDF(
  month: number,
  year: number,
  disponibilidad: number,
  slaCumplido: boolean,
  incidentes: number,
  tiempoResolucion: string,
  dailyData: DailyAvailability[],
  incidentLog: GobIncident[],
  slaTerms: SLATerm[],
) {
  const doc = new jsPDF('p', 'mm', 'letter');
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const periodo = `${MONTHS_ES[month]} ${year}`;
  const folio = `RPT-GOB-${year}-${String(month + 1).padStart(2, '0')}`;
  const generationDate = new Date().toLocaleString('es-MX');
  const totalPages = 7;

  // ===== PAGE 1: Cover =====
  doc.setFillColor(NAVY);
  doc.rect(0, 0, w, h, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text('[ISP_NAME]', w / 2, 60, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Portal Gubernamental', w / 2, 70, { align: 'center' });
  doc.setFontSize(22);
  doc.text('Reporte de Disponibilidad', w / 2, 110, { align: 'center' });
  doc.text('de Servicio', w / 2, 122, { align: 'center' });
  doc.setFontSize(14);
  doc.text(periodo, w / 2, 145, { align: 'center' });
  doc.setFontSize(10);
  doc.text(GOB_CLIENT.nombre, w / 2, 170, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`Folio: ${folio}`, w / 2, 195, { align: 'center' });
  doc.text(`Generado: ${generationDate}`, w / 2, 203, { align: 'center' });
  doc.text(`Contrato: ${GOB_CLIENT.contrato}`, w / 2, 211, { align: 'center' });

  // ===== PAGE 2: Executive Summary =====
  doc.addPage();
  doc.setTextColor(NAVY);
  doc.setFontSize(16);
  doc.text('Resumen Ejecutivo', 20, 30);
  doc.setLineWidth(0.5);
  doc.setDrawColor(NAVY);
  doc.line(20, 33, w - 20, 33);

  doc.setFontSize(10);
  const kpis = [
    ['Disponibilidad del servicio', `${disponibilidad}%`],
    ['SLA cumplido', slaCumplido ? 'Sí' : 'No'],
    ['Incidentes registrados', String(incidentes)],
    ['Tiempo promedio de resolución', tiempoResolucion],
    ['Plan contratado', GOB_CLIENT.plan],
    ['Uptime garantizado (SLA)', `${GOB_CLIENT.slaUptime}%`],
  ];

  let yPos = 45;
  kpis.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.text(`${label}:`, 25, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 120, yPos);
    yPos += 8;
  });

  addFooter(doc, 2, totalPages);

  // ===== PAGE 3-4: Availability Table =====
  doc.addPage();
  doc.setTextColor(NAVY);
  doc.setFontSize(16);
  doc.text('Tabla de Disponibilidad Diaria', 20, 30);
  doc.line(20, 33, w - 20, 33);

  const tableData = dailyData.map(d => [
    d.fecha, `${d.disponibilidad}%`, String(d.incidentes), d.tiempoInactivo, d.observaciones,
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Fecha', 'Disponibilidad', 'Incidentes', 'Tiempo inactivo', 'Observaciones']],
    body: tableData,
    styles: { fontSize: 7, textColor: NAVY, cellPadding: 2 },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 7 },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    didDrawPage: (data) => {
      addFooter(doc, doc.internal.pages.length - 1, totalPages);
    },
  });

  // Add totals
  const avgDisp = (dailyData.reduce((s, d) => s + d.disponibilidad, 0) / dailyData.length).toFixed(2);
  const totalInc = dailyData.reduce((s, d) => s + d.incidentes, 0);
  const y = (doc as any).lastAutoTable?.finalY || 200;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Promedio mensual: ${avgDisp}% | Total incidentes: ${totalInc}`, 25, y + 10);

  addFooter(doc, 3, totalPages);

  // ===== PAGE 5: Incident Log =====
  doc.addPage();
  doc.setTextColor(NAVY);
  doc.setFontSize(16);
  doc.text('Registro de Incidentes', 20, 30);
  doc.line(20, 33, w - 20, 33);

  const incData = incidentLog.map(i => [
    i.folio, i.fechaInicio, i.fechaResolucion, i.duracion, i.tipo, i.causaRaiz, i.resolucion,
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Folio', 'Inicio', 'Resolución', 'Duración', 'Tipo', 'Causa raíz', 'Resolución']],
    body: incData,
    styles: { fontSize: 6, textColor: NAVY, cellPadding: 2 },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 6 },
    columnStyles: { 5: { cellWidth: 35 }, 6: { cellWidth: 35 } },
  });

  addFooter(doc, 5, totalPages);

  // ===== PAGE 6: SLA Compliance =====
  doc.addPage();
  doc.setTextColor(NAVY);
  doc.setFontSize(16);
  doc.text('Declaración de Cumplimiento de SLA', 20, 30);
  doc.line(20, 33, w - 20, 33);

  const slaData = slaTerms.map(t => [
    t.nombre, t.garantizado, t.actual, t.cumplido ? '✓ Cumplido' : '✗ Incumplido',
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Término', 'Garantizado', 'Actual', 'Estado']],
    body: slaData,
    styles: { fontSize: 8, textColor: NAVY, cellPadding: 3 },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const val = data.cell.raw as string;
        if (val.includes('✓')) {
          data.cell.styles.textColor = [29, 158, 117];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [226, 75, 74];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  addFooter(doc, 6, totalPages);

  // ===== PAGE 7: Digital Signature Block =====
  doc.addPage();
  doc.setTextColor(NAVY);
  doc.setFontSize(16);
  doc.text('Firma Digital', 20, 30);
  doc.line(20, 33, w - 20, 33);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const sigItems = [
    ['Representante autorizado ISP:', 'Ing. Carlos Mendoza — Director de Operaciones'],
    ['Fecha y hora de generación:', generationDate],
    ['Folio único del documento:', folio],
    ['Entidad gubernamental:', GOB_CLIENT.nombre],
    ['Periodo del reporte:', periodo],
  ];

  let sigY = 50;
  sigItems.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.text(label, 25, sigY);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 25, sigY + 6);
    sigY += 18;
  });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Este reporte fue generado automáticamente por [ISP_NAME] Portal Gubernamental.',
    w / 2, sigY + 20, { align: 'center' }
  );

  doc.setLineWidth(0.3);
  doc.line(30, sigY + 40, 100, sigY + 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Firma del representante autorizado', 35, sigY + 45);

  doc.line(120, sigY + 40, 190, sigY + 40);
  doc.text('Sello institucional', 140, sigY + 45);

  addFooter(doc, 7, totalPages);

  // Save
  doc.save(`Reporte_Gobierno_${MONTHS_ES[month]}_${year}.pdf`);
}
