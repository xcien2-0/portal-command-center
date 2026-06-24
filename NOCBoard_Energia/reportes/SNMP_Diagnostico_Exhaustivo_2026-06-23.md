================================================================================
  REPORTE EXHAUSTIVO — DIAGNOSTICO SNMP NOCBoard Energia v3.9.6
  XCIEN Networks — Infraestructura de Energia
================================================================================
  Fecha: 2026-06-23 | Generado automaticamente
  Total hosts monitoreados: 76
  Version NOCBoard: 3.9.6
================================================================================

================================================================================
  SECCION 1: DASHBOARD EJECUTIVO
================================================================================

  DISPONIBILIDAD GENERAL
  ========================================
  Online:   54 / 76  (71%)
  Offline:  22 / 76  (28%)

  COBERTURA SNMP
  ========================================
  SNMP v2c configurado:     26 / 76  (34%)
    - Midiendo completo:    18
    - Midiendo parcial:      0
    - Sin metricas:          8  (todos offline)
  Solo ICMP (ping):         49 / 76  (64%)
  ModbusTCP:                 1 / 76

  DISTRIBUCION POR VENDOR
  ========================================
          unknown:  39 hosts
           samlex:  19 hosts
            eltek:  12 hosts
              mei:   5 hosts
          victron:   1 hosts

  DISTRIBUCION POR CIUDAD (20 ciudades)
  ========================================
                  Monterrey:  45 hosts
                  Querétaro:   5 hosts
                   Saltillo:   4 hosts
             Piedras Negras:   3 hosts
            San Luis Potosí:   2 hosts
                    Reynosa:   2 hosts
                    Tampico:   2 hosts
                  Chihuahua:   1 hosts
                     México:   1 hosts
                    Torreón:   1 hosts
                  Naucalpan:   1 hosts
          Gustavo A. Madero:   1 hosts
                 Cuautitlan:   1 hosts
                 Iztapalapa:   1 hosts
                    Metepec:   1 hosts
                     Toluca:   1 hosts
             Melchor Ocampo:   1 hosts
        Ecatepec de Morelos:   1 hosts
               Tlalnepantla:   1 hosts
                  Coyotepec:   1 hosts

================================================================================
  SECCION 2: DETALLE DE HOSTS SNMP v2c (26 hosts)
================================================================================

  [01] MONTERREY_PDA_PLANTA-ELTEK
      IP: 172.30.111.246  |  Ciudad: Monterrey  |  Sitio: PDA
      Vendor: eltek  |  Tipo: rectifier
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 100
      Ping: latencia=5.027ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - batteryCurrent: -63A
        - batterySOC: 0%
        - batteryTemperature: 0C
        - batteryVoltage: 54.32V
        - loadCurrent: 16.6A
        - mainsVoltage: 239V
        - rectifierCount: 3
        - rectifierOutputCurrent: 9.9A

  [02] MONTERREY_ANTIGUA-ESTANZUELA_PLANTA-ELTEK
      IP: 172.30.246.250  |  Ciudad: Monterrey  |  Sitio: Antigua Estanzuela
      Vendor: eltek  |  Tipo: rectifier
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 100
      Ping: latencia=9.418ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - batteryCurrent: 0A
        - batterySOC: 0%
        - batteryTemperature: 0C
        - batteryVoltage: 53.46V
        - loadCurrent: 0.5A
        - mainsVoltage: 251V
        - rectifierCount: 3
        - rectifierOutputCurrent: 0.5A

  [03] MONTERREY_MITRAS_PLANTA-ELTEK
      IP: 172.30.90.98  |  Ciudad: Monterrey  |  Sitio: Mitras
      Vendor: eltek  |  Tipo: rectifier
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 99.96549999999999
      Ping: latencia=10.299ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - batteryCurrent: -7A
        - batterySOC: 50%
        - batteryTemperature: 0C
        - batteryVoltage: 53.47V
        - loadCurrent: 10.7A
        - mainsVoltage: 220V
        - rectifierCount: 3
        - rectifierOutputCurrent: 9.8A

  [04] MONTERREY_MITRAS_INVERSOR-SAMLEX
      IP: 172.30.90.102  |  Ciudad: Monterrey  |  Sitio: Mitras
      Vendor: samlex  |  Tipo: inverter
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 100
      Ping: latencia=7.436ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - acOutputVoltage: 122.5V
        - batteryVoltage: 53.2V
        - loadPower: 422.3
        - mainsFrequency: 0
        - mainsPresent: False
        - mainsVoltage: 0V

  [05] MONTERREY_SENDERO_PLANTA-ELTEK
      IP: 172.30.109.194  |  Ciudad: Monterrey  |  Sitio: Sendero
      Vendor: eltek  |  Tipo: rectifier
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 100
      Ping: latencia=7.483ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - batteryCurrent: -7A
        - batterySOC: 100%
        - batteryTemperature: 0C
        - batteryVoltage: 53.52V
        - loadCurrent: 15.9A
        - mainsVoltage: 245V
        - rectifierCount: 3
        - rectifierOutputCurrent: 15A

  [06] SALTILLO_MECASA-RAMOS_PLANTA-ELTEK
      IP: 172.18.13.190  |  Ciudad: Saltillo  |  Sitio: Mecasa Ramos
      Vendor: eltek  |  Tipo: rectifier
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 99.58196153846154
      Ping: latencia=13.623ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - batteryCurrent: 0A
        - batterySOC: 100%
        - batteryTemperature: 0C
        - loadCurrent: 7.5A
        - mainsVoltage: 216V
        - rectifierCount: 3
        - rectifierOutputCurrent: 6.8A
        - rectifierOutputVoltage: 54.56V

  [07] QUERÉTARO_JURIQUILLA_INVERSOR-SAMLEX
      IP: 172.25.138.250  |  Ciudad: Querétaro  |  Sitio: Juriquilla
      Vendor: samlex  |  Tipo: inverter
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 94.35113846153845
      Ping: latencia=61.196ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - acOutputVoltage: 120.8V
        - batteryVoltage: 26.8V
        - loadPower: 0
        - mainsFrequency: 60
        - mainsPresent: True
        - mainsVoltage: 125.5V

  [08] QUERÉTARO_BANDERA_INVERSOR-SAMLEX
      IP: 172.25.131.162  |  Ciudad: Querétaro  |  Sitio: Bandera
      Vendor: samlex  |  Tipo: inverter
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 94.37855384615384
      Ping: latencia=60.899ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - acOutputVoltage: 120.9V
        - batteryVoltage: 26.9V
        - loadPower: 0
        - mainsFrequency: 59.9
        - mainsPresent: True
        - mainsVoltage: 117.3V

  [09] QUERÉTARO_TEC100_INVERSOR-SAMLEX
      IP: 172.25.132.246  |  Ciudad: Querétaro  |  Sitio: Tec100
      Vendor: samlex  |  Tipo: inverter
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 94.384
      Ping: latencia=60.84ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - acOutputVoltage: 121V
        - batteryVoltage: 26.9V
        - loadPower: 0
        - mainsFrequency: 60
        - mainsPresent: True
        - mainsVoltage: 127.8V

  [10] CHIHUAHUA_PANAMERICANA_INVERSOR-SAMLEX
      IP: 10.33.8.250  |  Ciudad: Chihuahua  |  Sitio: Panamericana
      Vendor: samlex  |  Tipo: inverter
      Status: offline  |  SNMP: SIN DATOS
      Health Score: 0
      Ping: latencia=?ms  loss=100%
      >>> HOST OFFLINE - No se pueden leer OIDs

  [11] MONTERREY_MONTEMORELOS_INVERSOR-SAMLEX
      IP: 172.30.13.226  |  Ciudad: Monterrey  |  Sitio: Montemorelos
      Vendor: samlex  |  Tipo: inverter
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 99.80915384615385
      Ping: latencia=11.654ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - acOutputVoltage: 120.8V
        - batteryVoltage: 27V
        - loadPower: 0
        - mainsFrequency: 59.9
        - mainsPresent: True
        - mainsVoltage: 123.1V

  [12] MONTERREY_MIRASUR_INVERSOR-SAMLEX
      IP: 172.30.162.38  |  Ciudad: Monterrey  |  Sitio: Mirasur
      Vendor: samlex  |  Tipo: inverter
      Status: offline  |  SNMP: SIN DATOS
      Health Score: 0
      Ping: latencia=?ms  loss=100%
      >>> HOST OFFLINE - No se pueden leer OIDs

  [13] MONTERREY_DENIS_INVERSOR-SAMLEX
      IP: 172.30.176.238  |  Ciudad: Monterrey  |  Sitio: Denis
      Vendor: samlex  |  Tipo: inverter
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 100
      Ping: latencia=6.301ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - acOutputVoltage: 121V
        - batteryVoltage: 26.9V
        - loadPower: 0
        - mainsFrequency: 60
        - mainsPresent: True
        - mainsVoltage: 121.5V

  [14] MONTERREY_NORTE_INVERSOR-SAMLEX
      IP: 172.30.91.254  |  Ciudad: Monterrey  |  Sitio: Norte
      Vendor: samlex  |  Tipo: inverter
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 100
      Ping: latencia=6.742ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - acOutputVoltage: 121V
        - batteryVoltage: 53.5V
        - loadPower: 293.7
        - mainsFrequency: 0
        - mainsPresent: False
        - mainsVoltage: 0V

  [15] MONTERREY_SANTA-ROSA_INVERSOR-SAMLEX
      IP: 172.30.220.70  |  Ciudad: Monterrey  |  Sitio: Santa Rosa
      Vendor: samlex  |  Tipo: inverter
      Status: offline  |  SNMP: SIN DATOS
      Health Score: 0
      Ping: latencia=?ms  loss=100%
      >>> HOST OFFLINE - No se pueden leer OIDs

  [16] MONTERREY_PURISIMA_INVERSOR-SAMLEX
      IP: 172.30.99.166  |  Ciudad: Monterrey  |  Sitio: Purisima
      Vendor: samlex  |  Tipo: inverter
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 100
      Ping: latencia=4.669ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - acOutputVoltage: 121V
        - batteryVoltage: 26.9V
        - loadPower: 0
        - mainsFrequency: 59.9
        - mainsPresent: True
        - mainsVoltage: 112.2V

  [17] MONTERREY_PDA_INVERSOR-SAMLEX
      IP: 172.30.111.54  |  Ciudad: Monterrey  |  Sitio: PDA
      Vendor: samlex  |  Tipo: inverter
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 100
      Ping: latencia=5.018ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - acOutputVoltage: 122.3V
        - batteryVoltage: 56.6V
        - loadPower: 484
        - mainsFrequency: 0
        - mainsPresent: False
        - mainsVoltage: 0V

  [18] SAN-LUIS-POTOSÍ_EDIFICIO-EME_INVERSOR-SAMLEX
      IP: 10.40.1.238  |  Ciudad: San Luis Potosí  |  Sitio: Edificio EME
      Vendor: samlex  |  Tipo: inverter
      Status: offline  |  SNMP: SIN DATOS
      Health Score: 0
      Ping: latencia=?ms  loss=100%
      >>> HOST OFFLINE - No se pueden leer OIDs

  [19] MONTERREY_LOMA_INVERSOR-SAMLEX
      IP: 172.30.56.66  |  Ciudad: Monterrey  |  Sitio: Loma
      Vendor: samlex  |  Tipo: inverter
      Status: offline  |  SNMP: SIN DATOS
      Health Score: 0
      Ping: latencia=?ms  loss=100%
      >>> HOST OFFLINE - No se pueden leer OIDs

  [20] MÉXICO_TEPETLIXPA_INVERSOR-SAMLEX
      IP: 10.60.105.250  |  Ciudad: México  |  Sitio: Tepetlixpa
      Vendor: samlex  |  Tipo: inverter
      Status: offline  |  SNMP: SIN DATOS
      Health Score: 0
      Ping: latencia=?ms  loss=100%
      >>> HOST OFFLINE - No se pueden leer OIDs

  [21] REYNOSA_MEYBI_INVERSOR-SAMLEX
      IP: 172.20.47.242  |  Ciudad: Reynosa  |  Sitio: Meybi
      Vendor: samlex  |  Tipo: inverter
      Status: offline  |  SNMP: SIN DATOS
      Health Score: 0
      Ping: latencia=?ms  loss=100%
      >>> HOST OFFLINE - No se pueden leer OIDs

  [22] QUERÉTARO_COLORADO_PLANTA-ELTEK
      IP: 172.25.134.246  |  Ciudad: Querétaro  |  Sitio: Colorado
      Vendor: eltek  |  Tipo: rectifier
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 94.45101538461539
      Ping: latencia=60.114ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - batteryCurrent: 0A
        - batterySOC: 50%
        - batteryTemperature: 0C
        - loadCurrent: 8.1A
        - mainsVoltage: 223V
        - rectifierCount: 3
        - rectifierOutputCurrent: 7.8A
        - rectifierOutputVoltage: 53.52V

  [23] MONTERREY_INDEPENDENCIA_PLANTA-ELTEK
      IP: 172.26.18.20  |  Ciudad: Monterrey  |  Sitio: Independencia
      Vendor: eltek  |  Tipo: rectifier
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 99.36446153846154
      Ping: latencia=15.508ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - batteryCurrent: 0A
        - batterySOC: 100%
        - batteryTemperature: 0C
        - loadCurrent: 2.1A
        - mainsVoltage: 247V
        - rectifierCount: 3
        - rectifierOutputCurrent: 2A
        - rectifierOutputVoltage: 53.45V

  [24] MONTERREY_INDEPENDENCIA_INVERSOR-SAMLEX
      IP: 172.26.18.21  |  Ciudad: Monterrey  |  Sitio: Independencia
      Vendor: samlex  |  Tipo: inverter
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 100
      Ping: latencia=4.519ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - acOutputVoltage: 121.1V
        - batteryVoltage: 53.3V
        - loadPower: 0
        - mainsFrequency: 59.9
        - mainsPresent: True
        - mainsVoltage: 125V

  [25] QUERÉTARO_CARRTERA-57_INVERSOR-SAMLEX
      IP: 10.40.11.242  |  Ciudad: Querétaro  |  Sitio: Carrtera 57
      Vendor: samlex  |  Tipo: inverter
      Status: offline  |  SNMP: SIN DATOS
      Health Score: 0
      Ping: latencia=?ms  loss=100%
      >>> HOST OFFLINE - No se pueden leer OIDs

  [26] MONTERREY_HUINALA_INVERSOR-SAMLEX
      IP: 172.30.119.238  |  Ciudad: Monterrey  |  Sitio: Huinala
      Vendor: samlex  |  Tipo: inverter
      Status: online  |  SNMP: MIDIENDO OK
      Health Score: 100
      Ping: latencia=6.352ms  loss=0%
      Ultimo poll: 2026-06-23T15:02:12Z
      Metricas:
        - acOutputVoltage: 121V
        - batteryVoltage: 53.2V
        - loadPower: 0
        - mainsFrequency: 60
        - mainsPresent: True
        - mainsVoltage: 122V

================================================================================
  SECCION 3: HOSTS ICMP CON VENDOR CONOCIDO — DEBEN SER SNMP (10)
================================================================================

  ESTOS HOSTS NUNCA VAN A MEDIR OIDs PORQUE ESTAN EN MODO ICMP (SOLO PING)
  ACCION REQUERIDA: Cambiar protocolo a snmpV2c desde GUI de NOCBoard

  [01] MONTERREY_PESQUERIA_PLANTA-ELTEK
      IP: 172.30.206.2  |  Vendor: eltek  |  Status: online
      Community sugerida: snmpxcien  |  Perfil: Eltek (integrado)
      PRIORIDAD: ALTA - esta online, se puede activar ya

  [02] SAN-LUIS-POTOSÍ_EDIFICIO-EME_PLANTA-ELTEK
      IP: 10.40.1.234  |  Vendor: eltek  |  Status: offline
      Community sugerida: snmpxcien  |  Perfil: Eltek (integrado)
      PRIORIDAD: MEDIA - offline, activar cuando vuelva

  [03] PIEDRAS-NEGRAS_PIEDRAS-NEGRAS_PLANTA-MEI
      IP: 10.20.9.242  |  Vendor: mei  |  Status: online
      Community sugerida: snmpxcien  |  Perfil: MEI (integrado)
      PRIORIDAD: ALTA - esta online, se puede activar ya

  [04] REYNOSA_LIBRAMIENTO_PLANTA-MEI
      IP: 172.20.12.246  |  Vendor: mei  |  Status: offline
      Community sugerida: snmpxcien  |  Perfil: MEI (integrado)
      PRIORIDAD: MEDIA - offline, activar cuando vuelva

  [05] TORREÓN_TORREÓN_PLANTA-MEI
      IP: 10.80.1.251  |  Vendor: mei  |  Status: offline
      Community sugerida: snmpxcien  |  Perfil: MEI (integrado)
      PRIORIDAD: MEDIA - offline, activar cuando vuelva

  [06] PIEDRAS-NEGRAS_ACUÑA_PLANTA-MEI
      IP: 10.20.28.250  |  Vendor: mei  |  Status: online
      Community sugerida: snmpxcien  |  Perfil: MEI (integrado)
      PRIORIDAD: ALTA - esta online, se puede activar ya

  [07] PIEDRAS-NEGRAS_APOLO_PLANTA-MEI
      IP: 10.20.25.250  |  Vendor: mei  |  Status: online
      Community sugerida: snmpxcien  |  Perfil: MEI (integrado)
      PRIORIDAD: ALTA - esta online, se puede activar ya

  [08] MONTERREY_HUINALA_PLANTA-ELTEK
      IP: 172.30.119.234  |  Vendor: eltek  |  Status: online
      Community sugerida: snmpxcien  |  Perfil: Eltek (integrado)
      PRIORIDAD: ALTA - esta online, se puede activar ya

  [09] MONTERREY_JUAREZ-BLANCAS_PLANTA-ELTEK
      IP: 172.30.203.246  |  Vendor: eltek  |  Status: online
      Community sugerida: snmpxcien  |  Perfil: Eltek (integrado)
      PRIORIDAD: ALTA - esta online, se puede activar ya

  [10] MONTERREY_SEMINARIO_PLANTA-ELTEK
      IP: 172.30.247.250  |  Vendor: eltek  |  Status: online
      Community sugerida: snmpxcien  |  Perfil: Eltek (integrado)
      PRIORIDAD: ALTA - esta online, se puede activar ya

================================================================================
  SECCION 4: SITE MONITORS ALGCom (39)
================================================================================

  Los Site Monitor ALG SM9S son dispositivos SNMP que monitorean:
  - Voltaje AC (CFE)
  - Temperatura ambiente
  - Estado de puertas/gabinetes
  - Alarmas de intrusion

  PROBLEMA: Estan como vendor=unknown y protocolo ICMP
  SOLUCION: Reclasificar + cambiar a snmpV2c + perfil 'ALG Site Monitor'

  Online: 29  |  Offline: 10

  [01] MONTERREY_JUAREZ-BLANCAS_SITE-MONITOR
      IP: 172.30.203.250  |  Ciudad: Monterrey  |  Status: online
  [02] MONTERREY_NORTE_SITE-MONITOR
      IP: 172.30.91.150  |  Ciudad: Monterrey  |  Status: online
  [03] MONTERREY_DENIS_SITE-MONITOR
      IP: 172.30.176.234  |  Ciudad: Monterrey  |  Status: online
  [04] MONTERREY_MITRAS_SITE-MONITOR
      IP: 172.30.85.126  |  Ciudad: Monterrey  |  Status: online
  [05] MONTERREY_NIMIW_SITE-MONITOR
      IP: 172.30.17.182  |  Ciudad: Monterrey  |  Status: online
  [06] MONTERREY_PESQUERIA_SITE-MONITOR
      IP: 172.30.206.234  |  Ciudad: Monterrey  |  Status: online
  [07] MONTERREY_INDEPENDENCIA_SITE-MONITOR
      IP: 172.30.20.22  |  Ciudad: Monterrey  |  Status: offline
  [08] MONTERREY_HIDALGO_SITE-MONITOR
      IP: 172.30.22.250  |  Ciudad: Monterrey  |  Status: online
  [09] MONTERREY_JUAREZ_SITE-MONITOR
      IP: 172.30.87.246  |  Ciudad: Monterrey  |  Status: online
  [10] MONTERREY_CADEREYTA_SITE-MONITOR
      IP: 172.30.2.86  |  Ciudad: Monterrey  |  Status: offline
  [11] MONTERREY_SANTA-ROSA_SITE-MONITOR
      IP: 172.30.16.246  |  Ciudad: Monterrey  |  Status: online
  [12] MONTERREY_PURISIMA_SITE-MONITOR
      IP: 172.30.99.118  |  Ciudad: Monterrey  |  Status: online
  [13] MONTERREY_SENDERO_SITE-MONITOR
      IP: 172.30.116.110  |  Ciudad: Monterrey  |  Status: online
  [14] MONTERREY_LOMA_SITE-MONITOR
      IP: 172.30.14.250  |  Ciudad: Monterrey  |  Status: online
  [15] MONTERREY_MONTEMORELOS_SITE-MONITOR
      IP: 172.30.13.222  |  Ciudad: Monterrey  |  Status: online
  [16] MONTERREY_KRISTALES_SITE-MONITOR
      IP: 172.30.51.254  |  Ciudad: Monterrey  |  Status: online
  [17] MONTERREY_GUADALUPE_SITE-MONITOR
      IP: 172.30.33.202  |  Ciudad: Monterrey  |  Status: online
  [18] MONTERREY_HUALAHUISES_SITE-MONITOR
      IP: 172.30.160.70  |  Ciudad: Monterrey  |  Status: online
  [19] MONTERREY_STA-CATARINA_SITE-MONITOR
      IP: 172.30.47.238  |  Ciudad: Monterrey  |  Status: online
  [20] MONTERREY_EL-CARMEN_SITE-MONITOR
      IP: 172.30.36.254  |  Ciudad: Monterrey  |  Status: online
  [21] MONTERREY_PUEBLO-NUEVO_SITE-MONITOR
      IP: 172.30.96.250  |  Ciudad: Monterrey  |  Status: online
  [22] MONTERREY_ROJAS_SITE-MONITOR
      IP: 172.30.48.250  |  Ciudad: Monterrey  |  Status: online
  [23] MONTERREY_SEMINARIO_SITE-MONITOR
      IP: 172.30.247.246  |  Ciudad: Monterrey  |  Status: online
  [24] TAMPICO_ARBOLEDAS_SITE-MONITOR
      IP: 172.30.99.146  |  Ciudad: Tampico  |  Status: offline
  [25] TAMPICO_TAMPICO_SITE-MONITOR
      IP: 10.70.0.250  |  Ciudad: Tampico  |  Status: offline
  [26] SALTILLO_DERRAMADEREO_SITE-MONITOR
      IP: 172.19.83.250  |  Ciudad: Saltillo  |  Status: online
  [27] SALTILLO_LOFT_SITE-MONITOR
      IP: 172.18.78.234  |  Ciudad: Saltillo  |  Status: online
  [28] SALTILLO_ACHERBIS_SITE-MONITOR
      IP: 172.18.29.194  |  Ciudad: Saltillo  |  Status: online
  [29] MONTERREY_SANTIAGO-II_SITE-MONITOR
      IP: 172.30.12.246  |  Ciudad: Monterrey  |  Status: online
  [30] NAUCALPAN_NAUCALPAN_SITE-MONITOR
      IP: 10.61.0.254  |  Ciudad: Naucalpan  |  Status: online
  [31] GUSTAVO-A.-MADERO_VALLEJO_SITE-MONITOR
      IP: 10.61.20.254  |  Ciudad: Gustavo A. Madero  |  Status: online
  [32] CUAUTITLAN_CUAUTITLAN_SITE-MONITOR
      IP: 10.61.50.254  |  Ciudad: Cuautitlan  |  Status: offline
  [33] IZTAPALAPA_CENTRAL-DE-ABASTOS_SITE-MONITOR
      IP: 10.61.40.254  |  Ciudad: Iztapalapa  |  Status: online
  [34] METEPEC_TOTOLTEPEC_SITE-MONITOR
      IP: 10.60.10.242  |  Ciudad: Metepec  |  Status: online
  [35] TOLUCA_TOLULCA-2000_SITE-MONITOR
      IP: 10.61.30.254  |  Ciudad: Toluca  |  Status: offline
  [36] MELCHOR-OCAMPO_XOCHIMIQUIA_SITE-MONITOR
      IP: 10.60.53.241  |  Ciudad: Melchor Ocampo  |  Status: offline
  [37] ECATEPEC-DE-MORELOS_XALOSTOC_SITE-MONITOR
      IP: 10.60.80.245  |  Ciudad: Ecatepec de Morelos  |  Status: offline
  [38] TLALNEPANTLA_TLANEPANTLA_SITE-MONITOR
      IP: 10.60.23.253  |  Ciudad: Tlalnepantla  |  Status: offline
  [39] COYOTEPEC_COYOTEPEC_SITE-MONITOR
      IP: 172.28.1.250  |  Ciudad: Coyotepec  |  Status: offline

================================================================================
  SECCION 5: HOSTS SIN CLASIFICAR (0)
================================================================================

  Estos hosts necesitan identificacion de marca/modelo en campo


================================================================================
  SECCION 6: PERFILES SNMP DISPONIBLES EN v3.9.6
================================================================================

  Perfiles precargados: 7
  - Eltek (integrado) (OIDs integrados en firmware)
  - Vertiv / Emerson (integrado) (OIDs integrados en firmware)
  - MEI (integrado) (OIDs integrados en firmware)
  - Samlex (integrado) (OIDs integrados en firmware)
  - ALG Site Monitor (integrado) (OIDs integrados en firmware)
  - ALG DC UPS (integrado) (OIDs integrados en firmware)
  - WatchDog (integrado) (OIDs integrados en firmware)

  NOTA: Los perfiles v3.9.6 son integrados — los OIDs estan en el firmware
  de NOCBoard, no en config.json. Por eso aparecen con 0 OIDs en el archivo
  pero funcionan correctamente cuando se asignan a un host.

  Vendors soportados y perfiles recomendados:
  - Eltek (rectificadores)     -> 'Eltek (integrado)'
  - Samlex (inversores)         -> 'Samlex (integrado)'
  - ALGCom Site Monitor (SM9S)  -> 'ALG Site Monitor (integrado)'
  - ALGCom DC UPS              -> 'ALG DC UPS (integrado)'
  - MEI (rectificadores)        -> 'MEI (integrado)'
  - Vertiv/Emerson              -> 'Vertiv / Emerson (integrado)'
  - WatchDog (ambiental)        -> 'WatchDog (integrado)'

================================================================================
  SECCION 7: ANALISIS DE CAUSA RAIZ — POR QUE NO MIDEN OIDs
================================================================================

  CAUSA 1: PROTOCOLO INCORRECTO (49 de 76 hosts = 64%)
  ------------------------------------------------------------
  49 hosts tienen protocolo ICMP. ICMP = ping solamente.
  El ping verifica si el host esta vivo, pero NUNCA lee OIDs SNMP.
  Para leer voltaje, corriente, temperatura, etc. se necesita snmpV2c.

  Impacto: 49 hosts que podrian estar midiendo pero no lo hacen
  Solucion: Cambiar protocolo en GUI de NOCBoard (host por host)
  Esfuerzo: ~2 min por host = ~1.5 horas total

  CAUSA 2: HOST OFFLINE (22 de 76 hosts = 29%)
  ------------------------------------------------------------
  22 hosts no responden a ping ni a SNMP.
  De estos, 8 tienen SNMP configurado pero no pueden comunicarse.

  Sub-causas posibles:
  a) VPN caida entre NOCBoard y la radiobase
  b) Equipo de energia apagado o sin alimentacion
  c) IP cambiada sin actualizar en NOCBoard
  d) Firewall/ACL bloqueando UDP 161 (SNMP)

  CAUSA 3: VENDOR NO CLASIFICADO (39 hosts)
  ------------------------------------------------------------
  39 hosts tienen vendor=unknown. Incluso si cambiamos a snmpV2c,
  NOCBoard no sabra que OIDs consultar sin un perfil asignado.
  Los Site Monitors (22) son ALGCom pero no estan clasificados.

  CAUSA 4: COMMUNITY STRING INCORRECTA (potencial)
  ------------------------------------------------------------
  Community global actual: NO CONFIGURADA
  Overrides: {}

  La mayoria de dispositivos XCIEN usan community='snmpxcien'
  Excepciones conocidas: Mitras y PDA usan community='read'
  Si la community no coincide, el dispositivo rechaza la consulta SNMP
  silenciosamente (no hay error visible, simplemente no responde)

================================================================================
  SECCION 8: LABORATORIO DE PRUEBAS — SITIO INDEPENDENCIA
================================================================================

  Sitio seleccionado como laboratorio para validar SNMP + alarmas
  antes de replicar configuracion a toda la red XCIEN.

  Dispositivos en Independencia: 4

  > MONTERREY_INDEPENDENCIA_PLANTA-ELTEK
    IP: 172.26.18.20
    Protocolo: snmpV2c
    Vendor: eltek
    Status: online
    Health: 99.36446153846154
    Metricas:
      batteryCurrent: 0
      batterySOC: 100
      batteryTemperature: 0
      loadCurrent: 2.1
      mainsVoltage: 247
      rectifierCount: 3
      rectifierOutputCurrent: 2
      rectifierOutputVoltage: 53.45

  > MONTERREY_INDEPENDENCIA_INVERSOR-SAMLEX
    IP: 172.26.18.21
    Protocolo: snmpV2c
    Vendor: samlex
    Status: online
    Health: 100
    Metricas:
      acOutputVoltage: 121.1
      batteryVoltage: 53.3
      loadPower: 0
      mainsFrequency: 59.9
      mainsPresent: True
      mainsVoltage: 125

  > MONTERREY_INDEPENDENCIA_VICTRO
    IP: 172.26.18.106
    Protocolo: modbusTCP
    Vendor: victron
    Status: offline
    Health: 0
    Metricas:

  > MONTERREY_INDEPENDENCIA_SITE-MONITOR
    IP: 172.30.20.22
    Protocolo: icmp
    Vendor: ?
    Status: offline
    Health: 0

  PLAN DE PRUEBAS INDEPENDENCIA:
  1. Validar que los 3 dispositivos SNMP midan correctamente
  2. Configurar umbrales de alarma en NOCBoard:
     - Voltaje bateria < 46V -> alarma critica
     - Voltaje bateria < 48V -> alarma warning
     - Voltaje CFE = 0V -> alarma corte de energia
     - Temperatura > 45C -> alarma temperatura
  3. Probar notificaciones Telegram (@xcien_nocboard_bot)
  4. Simular falla: desconectar CFE y verificar cascada de alarmas
  5. Documentar comportamiento esperado vs real
  6. Crear plantilla de configuracion replicable

================================================================================
  SECCION 9: PLAN DE ACCION COMPLETO
================================================================================

  FASE 1: LABORATORIO INDEPENDENCIA (hoy)
  --------------------------------------------------
  1.1 Verificar SNMP de los 3 dispositivos Independencia
  1.2 Configurar alarmas y umbrales
  1.3 Probar notificaciones Telegram
  1.4 Simular escenarios de falla
  1.5 Documentar resultados

  FASE 2: VENDOR CONOCIDO (esta semana)
  --------------------------------------------------
  2.1 Cambiar 10 hosts ICMP con vendor a snmpV2c
  2.2 Asignar perfiles SNMP correctos
  2.3 Verificar metricas en cada uno
  2.4 Meta: pasar de 18 a 28 hosts midiendo

  FASE 3: SITE MONITORS ALG (proxima semana)
  --------------------------------------------------
  3.1 Reclasificar 22 Site Monitors como ALGCom
  3.2 Cambiar a snmpV2c + perfil ALG Site Monitor
  3.3 Meta: pasar de 28 a 50 hosts midiendo

  FASE 4: CLASIFICACION COMPLETA (2 semanas)
  --------------------------------------------------
  4.1 Identificar vendor de 17 hosts desconocidos
  4.2 Investigar 22 hosts offline
  4.3 Meta: 76/76 clasificados y monitoreados

  METRICAS OBJETIVO:
  Actual:    18/76 midiendo OIDs = 23%
  Fase 1:    Validacion en Independencia
  Fase 2:    ~28/76 = 37%
  Fase 3:    ~50/76 = 66%
  Fase 4:    76/76 = 100%

================================================================================
  FIN DEL REPORTE
================================================================================