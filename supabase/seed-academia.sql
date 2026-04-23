-- ══════════════════════════════════════════════════════════════
--  SEED: Academia XCIEN — Módulos, Exámenes y Preguntas
--  Pegar completo en Supabase → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- ─── MÓDULOS ─────────────────────────────────────────────────
INSERT INTO academy_modules (id, titulo, descripcion, tipo, nivel_requerido, orden, xp_otorga) VALUES

  ('10000000-0000-0000-0000-000000000001',
   'Fundamentos de Redes XCIEN',
   'Introducción a la arquitectura de red, topologías y protocolos base utilizados en la infraestructura de XCIEN. Ideal para técnicos nuevos.',
   'video', 1, 1, 50),

  ('10000000-0000-0000-0000-000000000002',
   'Instalación de Fibra Óptica Residencial',
   'Proceso completo de instalación de ONT, empalme de fibra, medición con OTDR y pruebas de servicio en instalaciones residenciales.',
   'documento', 1, 2, 75),

  ('10000000-0000-0000-0000-000000000003',
   'Seguridad y Protocolos de Campo',
   'Normas de seguridad, uso de EPP, protocolo de acceso a sitio, etiquetado de equipos y procedimientos de emergencia en campo.',
   'video', 1, 3, 50),

  ('10000000-0000-0000-0000-000000000004',
   'Configuración de Equipos ONT/CPE',
   'Configuración de parámetros de red en ONT de fibra, routers WiFi y CPE. Pruebas de velocidad y verificación de calidad de señal.',
   'practica', 2, 1, 100),

  ('10000000-0000-0000-0000-000000000005',
   'Diagnóstico y Solución de Fallas',
   'Metodología de diagnóstico por síntomas, uso de herramientas técnicas (ping, traceroute, OTDR) y escalamiento correcto de tickets.',
   'documento', 2, 2, 100),

  ('10000000-0000-0000-0000-000000000006',
   'Redes RF y Microondas',
   'Principios de radiofrecuencia, alineación de antenas, medición de potencia de señal (dBm), cálculos de enlace y normativa de operación.',
   'documento', 3, 1, 150),

  ('10000000-0000-0000-0000-000000000007',
   'Instalaciones Empresariales',
   'Proceso de instalación empresarial: levantamiento previo, cableado estructurado, configuración de VLANs y entrega formal de servicio.',
   'practica', 3, 2, 150),

  ('10000000-0000-0000-0000-000000000008',
   'Firewall y Seguridad Perimetral',
   'Configuración de firewalls, políticas de acceso, NAT, VPN site-to-site y mejores prácticas de seguridad para instalaciones de alto nivel.',
   'practica', 4, 1, 200)

ON CONFLICT (id) DO NOTHING;


-- ─── EXÁMENES ────────────────────────────────────────────────
INSERT INTO exams (id, titulo, module_id, calificacion_minima, xp_primer_intento, xp_reintento, max_intentos) VALUES

  ('20000000-0000-0000-0000-000000000001',
   'Examen: Fundamentos de Redes',
   '10000000-0000-0000-0000-000000000001', 70, 100, 50, 3),

  ('20000000-0000-0000-0000-000000000002',
   'Examen: Fibra Óptica Residencial',
   '10000000-0000-0000-0000-000000000002', 70, 150, 75, 3),

  ('20000000-0000-0000-0000-000000000003',
   'Examen: Seguridad en Campo',
   '10000000-0000-0000-0000-000000000003', 70, 100, 50, 3),

  ('20000000-0000-0000-0000-000000000004',
   'Examen: Configuración ONT/CPE',
   '10000000-0000-0000-0000-000000000004', 70, 200, 100, 3),

  ('20000000-0000-0000-0000-000000000005',
   'Examen: Diagnóstico de Fallas',
   '10000000-0000-0000-0000-000000000005', 70, 200, 100, 3),

  ('20000000-0000-0000-0000-000000000006',
   'Examen: Redes RF y Microondas',
   '10000000-0000-0000-0000-000000000006', 75, 300, 150, 3),

  ('20000000-0000-0000-0000-000000000007',
   'Examen: Instalaciones Empresariales',
   '10000000-0000-0000-0000-000000000007', 75, 300, 150, 3),

  ('20000000-0000-0000-0000-000000000008',
   'Examen: Firewall y Seguridad',
   '10000000-0000-0000-0000-000000000008', 80, 400, 200, 2)

ON CONFLICT (id) DO NOTHING;


-- ─── PREGUNTAS ────────────────────────────────────────────────

-- Examen 1: Fundamentos de Redes
INSERT INTO exam_questions (exam_id, pregunta, opciones, respuesta_correcta, explicacion) VALUES

  ('20000000-0000-0000-0000-000000000001',
   '¿Cuál es la función principal de un switch en una red Ethernet?',
   '["Conectar redes diferentes entre sí usando IP","Enviar paquetes según dirección IP","Conectar dispositivos en la misma LAN usando direcciones MAC","Amplificar la señal WiFi"]',
   2,
   'El switch trabaja en la capa 2 del modelo OSI y reenvía tramas Ethernet basándose en direcciones MAC, conectando dispositivos dentro de la misma LAN.'),

  ('20000000-0000-0000-0000-000000000001',
   '¿Qué protocolo se usa para asignar direcciones IP automáticamente a los dispositivos?',
   '["DNS","DHCP","HTTP","SMTP"]',
   1,
   'DHCP (Dynamic Host Configuration Protocol) asigna automáticamente dirección IP, máscara, gateway y servidores DNS a cada dispositivo que se conecta a la red.'),

  ('20000000-0000-0000-0000-000000000001',
   'En el modelo OSI, ¿en qué capa opera el router?',
   '["Capa 1 — Física","Capa 2 — Enlace de datos","Capa 3 — Red","Capa 4 — Transporte"]',
   2,
   'El router opera en la Capa 3 (Red) del modelo OSI, tomando decisiones de reenvío basadas en direcciones IP para interconectar redes distintas.'),

  ('20000000-0000-0000-0000-000000000001',
   '¿Cuál es la velocidad máxima teórica de una interfaz Gigabit Ethernet?',
   '["100 Mbps","10 Mbps","1 Gbps","10 Gbps"]',
   2,
   'Gigabit Ethernet (GbE / 1000BASE-T) opera a 1 Gbps = 1000 Mbps, siendo el estándar más común en instalaciones actuales de XCIEN.'),

  ('20000000-0000-0000-0000-000000000001',
   '¿Qué significa el acrónimo VLAN?',
   '["Virtual Local Area Network","Variable LAN Adaptor","Verified Local Access Node","Virtual Line Area Number"]',
   0,
   'VLAN (Virtual Local Area Network) permite segmentar lógicamente una red física en múltiples redes virtuales independientes, mejorando seguridad y rendimiento.'),

-- Examen 2: Fibra Óptica Residencial
  ('20000000-0000-0000-0000-000000000002',
   '¿Qué herramienta se usa para medir atenuación y localizar fallas en una fibra óptica?',
   '["Voltímetro","OTDR","Pinza amperimétrica","Multímetro digital"]',
   1,
   'El OTDR (Optical Time Domain Reflectometer) envía pulsos de luz y mide los reflejos para determinar atenuación, empalmes y fallas a lo largo de la fibra.'),

  ('20000000-0000-0000-0000-000000000002',
   '¿Cuál es el tipo de conector más común en instalaciones FTTH de XCIEN?',
   '["RJ45","F-type","SC/APC","BNC"]',
   2,
   'El conector SC/APC (Subscriber Connector / Angled Physical Contact) es el estándar FTTH por su baja pérdida de retorno, gracias al corte angular que reduce reflexiones.'),

  ('20000000-0000-0000-0000-000000000002',
   '¿Qué indica un nivel óptico de recepción de -30 dBm o menor en un ONT?',
   '["Señal excelente","Nivel normal de operación","Atenuación excesiva — posible falla o fibra cortada","El ONT no está configurado"]',
   2,
   'El rango operativo típico de un ONT es entre -8 y -27 dBm. Un nivel de -30 dBm indica atenuación excesiva que puede ser causada por ruptura, mal empalme o suciedad en el conector.'),

  ('20000000-0000-0000-0000-000000000002',
   '¿Qué es un empalme por fusión en fibra óptica?',
   '["Conexión mediante conector mecánico desmontable","Unión permanente de dos fibras usando calor eléctrico","Tipo de conector SC/APC de alta potencia","Técnica de medición con láser pulsado"]',
   1,
   'El empalme por fusión usa calor eléctrico para fusionar los extremos de dos fibras ópticas, logrando pérdidas mínimas (< 0.1 dB) y una unión permanente.'),

  ('20000000-0000-0000-0000-000000000002',
   'Antes de activar el servicio al cliente, ¿qué verificación es obligatoria?',
   '["Reiniciar el ONT tres veces consecutivas","Llamar al NOC sin hacer pruebas propias","Medir el nivel óptico de recepción con medidor de potencia","Conectar directamente sin verificar"]',
   2,
   'Siempre medir el nivel óptico de recepción antes de activar. Confirma que la fibra llegó correctamente y que el nivel está dentro del rango aceptable del ONT (-8 a -27 dBm).'),

-- Examen 3: Seguridad en Campo
  ('20000000-0000-0000-0000-000000000003',
   '¿Qué debes hacer PRIMERO al llegar a un sitio de trabajo en altura?',
   '["Subir directamente al punto de trabajo","Revisar el EPP y evaluar el área de trabajo","Llamar al cliente para avisar tu llegada","Conectar los equipos antes de subir"]',
   1,
   'La seguridad es prioridad absoluta. Antes de cualquier trabajo en altura revisar arnés, casco, líneas de vida y evaluar el área: superficie, condiciones climáticas y riesgos eléctricos.'),

  ('20000000-0000-0000-0000-000000000003',
   '¿Cuál es el contenido mínimo que debe tener el cierre de un ticket de trabajo?',
   '["Solo el nombre del técnico y hora de salida","Solo la firma del cliente","Fotos antes/después, métricas de señal, materiales usados y firma del cliente","Número de serie del equipo instalado únicamente"]',
   2,
   'El protocolo XCIEN exige: evidencia fotográfica (antes y después), métricas de señal verificadas, materiales utilizados y firma del cliente como conformidad del servicio.'),

  ('20000000-0000-0000-0000-000000000003',
   '¿Qué protocolo se sigue si no puedes acceder al sitio por ausencia del cliente?',
   '["Abandonar sin reportar nada","Esperar indefinidamente en el sitio","Registrar intento fallido en ticket, notificar al coordinador y reagendar","Entrar al sitio de cualquier manera disponible"]',
   2,
   'Si no hay acceso: registrar el intento fallido con hora y foto de evidencia en el ticket, notificar al coordinador y contactar al cliente para reagendar. No se abandona sin reporte.'),

  ('20000000-0000-0000-0000-000000000003',
   '¿Qué debes hacer con los residuos de materiales al terminar un trabajo?',
   '["Dejarlos donde cayeron","Tirarlos en la basura más cercana sin clasificar","Recolectarlos, clasificarlos y llevarlos al punto de disposición correcto","Enterrarlos o esconderlos en la zona"]',
   2,
   'El protocolo ambiental XCIEN exige recolectar todos los residuos (fibra, embalajes, materiales peligrosos), clasificarlos y llevarlos al punto de disposición correspondiente.'),

  ('20000000-0000-0000-0000-000000000003',
   '¿Cuándo está permitido trabajar en altura sin arnés de seguridad?',
   '["Cuando la altura es menor a 2 metros","Cuando el trabajo dura menos de 10 minutos","Cuando el cliente no tiene escalera disponible","Nunca — el arnés es obligatorio en todo trabajo en altura"]',
   3,
   'El uso de arnés es OBLIGATORIO en cualquier trabajo en altura, sin excepciones. La normativa XCIEN y la legislación mexicana no contemplan excepción por tiempo o altura mínima.'),

-- Examen 4: Configuración ONT/CPE
  ('20000000-0000-0000-0000-000000000004',
   '¿Cuál es el rango de señal óptica ACEPTABLE para un ONT en funcionamiento?',
   '["0 a -5 dBm","−8 a −27 dBm","−30 a −40 dBm","Cualquier valor negativo"]',
   1,
   'El rango operativo típico de un ONT es entre -8 dBm (muy buena señal) y -27 dBm (señal mínima aceptable). Fuera de este rango el servicio será inestable.'),

  ('20000000-0000-0000-0000-000000000004',
   '¿Qué parámetro DEBES configurar en el router WiFi para separar la red del cliente de la red de gestión?',
   '["Cambiar el canal WiFi","Configurar VLANs distintas para datos y gestión","Reiniciar el equipo a fábrica","Aumentar la potencia de transmisión"]',
   1,
   'Configurar VLANs separadas para tráfico de datos del cliente y gestión del equipo es una práctica estándar de seguridad que previene accesos no autorizados a la gestión del equipo.'),

  ('20000000-0000-0000-0000-000000000004',
   'Un cliente reporta velocidad de bajada de 5 Mbps teniendo contratado 100 Mbps. ¿Cuál es el PRIMER paso de diagnóstico?',
   '["Cambiar inmediatamente el ONT","Culpar al NOC sin revisar nada","Hacer prueba de velocidad por cable directamente desde el ONT, descartando WiFi","Llamar al cliente para cancelar el ticket"]',
   2,
   'Siempre aislar variables. La primera prueba es directamente desde el ONT por cable Ethernet. Si la velocidad es correcta, el problema es del WiFi o la red interna del cliente, no del servicio.'),

  ('20000000-0000-0000-0000-000000000004',
   '¿Para qué sirve el protocolo PPPoE en una instalación de fibra?',
   '["Aumentar la velocidad de la fibra","Autenticar al usuario y establecer la sesión de datos con el ISP","Configurar la red WiFi automáticamente","Medir la potencia óptica del enlace"]',
   1,
   'PPPoE (Point-to-Point Protocol over Ethernet) permite al ONT autenticarse con el servidor del ISP usando usuario y contraseña, estableciendo la sesión de internet del cliente.'),

  ('20000000-0000-0000-0000-000000000004',
   '¿Cuál es el canal WiFi con menor interferencia en la banda de 2.4 GHz en entornos urbanos?',
   '["Canal 6 siempre es el mejor","Canal 1, 6 o 11 — los únicos no superpuestos","Canal 13 para máxima velocidad","Cualquier canal automático"]',
   1,
   'En la banda de 2.4 GHz, solo los canales 1, 6 y 11 son no superpuestos. En entornos urbanos con muchas redes WiFi, elegir el menos congestionado de estos tres reduce la interferencia.'),

-- Examen 5: Diagnóstico de Fallas
  ('20000000-0000-0000-0000-000000000005',
   'Un cliente sin internet tiene señal óptica correcta en el ONT (LED verde). ¿Cuál es la causa más probable?',
   '["Fibra cortada","Problema de autenticación PPPoE o configuración del CPE","Falla en el splitter de la red GPON","Antena WiFi dañada"]',
   1,
   'Si la señal óptica es correcta (LED verde en ONT) pero no hay internet, el problema es lógico: credenciales PPPoE incorrectas, VLAN mal configurada o falla en el perfil del OLT.'),

  ('20000000-0000-0000-0000-000000000005',
   '¿Qué comando usas en Windows para verificar la conectividad básica con el gateway?',
   '["ipconfig /release","ping [IP-del-gateway]","netstat -a","arp -d"]',
   1,
   'El comando ping [IP-gateway] envía paquetes ICMP y mide el tiempo de respuesta. Si el gateway no responde, hay un problema en la red local o en el equipo del cliente.'),

  ('20000000-0000-0000-0000-000000000005',
   'El LED de señal óptica del ONT está en ROJO. ¿Qué indica esto?',
   '["El ONT está actualizando firmware","La velocidad del servicio es baja","No hay señal óptica — posible fibra cortada, conector sucio o falla en el splitter","El WiFi está desactivado"]',
   2,
   'LED rojo en señal óptica = no hay luz llegando al ONT. Las causas típicas son: fibra cortada o doblada, conector sucio (limpiar con kit de limpieza), falla en el splitter o problema en la OLT del nodo.'),

  ('20000000-0000-0000-0000-000000000005',
   '¿En qué caso DEBES escalar el ticket al NOC en lugar de resolverlo en campo?',
   '["Cuando el cliente es grosero","Cuando el problema está en la red del ISP: OLT, nodo, backbone","Cuando llevas más de 20 minutos en el sitio","Cuando no tienes herramientas"]',
   1,
   'Los problemas de infraestructura del ISP (OLT caída, nodo sin servicio, backbone congestionado) no pueden resolverse en campo. Estos deben escalarse al NOC con evidencia: nivel óptico, resultado de ping y síntomas.'),

  ('20000000-0000-0000-0000-000000000005',
   '¿Qué información MÍNIMA debes incluir al abrir un ticket de escalamiento al NOC?',
   '["Solo el nombre del cliente","Solo la dirección del sitio","ID del ticket, síntomas exactos, métricas de señal, pruebas realizadas y conclusión del diagnóstico","Tu nombre y hora de llegada"]',
   2,
   'Un buen escalamiento ahorra tiempo. El NOC necesita: ID del ticket, síntomas exactos, nivel óptico medido, resultados de ping/traceroute, pruebas ya realizadas y tu diagnóstico preliminar.'),

-- Examen 6: Redes RF y Microondas
  ('20000000-0000-0000-0000-000000000006',
   '¿Qué significa dBm en el contexto de redes RF?',
   '["Decibeles por metro cuadrado","Decibeles referenciados a 1 miliWatt de potencia","Densidad de bits por megahercio","Datos binarios modulados"]',
   1,
   'dBm (decibel-milliwatt) es la unidad estándar para medir potencia de señal RF referenciada a 1 mW. Valores como -70 dBm (buena señal WiFi) o -22 dBm (buena señal óptica) usan esta unidad.'),

  ('20000000-0000-0000-0000-000000000006',
   'Para alinear correctamente una antena de microondas, ¿qué herramienta usas en campo?',
   '["Voltímetro digital","Analizador de espectro o medidor de señal del equipo en tiempo real","GPS de navegación","OTDR de fibra óptica"]',
   1,
   'La alineación de antenas microondas se realiza monitoreando el nivel de señal (RSSI) en tiempo real mediante el software del equipo o un analizador de espectro, ajustando eje horizontal y vertical hasta maximizar la señal.'),

  ('20000000-0000-0000-0000-000000000006',
   '¿Qué causa la "línea de visión" (LOS) en un enlace microondas?',
   '["Es un tipo de cable de fibra","Es el requisito de que no haya obstáculos físicos entre antenas","Es un protocolo de enrutamiento","Es el nivel mínimo de señal requerido"]',
   1,
   'Line of Sight (LOS) significa que debe existir una trayectoria visual libre de obstáculos entre las dos antenas. Sin LOS, la señal se atenúa drásticamente o es imposible establecer el enlace.'),

  ('20000000-0000-0000-0000-000000000006',
   '¿Cuál es el efecto del "multipath" en un enlace RF?',
   '["Aumenta la velocidad del enlace","Causa interferencia destructiva que degrada la señal","Permite usar múltiples antenas simultáneamente","Mejora el alcance del enlace"]',
   1,
   'El multipath ocurre cuando la señal llega al receptor por múltiples trayectorias (reflexiones). Las señales desfasadas se combinan destructivamente, causando desvanecimientos y errores que degradan el enlace.'),

  ('20000000-0000-0000-0000-000000000006',
   '¿A qué distancia mínima del suelo deben instalarse las antenas microondas para evitar obstrucción por vegetación y edificios?',
   '["No importa la altura, solo importa la potencia","La suficiente para garantizar zona de Fresnel libre de obstáculos","Exactamente 10 metros siempre","Lo más bajo posible para facilitar mantenimiento"]',
   1,
   'La altura correcta se calcula para garantizar que la zona de Fresnel (volumen elipsoidal alrededor de la línea de visión) esté libre de obstáculos al menos en un 60%. Depende de la distancia del enlace y la frecuencia.'),

-- Examen 7: Instalaciones Empresariales
  ('20000000-0000-0000-0000-000000000007',
   '¿Cuál es el primer paso antes de iniciar una instalación empresarial?',
   '["Instalar directamente sin preparación","Realizar levantamiento previo del sitio: planos, cantidad de puntos, infraestructura existente","Pedir el pago al cliente","Instalar el equipo en el cuarto más cercano"]',
   1,
   'El levantamiento previo es obligatorio. Incluye: planos del edificio, cantidad y ubicación de puntos de red, estado del cableado existente, ubicación del rack/MDF, y requerimientos específicos del cliente.'),

  ('20000000-0000-0000-0000-000000000007',
   '¿Cuál es la longitud máxima de un segmento de cable Cat6 en cableado estructurado según el estándar TIA-568?',
   '["50 metros","100 metros","200 metros","Sin límite si el cable es de buena calidad"]',
   1,
   'El estándar TIA-568 define 100 metros como longitud máxima para un segmento horizontal de cableado estructurado (90m canal permanente + 10m de cordones de parcheo).'),

  ('20000000-0000-0000-0000-000000000007',
   '¿Qué documento debes entregar al cliente al finalizar una instalación empresarial?',
   '["Solo la factura","Nada, el servicio habla por sí solo","Acta de entrega firmada, diagrama de red, contraseñas de equipos y evidencia fotográfica","Solo las contraseñas de los equipos"]',
   2,
   'La entrega formal empresarial incluye: acta de entrega firmada por ambas partes, diagrama lógico/físico de red, credenciales de gestión de equipos, garantías y evidencia fotográfica del trabajo realizado.'),

  ('20000000-0000-0000-0000-000000000007',
   '¿Para qué se usa una VLAN en una instalación empresarial?',
   '["Para aumentar la velocidad del internet","Para decorar el diagrama de red","Para segmentar el tráfico: separar datos, voz, gestión y clientes internos","Para conectar más equipos del mismo fabricante"]',
   2,
   'Las VLANs permiten segmentar lógicamente la red: red de datos, red de voz (VoIP), red de gestión de equipos, red de visitantes/clientes. Mejoran seguridad y rendimiento sin necesidad de hardware adicional.'),

  ('20000000-0000-0000-0000-000000000007',
   '¿Qué es un "patch panel" y para qué sirve?',
   '["Un tipo de router empresarial","Panel de distribución que centraliza los cables de red del edificio para facilitar la administración","Un switch de alta densidad","Un tipo de conector especial para fibra"]',
   1,
   'El patch panel es el punto de terminación de todos los cables de red del edificio, ubicado en el rack/MDF. Permite conectar y reconectar puertos de forma flexible mediante cordones de parcheo sin tocar el cableado fijo.'),

-- Examen 8: Firewall y Seguridad
  ('20000000-0000-0000-0000-000000000008',
   '¿Qué es NAT y cuál es su función principal en una red empresarial?',
   '["Network Audio Transmission — protocolo de voz","Network Address Translation — traduce IPs privadas a una IP pública","Network Access Token — método de autenticación","Network Analysis Tool — herramienta de diagnóstico"]',
   1,
   'NAT (Network Address Translation) permite que múltiples dispositivos con IPs privadas compartan una sola IP pública para acceder a internet. Además oculta la topología interna de la red.'),

  ('20000000-0000-0000-0000-000000000008',
   '¿Qué tipo de regla de firewall se usa para BLOQUEAR todo el tráfico y solo permitir lo explícitamente autorizado?',
   '["Allow-all con excepciones","Default deny — política de denegación por defecto","Trust-all interno","Regla permisiva bidireccional"]',
   1,
   'La política "default deny" o "deny all" es la mejor práctica de seguridad: todo el tráfico está bloqueado por defecto y solo se permite lo que explícitamente se necesita. Opuesto a "allow all" que es inseguro.'),

  ('20000000-0000-0000-0000-000000000008',
   '¿Cuál es el propósito de una VPN site-to-site entre dos sucursales?',
   '["Aumentar la velocidad de internet de cada sucursal","Crear un túnel cifrado sobre internet que conecta las redes privadas de ambas sucursales","Compartir contraseñas entre empleados de forma segura","Reemplazar el servicio de internet contratado"]',
   1,
   'Una VPN site-to-site crea un túnel cifrado (IPsec/IKE) sobre internet público, permitiendo que las redes LAN de dos ubicaciones se comuniquen como si estuvieran en la misma red privada, de forma segura.'),

  ('20000000-0000-0000-0000-000000000008',
   '¿Cuál de estas opciones representa una práctica de seguridad INCORRECTA al configurar un firewall empresarial?',
   '["Cambiar las contraseñas por defecto de los equipos","Usar contraseñas únicas y complejas","Dejar la contraseña de administrador como admin/admin para no olvidarla","Deshabilitar servicios y puertos no utilizados"]',
   2,
   'Dejar credenciales por defecto (admin/admin, admin/1234, etc.) es una de las vulnerabilidades más comunes y explotadas. Siempre cambiar las contraseñas a valores únicos, complejos y documentados de forma segura.'),

  ('20000000-0000-0000-0000-000000000008',
   '¿Qué es una zona DMZ en arquitectura de firewall?',
   '["Una zona prohibida dentro del edificio","Una red intermedia que expone servicios públicos sin comprometer la red interna","Un tipo de conexión VPN","La zona de cobertura WiFi máxima"]',
   1,
   'La DMZ (Demilitarized Zone) es una red intermedia aislada donde se colocan los servidores accesibles desde internet (web, correo, DNS). Si un servidor es comprometido, el atacante no accede directamente a la red interna.');
