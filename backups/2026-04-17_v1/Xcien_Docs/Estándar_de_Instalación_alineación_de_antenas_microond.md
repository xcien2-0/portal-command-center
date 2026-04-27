# ESTÁNDAR DE INSTALACIÓN: ALINEACIÓN DE ANTENAS MICROONDAS
**Código:** XI-EI-MWA-001
**Versión:** 1.0
**Fecha de Emisión:** 15 de Mayo de 2024

---

## 1. Objetivo del Documento

El presente estándar establece el procedimiento mandatorio y uniforme para la alineación precisa y eficiente de antenas microondas en la red de Xcien. Su implementación es crucial para garantizar la operación óptima de los enlaces de telecomunicaciones, minimizando la Tasa de Error de Bits (BER), optimizando el Nivel de Señal Recibida (RSL) y asegurando la máxima fiabilidad y disponibilidad del servicio. Este documento contribuye directamente a la meta estratégica de estandarización y profesionalización de los procesos operativos de Xcien.

## 2. Alcance

Este estándar es de aplicación obligatoria para todo el personal de Xcien, así como para contratistas y terceros involucrados en las fases de instalación, puesta en marcha, mantenimiento preventivo y correctivo, y resolución de problemas de enlaces microondas dentro de la infraestructura de Xcien. Cubre todas las tecnologías y bandas de frecuencia utilizadas para enlaces de radio punto a punto, desde la preparación inicial hasta la verificación final y documentación del enlace alineado.

## 3. Glosario

Para la correcta interpretación de este documento, se definen los siguientes términos técnicos:

*   **ACM:** _Adaptive Coding and Modulation_ (Codificación y Modulación Adaptativa).
*   **Azimut:** Orientación angular horizontal de la antena respecto al norte geográfico.
*   **BER:** _Bit Error Rate_ (Tasa de Error de Bits). Métrica de calidad del enlace que indica la proporción de bits erróneos.
*   **CLI:** _Command Line Interface_ (Interfaz de Línea de Comandos).
*   **dBm:** Decibelios-milivatio. Unidad de medida para la potencia de señal.
*   **Elevación:** Ángulo vertical de inclinación de la antena.
*   **EPP:** Equipo de Protección Personal.
*   **EVM:** _Error Vector Magnitude_ (Magnitud de Vector de Error). Métrica de calidad que mide la desviación de la señal recibida respecto a la ideal.
*   **IDU:** _Indoor Unit_ (Unidad Interior). Parte del radioenlace que se instala dentro del shelter.
*   **Link Budget:** Presupuesto de Enlace. Cálculo que predice el RSL esperado en un enlace de radio.
*   **NMS:** _Network Management System_ (Sistema de Gestión de Red). Plataforma centralizada para la supervisión y gestión de la red.
*   **ODU:** _Outdoor Unit_ (Unidad Exterior). Parte del radioenlace que se instala en la torre junto a la antena.
*   **Polarización:** Orientación del campo eléctrico de la onda electromagnética (Horizontal o Vertical).
*   **RSL:** _Received Signal Level_ (Nivel de Señal Recibida). Medición de la potencia de la señal de radio recibida por la antena.
*   **RSSI:** _Received Signal Strength Indicator_ (Indicador de Intensidad de Señal Recibida).
*   **SNR:** _Signal-to-Noise Ratio_ (Relación Señal/Ruido). Métrica que compara la potencia de la señal deseada con la potencia del ruido de fondo.
*   **XPIC:** _Cross-Polarization Interference Cancellation_ (Cancelación de Interferencia por Polarización Cruzada). Técnica para duplicar la capacidad utilizando la misma frecuencia en polarizaciones ortogonales.

## 4. Desarrollo del Proceso / Procedimiento Paso a Paso

El proceso de alineación de antenas microondas debe ejecutarse rigurosamente, siguiendo las fases y pasos descritos a continuación.

### 4.1. Fase de Preparación Previa a la Alineación

1.  **Revisión Documental Obligatoria:**
    *   Consultar y comprender el _Link Budget_ del enlace, incluyendo RSL objetivo, frecuencias, potencia de transmisión y anchos de banda.
    *   Verificar los planos de ingeniería de la torre para confirmar alturas de instalación y orientación inicial (Azimut y Elevación).
    *   Disponer de la hoja de configuración del radio para ambos sitios (sitio A y sitio B).
    *   Confirmar la ruta de acceso al sitio y cualquier restricción de entrada.
2.  **Verificación de Equipos y Herramientas:**
    *   Asegurar la disponibilidad y funcionalidad de: brújula de precisión, clinómetro (inclinómetro digital), binoculares, multímetro con función de lectura de RSSI (si aplica), _laptop_ con software de gestión del radio, herramientas de mano (llaves, torquímetros), EPP completo y en buen estado.
    *   Confirmar que las ODUs, IDUs, antenas, _feedhorns_ (si aplica), guías de onda/cables coaxiales, conectores y _jumpers_ están completos y en perfecto estado.
3.  **Coordinación de Equipos:**
    *   Establecer comunicación bidireccional fiable entre los equipos de trabajo del sitio A y el sitio B. Esto incluye canales de radio o telefonía móvil con cobertura garantizada.
    *   Designar un líder de alineación para cada sitio y uno general para el enlace.

### 4.2. Fase de Montaje Físico y Conexión Inicial

1.  **Instalación Mecánica de la Antena:**
    *   Montar la antena en la estructura de soporte según los planos de ingeniería, asegurando la altura y posición inicial.
    *   Asegurar que los soportes permitan los ajustes finos de Azimut y Elevación.
2.  **Instalación de ODU y Conexiones:**
    *   Instalar la ODU en la parte posterior de la antena o en su ubicación designada.
    *   Conectar el _feedhorn_ a la ODU (si aplica) y a la antena, o directamente la ODU a la antena.
    *   Conectar los cables IF/Ethernet entre la ODU y la IDU, asegurando la impermeabilización de todas las uniones con cinta vulcanizante y auto-fusionable.
    *   Asegurar que los radios estén configurados con los parámetros de enlace correctos (frecuencia, potencia, ancho de banda, polarización).

### 4.3. Fase de Alineación Preliminar (Rough Alignment)

1.  **Orientación Inicial:**
    *   Utilizar la brújula de precisión para orientar la antena en el Azimut aproximado indicado en el _Link Budget_ o planos.
    *   Utilizar el clinómetro para establecer la Elevación aproximada.
    *   Estos ajustes deben ser realizados con la mayor precisión posible, pero sin apretar definitivamente los pernos.
2.  **Establecimiento de Comunicación Verbal:**
    *   Los líderes de alineación en ambos sitios deben confirmar que están listos para iniciar la fase de alineación fina.

### 4.4. Fase de Alineación Fina (Fine Alignment)

1.  **Monitoreo del RSL:**
    *   Conectar la _laptop_ con el software de gestión del radio o un medidor de RSSI al puerto de monitoreo de la ODU (si aplica) para visualizar el RSL en tiempo real.
    *   El sitio A iniciará los ajustes mientras el sitio B monitorea y viceversa.
2.  **Ajustes de Azimut:**
    *   En el sitio A, realizar movimientos incrementales y lentos en el Azimut de la antena. Mover en una dirección hasta que el RSL comience a caer, luego mover en la dirección opuesta hasta que el RSL comience a caer nuevamente. Identificar el punto de máximo RSL.
    *   Apretar ligeramente los pernos de Azimut y notificar al sitio B para que realice el mismo procedimiento.
    *   Confirmar el valor de RSL obtenido en el sitio B por la alineación del sitio A, y viceversa.
3.  **Ajustes de Elevación:**
    *   Con el Azimut ajustado aproximadamente, realizar el mismo procedimiento para la Elevación, moviendo la antena hacia arriba y hacia abajo para encontrar el punto de máximo RSL.
    *   Apretar ligeramente los pernos de Elevación y notificar al sitio B para que realice el mismo procedimiento.
4.  **Optimización Iterativa:**
    *   Repetir los ajustes finos de Azimut y Elevación alternadamente entre ambos sitios hasta que no se pueda obtener un RSL superior. El objetivo es alcanzar el RSL previsto en el _Link Budget_ con una tolerancia mínima.
    *   **Principio de "Peak":** Se debe alcanzar el punto de máxima señal, no solo una señal aceptable.
    *   Para enlaces _XPIC_ o de doble polarización, asegurar que ambas polarizaciones (Vertical y Horizontal) alcancen sus RSL objetivos.
5.  **Verificación de Estabilidad:**
    *   Monitorear el RSL durante al menos 5 minutos para asegurar su estabilidad y ausencia de fluctuaciones significativas.

### 4.5. Fase de Verificación, Fijación y Documentación

1.  **Verificación de Parámetros de Calidad:**
    *   Una vez que el RSL óptimo ha sido alcanzado y estabilizado, verificar los siguientes parámetros desde el NMS o CLI del radio en ambos sitios:
        *   **RSL Actual:** Debe estar dentro de ±2 dBm del RSL objetivo establecido en el _Link Budget_.
        *   **BER:** Debe ser 0 (cero). Cualquier valor superior a 0 es inaceptable.
        *   **SNR/EVM:** Deben estar dentro de los rangos aceptables especificados por el fabricante para la modulación configurada.
        *   **_Output Power_:** Confirmar que la potencia de salida está en el valor correcto.
    *   **Tabla de RSL Objetivo (Referencial):**
        | Banda de Frecuencia | RSL Objetivo (dBm) | RSL Mínimo Aceptable (dBm) |
        | :------------------ | :----------------: | :------------------------: |
        | 6 GHz               |   -45 ± 2 dBm      |          -55 dBm           |
        | 11 GHz              |   -48 ± 2 dBm      |          -58 dBm           |
        | 18 GHz              |   -52 ± 2 dBm      |          -62 dBm           |
        | 23 GHz              |   -55 ± 2 dBm      |          -65 dBm           |
        | _Otros_             | _Según Link Budget_ |    _Según Link Budget_     |
2.  **Fijación Definitiva de la Antena:**
    *   Apretar firmemente todos los pernos de Azimut y Elevación de la antena utilizando un torquímetro según las especificaciones del fabricante.
    *   Verificar que la antena no se haya movido durante el proceso de apriete.
    *   Confirmar nuevamente el RSL y BER después de la fijación. Si hay cambios significativos, se debe repetir la alineación fina.
3.  **Sellado y Protección:**
    *   Asegurar que todas las conexiones externas (cables, conectores, _jumpers_) estén correctamente selladas y protegidas contra la intemperie utilizando cinta vulcanizante y cinta auto-fusionable de forma profesional.
4.  **Reporte y Documentación:**
    *   Registrar de manera exhaustiva todos los valores finales de RSL, BER, SNR/EVM y _Output Power_ para cada polarización en ambos sitios.
    *   Tomar fotografías claras de la antena alineada, conexiones selladas y las lecturas en pantalla (si aplica).
    *   Generar un informe de alineación completo y adjuntar al expediente del enlace.
    *   Actualizar la base de datos de gestión de activos de red con la información del enlace.

## 5. Reglas de Seguridad o Tolerancia Cero

El cumplimiento estricto de las siguientes normas de seguridad es un requisito no negociable para todo el personal involucrado en la alineación de antenas microondas. Cualquier incumplimiento será considerado una falta grave.

1.  **Trabajo en Alturas:**
    *   **Obligatorio:** Uso de EPP certificado y en perfecto estado (arnés de seguridad de cuerpo completo, doble línea de vida con absorbedor de impacto, casco con barbiquejo, guantes antideslizantes, botas de seguridad con puntera y suela anti-perforación).
    *   **Certificación:** Todo el personal debe poseer certificación vigente para trabajos en altura y rescate.
    *   **Never Work Alone:** Prohibido realizar trabajos en altura de manera individual. Siempre debe haber un equipo de apoyo en tierra.
    *   **Inspección:** Realizar inspección pre-uso de EPP y equipos de ascenso/descenso.
2.  **Exposición a Campos Electromagnéticos (RF):**
    *   **Zonas de Seguridad:** Identificar y respetar las zonas de seguridad alrededor de antenas transmisoras de alta potencia.
    *   **Medición:** Si hay dudas sobre los niveles de RF, utilizar un medidor de campo de radiofrecuencia.
    *   **Prohibición:** Bajo ninguna circunstancia se debe mirar directamente la boca de una antena microondas que esté transmitiendo. Minimizar el tiempo de exposición innecesaria en el frente de la antena.
    *   **Apagado:** Considerar apagar los transmisores cercanos si no son parte del enlace a alinear, previa coordinación con NOC.
3.  **Energía Eléctrica:**
    *   **Aislamiento y Bloqueo (LOTO):** Antes de manipular cualquier conexión eléctrica o equipos energizados, se debe aplicar el procedimiento de bloqueo y etiquetado (LOTO) para asegurar la ausencia de tensión.
    *   **Herramientas Aisladas:** Utilizar herramientas con aislamiento eléctrico certificado.
    *   **Personal Calificado:** Solo personal eléctrico certificado está autorizado para manipular instalaciones eléctricas.
4.  **Condiciones Climáticas Adversas:**
    *   **Prohibición:** Está terminantemente prohibido realizar trabajos en altura bajo condiciones climáticas adversas como lluvia, tormentas eléctricas, vientos fuertes (superiores a 30 km/h), niebla densa o heladas.
    *   **Evacuación:** En caso de cambio repentino de las condiciones climáticas, se debe evacuar de forma segura y controlada.
5.  **Herramientas y Equipos:**
    *   **Uso Correcto:** Utilizar las herramientas y equipos de acuerdo a su diseño y propósito.
    *   **Mantenimiento:** Asegurar que todas las herramientas estén en buen estado de funcionamiento y calibradas. Prohibido el uso de herramientas dañadas o improvisadas.
    *   **Anclaje:** Asegurar todas las herramientas y objetos pequeños con cuerdas o _lanyards_ para evitar caídas desde altura.
6.  **Orden y Limpieza:**
    *   Mantener el área de trabajo (tanto en tierra como en altura) limpia y ordenada para prevenir tropiezos, caídas y otros accidentes.
    *   Desechar correctamente todos los residuos y embalajes.
7.  **Comunicación Efectiva:**
    *   Mantener comunicación constante y clara entre todo el equipo de trabajo, tanto en el sitio como entre sitios, utilizando los canales establecidos.
8.  **Procedimientos de Emergencia:**
    *   Todo el personal debe conocer y ser capaz de aplicar los procedimientos de emergencia, incluyendo primeros auxilios y rescate en alturas.
    *   Identificar la ubicación del botiquín de primeros auxilios y de equipos de rescate.
9.  **Uso de Dispositivos Móviles Personales:**
    *   **Prohibición:** El uso de teléfonos móviles personales para fines no laborales está estrictamente prohibido durante la ejecución de tareas críticas en altura, manipulación de equipos energizados o durante la fase de alineación. El teléfono de trabajo debe usarse únicamente para coordinación operativa.

---