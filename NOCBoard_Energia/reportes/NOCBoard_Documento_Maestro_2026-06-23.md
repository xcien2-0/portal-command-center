================================================================================
  DOCUMENTO MAESTRO — NOCBoard Energia v3.9.6
  Diagnostico SNMP, Configuracion Telegram y Plan de Accion
  XCIEN Networks — Infraestructura de Energia
================================================================================
  Fecha: 2026-06-23 13:30
  Elaboro: Jose Miguel Macias Contreras (Field Service Engineer)
  Herramienta: NOCBoard Energia v3.9.6
  Clasificacion: Interno XCIEN
================================================================================


  INDICE
  ------------------------------------------------------------
  1. Resumen Ejecutivo
  2. Inventario General de Hosts (76)
  3. Diagnostico SNMP Completo
  4. Perfiles SNMP Configurados (7 perfiles)
  5. Configuracion SNMP Global
  6. Umbrales de Alarma
  7. Configuracion Telegram
  8. Laboratorio de Pruebas — Sitio Independencia
  9. Analisis de Causa Raiz
  10. Hosts SNMP — Detalle Individual (26)
  11. Hosts ICMP con Vendor Conocido (10)
  12. Site Monitors ALGCom (22)
  13. Hosts Sin Clasificar (17)
  14. Sitios con Corte CFE (en tiempo real)
  15. Plan de Accion por Fases
  16. Metricas Objetivo
  17. Anexos


================================================================================
  1. RESUMEN EJECUTIVO
================================================================================

  NOCBoard Energia v3.9.6 monitorea 76 dispositivos de energia
  distribuidos en 20 ciudades y 62 sitios.

  ESTADO ACTUAL:
  +==================================================+
  | Hosts totales          |     76 | 100%    |
  | Online                 |     55 |  72%    |
  | Offline                |     21 |  27%    |
  +--------------------------------------------------+
  | SNMP v2c configurado   |     26 |  34%    |
  | SNMP midiendo OIDs     |     18 |  23%    |
  | SNMP sin metricas      |      8 | offline |
  | Solo ICMP (ping)       |     49 |  64%    |
  | ModbusTCP              |      1 |   1%    |
  +==================================================+

  COBERTURA SNMP EFECTIVA: 18/76 = 23%
  META: 76/76 = 100%

  DISTRIBUCION POR VENDOR:
       unknown:  39  ##############################################################################
        samlex:  19  ######################################
         eltek:  12  ########################
           mei:   5  ##########
       victron:   1  ##

  DISTRIBUCION POR CIUDAD (20):
                  Monterrey:  45  #############################################
                  Querétaro:   5  #####
                   Saltillo:   4  ####
             Piedras Negras:   3  ###
            San Luis Potosí:   2  ##
                    Reynosa:   2  ##
                    Tampico:   2  ##
                  Chihuahua:   1  #
                     México:   1  #
                    Torreón:   1  #
                  Naucalpan:   1  #
          Gustavo A. Madero:   1  #
                 Cuautitlan:   1  #
                 Iztapalapa:   1  #
                    Metepec:   1  #
                     Toluca:   1  #
             Melchor Ocampo:   1  #
        Ecatepec de Morelos:   1  #
               Tlalnepantla:   1  #
                  Coyotepec:   1  #

================================================================================
  2. INVENTARIO GENERAL DE HOSTS (76)
================================================================================

    # | Nombre                                             | IP               | Vendor     | Proto    | Status 
  ----+----------------------------------------------------+------------------+------------+----------+--------
    1 | CHIHUAHUA_PANAMERICANA_INVERSOR-SAMLEX             | 10.33.8.250      | samlex     | snmpV2c  | offline
    2 | COYOTEPEC_COYOTEPEC_SITE-MONITOR                   | 172.28.1.250     | unknown    | icmp     | offline
    3 | CUAUTITLAN_CUAUTITLAN_SITE-MONITOR                 | 10.61.50.254     | unknown    | icmp     | offline
    4 | ECATEPEC-DE-MORELOS_XALOSTOC_SITE-MONITOR          | 10.60.80.245     | unknown    | icmp     | offline
    5 | GUSTAVO-A.-MADERO_VALLEJO_SITE-MONITOR             | 10.61.20.254     | unknown    | icmp     | online 
    6 | IZTAPALAPA_CENTRAL-DE-ABASTOS_SITE-MONITOR         | 10.61.40.254     | unknown    | icmp     | online 
    7 | MELCHOR-OCAMPO_XOCHIMIQUIA_SITE-MONITOR            | 10.60.53.241     | unknown    | icmp     | offline
    8 | METEPEC_TOTOLTEPEC_SITE-MONITOR                    | 10.60.10.242     | unknown    | icmp     | online 
    9 | MONTERREY_ANTIGUA-ESTANZUELA_PLANTA-ELTEK          | 172.30.246.250   | eltek      | snmpV2c  | online 
   10 | MONTERREY_CADEREYTA_SITE-MONITOR                   | 172.30.2.86      | unknown    | icmp     | online 
   11 | MONTERREY_DENIS_INVERSOR-SAMLEX                    | 172.30.176.238   | samlex     | snmpV2c  | online 
   12 | MONTERREY_DENIS_SITE-MONITOR                       | 172.30.176.234   | unknown    | icmp     | online 
   13 | MONTERREY_EL-CARMEN_SITE-MONITOR                   | 172.30.36.254    | unknown    | icmp     | online 
   14 | MONTERREY_GUADALUPE_SITE-MONITOR                   | 172.30.33.202    | unknown    | icmp     | online 
   15 | MONTERREY_HIDALGO_SITE-MONITOR                     | 172.30.22.250    | unknown    | icmp     | online 
   16 | MONTERREY_HUALAHUISES_SITE-MONITOR                 | 172.30.160.70    | unknown    | icmp     | online 
   17 | MONTERREY_HUINALA_INVERSOR-SAMLEX                  | 172.30.119.238   | samlex     | snmpV2c  | online 
   18 | MONTERREY_HUINALA_PLANTA-ELTEK                     | 172.30.119.234   | eltek      | icmp     | online 
   19 | MONTERREY_INDEPENDENCIA_INVERSOR-SAMLEX            | 172.26.18.21     | samlex     | snmpV2c  | online 
   20 | MONTERREY_INDEPENDENCIA_PLANTA-ELTEK               | 172.26.18.20     | eltek      | snmpV2c  | online 
   21 | MONTERREY_INDEPENDENCIA_SITE-MONITOR               | 172.30.20.22     | ?          | icmp     | offline
   22 | MONTERREY_INDEPENDENCIA_VICTRO                     | 172.26.18.106    | victron    | modbusTCP | offline
   23 | MONTERREY_JUAREZ-BLANCAS_PLANTA-ELTEK              | 172.30.203.246   | eltek      | icmp     | online 
   24 | MONTERREY_JUAREZ-BLANCAS_SITE-MONITOR              | 172.30.203.250   | unknown    | icmp     | online 
   25 | MONTERREY_JUAREZ_SITE-MONITOR                      | 172.30.87.246    | unknown    | icmp     | online 
   26 | MONTERREY_KRISTALES_SITE-MONITOR                   | 172.30.51.254    | unknown    | icmp     | online 
   27 | MONTERREY_LOMA_INVERSOR-SAMLEX                     | 172.30.56.66     | samlex     | snmpV2c  | offline
   28 | MONTERREY_LOMA_SITE-MONITOR                        | 172.30.14.250    | unknown    | icmp     | online 
   29 | MONTERREY_MIRASUR_INVERSOR-SAMLEX                  | 172.30.162.38    | samlex     | snmpV2c  | offline
   30 | MONTERREY_MITRAS_INVERSOR-SAMLEX                   | 172.30.90.102    | samlex     | snmpV2c  | online 
   31 | MONTERREY_MITRAS_PLANTA-ELTEK                      | 172.30.90.98     | eltek      | snmpV2c  | online 
   32 | MONTERREY_MITRAS_SITE-MONITOR                      | 172.30.85.126    | unknown    | icmp     | online 
   33 | MONTERREY_MONTEMORELOS_INVERSOR-SAMLEX             | 172.30.13.226    | samlex     | snmpV2c  | online 
   34 | MONTERREY_MONTEMORELOS_SITE-MONITOR                | 172.30.13.222    | unknown    | icmp     | online 
   35 | MONTERREY_NIMIW_SITE-MONITOR                       | 172.30.17.182    | unknown    | icmp     | online 
   36 | MONTERREY_NORTE_INVERSOR-SAMLEX                    | 172.30.91.254    | samlex     | snmpV2c  | online 
   37 | MONTERREY_NORTE_SITE-MONITOR                       | 172.30.91.150    | unknown    | icmp     | online 
   38 | MONTERREY_PDA_INVERSOR-SAMLEX                      | 172.30.111.54    | samlex     | snmpV2c  | online 
   39 | MONTERREY_PDA_PLANTA-ELTEK                         | 172.30.111.246   | eltek      | snmpV2c  | online 
   40 | MONTERREY_PESQUERIA_PLANTA-ELTEK                   | 172.30.206.2     | eltek      | icmp     | online 
   41 | MONTERREY_PESQUERIA_SITE-MONITOR                   | 172.30.206.234   | unknown    | icmp     | online 
   42 | MONTERREY_PUEBLO-NUEVO_SITE-MONITOR                | 172.30.96.250    | unknown    | icmp     | online 
   43 | MONTERREY_PURISIMA_INVERSOR-SAMLEX                 | 172.30.99.166    | samlex     | snmpV2c  | online 
   44 | MONTERREY_PURISIMA_SITE-MONITOR                    | 172.30.99.118    | unknown    | icmp     | online 
   45 | MONTERREY_ROJAS_SITE-MONITOR                       | 172.30.48.250    | unknown    | icmp     | online 
   46 | MONTERREY_SANTA-ROSA_INVERSOR-SAMLEX               | 172.30.220.70    | samlex     | snmpV2c  | offline
   47 | MONTERREY_SANTA-ROSA_SITE-MONITOR                  | 172.30.16.246    | unknown    | icmp     | online 
   48 | MONTERREY_SANTIAGO-II_SITE-MONITOR                 | 172.30.12.246    | unknown    | icmp     | online 
   49 | MONTERREY_SEMINARIO_PLANTA-ELTEK                   | 172.30.247.250   | eltek      | icmp     | online 
   50 | MONTERREY_SEMINARIO_SITE-MONITOR                   | 172.30.247.246   | unknown    | icmp     | online 
   51 | MONTERREY_SENDERO_PLANTA-ELTEK                     | 172.30.109.194   | eltek      | snmpV2c  | online 
   52 | MONTERREY_SENDERO_SITE-MONITOR                     | 172.30.116.110   | unknown    | icmp     | online 
   53 | MONTERREY_STA-CATARINA_SITE-MONITOR                | 172.30.47.238    | unknown    | icmp     | online 
   54 | MÉXICO_TEPETLIXPA_INVERSOR-SAMLEX                  | 10.60.105.250    | samlex     | snmpV2c  | offline
   55 | NAUCALPAN_NAUCALPAN_SITE-MONITOR                   | 10.61.0.254      | unknown    | icmp     | online 
   56 | PIEDRAS-NEGRAS_ACUÑA_PLANTA-MEI                    | 10.20.28.250     | mei        | icmp     | online 
   57 | PIEDRAS-NEGRAS_APOLO_PLANTA-MEI                    | 10.20.25.250     | mei        | icmp     | online 
   58 | PIEDRAS-NEGRAS_PIEDRAS-NEGRAS_PLANTA-MEI           | 10.20.9.242      | mei        | icmp     | online 
   59 | QUERÉTARO_BANDERA_INVERSOR-SAMLEX                  | 172.25.131.162   | samlex     | snmpV2c  | online 
   60 | QUERÉTARO_CARRTERA-57_INVERSOR-SAMLEX              | 10.40.11.242     | samlex     | snmpV2c  | offline
   61 | QUERÉTARO_COLORADO_PLANTA-ELTEK                    | 172.25.134.246   | eltek      | snmpV2c  | online 
   62 | QUERÉTARO_JURIQUILLA_INVERSOR-SAMLEX               | 172.25.138.250   | samlex     | snmpV2c  | online 
   63 | QUERÉTARO_TEC100_INVERSOR-SAMLEX                   | 172.25.132.246   | samlex     | snmpV2c  | online 
   64 | REYNOSA_LIBRAMIENTO_PLANTA-MEI                     | 172.20.12.246    | mei        | icmp     | offline
   65 | REYNOSA_MEYBI_INVERSOR-SAMLEX                      | 172.20.47.242    | samlex     | snmpV2c  | offline
   66 | SALTILLO_ACHERBIS_SITE-MONITOR                     | 172.18.29.194    | unknown    | icmp     | online 
   67 | SALTILLO_DERRAMADEREO_SITE-MONITOR                 | 172.19.83.250    | unknown    | icmp     | online 
   68 | SALTILLO_LOFT_SITE-MONITOR                         | 172.18.78.234    | unknown    | icmp     | online 
   69 | SALTILLO_MECASA-RAMOS_PLANTA-ELTEK                 | 172.18.13.190    | eltek      | snmpV2c  | online 
   70 | SAN-LUIS-POTOSÍ_EDIFICIO-EME_INVERSOR-SAMLEX       | 10.40.1.238      | samlex     | snmpV2c  | offline
   71 | SAN-LUIS-POTOSÍ_EDIFICIO-EME_PLANTA-ELTEK          | 10.40.1.234      | eltek      | icmp     | offline
   72 | TAMPICO_ARBOLEDAS_SITE-MONITOR                     | 172.30.99.146    | unknown    | icmp     | offline
   73 | TAMPICO_TAMPICO_SITE-MONITOR                       | 10.70.0.250      | unknown    | icmp     | offline
   74 | TLALNEPANTLA_TLANEPANTLA_SITE-MONITOR              | 10.60.23.253     | unknown    | icmp     | offline
   75 | TOLUCA_TOLULCA-2000_SITE-MONITOR                   | 10.61.30.254     | unknown    | icmp     | offline
   76 | TORREÓN_TORREÓN_PLANTA-MEI                         | 10.80.1.251      | mei        | icmp     | offline

================================================================================
  3. DIAGNOSTICO SNMP COMPLETO
================================================================================

  3.1 Hosts SNMP v2c — Midiendo correctamente
  Total: 18 hosts

  [01] MONTERREY_PDA_PLANTA-ELTEK
       IP: 172.30.111.246  |  Vendor: eltek  |  Health: 95.3476
       Metricas: batteryCurrent=-63, batteryVoltage=54.32, loadCurrent=16.7, mainsVoltage=239, rectifierCount=3, rectifierOutputCurrent=10.4
       Ultimo poll: 2026-06-23T19:22:55Z

  [02] MONTERREY_ANTIGUA-ESTANZUELA_PLANTA-ELTEK
       IP: 172.30.246.250  |  Vendor: eltek  |  Health: 99.89246153846153
       Metricas: loadCurrent=0.6, mainsVoltage=247, rectifierCount=3, rectifierOutputCurrent=0.7, rectifierOutputVoltage=53.54
       Ultimo poll: 2026-06-23T19:22:55Z

  [03] MONTERREY_MITRAS_PLANTA-ELTEK
       IP: 172.30.90.98  |  Vendor: eltek  |  Health: 97.76638461538461
       Metricas: batteryCurrent=-7, batterySOC=50, batteryVoltage=53.55, loadCurrent=10.4, mainsVoltage=220, rectifierCount=3, rectifierOutputCurrent=10.2
       Ultimo poll: 2026-06-23T19:22:55Z

  [04] MONTERREY_MITRAS_INVERSOR-SAMLEX
       IP: 172.30.90.102  |  Vendor: samlex  |  Health: 100
       Metricas: acOutputVoltage=122.6, batteryVoltage=53, loadPower=422.9
       Ultimo poll: 2026-06-23T19:22:56Z

  [05] MONTERREY_SENDERO_PLANTA-ELTEK
       IP: 172.30.109.194  |  Vendor: eltek  |  Health: 97.88557692307693
       Metricas: batteryCurrent=-7, batterySOC=100, loadCurrent=17, mainsVoltage=242, rectifierCount=3, rectifierOutputCurrent=16.7, rectifierOutputVoltage=53.52
       Ultimo poll: 2026-06-23T19:22:55Z

  [06] SALTILLO_MECASA-RAMOS_PLANTA-ELTEK
       IP: 172.18.13.190  |  Vendor: eltek  |  Health: 100
       Metricas: batterySOC=100, batteryVoltage=54.56, loadCurrent=8.2, mainsVoltage=215, rectifierCount=3, rectifierOutputCurrent=8
       Ultimo poll: 2026-06-23T19:22:56Z

  [07] QUERÉTARO_JURIQUILLA_INVERSOR-SAMLEX
       IP: 172.25.138.250  |  Vendor: samlex  |  Health: 93.22138461538461
       Metricas: acOutputVoltage=120.8, batteryVoltage=26.8, mainsFrequency=59.9, mainsPresent=True, mainsVoltage=125.5
       Ultimo poll: 2026-06-23T19:22:55Z

  [08] QUERÉTARO_BANDERA_INVERSOR-SAMLEX
       IP: 172.25.131.162  |  Vendor: samlex  |  Health: 93.52803076923077
       Metricas: acOutputVoltage=120.9, batteryVoltage=26.9, mainsFrequency=59.9, mainsPresent=True, mainsVoltage=113.6
       Ultimo poll: 2026-06-23T19:22:56Z

  [09] QUERÉTARO_TEC100_INVERSOR-SAMLEX
       IP: 172.25.132.246  |  Vendor: samlex  |  Health: 93.58886153846154
       Metricas: acOutputVoltage=120.8, batteryVoltage=26.9, mainsFrequency=59.9, mainsPresent=True, mainsVoltage=128
       Ultimo poll: 2026-06-23T19:22:56Z

  [10] MONTERREY_MONTEMORELOS_INVERSOR-SAMLEX
       IP: 172.30.13.226  |  Vendor: samlex  |  Health: 95.18495384615385
       Metricas: acOutputVoltage=120.9, batteryVoltage=27.1, mainsFrequency=59.9, mainsPresent=True, mainsVoltage=123
       Ultimo poll: 2026-06-23T19:22:55Z

  [11] MONTERREY_DENIS_INVERSOR-SAMLEX
       IP: 172.30.176.238  |  Vendor: samlex  |  Health: 96.68073076923076
       Metricas: acOutputVoltage=121, batteryVoltage=26.9, mainsFrequency=59.9, mainsPresent=True, mainsVoltage=112.7
       Ultimo poll: 2026-06-23T19:22:55Z

  [12] MONTERREY_NORTE_INVERSOR-SAMLEX
       IP: 172.30.91.254  |  Vendor: samlex  |  Health: 96.87007692307692
       Metricas: acOutputVoltage=120.9, batteryVoltage=53.4, loadPower=295.8
       Ultimo poll: 2026-06-23T19:22:55Z

  [13] MONTERREY_PURISIMA_INVERSOR-SAMLEX
       IP: 172.30.99.166  |  Vendor: samlex  |  Health: 97.609
       Metricas: acOutputVoltage=121, batteryVoltage=26.9, mainsFrequency=59.9, mainsPresent=True, mainsVoltage=111.5
       Ultimo poll: 2026-06-23T19:22:55Z

  [14] MONTERREY_PDA_INVERSOR-SAMLEX
       IP: 172.30.111.54  |  Vendor: samlex  |  Health: 96.64657692307692
       Metricas: acOutputVoltage=122.2, batteryVoltage=56.9, loadPower=492.2
       Ultimo poll: 2026-06-23T19:22:55Z

  [15] QUERÉTARO_COLORADO_PLANTA-ELTEK
       IP: 172.25.134.246  |  Vendor: eltek  |  Health: 92.71507692307692
       Metricas: batterySOC=50, loadCurrent=8.3, mainsVoltage=223, rectifierCount=3, rectifierOutputCurrent=8.2, rectifierOutputVoltage=53.52
       Ultimo poll: 2026-06-23T19:22:56Z

  [16] MONTERREY_INDEPENDENCIA_PLANTA-ELTEK
       IP: 172.26.18.20  |  Vendor: eltek  |  Health: 97.93069230769231
       Metricas: batterySOC=100, batteryVoltage=53.53, loadCurrent=0.7, mainsVoltage=245, rectifierCount=3, rectifierOutputCurrent=0.7
       Ultimo poll: 2026-06-23T19:22:56Z

  [17] MONTERREY_INDEPENDENCIA_INVERSOR-SAMLEX
       IP: 172.26.18.21  |  Vendor: samlex  |  Health: 98.80888461538461
       Metricas: acOutputVoltage=121.1, batteryVoltage=53.2, mainsFrequency=59.9, mainsPresent=True, mainsVoltage=125.5
       Ultimo poll: 2026-06-23T19:22:56Z

  [18] MONTERREY_HUINALA_INVERSOR-SAMLEX
       IP: 172.30.119.238  |  Vendor: samlex  |  Health: 96.37553846153845
       Metricas: acOutputVoltage=121.1, batteryVoltage=53.2, mainsFrequency=59.9, mainsPresent=True, mainsVoltage=121.2
       Ultimo poll: 2026-06-23T19:22:56Z

  3.2 Hosts SNMP v2c — Sin metricas (offline)
  Total: 8 hosts

  [01] CHIHUAHUA_PANAMERICANA_INVERSOR-SAMLEX  |  10.33.8.250  |  samlex  |  OFFLINE
  [02] MONTERREY_MIRASUR_INVERSOR-SAMLEX  |  172.30.162.38  |  samlex  |  OFFLINE
  [03] MONTERREY_SANTA-ROSA_INVERSOR-SAMLEX  |  172.30.220.70  |  samlex  |  OFFLINE
  [04] SAN-LUIS-POTOSÍ_EDIFICIO-EME_INVERSOR-SAMLEX  |  10.40.1.238  |  samlex  |  OFFLINE
  [05] MONTERREY_LOMA_INVERSOR-SAMLEX  |  172.30.56.66  |  samlex  |  OFFLINE
  [06] MÉXICO_TEPETLIXPA_INVERSOR-SAMLEX  |  10.60.105.250  |  samlex  |  OFFLINE
  [07] REYNOSA_MEYBI_INVERSOR-SAMLEX  |  172.20.47.242  |  samlex  |  OFFLINE
  [08] QUERÉTARO_CARRTERA-57_INVERSOR-SAMLEX  |  10.40.11.242  |  samlex  |  OFFLINE

================================================================================
  4. PERFILES SNMP CONFIGURADOS (7)
================================================================================

  PERFIL: Eltek (integrado)
  Vendor: eltek  |  Enabled: True  |  OIDs: 9
    - batteryVoltage                  OID: 1.3.6.1.4.1.12148.10.10.5.5.0  div: 100  tipo: number
    - batteryCurrent                  OID: 1.3.6.1.4.1.12148.10.10.6.5.0  div: 1  tipo: number
    - batteryTemperature              OID: 1.3.6.1.4.1.12148.10.10.7.5.0  div: 1  tipo: number
    - batterySOC                      OID: 1.3.6.1.4.1.12148.10.10.9.5.0  div: 1  tipo: number
    - rectifierOutputVoltage          OID: 1.3.6.1.4.1.12148.10.10.5.5.0  div: 100  tipo: number
    - rectifierOutputCurrent          OID: 1.3.6.1.4.1.12148.10.5.2.5.0  div: 10  tipo: number
    - rectifierCount                  OID: 1.3.6.1.4.1.12148.10.5.5.0  div: 1  tipo: number
    - loadCurrent                     OID: 1.3.6.1.4.1.12148.10.9.2.5.0  div: 10  tipo: number
    - mainsVoltage                    OID: 1.3.6.1.4.1.12148.10.3.4.1.6.1  div: 1  tipo: number

  PERFIL: Vertiv / Emerson (integrado)
  Vendor: vertiv  |  Enabled: True  |  OIDs: 9
    - rectifierOutputVoltage          OID: 1.3.6.1.4.1.6302.2.1.2.2.1.2.1  div: 1  tipo: number
    - loadCurrent                     OID: 1.3.6.1.4.1.6302.2.1.2.2.1.2.2  div: 1  tipo: number
    - batteryCurrent                  OID: 1.3.6.1.4.1.6302.2.1.2.3.1.2.1  div: 1  tipo: number
    - batterySOC                      OID: 1.3.6.1.4.1.6302.2.1.2.3.1.2.5  div: 1  tipo: number
    - batteryTemperature              OID: 1.3.6.1.4.1.6302.2.1.2.3.1.2.3  div: 1  tipo: number
    - mainsVoltage                    OID: 1.3.6.1.4.1.6302.2.1.2.4.1.2.1  div: 1  tipo: number
    - rectifierCount                  OID: 1.3.6.1.4.1.6302.2.1.2.5.1.2.1  div: 1  tipo: number
    - rectifierFailCount              OID: 1.3.6.1.4.1.6302.2.1.2.5.1.2.2  div: 1  tipo: number
    - generalAlarmActive              OID: 1.3.6.1.4.1.6302.2.1.1.3.0  div: 1  tipo: boolNonZero

  PERFIL: MEI (integrado)
  Vendor: mei  |  Enabled: True  |  OIDs: 4
    - mainsVoltage                    OID: 1.3.6.1.4.1.21940.2.3.1.2.1.0  div: 1000  tipo: number
    - mainsFrequency                  OID: 1.3.6.1.4.1.21940.2.3.1.2.7.0  div: 1000  tipo: number
    - rectifierOutputVoltage          OID: 1.3.6.1.4.1.21940.2.4.2.1.0  div: 1000  tipo: number
    - rectifierOutputCurrent          OID: 1.3.6.1.4.1.21940.2.4.2.2.0  div: 1000  tipo: number

  PERFIL: Samlex (integrado)
  Vendor: samlex  |  Enabled: True  |  OIDs: 6
    - mainsVoltage                    OID: 1.3.6.1.4.1.49075.1.3.1.7.0  div: 10  tipo: number
    - mainsFrequency                  OID: 1.3.6.1.4.1.49075.1.3.1.10.0  div: 10  tipo: number
    - acOutputVoltage                 OID: 1.3.6.1.4.1.49075.1.3.1.2.0  div: 10  tipo: number
    - loadPower                       OID: 1.3.6.1.4.1.49075.1.3.1.4.0  div: 10  tipo: number
    - batteryVoltage                  OID: 1.3.6.1.4.1.49075.1.3.2.1.0  div: 10  tipo: number
    - mainsPresent                    OID: 1.3.6.1.4.1.49075.1.3.3.4.0  div: 1  tipo: boolZero

  PERFIL: ALG Site Monitor (integrado)
  Vendor: alg  |  Enabled: True  |  OIDs: 5
    - mainsVoltage                    OID: 1.3.6.1.4.1.49136.100.3.5.0  div: 1000  tipo: number
    - batteryVoltage                  OID: 1.3.6.1.4.1.49136.100.3.6.0  div: 1000  tipo: number
    - temperature                     OID: 1.3.6.1.4.1.49136.100.3.1.0  div: 1  tipo: number
    - humidity                        OID: 1.3.6.1.4.1.49136.100.3.4.0  div: 1  tipo: number
    - doorOpen                        OID: 1.3.6.1.4.1.49136.100.3.10.0  div: 1  tipo: number

  PERFIL: ALG DC UPS (integrado)
  Vendor: algUps  |  Enabled: True  |  OIDs: 2
    - batteryVoltage                  OID: 1.3.6.1.4.1.49136.1.1.1.0  div: 10  tipo: number
    - mainsVoltage                    OID: 1.3.6.1.4.1.49136.1.1.2.0  div: 10  tipo: number

  PERFIL: WatchDog (integrado)
  Vendor: watchdog  |  Enabled: True  |  OIDs: 5
    - temperature                     OID: 1.3.6.1.4.1.21239.5.1.2.1.5.1  div: 10  tipo: number
    - humidity                        OID: 1.3.6.1.4.1.21239.5.1.2.1.6.1  div: 1  tipo: number
    - mainsVoltage                    OID: 1.3.6.1.4.1.21239.5.1.11.1.5.1  div: 1  tipo: number
    - batteryVoltage                  OID: 1.3.6.1.4.1.21239.5.1.11.1.5.2  div: 1  tipo: number
    - doorOpen                        OID: 1.3.6.1.4.1.21239.5.1.11.1.5.3  div: 1  tipo: number

================================================================================
  5. CONFIGURACION SNMP GLOBAL
================================================================================

  Version: 2c
  Puerto: 161
  Community global: snmpxcien
  Timeout: 5 seg
  Reintentos: 2

  City Overrides:
    Monterrey: community=snmpxcien

  Host Overrides:
    172.30.111.54: community=read
    172.30.90.102: community=read

  Monitoreo:
    Ping habilitado: True
    SNMP habilitado: True
    Ping intervalo: 20 seg
    SNMP intervalo: 60 seg
    Max concurrent ping: 80
    Max concurrent SNMP: 20

================================================================================
  6. UMBRALES DE ALARMA
================================================================================

  ENERGIA:
    Voltaje bateria WARNING:   < 51V
    Voltaje bateria CRITICAL:  < 46V
    SOC bateria WARNING:       < 40%
    SOC bateria CRITICAL:      < 20%
    CFE confirmacion lecturas: 3
    CFE clear lecturas:        2
    Sobrecarga:                > 100%
    Tolerancia voltaje:        10%
    Multi-down threshold:      3 hosts

  RED:
    Latencia WARNING:          > 50ms
    Latencia CRITICAL:         > 200ms
    Packet loss WARNING:       > 5%
    Packet loss CRITICAL:      > 20%

  SISTEMA:
    CPU WARNING:               > 70%
    CPU CRITICAL:              > 90%
    Memoria WARNING:           > 75%
    Memoria CRITICAL:          > 90%

================================================================================
  7. CONFIGURACION TELEGRAM
================================================================================

  Bot: @xcien_nocboard_bot
  Bot Token: CONFIGURADO (46 chars)
  Canal: NOCBOARD ENERGIA
  Chat ID: -1003763039964
  Estado: ACTIVO
  Test: Message sent successfully (verificado 2026-06-23 13:24)

  Notificaciones habilitadas:
    Host offline:        SI
    Host recovery:       SI
    Host degraded:       NO
    Corte CFE:           SI
    Monitoring events:   SI

  NOTA: La configuracion de Telegram se borra al reiniciar NOCBoard.
  Debe reconfigurarse desde GUI (Cmd+, > Telegram) cada vez.
  El config.json se sobreescribe desde la DB interna al reiniciar.

================================================================================
  8. LABORATORIO DE PRUEBAS — SITIO INDEPENDENCIA
================================================================================

  Sitio seleccionado como laboratorio para validar configuracion SNMP
  y alarmas antes de replicar a toda la red XCIEN.

  Dispositivos: 4

  DISPOSITIVO: MONTERREY_INDEPENDENCIA_PLANTA-ELTEK
    IP: 172.26.18.20
    Protocolo: snmpV2c
    Vendor: eltek
    Tipo: rectifier
    Status: online
    Health Score: 97.93069230769231
    Metricas actuales:
      batteryCurrent: 0A
      batterySOC: 100%
      batteryTemperature: 0
      batteryVoltage: 53.53V
      loadCurrent: 0.7A
      mainsVoltage: 245V
      rectifierCount: 3
      rectifierOutputCurrent: 0.7A
    Evaluacion vs umbrales:
      batteryVoltage 53.53V -> [OK]
      batterySOC 100% -> [OK]
      mainsVoltage 245V -> [OK]

  DISPOSITIVO: MONTERREY_INDEPENDENCIA_INVERSOR-SAMLEX
    IP: 172.26.18.21
    Protocolo: snmpV2c
    Vendor: samlex
    Tipo: inverter
    Status: online
    Health Score: 98.80888461538461
    Metricas actuales:
      acOutputVoltage: 121.1V
      batteryVoltage: 53.2V
      loadPower: 0W
      mainsFrequency: 59.9Hz
      mainsPresent: True
      mainsVoltage: 125.5V
    Evaluacion vs umbrales:
      batteryVoltage 53.2V -> [OK]
      mainsVoltage 125.5V -> [OK]

  DISPOSITIVO: MONTERREY_INDEPENDENCIA_VICTRO
    IP: 172.26.18.106
    Protocolo: modbusTCP
    Vendor: victron
    Tipo: inverter
    Status: offline
    Health Score: 0
    Metricas actuales:
    Evaluacion vs umbrales:

  DISPOSITIVO: MONTERREY_INDEPENDENCIA_SITE-MONITOR
    IP: 172.30.20.22
    Protocolo: icmp
    Vendor: ?
    Tipo: siteMonitor
    Status: offline
    Health Score: 0
    Sin metricas (offline o protocolo incompatible)

  PLAN DE PRUEBAS:
  1. Validar SNMP en Eltek (172.26.18.20) — COMPLETADO, midiendo 8 OIDs
  2. Validar SNMP en Samlex (172.26.18.21) — COMPLETADO, midiendo 6 OIDs
  3. Configurar Telegram — COMPLETADO, test exitoso
  4. Esperar evento real (offline/recovery/CFE) para validar alerta automatica
  5. Victron (172.26.18.106) — OFFLINE, pendiente investigar
  6. Site Monitor ALG (172.30.20.22) — OFFLINE + ICMP, pendiente reclasificar

  PRUEBAS DE ALARMA SIMULADAS (enviadas a Telegram):
  [1] Reporte de estado — metricas actuales Eltek + Samlex
  [2] Warning — voltaje bateria bajo (<51V)
  [3] Alarma Critica — corte CFE (0V)
  [4] Recuperacion — CFE restaurada
  [5] Host Offline — Victron sin respuesta
  Resultado: 5/5 mensajes entregados exitosamente

================================================================================
  9. ANALISIS DE CAUSA RAIZ — POR QUE SOLO 18/76 MIDEN
================================================================================

  CAUSA 1: PROTOCOLO INCORRECTO
  Afectados: 49 hosts (64%)
  Descripcion: 49 hosts tienen protocolo ICMP (solo ping).
  ICMP verifica disponibilidad pero NUNCA lee OIDs SNMP.
  Solucion: Cambiar protocolo a snmpV2c desde GUI de NOCBoard.

  Desglose ICMP:
    Con vendor conocido: 10 (Eltek: 5, MEI: 5)
    Site Monitors ALG:   39
    Sin clasificar:      0

  CAUSA 2: HOST OFFLINE
  Afectados: 21 hosts (27%)
  Descripcion: No hay conectividad de red, ni ping ni SNMP llega.
  Sub-causas posibles:
    a) VPN caida entre NOCBoard y la radiobase
    b) Equipo de energia apagado o sin alimentacion
    c) IP cambiada sin actualizar en NOCBoard
    d) Firewall/ACL bloqueando UDP 161 (SNMP)

  CAUSA 3: VENDOR NO CLASIFICADO
  Afectados: 39 hosts
  Descripcion: Sin vendor, NOCBoard no sabe que perfil SNMP aplicar.
  Los 22 Site Monitors son ALGCom pero estan como unknown.

  CAUSA 4: COMMUNITY STRING INCORRECTA (potencial)
  Community global: snmpxcien
  La mayoria usa 'snmpxcien', excepciones: Mitras y PDA usan 'read'.
  Si la community no coincide, el dispositivo rechaza silenciosamente.

================================================================================
  10. HOSTS SNMP v2c — DETALLE INDIVIDUAL (26)
================================================================================

  [01] MONTERREY_PDA_PLANTA-ELTEK
       IP: 172.30.111.246  |  Ciudad: Monterrey  |  Sitio: PDA
       Vendor: eltek  |  Tipo: rectifier
       Status: online  |  SNMP: MIDIENDO
       Health: 95.3476
       Ping: latencia=50.401ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:55Z
         batteryCurrent: -63
         batterySOC: 0
         batteryTemperature: 0
         batteryVoltage: 54.32
         loadCurrent: 16.7
         mainsVoltage: 239
         rectifierCount: 3
         rectifierOutputCurrent: 10.4

  [02] MONTERREY_ANTIGUA-ESTANZUELA_PLANTA-ELTEK
       IP: 172.30.246.250  |  Ciudad: Monterrey  |  Sitio: Antigua Estanzuela
       Vendor: eltek  |  Tipo: rectifier
       Status: online  |  SNMP: MIDIENDO
       Health: 99.89246153846153
       Ping: latencia=10.932ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:55Z
         batteryCurrent: 0
         batterySOC: 0
         batteryTemperature: 0
         loadCurrent: 0.6
         mainsVoltage: 247
         rectifierCount: 3
         rectifierOutputCurrent: 0.7
         rectifierOutputVoltage: 53.54

  [03] MONTERREY_MITRAS_PLANTA-ELTEK
       IP: 172.30.90.98  |  Ciudad: Monterrey  |  Sitio: Mitras
       Vendor: eltek  |  Tipo: rectifier
       Status: online  |  SNMP: MIDIENDO
       Health: 97.76638461538461
       Ping: latencia=29.358ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:55Z
         batteryCurrent: -7
         batterySOC: 50
         batteryTemperature: 0
         batteryVoltage: 53.55
         loadCurrent: 10.4
         mainsVoltage: 220
         rectifierCount: 3
         rectifierOutputCurrent: 10.2

  [04] MONTERREY_MITRAS_INVERSOR-SAMLEX
       IP: 172.30.90.102  |  Ciudad: Monterrey  |  Sitio: Mitras
       Vendor: samlex  |  Tipo: inverter
       Status: online  |  SNMP: MIDIENDO
       Health: 100
       Ping: latencia=7.745ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:56Z
         acOutputVoltage: 122.6
         batteryVoltage: 53
         loadPower: 422.9
         mainsFrequency: 0
         mainsPresent: False
         mainsVoltage: 0

  [05] MONTERREY_SENDERO_PLANTA-ELTEK
       IP: 172.30.109.194  |  Ciudad: Monterrey  |  Sitio: Sendero
       Vendor: eltek  |  Tipo: rectifier
       Status: online  |  SNMP: MIDIENDO
       Health: 97.88557692307693
       Ping: latencia=28.325ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:55Z
         batteryCurrent: -7
         batterySOC: 100
         batteryTemperature: 0
         loadCurrent: 17
         mainsVoltage: 242
         rectifierCount: 3
         rectifierOutputCurrent: 16.7
         rectifierOutputVoltage: 53.52

  [06] SALTILLO_MECASA-RAMOS_PLANTA-ELTEK
       IP: 172.18.13.190  |  Ciudad: Saltillo  |  Sitio: Mecasa Ramos
       Vendor: eltek  |  Tipo: rectifier
       Status: online  |  SNMP: MIDIENDO
       Health: 100
       Ping: latencia=8.348ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:56Z
         batteryCurrent: 0
         batterySOC: 100
         batteryTemperature: 0
         batteryVoltage: 54.56
         loadCurrent: 8.2
         mainsVoltage: 215
         rectifierCount: 3
         rectifierOutputCurrent: 8

  [07] QUERÉTARO_JURIQUILLA_INVERSOR-SAMLEX
       IP: 172.25.138.250  |  Ciudad: Querétaro  |  Sitio: Juriquilla
       Vendor: samlex  |  Tipo: inverter
       Status: online  |  SNMP: MIDIENDO
       Health: 93.22138461538461
       Ping: latencia=73.435ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:55Z
         acOutputVoltage: 120.8
         batteryVoltage: 26.8
         loadPower: 0
         mainsFrequency: 59.9
         mainsPresent: True
         mainsVoltage: 125.5

  [08] QUERÉTARO_BANDERA_INVERSOR-SAMLEX
       IP: 172.25.131.162  |  Ciudad: Querétaro  |  Sitio: Bandera
       Vendor: samlex  |  Tipo: inverter
       Status: online  |  SNMP: MIDIENDO
       Health: 93.52803076923077
       Ping: latencia=70.113ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:56Z
         acOutputVoltage: 120.9
         batteryVoltage: 26.9
         loadPower: 0
         mainsFrequency: 59.9
         mainsPresent: True
         mainsVoltage: 113.6

  [09] QUERÉTARO_TEC100_INVERSOR-SAMLEX
       IP: 172.25.132.246  |  Ciudad: Querétaro  |  Sitio: Tec100
       Vendor: samlex  |  Tipo: inverter
       Status: online  |  SNMP: MIDIENDO
       Health: 93.58886153846154
       Ping: latencia=69.454ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:56Z
         acOutputVoltage: 120.8
         batteryVoltage: 26.9
         loadPower: 0
         mainsFrequency: 59.9
         mainsPresent: True
         mainsVoltage: 128

  [10] CHIHUAHUA_PANAMERICANA_INVERSOR-SAMLEX
       IP: 10.33.8.250  |  Ciudad: Chihuahua  |  Sitio: Panamericana
       Vendor: samlex  |  Tipo: inverter
       Status: offline  |  SNMP: SIN DATOS
       Health: 0
       Ping: latencia=?ms  loss=100%

  [11] MONTERREY_MONTEMORELOS_INVERSOR-SAMLEX
       IP: 172.30.13.226  |  Ciudad: Monterrey  |  Sitio: Montemorelos
       Vendor: samlex  |  Tipo: inverter
       Status: online  |  SNMP: MIDIENDO
       Health: 95.18495384615385
       Ping: latencia=52.163ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:55Z
         acOutputVoltage: 120.9
         batteryVoltage: 27.1
         loadPower: 0
         mainsFrequency: 59.9
         mainsPresent: True
         mainsVoltage: 123

  [12] MONTERREY_MIRASUR_INVERSOR-SAMLEX
       IP: 172.30.162.38  |  Ciudad: Monterrey  |  Sitio: Mirasur
       Vendor: samlex  |  Tipo: inverter
       Status: offline  |  SNMP: SIN DATOS
       Health: 0
       Ping: latencia=?ms  loss=100%

  [13] MONTERREY_DENIS_INVERSOR-SAMLEX
       IP: 172.30.176.238  |  Ciudad: Monterrey  |  Sitio: Denis
       Vendor: samlex  |  Tipo: inverter
       Status: online  |  SNMP: MIDIENDO
       Health: 96.68073076923076
       Ping: latencia=38.767ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:55Z
         acOutputVoltage: 121
         batteryVoltage: 26.9
         loadPower: 0
         mainsFrequency: 59.9
         mainsPresent: True
         mainsVoltage: 112.7

  [14] MONTERREY_NORTE_INVERSOR-SAMLEX
       IP: 172.30.91.254  |  Ciudad: Monterrey  |  Sitio: Norte
       Vendor: samlex  |  Tipo: inverter
       Status: online  |  SNMP: MIDIENDO
       Health: 96.87007692307692
       Ping: latencia=37.126ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:55Z
         acOutputVoltage: 120.9
         batteryVoltage: 53.4
         loadPower: 295.8
         mainsFrequency: 0
         mainsPresent: False
         mainsVoltage: 0

  [15] MONTERREY_SANTA-ROSA_INVERSOR-SAMLEX
       IP: 172.30.220.70  |  Ciudad: Monterrey  |  Sitio: Santa Rosa
       Vendor: samlex  |  Tipo: inverter
       Status: offline  |  SNMP: SIN DATOS
       Health: 0
       Ping: latencia=?ms  loss=100%

  [16] MONTERREY_PURISIMA_INVERSOR-SAMLEX
       IP: 172.30.99.166  |  Ciudad: Monterrey  |  Sitio: Purisima
       Vendor: samlex  |  Tipo: inverter
       Status: online  |  SNMP: MIDIENDO
       Health: 97.609
       Ping: latencia=30.722ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:55Z
         acOutputVoltage: 121
         batteryVoltage: 26.9
         loadPower: 0
         mainsFrequency: 59.9
         mainsPresent: True
         mainsVoltage: 111.5

  [17] MONTERREY_PDA_INVERSOR-SAMLEX
       IP: 172.30.111.54  |  Ciudad: Monterrey  |  Sitio: PDA
       Vendor: samlex  |  Tipo: inverter
       Status: online  |  SNMP: MIDIENDO
       Health: 96.64657692307692
       Ping: latencia=39.063ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:55Z
         acOutputVoltage: 122.2
         batteryVoltage: 56.9
         loadPower: 492.2
         mainsFrequency: 0
         mainsPresent: False
         mainsVoltage: 0

  [18] SAN-LUIS-POTOSÍ_EDIFICIO-EME_INVERSOR-SAMLEX
       IP: 10.40.1.238  |  Ciudad: San Luis Potosí  |  Sitio: Edificio EME
       Vendor: samlex  |  Tipo: inverter
       Status: offline  |  SNMP: SIN DATOS
       Health: 0
       Ping: latencia=?ms  loss=100%

  [19] MONTERREY_LOMA_INVERSOR-SAMLEX
       IP: 172.30.56.66  |  Ciudad: Monterrey  |  Sitio: Loma
       Vendor: samlex  |  Tipo: inverter
       Status: offline  |  SNMP: SIN DATOS
       Health: 0
       Ping: latencia=?ms  loss=100%

  [20] MÉXICO_TEPETLIXPA_INVERSOR-SAMLEX
       IP: 10.60.105.250  |  Ciudad: México  |  Sitio: Tepetlixpa
       Vendor: samlex  |  Tipo: inverter
       Status: offline  |  SNMP: SIN DATOS
       Health: 0
       Ping: latencia=?ms  loss=100%

  [21] REYNOSA_MEYBI_INVERSOR-SAMLEX
       IP: 172.20.47.242  |  Ciudad: Reynosa  |  Sitio: Meybi
       Vendor: samlex  |  Tipo: inverter
       Status: offline  |  SNMP: SIN DATOS
       Health: 0
       Ping: latencia=?ms  loss=100%

  [22] QUERÉTARO_COLORADO_PLANTA-ELTEK
       IP: 172.25.134.246  |  Ciudad: Querétaro  |  Sitio: Colorado
       Vendor: eltek  |  Tipo: rectifier
       Status: online  |  SNMP: MIDIENDO
       Health: 92.71507692307692
       Ping: latencia=78.92ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:56Z
         batteryCurrent: 0
         batterySOC: 50
         batteryTemperature: 0
         loadCurrent: 8.3
         mainsVoltage: 223
         rectifierCount: 3
         rectifierOutputCurrent: 8.2
         rectifierOutputVoltage: 53.52

  [23] MONTERREY_INDEPENDENCIA_PLANTA-ELTEK
       IP: 172.26.18.20  |  Ciudad: Monterrey  |  Sitio: Independencia
       Vendor: eltek  |  Tipo: rectifier
       Status: online  |  SNMP: MIDIENDO
       Health: 97.93069230769231
       Ping: latencia=27.934ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:56Z
         batteryCurrent: 0
         batterySOC: 100
         batteryTemperature: 0
         batteryVoltage: 53.53
         loadCurrent: 0.7
         mainsVoltage: 245
         rectifierCount: 3
         rectifierOutputCurrent: 0.7

  [24] MONTERREY_INDEPENDENCIA_INVERSOR-SAMLEX
       IP: 172.26.18.21  |  Ciudad: Monterrey  |  Sitio: Independencia
       Vendor: samlex  |  Tipo: inverter
       Status: online  |  SNMP: MIDIENDO
       Health: 98.80888461538461
       Ping: latencia=20.323ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:56Z
         acOutputVoltage: 121.1
         batteryVoltage: 53.2
         loadPower: 0
         mainsFrequency: 59.9
         mainsPresent: True
         mainsVoltage: 125.5

  [25] QUERÉTARO_CARRTERA-57_INVERSOR-SAMLEX
       IP: 10.40.11.242  |  Ciudad: Querétaro  |  Sitio: Carrtera 57
       Vendor: samlex  |  Tipo: inverter
       Status: offline  |  SNMP: SIN DATOS
       Health: 0
       Ping: latencia=?ms  loss=100%

  [26] MONTERREY_HUINALA_INVERSOR-SAMLEX
       IP: 172.30.119.238  |  Ciudad: Monterrey  |  Sitio: Huinala
       Vendor: samlex  |  Tipo: inverter
       Status: online  |  SNMP: MIDIENDO
       Health: 96.37553846153845
       Ping: latencia=41.412ms  loss=0%
       Ultimo poll: 2026-06-23T19:22:56Z
         acOutputVoltage: 121.1
         batteryVoltage: 53.2
         loadPower: 0
         mainsFrequency: 59.9
         mainsPresent: True
         mainsVoltage: 121.2

================================================================================
  11. HOSTS ICMP CON VENDOR CONOCIDO — CANDIDATOS SNMP (10)
================================================================================

  ACCION REQUERIDA: Cambiar protocolo ICMP -> snmpV2c en GUI

  [01] MONTERREY_PESQUERIA_PLANTA-ELTEK
       IP: 172.30.206.2  |  Vendor: eltek  |  Status: online
       Community: snmpxcien  |  Perfil: Eltek (integrado)
       Prioridad: ALTA

  [02] SAN-LUIS-POTOSÍ_EDIFICIO-EME_PLANTA-ELTEK
       IP: 10.40.1.234  |  Vendor: eltek  |  Status: offline
       Community: snmpxcien  |  Perfil: Eltek (integrado)
       Prioridad: MEDIA (offline)

  [03] PIEDRAS-NEGRAS_PIEDRAS-NEGRAS_PLANTA-MEI
       IP: 10.20.9.242  |  Vendor: mei  |  Status: online
       Community: snmpxcien  |  Perfil: Mei (integrado)
       Prioridad: ALTA

  [04] REYNOSA_LIBRAMIENTO_PLANTA-MEI
       IP: 172.20.12.246  |  Vendor: mei  |  Status: offline
       Community: snmpxcien  |  Perfil: Mei (integrado)
       Prioridad: MEDIA (offline)

  [05] TORREÓN_TORREÓN_PLANTA-MEI
       IP: 10.80.1.251  |  Vendor: mei  |  Status: offline
       Community: snmpxcien  |  Perfil: Mei (integrado)
       Prioridad: MEDIA (offline)

  [06] PIEDRAS-NEGRAS_ACUÑA_PLANTA-MEI
       IP: 10.20.28.250  |  Vendor: mei  |  Status: online
       Community: snmpxcien  |  Perfil: Mei (integrado)
       Prioridad: ALTA

  [07] PIEDRAS-NEGRAS_APOLO_PLANTA-MEI
       IP: 10.20.25.250  |  Vendor: mei  |  Status: online
       Community: snmpxcien  |  Perfil: Mei (integrado)
       Prioridad: ALTA

  [08] MONTERREY_HUINALA_PLANTA-ELTEK
       IP: 172.30.119.234  |  Vendor: eltek  |  Status: online
       Community: snmpxcien  |  Perfil: Eltek (integrado)
       Prioridad: ALTA

  [09] MONTERREY_JUAREZ-BLANCAS_PLANTA-ELTEK
       IP: 172.30.203.246  |  Vendor: eltek  |  Status: online
       Community: snmpxcien  |  Perfil: Eltek (integrado)
       Prioridad: ALTA

  [10] MONTERREY_SEMINARIO_PLANTA-ELTEK
       IP: 172.30.247.250  |  Vendor: eltek  |  Status: online
       Community: snmpxcien  |  Perfil: Eltek (integrado)
       Prioridad: ALTA

================================================================================
  12. SITE MONITORS ALGCom (39)
================================================================================

  ACCION: Reclasificar vendor=alg + cambiar ICMP -> snmpV2c
  Perfil: ALG Site Monitor (integrado)
  Online: 30  |  Offline: 9

  [01] MONTERREY_JUAREZ-BLANCAS_SITE-MONITOR              | 172.30.203.250   | Monterrey       | online
  [02] MONTERREY_NORTE_SITE-MONITOR                       | 172.30.91.150    | Monterrey       | online
  [03] MONTERREY_DENIS_SITE-MONITOR                       | 172.30.176.234   | Monterrey       | online
  [04] MONTERREY_MITRAS_SITE-MONITOR                      | 172.30.85.126    | Monterrey       | online
  [05] MONTERREY_NIMIW_SITE-MONITOR                       | 172.30.17.182    | Monterrey       | online
  [06] MONTERREY_PESQUERIA_SITE-MONITOR                   | 172.30.206.234   | Monterrey       | online
  [07] MONTERREY_INDEPENDENCIA_SITE-MONITOR               | 172.30.20.22     | Monterrey       | offline
  [08] MONTERREY_HIDALGO_SITE-MONITOR                     | 172.30.22.250    | Monterrey       | online
  [09] MONTERREY_JUAREZ_SITE-MONITOR                      | 172.30.87.246    | Monterrey       | online
  [10] MONTERREY_CADEREYTA_SITE-MONITOR                   | 172.30.2.86      | Monterrey       | online
  [11] MONTERREY_SANTA-ROSA_SITE-MONITOR                  | 172.30.16.246    | Monterrey       | online
  [12] MONTERREY_PURISIMA_SITE-MONITOR                    | 172.30.99.118    | Monterrey       | online
  [13] MONTERREY_SENDERO_SITE-MONITOR                     | 172.30.116.110   | Monterrey       | online
  [14] MONTERREY_LOMA_SITE-MONITOR                        | 172.30.14.250    | Monterrey       | online
  [15] MONTERREY_MONTEMORELOS_SITE-MONITOR                | 172.30.13.222    | Monterrey       | online
  [16] MONTERREY_KRISTALES_SITE-MONITOR                   | 172.30.51.254    | Monterrey       | online
  [17] MONTERREY_GUADALUPE_SITE-MONITOR                   | 172.30.33.202    | Monterrey       | online
  [18] MONTERREY_HUALAHUISES_SITE-MONITOR                 | 172.30.160.70    | Monterrey       | online
  [19] MONTERREY_STA-CATARINA_SITE-MONITOR                | 172.30.47.238    | Monterrey       | online
  [20] MONTERREY_EL-CARMEN_SITE-MONITOR                   | 172.30.36.254    | Monterrey       | online
  [21] MONTERREY_PUEBLO-NUEVO_SITE-MONITOR                | 172.30.96.250    | Monterrey       | online
  [22] MONTERREY_ROJAS_SITE-MONITOR                       | 172.30.48.250    | Monterrey       | online
  [23] MONTERREY_SEMINARIO_SITE-MONITOR                   | 172.30.247.246   | Monterrey       | online
  [24] TAMPICO_ARBOLEDAS_SITE-MONITOR                     | 172.30.99.146    | Tampico         | offline
  [25] TAMPICO_TAMPICO_SITE-MONITOR                       | 10.70.0.250      | Tampico         | offline
  [26] SALTILLO_DERRAMADEREO_SITE-MONITOR                 | 172.19.83.250    | Saltillo        | online
  [27] SALTILLO_LOFT_SITE-MONITOR                         | 172.18.78.234    | Saltillo        | online
  [28] SALTILLO_ACHERBIS_SITE-MONITOR                     | 172.18.29.194    | Saltillo        | online
  [29] MONTERREY_SANTIAGO-II_SITE-MONITOR                 | 172.30.12.246    | Monterrey       | online
  [30] NAUCALPAN_NAUCALPAN_SITE-MONITOR                   | 10.61.0.254      | Naucalpan       | online
  [31] GUSTAVO-A.-MADERO_VALLEJO_SITE-MONITOR             | 10.61.20.254     | Gustavo A. Madero | online
  [32] CUAUTITLAN_CUAUTITLAN_SITE-MONITOR                 | 10.61.50.254     | Cuautitlan      | offline
  [33] IZTAPALAPA_CENTRAL-DE-ABASTOS_SITE-MONITOR         | 10.61.40.254     | Iztapalapa      | online
  [34] METEPEC_TOTOLTEPEC_SITE-MONITOR                    | 10.60.10.242     | Metepec         | online
  [35] TOLUCA_TOLULCA-2000_SITE-MONITOR                   | 10.61.30.254     | Toluca          | offline
  [36] MELCHOR-OCAMPO_XOCHIMIQUIA_SITE-MONITOR            | 10.60.53.241     | Melchor Ocampo  | offline
  [37] ECATEPEC-DE-MORELOS_XALOSTOC_SITE-MONITOR          | 10.60.80.245     | Ecatepec de Morelos | offline
  [38] TLALNEPANTLA_TLANEPANTLA_SITE-MONITOR              | 10.60.23.253     | Tlalnepantla    | offline
  [39] COYOTEPEC_COYOTEPEC_SITE-MONITOR                   | 172.28.1.250     | Coyotepec       | offline

================================================================================
  13. HOSTS SIN CLASIFICAR (0)
================================================================================

  ACCION: Identificar marca/modelo en campo


================================================================================
  14. SITIOS CON CORTE CFE (tiempo real)
================================================================================

  CORTE: MONTERREY_MITRAS_INVERSOR-SAMLEX
    IP: 172.30.90.102  |  Ciudad: Monterrey
    Voltaje CFE: 0V
    Bateria: 53

  CORTE: MONTERREY_NORTE_INVERSOR-SAMLEX
    IP: 172.30.91.254  |  Ciudad: Monterrey
    Voltaje CFE: 0V
    Bateria: 53.4

  CORTE: MONTERREY_PDA_INVERSOR-SAMLEX
    IP: 172.30.111.54  |  Ciudad: Monterrey
    Voltaje CFE: 0V
    Bateria: 56.9


================================================================================
  15. PLAN DE ACCION POR FASES
================================================================================

  FASE 0: TELEGRAM + LABORATORIO (completado hoy)
  -------------------------------------------------------
  [OK] Configurar bot Telegram en NOCBoard
  [OK] Test message exitoso
  [OK] Verificar SNMP Independencia Eltek (8 OIDs)
  [OK] Verificar SNMP Independencia Samlex (6 OIDs)
  [OK] Enviar 5 simulaciones de alarma al canal
  [OK] Generar documento exhaustivo
  [  ] Esperar evento real para validar alerta automatica
  [  ] Investigar Victron offline (172.26.18.106)
  [  ] Reclasificar Site Monitor ALG (172.30.20.22)

  FASE 1: VENDOR CONOCIDO (esta semana)
  -------------------------------------------------------
  Cambiar 10 hosts de ICMP a snmpV2c:
    [  ] MONTERREY_PESQUERIA_PLANTA-ELTEK              ONLINE - listo
    [  ] SAN-LUIS-POTOSÍ_EDIFICIO-EME_PLANTA-ELTEK     OFFLINE - esperar
    [  ] PIEDRAS-NEGRAS_PIEDRAS-NEGRAS_PLANTA-MEI      ONLINE - listo
    [  ] REYNOSA_LIBRAMIENTO_PLANTA-MEI                OFFLINE - esperar
    [  ] TORREÓN_TORREÓN_PLANTA-MEI                    OFFLINE - esperar
    [  ] PIEDRAS-NEGRAS_ACUÑA_PLANTA-MEI               ONLINE - listo
    [  ] PIEDRAS-NEGRAS_APOLO_PLANTA-MEI               ONLINE - listo
    [  ] MONTERREY_HUINALA_PLANTA-ELTEK                ONLINE - listo
    [  ] MONTERREY_JUAREZ-BLANCAS_PLANTA-ELTEK         ONLINE - listo
    [  ] MONTERREY_SEMINARIO_PLANTA-ELTEK              ONLINE - listo
  Meta: pasar de 18 a ~25 hosts midiendo

  FASE 2: SITE MONITORS ALG (proxima semana)
  -------------------------------------------------------
  Reclasificar 39 Site Monitors:
    - Cambiar vendor: unknown -> alg
    - Cambiar protocolo: ICMP -> snmpV2c
    - Asignar perfil: ALG Site Monitor (integrado)
  Meta: pasar a ~55 hosts midiendo

  FASE 3: CLASIFICACION COMPLETA (2 semanas)
  -------------------------------------------------------
  [  ] Identificar 0 hosts sin clasificar
  [  ] Investigar 21 hosts offline
  [  ] Coordenadas GPS exactas para mapa
  [  ] Activar 'Notify when host is degraded'
  Meta: 76/76 clasificados y monitoreados (100%)

================================================================================
  16. METRICAS OBJETIVO
================================================================================

  Estado actual:      18/76 midiendo SNMP = 23%
  Post Fase 1:        25/76 = 32%
  Post Fase 2:        55/76 = 72%
  Post Fase 3:        76/76 = 100%

  Estado          |  SNMP | Barra                         
  ----------------+-------+-------------------------------
  Actual          |   23% | #######
  Fase 1          |   32% | ##########
  Fase 2          |   72% | ########################
  Fase 3 (meta)   |  100% | #################################

================================================================================
  17. ANEXOS
================================================================================

  A. Archivos de configuracion:
     ~/Library/Application Support/NOCBoardEnergia/config.json
     ~/Library/Application Support/NOCBoardEnergia/hosts.json

  B. OIDs por vendor (Enterprise):
     Eltek:   1.3.6.1.4.1.12148.*
     Samlex:  1.3.6.1.4.1.49075.*
     ALGCom:  1.3.6.1.4.1.49136.*
     MEI:     1.3.6.1.4.1.21940.*
     Vertiv:  1.3.6.1.4.1.6302.*
     WatchDog:1.3.6.1.4.1.21239.*

  C. Telegram:
     Bot: @xcien_nocboard_bot
     Canal: NOCBOARD ENERGIA (-1003763039964)
     Bot reportes: @jmmc2026_bot (chat 6609271992)

  D. Puertos:
     NOCBoard API: localhost:9404
     XCIEN Backend: localhost:8002
     XCIEN Frontend: localhost:8080
     SNMP: UDP 161
     Syslog: UDP 514

  E. Obsidian:
     /Users/mesquite/Documents/CerebroDigital/XCIEN_2.0/

  F. Repositorio:
     github.com/jmmcmx/portal-command-center

================================================================================
  FIN DEL DOCUMENTO
  Generado: 2026-06-23 13:30
  NOCBoard Energia v3.9.6 — XCIEN Networks
================================================================================