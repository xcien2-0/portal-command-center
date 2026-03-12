import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MONTHS_ES, GOB_CLIENT, type GobIncident } from '@/data/mockGobiernoData';

interface ObservacionesEjecutivasProps {
  month: number;
  year: number;
  uptimePct: number;
  slaMet: boolean;
  incidentCount: number;
  avgResolutionMin: number;
  incidents: GobIncident[];
}

// TODO: connect to AI API (OpenAI / Perplexity) for dynamic generation
function generateObservaciones(
  clientName: string,
  period: string,
  uptimePct: number,
  slaMet: boolean,
  incidentCount: number,
  avgResolutionMin: number,
  incidents: GobIncident[],
): string {
  const dayCount = period.includes('Febrero') ? 28 : 30;
  const totalMinutes = dayCount * 24 * 60;
  const downtimeMin = Math.round(totalMinutes * (1 - uptimePct / 100));
  const downtimeHrs = (downtimeMin / 60).toFixed(1);

  // Paragraph 1 — SERVICE OVERVIEW
  const p1 = `Durante el período correspondiente al mes de ${period}, [ISP_NAME] proporcionó al ${clientName} los servicios de conectividad a internet contratados bajo el expediente ${GOB_CLIENT.contrato}, alcanzando una disponibilidad del ${uptimePct.toFixed(2)}% del tiempo total del período. ${slaMet ? `Lo anterior representa el cumplimiento satisfactorio del Acuerdo de Nivel de Servicio (SLA) establecido contractualmente en ${GOB_CLIENT.slaUptime}%.` : `Lo anterior se encuentra por debajo del umbral de ${GOB_CLIENT.slaUptime}% establecido en el Acuerdo de Nivel de Servicio (SLA), por lo que se reconoce el incumplimiento correspondiente.`} El tiempo acumulado fuera de servicio durante el período fue de ${downtimeHrs} horas.`;

  // Paragraph 2 — INCIDENTS AND RESPONSE
  let p2: string;
  if (incidentCount === 0) {
    p2 = `Se informa que durante la totalidad del período no se registraron incidentes de servicio, manteniéndose la operación de manera ininterrumpida y dentro de los parámetros de calidad establecidos.`;
  } else {
    const incidentDescriptions = incidents.slice(0, 3).map(inc =>
      `el incidente con folio ${inc.folio}, originado por ${inc.causaRaiz.toLowerCase()}, el cual fue atendido y resuelto en un tiempo de ${inc.duracion}`
    ).join('; ');
    p2 = `Durante el período en cuestión se registraron ${incidentCount} incidentes de servicio. Entre los eventos más relevantes se documentaron: ${incidentDescriptions}. El tiempo promedio de resolución fue de ${avgResolutionMin} minutos, lo cual se encuentra dentro de los tiempos de respuesta comprometidos contractualmente. En todos los casos, se procedió a la activación inmediata de los protocolos de atención y escalamiento correspondientes.`;
  }

  // Paragraph 3 — DECLARATION AND COMMITMENT
  const p3 = slaMet
    ? `En virtud de lo anterior, se declara formalmente que [ISP_NAME] ha dado cumplimiento íntegro a las obligaciones establecidas en el contrato de prestación de servicios durante el mes de ${period}. Se reitera el compromiso institucional de mantener los más altos estándares de calidad, disponibilidad y transparencia en la prestación del servicio, así como de continuar fortaleciendo los mecanismos de monitoreo y respuesta ante incidentes para garantizar la continuidad operativa del ${clientName}.`
    : `En virtud de lo anterior, se reconoce que durante el mes de ${period} no se alcanzó el nivel de disponibilidad comprometido contractualmente. En cumplimiento con la cláusula de penalización, se procederá a aplicar el descuento correspondiente al 5% de la factura mensual. [ISP_NAME] reitera su compromiso de implementar las medidas correctivas necesarias para restablecer los niveles de servicio acordados y garantizar la continuidad operativa del ${clientName}.`;

  return `${p1}\n\n${p2}\n\n${p3}`;
}

export function ObservacionesEjecutivas({
  month, year, uptimePct, slaMet, incidentCount, avgResolutionMin, incidents,
}: ObservacionesEjecutivasProps) {
  const period = `${MONTHS_ES[month]} de ${year}`;

  const text = useMemo(() => generateObservaciones(
    GOB_CLIENT.nombre, period, uptimePct, slaMet, incidentCount, avgResolutionMin, incidents,
  ), [period, uptimePct, slaMet, incidentCount, avgResolutionMin, incidents]);

  return (
    <section>
      <h2 className="text-lg font-semibold text-gob-navy mb-3">Observaciones Ejecutivas</h2>
      <Card className="border-gob-navy/10 bg-gob-navy/[0.02]">
        <CardContent className="p-6">
          {text.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-sm text-gob-navy leading-relaxed mb-4 last:mb-0 text-justify">
              {paragraph}
            </p>
          ))}
        </CardContent>
      </Card>
      <p className="text-[10px] text-gob-navy/40 mt-2 italic">
        Este texto fue generado automáticamente a partir de los datos del período. En producción, se conectará a un modelo de IA para personalización avanzada.
      </p>
    </section>
  );
}
