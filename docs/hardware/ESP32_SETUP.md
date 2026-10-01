# Configuración del Prototipo ESP32 con Potenciómetro (BLE)

Documentación técnica para la conexión y configuración del prototipo de hardware ESP32 con potenciómetro analógico mediante Bluetooth Low Energy (BLE).

## 1. Conexión del Circuito

| Terminal del Potenciómetro | Pin del ESP32 | Descripción Técnica |
| :--- | :--- | :--- |
| Extremo 1 | `3V3` | Alimentación de referencia (3.3V CC). **No utilizar 5V/VIN**. |
| Pin Central (Cursor) | `GPIO 34` | Entrada analógica ADC1 (`ADC1_CH6`). |
| Extremo 2 | `GND` | Conexión a tierra común. |

> **Nota técnica sobre ADC:** Se emplea el canal `GPIO 34` perteneciente a `ADC1`. Los pines del bloque `ADC2` entran en conflicto cuando los módulos de comunicación inalámbrica (Wi-Fi/Bluetooth) se encuentran en operación. La resolución configurada en el firmware es de 12 bits (rango entero de 0 a 4095).

## 2. Parámetros del Perfil GATT (BLE)

- **Nombre de Publicación (Device Name):** `ESP32-Potentiometer`
- **UUID del Servicio Principal:** `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
- **UUID de la Característica:** `beb5483e-36e1-4688-b7f5-ea07361b26a8`
- **Propiedades:** `READ`, `NOTIFY`
- **Descriptor de Notificación:** `BLE2902` (`0x2902`)
- **Frecuencia de Muestreo / Notificación:** 100 ms (10 Hz)
- **Formato de Carga Útil:** Cadena ASCII codificada en UTF-8 con la representación numérica del valor analógico (ejemplo: `"2048"`).

## 3. Instrucciones de Compilación y Carga en Arduino IDE

1. Instalar la extensión oficial de placas **esp32** por Espressif Systems en el Gestor de Placas de Arduino IDE.
2. Seleccionar la placa correspondiente (ejemplo: `ESP32 Dev Module`).
3. Abrir el archivo de firmware [`esp32-potentiometer.ino`](./esp32-potentiometer.ino).
4. Conectar la placa ESP32 mediante cable micro-USB / USB-C y seleccionar el puerto serie asignado.
5. Compilar y cargar el programa.
6. Abrir el Monitor Serie configurado a **115200 baudios** para verificar el estado de inicio y la transmisión de lecturas.
