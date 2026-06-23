# NOCBoard Energia - Diagnostico SNMP Completo
**Fecha:** 2026-06-23
**Version:** 3.9.6
**Total hosts:** 76

---

## 1. Resumen Ejecutivo

| Categoria | Cantidad | % |
|-----------|----------|---|
| Hosts totales | 76 | 100% |
| Online | 54 | 71% |
| Offline | 22 | 28% |
| SNMP v2c activo | 26 | 34% |
| SNMP con metricas reales | 18 | 23% |
| Solo ICMP (ping) | 49 | 64% |
| ModbusTCP | 1 | 1% |

## 2. Hosts SNMP v2c - Midiendo correctamente (18)

| # | Sitio | IP | Vendor | Metricas clave |
|---|-------|----|---------|----|
| 1 | MONTERREY_PDA_PLANTA-ELTEK | 172.30.111.246 | eltek | Bat:54.32V, CFE:239V, Load:16.6A |
| 2 | MONTERREY_ANTIGUA-ESTANZUELA_PLANTA-ELTEK | 172.30.246.250 | eltek | Bat:53.46V, CFE:251V, Load:0.5A |
| 3 | MONTERREY_MITRAS_PLANTA-ELTEK | 172.30.90.98 | eltek | Bat:53.47V, CFE:220V, Load:10.7A, SOC:50% |
| 4 | MONTERREY_MITRAS_INVERSOR-SAMLEX | 172.30.90.102 | samlex | Bat:53.2V |
| 5 | MONTERREY_SENDERO_PLANTA-ELTEK | 172.30.109.194 | eltek | Bat:53.52V, CFE:245V, Load:15.9A, SOC:100% |
| 6 | SALTILLO_MECASA-RAMOS_PLANTA-ELTEK | 172.18.13.190 | eltek | CFE:216V, Load:7.5A, SOC:100% |
| 7 | QUERÉTARO_JURIQUILLA_INVERSOR-SAMLEX | 172.25.138.250 | samlex | Bat:26.8V, CFE:125.5V |
| 8 | QUERÉTARO_BANDERA_INVERSOR-SAMLEX | 172.25.131.162 | samlex | Bat:26.9V, CFE:117.3V |
| 9 | QUERÉTARO_TEC100_INVERSOR-SAMLEX | 172.25.132.246 | samlex | Bat:26.9V, CFE:127.8V |
| 10 | MONTERREY_MONTEMORELOS_INVERSOR-SAMLEX | 172.30.13.226 | samlex | Bat:27V, CFE:123.1V |
| 11 | MONTERREY_DENIS_INVERSOR-SAMLEX | 172.30.176.238 | samlex | Bat:26.9V, CFE:121.5V |
| 12 | MONTERREY_NORTE_INVERSOR-SAMLEX | 172.30.91.254 | samlex | Bat:53.5V |
| 13 | MONTERREY_PURISIMA_INVERSOR-SAMLEX | 172.30.99.166 | samlex | Bat:26.9V, CFE:112.2V |
| 14 | MONTERREY_PDA_INVERSOR-SAMLEX | 172.30.111.54 | samlex | Bat:56.6V |
| 15 | QUERÉTARO_COLORADO_PLANTA-ELTEK | 172.25.134.246 | eltek | CFE:223V, Load:8.1A, SOC:50% |
| 16 | MONTERREY_INDEPENDENCIA_PLANTA-ELTEK | 172.26.18.20 | eltek | CFE:247V, Load:2.1A, SOC:100% |
| 17 | MONTERREY_INDEPENDENCIA_INVERSOR-SAMLEX | 172.26.18.21 | samlex | Bat:53.3V, CFE:125V |
| 18 | MONTERREY_HUINALA_INVERSOR-SAMLEX | 172.30.119.238 | samlex | Bat:53.2V, CFE:122V |

## 3. Hosts SNMP v2c - Sin metricas (8)

**Causa:** Todos estan **offline** - no es error de perfil/OID, es falta de conectividad.

| # | Sitio | IP | Vendor | Status |
|---|-------|----|---------|--------|
| 1 | CHIHUAHUA_PANAMERICANA_INVERSOR-SAMLEX | 10.33.8.250 | samlex | offline |
| 2 | MONTERREY_MIRASUR_INVERSOR-SAMLEX | 172.30.162.38 | samlex | offline |
| 3 | MONTERREY_SANTA-ROSA_INVERSOR-SAMLEX | 172.30.220.70 | samlex | offline |
| 4 | SAN-LUIS-POTOSÍ_EDIFICIO-EME_INVERSOR-SAMLEX | 10.40.1.238 | samlex | offline |
| 5 | MONTERREY_LOMA_INVERSOR-SAMLEX | 172.30.56.66 | samlex | offline |
| 6 | MÉXICO_TEPETLIXPA_INVERSOR-SAMLEX | 10.60.105.250 | samlex | offline |
| 7 | REYNOSA_MEYBI_INVERSOR-SAMLEX | 172.20.47.242 | samlex | offline |
| 8 | QUERÉTARO_CARRTERA-57_INVERSOR-SAMLEX | 10.40.11.242 | samlex | offline |

## 4. Hosts ICMP con vendor conocido - Candidatos a SNMP (10)

**Problema:** Tienen vendor identificado pero protocolo ICMP (solo ping).
**Solucion:** Cambiar protocolo a snmpV2c en la GUI de NOCBoard.

| # | Sitio | IP | Vendor | Status | Accion |
|---|-------|----|---------|---------|----|
| 1 | MONTERREY_PESQUERIA_PLANTA-ELTEK | 172.30.206.2 | eltek | online | Cambiar a snmpV2c |
| 2 | SAN-LUIS-POTOSÍ_EDIFICIO-EME_PLANTA-ELTEK | 10.40.1.234 | eltek | offline | Cambiar a snmpV2c (cuando vuelva online) |
| 3 | PIEDRAS-NEGRAS_PIEDRAS-NEGRAS_PLANTA-MEI | 10.20.9.242 | mei | online | Cambiar a snmpV2c |
| 4 | REYNOSA_LIBRAMIENTO_PLANTA-MEI | 172.20.12.246 | mei | offline | Cambiar a snmpV2c (cuando vuelva online) |
| 5 | TORREÓN_TORREÓN_PLANTA-MEI | 10.80.1.251 | mei | offline | Cambiar a snmpV2c (cuando vuelva online) |
| 6 | PIEDRAS-NEGRAS_ACUÑA_PLANTA-MEI | 10.20.28.250 | mei | online | Cambiar a snmpV2c |
| 7 | PIEDRAS-NEGRAS_APOLO_PLANTA-MEI | 10.20.25.250 | mei | online | Cambiar a snmpV2c |
| 8 | MONTERREY_HUINALA_PLANTA-ELTEK | 172.30.119.234 | eltek | online | Cambiar a snmpV2c |
| 9 | MONTERREY_JUAREZ-BLANCAS_PLANTA-ELTEK | 172.30.203.246 | eltek | online | Cambiar a snmpV2c |
| 10 | MONTERREY_SEMINARIO_PLANTA-ELTEK | 172.30.247.250 | eltek | online | Cambiar a snmpV2c |

## 5. Site Monitors ALGCom - ICMP (39)

**Problema:** Los ALG Site Monitor estan como vendor=unknown y en ICMP.
**Solucion:** Clasificar como vendor=algcom y cambiar a snmpV2c con perfil ALG Site Monitor.

| # | Sitio | IP | Status |
|---|-------|----|--------|
| 1 | MONTERREY_JUAREZ-BLANCAS_SITE-MONITOR | 172.30.203.250 | online |
| 2 | MONTERREY_NORTE_SITE-MONITOR | 172.30.91.150 | online |
| 3 | MONTERREY_DENIS_SITE-MONITOR | 172.30.176.234 | online |
| 4 | MONTERREY_MITRAS_SITE-MONITOR | 172.30.85.126 | online |
| 5 | MONTERREY_NIMIW_SITE-MONITOR | 172.30.17.182 | online |
| 6 | MONTERREY_PESQUERIA_SITE-MONITOR | 172.30.206.234 | online |
| 7 | MONTERREY_INDEPENDENCIA_SITE-MONITOR | 172.30.20.22 | offline |
| 8 | MONTERREY_HIDALGO_SITE-MONITOR | 172.30.22.250 | online |
| 9 | MONTERREY_JUAREZ_SITE-MONITOR | 172.30.87.246 | online |
| 10 | MONTERREY_CADEREYTA_SITE-MONITOR | 172.30.2.86 | offline |
| 11 | MONTERREY_SANTA-ROSA_SITE-MONITOR | 172.30.16.246 | online |
| 12 | MONTERREY_PURISIMA_SITE-MONITOR | 172.30.99.118 | online |
| 13 | MONTERREY_SENDERO_SITE-MONITOR | 172.30.116.110 | online |
| 14 | MONTERREY_LOMA_SITE-MONITOR | 172.30.14.250 | online |
| 15 | MONTERREY_MONTEMORELOS_SITE-MONITOR | 172.30.13.222 | online |
| 16 | MONTERREY_KRISTALES_SITE-MONITOR | 172.30.51.254 | online |
| 17 | MONTERREY_GUADALUPE_SITE-MONITOR | 172.30.33.202 | online |
| 18 | MONTERREY_HUALAHUISES_SITE-MONITOR | 172.30.160.70 | online |
| 19 | MONTERREY_STA-CATARINA_SITE-MONITOR | 172.30.47.238 | online |
| 20 | MONTERREY_EL-CARMEN_SITE-MONITOR | 172.30.36.254 | online |
| 21 | MONTERREY_PUEBLO-NUEVO_SITE-MONITOR | 172.30.96.250 | online |
| 22 | MONTERREY_ROJAS_SITE-MONITOR | 172.30.48.250 | online |
| 23 | MONTERREY_SEMINARIO_SITE-MONITOR | 172.30.247.246 | online |
| 24 | TAMPICO_ARBOLEDAS_SITE-MONITOR | 172.30.99.146 | offline |
| 25 | TAMPICO_TAMPICO_SITE-MONITOR | 10.70.0.250 | offline |
| 26 | SALTILLO_DERRAMADEREO_SITE-MONITOR | 172.19.83.250 | online |
| 27 | SALTILLO_LOFT_SITE-MONITOR | 172.18.78.234 | online |
| 28 | SALTILLO_ACHERBIS_SITE-MONITOR | 172.18.29.194 | online |
| 29 | MONTERREY_SANTIAGO-II_SITE-MONITOR | 172.30.12.246 | online |
| 30 | NAUCALPAN_NAUCALPAN_SITE-MONITOR | 10.61.0.254 | online |
| 31 | GUSTAVO-A.-MADERO_VALLEJO_SITE-MONITOR | 10.61.20.254 | online |
| 32 | CUAUTITLAN_CUAUTITLAN_SITE-MONITOR | 10.61.50.254 | offline |
| 33 | IZTAPALAPA_CENTRAL-DE-ABASTOS_SITE-MONITOR | 10.61.40.254 | online |
| 34 | METEPEC_TOTOLTEPEC_SITE-MONITOR | 10.60.10.242 | online |
| 35 | TOLUCA_TOLULCA-2000_SITE-MONITOR | 10.61.30.254 | offline |
| 36 | MELCHOR-OCAMPO_XOCHIMIQUIA_SITE-MONITOR | 10.60.53.241 | offline |
| 37 | ECATEPEC-DE-MORELOS_XALOSTOC_SITE-MONITOR | 10.60.80.245 | offline |
| 38 | TLALNEPANTLA_TLANEPANTLA_SITE-MONITOR | 10.60.23.253 | offline |
| 39 | COYOTEPEC_COYOTEPEC_SITE-MONITOR | 172.28.1.250 | offline |

## 6. Otros hosts sin clasificar (0)

| # | Sitio | IP | Status |
|---|-------|----|--------|

## 7. Diagnostico - Por que no miden OIDs?

### Causa 1: Protocolo incorrecto (49 hosts)
Los 49 hosts en ICMP solo hacen ping - **nunca van a leer OIDs**.
NOCBoard necesita protocolo snmpV2c para hacer SNMP polling.

**Afectados:**
- 10 hosts con vendor conocido (Eltek: 5, MEI: 5)
- 39 Site Monitors ALGCom
- 0 sin clasificar

### Causa 2: Host offline (8 hosts SNMP)
Los 8 hosts SNMP sin metricas estan offline - la red no llega.

**Posibles razones:**
- Falla de energia en sitio
- VPN caida en la ciudad
- Equipo apagado o desconectado
- Cambio de IP

### Causa 3: Vendor no clasificado (39 hosts)
39 hosts tienen vendor=unknown. Sin vendor, NOCBoard no sabe que perfil SNMP aplicar.

## 8. Plan de Accion

### Inmediato (desde GUI NOCBoard)
1. **10 hosts con vendor conocido** -> Cambiar protocolo ICMP a snmpV2c
   - 5 Eltek: community=snmpxcien (o read para Mitras/PDA)
   - 5 MEI: community=snmpxcien
2. **Site Monitors ALG** -> Clasificar vendor + cambiar a snmpV2c (los online primero)

### Corto plazo
3. **39 hosts unknown** -> Identificar marca/modelo real de cada dispositivo
4. **8 offline** -> Verificar conectividad con equipo de campo

### Metricas objetivo
- Actual: 18/76 midiendo OIDs (24%)
- Con accion 1: ~28/76 (37%)
- Con accion 1+2: ~50/76 (66%)
- Con todas las acciones: 76/76 (100%)

---
*Generado por NOCBoard Energia Diagnostico v3.9.6*