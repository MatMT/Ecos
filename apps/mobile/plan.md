# ECOS: Guía Técnica de Arquitectura Móvil, Edge Computing e Interfaces

**Cliente Móvil, Inferencia en el Borde y Conectividad con el Panel Clínico**

*React Native (Expo Router) · ExecuTorch (On-Device PyTorch) · SQLite · Bluetooth Low Energy (Nexo Band / ESP32) · NestJS / Supabase Auth*

**Propósito:** Definir la arquitectura integral, especificación de componentes de interfaz (UI), persistencia local *offline-first*, pipeline de inferencia biométrica en el borde (*Edge AI*) y contratos de integración con el nuevo backend clínico de ECOS, garantizando que el procesamiento sensible permanezca en el dispositivo del usuario bajo políticas estrictas de privacidad (Shape C).

---

## 1. Objetivo, Alcance y Decisiones de Diseño

El sistema móvil de ECOS actúa como el puente orquestador entre el hardware vestible (**Nexo Band**), el modelo de inteligencia artificial en el dispositivo (**ExecuTorch**) y la infraestructura de servicios clínicos centralizada. Esta especificación define el desarrollo sobre `apps/mobile` para consumir los 14 nuevos módulos del backend (migración UUID GoTrue, RLS Shape A/B/C) sin comprometer la privacidad del estudiante ni sobrecargar la base de datos central con telemetría de alta frecuencia.

```
[ Nexo Band / ESP32 ] 
       │  (BLE Notify: tramas binarias compactas cada 1s - 5s)
       ▼
[ Mobile Edge Pipeline (apps/mobile) ]
  ├── 1. BLE Telemetry Manager (use-esp32-ble)
  ├── 2. SQLite Buffer Local (Chunks crudos, purga a las 48h)
  ├── 3. Feature Extractor (HRV, Delta, Ventana deslizante 10 timesteps)
  ├── 4. ExecuTorch Engine (model.pte -> Autoencoder Anomaly Detection)
  └── 5. Dispatcher / Sync Engine (Supabase Auth / HTTPS REST)
       │
       ├── (POST /biometrics/summary -> Ventanas agregadas horarias)
       ├── (POST /alerts -> Disparo de alerta si MSE > Umbral o Botón de Pánico)
       └── (POST /shared-content -> Snapshots autorizados del diario)
       ▼
[ ECOS Clinical Backend (NestJS + PostgreSQL RLS) ]

```

### 1.1 Decisiones Confirmadas para la Capa Móvil

| Decisión | Criterio Técnico y Arquitectónico |
| --- | --- |
| **Separación Edge vs. Backend** | Toda la detección de anomalías y filtrado biométrico ocurre en el cliente móvil. El servidor nunca recibe señales crudas por segundo; solo almacena resúmenes horarios y eventos de alerta procesados.

 |
| **Privacidad Estricta del Diario (Shape C)** | El modelo `remote_emotional_journal` permanece restringido exclusivamente al usuario (`auth.uid()`) o en SQLite local. El panel clínico jamás lee esta tabla. Solo se transmiten instantáneas inmutables a `remote_shared_patient_content` cuando el paciente presiona explícitamente "Compartir con terapeuta".

 |
| **Autenticación GoTrue / UUID** | Migración completa a tokens JWT emitidos por Supabase Auth (`/api/v1/auth/login`), validando localmente el token y enlazando las solicitudes con la identidad federada en PostgreSQL (`auth.users.id`). |
| **Estrategia Offline-First** | La aplicación es plenamente operativa sin conexión a internet: almacena telemetría, ejecuta inferencia local y encola alertas o reflexiones en SQLite para sincronización posterior con reintentos exponenciales. |

---

## 2. Pipeline de Hardware e IoT (Nexo Band / ESP32)

### 2.1 Especificación del Banco de Pruebas (Dual-Potentiometer Bench Test)

Para validar la lógica de detección sin depender de biosensores analógicos inestables en etapas tempranas, el firmware se estructura en un banco de pruebas analógico de doble potenciómetro:

```
                  +3.3V (ESP32 Rail)
                    │
            ┌───────┴───────┐
            │               │
     [Potenciómetro 1] [Potenciómetro 2]
       (Ritmo Cardíaco)   (Actividad Física)
            │               │
            ▼               ▼
         GPIO 34         GPIO 35
       (ADC1_CH6)      (ADC1_CH7)
            │               │
            └───────┬───────┘
                    │  (Muestreo interno 50 Hz + Media móvil)
            [ ESP32 SoC ]
              ├── GPIO 22: LED Latido (PWM proporcional a BPM)
              ├── GPIO 23: LED Alerta Hardware (Taquicardia en reposo)
              └── BLE GATT Server: Service UUID 0x180D (Heart Rate Custom)

```

* **Canal 1 (GPIO 34 - BPM):** Rango fisiológico mapeado de 45 a 190 BPM.
* **Canal 2 (GPIO 35 - Actividad/Cadencia):** Rango de esfuerzo de 0 a 100% (simula acelerometría/pasos).
* **Acondicionamiento Eléctrico:** Filtro pasa-bajas RC pasivo ($R = 1\,\text{k}\Omega$, $C = 100\,\text{nF}$) en el cursor central de cada potenciómetro para estabilizar el conversor analógico-digital (ADC) de 12 bits ($0 - 4095$) ante transitorios del transceptor de radio.

### 2.2 Protocolo de Comunicación BLE (Bluetooth Low Energy)

Para evitar la fragmentación de la unidad máxima de transferencia (ATT MTU estándar de 23 bytes, útil de 20 bytes), se descarta el envío de texto plano JSON en producción y se implementa una estructura binaria empaquetada:

```c
// Estructura binaria de telemetría (Longitud fija: 6 Bytes)
struct __attribute__((packed)) NexoTelemetryPacket {
    uint8_t  bpm;             // 0 - 255 BPM
    uint8_t  activity_level;  // 0 - 100 % de movimiento relativo
    uint8_t  spo2;            // 0 - 100 % saturación de oxígeno
    uint16_t step_delta;      // Incremento de pasos desde el último paquete
    uint8_t  flags;           // Bit 0: Hardware Alert, Bit 1: Botón físico SOS, Bit 2: Batería baja
};

```

* **Service UUID:** `0000180d-0000-1000-8000-00805f9b34fb` (Heart Rate Service modificado).
* **Characteristic UUID:** `00002a37-0000-1000-8000-00805f9b34fb` (Notificación periódica cada 1000 ms).

---

## 3. Capa de Inteligencia Artificial en el Borde (ExecuTorch)

### 3.1 Modelo de Detección de Anomalías (`model.pte`)

El archivo binario `assets/model.pte` corresponde a un **Autoencoder Denso** optimizado mediante PyTorch Mobile / ExecuTorch. Su objetivo es aprender el patrón de correlación normal entre movimiento y frecuencia cardíaca para detectar desacoples fisiológicos.

* **Entrada del Tensor:** Matriz continua de dimensión `[1, 10, 3]` (10 timesteps secuenciales, 3 canales normalizados por paso).
* **Vector de Características ($t_i$):**
1. $X_0 = \text{BPM} / 220.0$
2. $X_1 = \text{Estrés Sintético} / 100.0$ (estimado mediante delta de pulsaciones vs. media base: $\Delta \text{BPM} \cdot 1.5$)
3. $X_2 = \text{Actividad} / 100.0$ (o pasos acumulados normalizados entre 0 y 200)



```
[ Buffer Rodante (10s) ] ──> [ Normalizador ] ──> [ ExecuTorch Runtime ] ──> [ Tensor Reconstruido ]
 (10 x 3 mediciones)                                 (model.pte)                  (10 x 3)
                                                                                     │
                                    ┌────────────────────────────────────────────────┘
                                    ▼
                     [ Cálculo de Error (MSE) ]
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
       MSE <= Umbral (0.045)                     MSE > Umbral (0.045)
   [ Clasificación: Normal ]             [ Clasificación: ANOMALÍA DETECTADA ]
   • Ejercicio (High BPM + High Act)     • Taquicardia en Reposo (High BPM + Zero Act)
   • Reposo (Low BPM + Zero Act)         • Ataque de Pánico / Crisis Aguda

```

### 3.2 Lógica del Semáforo Clínico en el Dispositivo

```typescript
// apps/mobile/src/services/ai/anomaly-evaluator.ts

export interface AnomalyEvaluationResult {
  state: 'GREEN' | 'YELLOW' | 'RED';
  mse: number;
  triggerEvent: boolean;
  recommendedAction?: 'NONE' | 'BREATHING_EXERCISE' | 'EMERGENCY_MODAL';
}

export function evaluatePhysiologicalState(
  mse: number,
  bpm: number,
  activity: number,
  consecutiveAlerts: number
): AnomalyEvaluationResult {
  // Estado Normal / Esfuerzo Físico
  if (mse < 0.045 || (bpm > 110 && activity > 40)) {
    return { state: 'GREEN', mse, triggerEvent: false, recommendedAction: 'NONE' };
  }

  // Desacople Moderado: Elevación de pulso con actividad baja (< 2 minutos)
  if (mse >= 0.045 && mse < 0.085 && consecutiveAlerts < 3) {
    return {
      state: 'YELLOW',
      mse,
      triggerEvent: false,
      recommendedAction: 'BREATHING_EXERCISE',
    };
  }

  // Crisis Aguda / Desacople Severo Sostenido (Taquicardia en reposo)
  return {
    state: 'RED',
    mse,
    triggerEvent: true,
    recommendedAction: 'EMERGENCY_MODAL',
  };
}

```

---

## 4. Persistencia Local (SQLite Offline-First)

Para garantizar la operación sin cobertura de red y evitar la fuga de datos de salud en reposo, `apps/mobile` implementa una base de datos local SQLite mediante `expo-sqlite`:

```sql
-- Chunks biométricos de alta frecuencia (retención local: 48 horas)
CREATE TABLE IF NOT EXISTS local_biometric_samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    bpm INTEGER NOT NULL,
    activity INTEGER NOT NULL,
    spo2 INTEGER NOT NULL,
    stress_level REAL NOT NULL,
    mse_error REAL NOT NULL,
    is_anomaly INTEGER DEFAULT 0,
    synced_to_summary INTEGER DEFAULT 0
);

-- Diario emocional confidencial (Shape C: No se expone por API)
CREATE TABLE IF NOT EXISTS local_emotional_journal (
    id TEXT PRIMARY KEY, -- UUID v4 local
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    mood_score INTEGER NOT NULL, -- 1 a 5
    primary_emotion TEXT NOT NULL, -- ansioso, triste, neutro, en paz, motivado
    narrative_text TEXT NOT NULL,
    associated_bpm INTEGER,
    associated_stress REAL,
    is_shared_with_therapist INTEGER DEFAULT 0,
    shared_snapshot_id TEXT
);

-- Cola de sincronización saliente hacia el servidor
CREATE TABLE IF NOT EXISTS local_sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    last_error TEXT
);

```

---

## 5. Integración con el Backend Clínico (Contratos API)

La aplicación móvil consume la superficie de API expuesta por el servidor NestJS bajo el prefijo `/api/v1`. A continuación se especifican las integraciones principales:

### 5.1 Autenticación y Perfil

* `POST /api/v1/auth/login`: Autenticación contra Supabase Auth. Retorna `access_token` JWT firmado con claims de GoTrue (`sub` = UUID del usuario).
* `POST /api/v1/auth/refresh`: Renovación silenciosa de sesión.
* `GET /api/v1/students/:id/overview`: Carga agregada de inicio (datos del estudiante, terapeuta asignado, próxima cita programada, plan activo).



### 5.2 Alertas de Seguridad y Botón de Pánico

Cuando el motor Edge detecta un estado crítico sostenido o el usuario pulsa el botón de emergencia en la pantalla principal:

```http
POST /api/v1/alerts HTTP/1.1
Content-Type: application/json
Authorization: Bearer <JWT_ESTUDIANTE>

{
  "studentId": 45,
  "alertType": "panic_button",
  "priority": "critical",
  "contextSummary": "Pulsación voluntaria del botón de pánico. Frecuencia cardíaca registrada: 138 bpm en reposo (Nivel de actividad: 2%).",
  "biometricRecordId": null
}

```

### 5.3 Sincronización de Tendencias y Resúmenes

En lugar de saturar `remote_biometric_records` con miles de filas por día, la aplicación genera agregaciones por hora y las envía periódicamente:

```http
POST /api/v1/biometrics/summary HTTP/1.1
Content-Type: application/json
Authorization: Bearer <JWT_ESTUDIANTE>

{
  "studentId": 45,
  "windowStart": "2026-09-18T14:00:00Z",
  "windowEnd": "2026-09-18T15:00:00Z",
  "averageHeartRate": 78,
  "maxHeartRate": 118,
  "averageStress": 34.5,
  "averageOxygen": 97,
  "totalSteps": 840,
  "anomalyEpisodesCount": 0
}

```

### 5.4 Compartición Segura de Contenido Terapéutico

Si el paciente decide voluntariamente compartir una entrada de su diario local con su terapeuta asignado, se genera un snapshot inmutable en el backend:

```http
POST /api/v1/students/45/shared-content HTTP/1.1
Content-Type: application/json
Authorization: Bearer <JWT_ESTUDIANTE>

{
  "therapistId": 17,
  "contentType": "journal_entry",
  "sourceLocalId": "c8b3e8a2-7201-49b8-a6e1-955dc9fa0821",
  "content": "Registro del 18/09: Me sentí sumamente abrumada antes de entrar al laboratorio de física. Comencé a sentir opresión en el pecho y me costó respirar. Usé la respiración guiada de Ecos durante 3 minutos y logré estabilizarme."
}

```

---

## 6. Especificación Detallada de Pantallas e Interfaces (UI)

La navegación principal utiliza una estructura por pestañas inferiores (*Tab Bar*) complementada con flujos modales de atención prioritaria.

```
Main Navigation Stack
├── (auth)
│    ├── login.tsx
│    └── forgot-password.tsx
└── (protected)
     ├── (tabs)
     │    ├── home.tsx      (Tab 1: Estado Actual, Biometría, Alerta)
     │    ├── stats.tsx     (Tab 2: Evolución, Citas, Contacto Terapeuta)
     │    ├── chat.tsx      (Tab 3: Asistente Preventivo, Diario Local)
     │    └── profile.tsx   (Tab 4: Ajustes, Vinculación Nexo Band)
     └── modals
          ├── breathing-guide.tsx  (Ejercicio de Coherencia Cardíaca)
          └── panic-alert.tsx      (Flujo de Contención y Llamada SOS)

```

---

### 6.1 Pantalla Principal (`home.tsx`) — "Tu Bienestar Hoy"

Diseñada para brindar claridad inmediata sobre el estado fisiológico sin generar estrés por sobrecarga de datos numéricos.

```
┌────────────────────────────────────────────────────────┐
│ [Avatar] Hola, Laura                      [Campana 🔔] │
│          Ecos Core                                     │
│                                                        │
│ Tu bienestar hoy                                       │
│ Martes, 22 de julio de 2026                            │
├────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │
│ │ • ESTADO ACTUAL · IA                   [Icono Mente]│ │
│ │ "Te percibimos un poco estresada.                   │ │
│ │  ¿Quieres respirar un momento?"                    │ │
│ │                                                    │ │
│ │ [ 🍃 Iniciar Respiración                         ] │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌──────────────────────────┐┌────────────────────────┐ │
│ │ [♥] 99 bpm      Elevado  ││ [→] 95 %        Normal │ │
│ │     Ritmo Cardíaco       ││     Oxígeno            │ │
│ └──────────────────────────┘└────────────────────────┘ │
│ ┌──────────────────────────┐┌────────────────────────┐ │
│ │ [🌡] 37.2 °C     Estable  ││ [⚠] 88 %          Alto │ │
│ │     Temp. Periférica     ││     Nivel de Estrés    │ │
│ └──────────────────────────┘└────────────────────────┘ │
│                                                        │
│ Tendencia de Estrés                              [ ↗ ] │
│ ┌────────────────────────────────────────────────────┐ │
│ │              .-.                                   │ │
│ │  .    .     /   \       .                          │ │
│ │ / \  / \   /     \     / \                         │ │
│ ───┴──┴───┴─┴───────┴───┴───┴────────────────────────┤ │
│   08:00    10:00    AHORA    14:00    16:00          │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ATENCIÓN PRIORITARIA                                   │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [ * ] Botón de Pánico                            > │ │
│ │       Contactar a Dr. Méndez                       │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ [ Home 🏠 ]     [ Stats 📊 ]    [ Chat 💬 ]  [ Perfil 👤]│
└────────────────────────────────────────────────────────┘

```

#### Elementos Funcionales y Componentes UI:

1. **Header Dinámico:** Muestra el saludo personalizado, fecha del sistema y el indicador del estado de enlace BLE con la pulsera Nexo Band.


2. **Banner de Inferencia Edge AI (`ESTADO ACTUAL · IA`):**

* Cambia reactivamente según la salida del evaluador de anomalías:
* **Verde:** *"Tu ritmo se mantiene sereno y estable. Excelente momento para concentrarte."*
* **Amarillo:** *"Detectamos una leve aceleración en tu pulso sin movimiento. ¿Quieres respirar un momento?"* (Acción: `Iniciar Respiración` abre el modal de coherencia cardíaca).


* **Rojo:** *"Tu pulso se encuentra significativamente elevado. Te recomendamos pausar tus actividades y buscar apoyo."*




3. **Grid de Métricas Rápidas (2x2 Cards):**

* *Ritmo Cardíaco:* Valor actual en BPM, pill descriptivo (`Normal`, `Elevado`, `Crítico`).


* *Oxígeno (SpO2):* Porcentaje en sangre.


* *Temperatura Periférica:* Estimada/calculada.


* *Nivel de Estrés:* Porcentaje acumulado en la última hora, derivado de la variabilidad del pulso.




4. **Tarjeta de Tendencia de Estrés:** Gráfica de línea temporal continua de las últimas 8 horas renderizada con `react-native-svg`.


5. **Módulo de Atención Prioritaria (Botón de Pánico):**

* Tarjeta en rojo carmesí con icono de alerta. Al pulsarlo, lanza una confirmación háptica de 2 segundos que ejecuta `POST /api/v1/alerts` con prioridad crítica y muestra el modal de contingencia.





---

### 6.2 Pantalla de Estadísticas y Evolución (`stats.tsx`) — "Tu Evolución"

Conecta los datos longitudinales del paciente con las intervenciones del psicólogo asignado.

```
┌────────────────────────────────────────────────────────┐
│ [Avatar] Ecos                               [Campana 🔔]│
│                                                        │
│ Tu Evolución                                           │
│ Has logrado reducir tus picos de estrés un 14%         │
│ esta semana. ¡Buen trabajo!                            │
├────────────────────────────────────────────────────────┤
│ TU EVOLUCIÓN CON ECOS                 Tendencia: Baja  │
│ ┌────────────────────────────────────────────────────┐ │
│ │    ▄█▄                                             │ │
│ │  ▄█████▄   ▄█▄             ▄█▄                     │ │
│ │  ███████▄▄█████▄   ▄█▄   ▄█████▄                   │ │
│ ├───┴───┴───┴───┴───┴───┴───┴───┴────────────────────┤ │
│     L   M   M   J   V   S   D                        │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ Sesiones recientes                                     │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [✦] Manejo de ansiedad diurna                    > │ │
│ │     Hace 2 días · 45 min                           │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ [⚙] Exploración de disparadores                  > │ │
│ │     22 de Julio · 60 min                           │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ Tu Terapeuta                                           │
│ ┌────────────────────────────────────────────────────┐ │
│ │                  [Foto Profesional]                │ │
│ │                   Dr. Carlos Méndez                │ │
│ │             Psicólogo Clínico Especialista         │ │
│ │                                                    │ │
│ │ [ ✉ Contactar por WhatsApp                       ] │ │
│ │ [ 📞 Llamada de voz                              ] │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌──────────────────────────┐┌────────────────────────┐ │
│ │ [🌙] Calidad Sueño       ││ [♥] Ritmo Cardíaco     │ │
│ │      Muy buena (8h)      ││     Estable (72 bpm)   │ │
│ └──────────────────────────┘└────────────────────────┘ │
└────────────────────────────────────────────────────────┘

```

#### Elementos Funcionales y Componentes UI:

1. **Banner de Refuerzo Positivo:** Resumen motivacional calculado semanalmente a partir de `GET /api/v1/students/:id/biometrics/trends` (ej. *"Redujiste tus picos un 14%"*).


2. **Histograma Semanal de Frecuencia de Crisis:** Gráfico de barras por día (L, M, M, J, V, S, D) que refleja el número de eventos o minutos en estrés alto.


3. **Lista de Sesiones Clínicas Realizadas:** Consume `GET /api/v1/appointments` para mostrar citas pasadas en estado `completed`, permitiendo al estudiante revisar acuerdos y planes de acción.


4. **Card del Terapeuta Asignado:**

* Muestra el nombre, especialidad y credenciales profesionales del terapeuta primario (`TherapistAssignment.isPrimary = true`).


* **Acciones Directas:** Enlaces rápidos (`Linking.openURL`) hacia el canal de mensajería seguro o llamada de consulta de acuerdo con la disponibilidad configurada.




5. **Píldoras Biométricas de Resumen:** Tarjetas horizontales inferiores que reportan la calidad del sueño calculada (horas totales en reposo) y la estabilidad del pulso basal.



---

### 6.3 Pantalla de Acompañamiento y Diario (`chat.tsx`)

Combina el apoyo de contención con el registro reflexivo del estudiante:

* **Pestaña Superior 1: Acompañamiento Preventivo (Chat):**
* Interfaz conversacional orientada a la psicoeducación y técnicas de afrontamiento basadas en terapia cognitivo-conductual (TCC).
* **Regla de Seguridad de la IA:** Si el usuario introduce patrones lingüísticos asociados con autolesión, desesperanza extrema o ideación suicida, el motor bloquea el flujo conversacional estándar y superpone inmediatamente los números de emergencia institucionales y nacionales (Línea de Vida / 911).


* **Pestaña Superior 2: Diario Emocional (Local First):**
* Listado de tarjetas cronológicas de las reflexiones del paciente.
* Cada entrada muestra: Fecha, Emoji de estado de ánimo, Texto redactado y Biometría asociada registrada en ese instante (BPM y Estrés capturados de Nexo Band).
* **Botón "Compartir con terapeuta":** Desencadena un diálogo modal con aviso de consentimiento informado. Al confirmar, genera la instantánea en `remote_shared_patient_content` y marca la entrada local con una insignia verde de verificación (`Compartido con Dr. Méndez`).





---

### 6.4 Modal de Coherencia Cardíaca (`breathing-guide.tsx`)

Se activa automáticamente al pulsar "Iniciar Respiración" en el Home o cuando el reloj Nexo detecta un desacople moderado (Estado Amarillo):

* **Visualizador Táctil y Visual:** Círculo concéntrico animado con `react-native-reanimated` que se expande durante 4 segundos (Inhalación), retiene 4 segundos, y se contrae 4 segundos (Exhalación).
* **Sincronización Háptica:** El motor de vibración del teléfono emite patrones sutiles para guiar el ejercicio sin necesidad de mirar la pantalla.
* **Feedback Biométrico en Vivo:** En la parte inferior, muestra el pulso en tiempo real transmitido por Nexo Band, permitiendo al usuario visualizar objetivamente cómo disminuyen sus pulsaciones a medida que completa el ciclo.

---

### 6.5 Modal de Emergencia y Contención (`panic-alert.tsx`)

* **Mecanismo de Descarte de Falso Positivo:** Cuenta regresiva de 5 segundos con advertencia sonora y botón de cancelación ("Fue un error, me encuentro bien").
* **Ejecución de Alerta:** Si no se cancela, emite la solicitud HTTP `POST /api/v1/alerts` con `priority = 'critical'`.


* **Acceso Inmediato a Ayuda:**
* Botón 1: Llamar directamente al contacto de emergencia asignado (`TrustedContact`).
* Botón 2: Marcar al departamento de psicología de la institución.
* Botón 3: Línea nacional de atención en crisis de salud mental.



---

## 7. Plan de Implementación por Fases (Mobile & Edge)

Para mantener la cadencia del equipo tras la entrega de la infraestructura de backend, se estructuran 6 fases incrementales de desarrollo móvil:

```
[ Fase M1: Protocolo IoT ] ──> [ Fase M2: Inferencia Edge ] ──> [ Fase M3: Home & Telemetría ]
  • Sketch ESP32 BLE             • ExecuTorch en React Native       • Consumo /overview
  • Parsing binario BLE          • Inferencia model.pte             • Componentes Home (UI)
                                                                             │
┌────────────────────────────────────────────────────────────────────────────┘
▼
[ Fase M4: Stats & Clínico ] ──> [ Fase M5: Diario & Shared ] ──> [ Fase M6: Hardening ]
  • Gráficas de tendencias        • SQLite Diario Emocional          • Pruebas e2e offline
  • Ficha del terapeuta           • Snapshot hacia shared-content    • Auditoría de consumo de batería

```

### Fase M1: Firmware ESP32 y Capa de Enlace BLE

* Carga del sketch en ESP32 mapeando los pines analógicos GPIO 34 y GPIO 35 a los potenciómetros.
* Implementación del empaquetado binario de 6 bytes en el servidor GATT de C++.
* Actualización de `use-esp32-ble.ts` para conectar, descubrir servicios y parsear el buffer binario en variables nativas TypeScript.

### Fase M2: Motor Edge AI con ExecuTorch

* Instalación y enlace nativo de `react-native-executorch` en el cliente Expo.
* Integración del archivo `assets/model.pte`.
* Desarrollo de la clase `RollingBuffer` (almacena las últimas 10 lecturas a 1 Hz y normaliza los vectores).
* Verificación de cálculo del error de reconstrucción (MSE) y evaluación del semáforo.

### Fase M3: Pantalla Principal y Monitoreo en Vivo

* Construcción de la vista `home.tsx` conforme al diseño validado (Grid 2x2, tarjeta IA reactiva y tendencia).


* Conexión de `use-biometric-monitor.ts` con el stream real de BLE, alternando automáticamente al simulador si la banda se desconecta.
* Implementación del modal de respiración guiada con retroalimentación háptica.

### Fase M4: Pestaña de Evolución y Datos Clínicos

* Desarrollo de `stats.tsx`: gráfico semanal de barras con SVG interactivo.


* Consumo del endpoint `GET /api/v1/students/:id/biometrics/trends` para obtener medias de estrés y picos.


* Carga de información del terapeuta desde `GET /api/v1/students/:id/overview` e integración de enlaces rápidos de contacto.



### Fase M5: Diario Emocional y Contenido Compartido

* Creación de las tablas SQLite locales para el diario personal.
* Diseño de la vista `chat.tsx` (pestaña Diario y asistente preventivo).
* Integración del endpoint `POST /api/v1/students/:id/shared-content` para exportar entradas seleccionadas hacia el panel del psicólogo.



### Fase M6: Resiliencia Offline, Pruebas y Hardening

* Pruebas de pérdida de paquetes BLE y recuperación automática de reconexión.
* Validación de la cola de sincronización de resúmenes horarios con interrupción forzada de red.
* Auditoría de rendimiento energético para asegurar que la inferencia local continua no degrade la batería del dispositivo móvil en más de un 4% por hora de monitoreo activo.

---

## 8. Criterios de Aceptación Técnica

1. **Fidelidad de Inferencia:** El modelo ExecuTorch en el teléfono debe procesar una ventana de 10 segundos en menos de **45 milisegundos**, clasificando taquicardia en reposo (BPM alto + Movimiento cero) como anomalía (Estado Rojo) en un 100% de las repeticiones del banco de pruebas.
2. **Eficiencia de Ancho de Banda:** La comunicación Bluetooth entre Nexo Band y el teléfono debe operar estrictamente bajo paquetes binarios empaquetados de tamaño menor o igual a 20 bytes, garantizando cero fragmentación ATT.
3. **Privacidad de Datos Clínicos:** Ninguna solicitud HTTP saliente debe incluir el contenido del diario emocional privado (`local_emotional_journal`). Solo las acciones explícitas de compartición deben registrarse en `remote_shared_patient_content`.


4. **Consistencia de Identidad:** Todas las peticiones al backend deben autenticarse mediante JWT emitidos por Supabase Auth con UUID coincidente con `auth.users.id`, respetando las directivas RLS Shape A y C del servidor.


5. **Resiliencia Operativa:** Si la conexión a internet falla durante un evento de pánico, la aplicación debe alertar al usuario en pantalla, abrir el marcador telefónico de emergencia de inmediato y persistir el evento en la cola local para retransmisión automática al restaurarse la conectividad.

----

### 1. El Cálculo del Nivel de Estrés y su Fórmula

En la práctica clínica y de ingeniería wearable, **el estrés no es una lectura directa de hardware**, sino un índice computado derivado del balance del sistema nervioso autónomo.

Dado que el banco de pruebas de la pulsera Nexo cuenta con dos canales analógicos (**Ritmo Cardíaco / BPM** y **Actividad Física / Movimiento**), el cálculo en la aplicación móvil debe modelar el **desacople fisiológico**:

$$\text{Estrés}_t = \text{clamp}\left(0,\, 100,\, \left[ \left( \frac{\text{BPM}_t - \text{BPM}_{\text{base}}}{\text{BPM}_{\text{max}} - \text{BPM}_{\text{base}}} \times 100 \right) \times \left( 1 - \frac{\text{Actividad}_t}{100} \right) \right] + \sigma_{\text{variabilidad}} \right)$$

* **$\text{BPM}_{\text{base}}$:** Frecuencia cardíaca en reposo del usuario (típicamente $60 - 70\,\text{BPM}$).
* **$\text{BPM}_{\text{max}}$:** Límite estimado según la edad (o fijo en $190\,\text{BPM}$ para la maqueta).
* **$\text{Actividad}_t$:** Porcentaje de movimiento relativo del potenciómetro 2 ($0 - 100\%$).
* **$\left(1 - \frac{\text{Actividad}_t}{100}\right)$ (Factor de atenuación motora):**
* **Si el usuario corre o hace cardio** ($\text{BPM} = 145$, $\text{Actividad} = 85\%$): El multiplicador se reduce a $0.15$. El pulso elevado se atribuye a demanda metabólica normal; el estrés calculado se mantiene bajo ($< 25\%$).
* **Si el usuario está en reposo o examen** ($\text{BPM} = 135$, $\text{Actividad} = 2\%$): El multiplicador es $0.98$. Todo el incremento del pulso se cataloga como estrés psicológico o angustia, disparando el valor a $\approx 85 - 90\%$.


* **Integración con ExecuTorch:** El valor resultante en escala $0 - 100$ se normaliza dividiéndolo entre $100.0$ para alimentar el canal `stress` en el tensor de entrada de `model.pte`.

---

### 2. Gestión de Datos Ausentes en la UI (Oxígeno y Temperatura)

En la pantalla diseñada (`image_264f2a.jpg`), el grid muestra cuatro tarjetas: *Ritmo Cardíaco*, *Oxígeno*, *Temperatura* y *Nivel de Estrés*.

Tanto el departamento de psicología como el asesor de economía señalaron que la **temperatura en muñeca es inexacta y poco útil clínicamente**, mientras que el sensor de **Oxígeno (SpO2)** requiere un sensor óptico dedicado (como el MAX30102) que aún no está cableado en el banco de potenciómetros.

Para la aplicación en React Native existen dos caminos recomendados:

#### Estrategia A: Estados de Sensor Desconectado (`--`)

Nunca se deben renderizar valores estáticos ficticios (como `37.2°C` o `95%`) fingiendo que provienen de la pulsera, ya que en una demostración técnica o evaluación se detectará que el hardware no los transmite:

* Si la trama BLE no incluye la clave de temperatura u oxígeno, la tarjeta debe renderizar un estado inactivo: **`-- %`** o **`-- °C`** con un texto secundario en gris: `Sensor no vinculado` o `Requiere Nexo Pro`.
* Esto demuestra madurez de software: la interfaz está preparada para hardware multitarea, pero respeta la integridad del dato.

#### Estrategia B: Reconfigurar la Cuadrícula 2x2 (La opción más coherente)

En lugar de mantener métricas que el equipo médico y económico aconsejaron omitir, sustituye las tarjetas de la pantalla `home.tsx` por parámetros que sí se derivan directamente del hardware actual y del acelerómetro:

| Posición Grid | Métrica Propuesta | Origen del Dato | Estado en Demo |
| --- | --- | --- | --- |
| **Superior Izq.** | **Ritmo Cardíaco** | Potenciómetro 1 (GPIO 34) | En vivo ($45 - 190\,\text{BPM}$) |
| **Superior Der.** | **Nivel de Actividad** *(reemplaza Oxígeno)* | Potenciómetro 2 (GPIO 35) | En vivo ($0 - 100\%$) |
| **Inferior Izq.** | **Calidad de Sueño** *(reemplaza Temperatura)* | Derivado de inactividad nocturna | Último bloque calculado (ej. $7.5\,\text{h}$) |
| **Inferior Der.** | **Nivel de Estrés** | Algoritmo desacople BPM / Actividad | Calculado dinámico ($0 - 100\%$) |
