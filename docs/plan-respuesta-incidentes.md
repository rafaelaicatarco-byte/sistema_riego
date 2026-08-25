# Plan de Respuesta a Incidentes — Sistema de Riego Automatizado

## Introducción

Este documento define los procedimientos de respuesta ante incidentes de seguridad para la aplicación web del Sistema de Riego Automatizado ESP32. Cada escenario incluye las fases de: **Detección → Contención → Notificación → Registro**.

---

## Escenario 1: Ataque de Fuerza Bruta contra el Login

### Descripción
Un atacante intenta adivinar credenciales de acceso realizando múltiples intentos de login con diferentes combinaciones de usuario/contraseña desde una misma IP o múltiples IPs.

### Detección
- **Sistema automático:** El módulo de rate limiting (`lib/validation.ts`) bloquea temporalmente la IP/usuario después de 5 intentos fallidos en 15 minutos.
- **Detección de anomalías:** El módulo `lib/anomaly-detection.ts` detecta cuando hay más de 3 intentos fallidos del mismo usuario en 5 minutos y marca el evento como "sospechoso".
- **Panel de alertas:** El componente `SecurityAlertsPanel` muestra las alertas en tiempo real en el dashboard.
- **Logs:** Cada intento fallido se registra en `/data/security-logs.json` con IP, usuario, timestamp y resultado.

### Contención
1. **Automática:** El rate limiting bloquea la IP/usuario por 15 minutos tras 5 intentos fallidos.
2. **Manual:** Si se detecta un patrón de ataque distribuido (múltiples IPs), el administrador puede:
   - Identificar las IPs en los logs de seguridad.
   - Bloquearlas en el firewall o CDN (Cloudflare, nginx).
   - Desactivar temporalmente la cuenta del usuario objetivo si está comprometida.

### Notificación
1. **Automática:** La alerta aparece en el panel de "Centro de alertas de seguridad" del dashboard.
2. **Al administrador:** Si hay más de 10 intentos fallidos en 1 hora, se considera un incidente mayor que requiere revisión manual.
3. **Al usuario afectado:** Si la cuenta tiene muchos intentos fallidos, mostrar un mensaje informativo al login: "Tu cuenta ha sido temporalmente bloqueada por seguridad."

### Registro
- **Archivo:** `/data/security-logs.json`
- **Campos registrados:**
  ```json
  {
    "timestamp": "2026-08-24T10:30:00.000Z",
    "usuario": "admin",
    "accion": "login_fallido",
    "resultado": "bloqueado",
    "ip": "192.168.1.100",
    "detalle": "Intento bloqueado por rate limiting. Reintentar en 842s"
  }
  ```
- **Retención:** Los logs se mantienen en el archivo hasta un máximo de 500 entradas en memoria. En producción, se recomienda retención de 90 días mínimo.

---

## Escenario 2: Activación de Motor Fuera de Horario o con Frecuencia Anómala

### Descripción
Un usuario malicioso o un script automatizado activa y desactiva la bomba de riego repetidamente, potencialmente causando:
- Desgaste prematuro del motor.
- Desperdicio de agua del tanque.
- Daño a las plantas por riego excesivo o insuficiente.
- Manipulación del sistema de riego para causar daño agrícola.

### Detección
- **Sistema automático:** El módulo de anomalías detecta más de 5 activaciones del motor en 1 minuto.
- **Logs de auditoría:** Cada activación/desactivación del motor se registra con `accion: "activar_motor"` o `accion: "desactivar_motor"`.
- **Panel de alertas:** Aparece una alerta de tipo "ACTIVACIÓN ANÓMALA DEL MOTOR" con el usuario responsable.

### Contención
1. **Automática:** El sistema de logs registra el evento como sospechoso.
2. **Manual:** El administrador puede:
   - Revisar el panel de alertas para identificar el usuario responsable.
   - Pausar manualmente la simulación desde el dashboard.
   - Cambiar las credenciales del usuario comprometido.
   - En un sistema real, implementar horarios de operación (scheduler) que impidan activación fuera de horario.

### Notificación
1. **Dashboard:** La alerta aparece en el panel de seguridad con prioridad alta (color rojo).
2. **Log del sistema:** El evento se registra como `resultado: "sospechoso"` para revisión posterior.
3. **En sistema real:** Se enviaría una notificación por email/SMS al administrador del sistema.

### Registro
- **Archivo:** `/data/security-logs.json`
- **Campos registrados:**
  ```json
  {
    "timestamp": "2026-08-24T14:20:00.000Z",
    "usuario": "operador1",
    "accion": "evento_sospechoso",
    "resultado": "sospechoso",
    "ip": "10.0.0.50",
    "detalle": "ACTIVACIÓN ANÓMALA DEL MOTOR: 7 activaciones en 60 segundos por usuario \"operador1\". Frecuencia inusual para un sistema de riego."
  }
  ```
- **Acción de registro:** Se marca el evento para revisión en la próxima auditoría de seguridad.

---

## Escenario 3: Manipulación de Lectura de Sensores / Configuración del Tanque

### Descripción
Un atacante o usuario malicioso manipula los parámetros del sistema para:
- Cambiar los umbrales de humedad para forzar activación/desactivación de la bomba.
- Modificar la configuración del tanque (capacidad reportada, niveles de apertura/cierre de válvula).
- Alterar los parámetros de cultivo para causar riego inadecuado.
- Realizar cambios repetidos para confundir el sistema o causar inestabilidad.

### Detección
- **Sistema automático:** El módulo de anomalías detecta más de 3 cambios de configuración en 2 minutos.
- **Logs de auditoría:** Cada cambio de configuración se registra con `accion: "cambio_config_tanque"` o `accion: "cambio_parametros_riego"`.
- **Historial de cambios:** Los logs permiten reconstruir la secuencia completa de cambios realizados.

### Contención
1. **Automática:** El sistema marca los cambios repetidos como sospechosos.
2. **Manual:** El administrador puede:
   - Revisar el historial de cambios en los logs de seguridad.
   - Restablecer los valores por defecto del sistema.
   - Identificar al usuario que realizó los cambios.
   - En sistema real: implementar validación de rangos permitidos para cada parámetro.

### Notificación
1. **Dashboard:** Aparece alerta "CAMBIOS REPETIDOS DE CONFIGURACIÓN" en el panel de seguridad.
2. **Log del sistema:** Se registra el detalle completo del cambio con usuario e IP.
3. **Auditoría:** Los cambios se mantienen en el log para revisión en la próxima auditoría.

### Registro
- **Archivo:** `/data/security-logs.json`
- **Campos registrados:**
  ```json
  {
    "timestamp": "2026-08-24T16:45:00.000Z",
    "usuario": "tecnico2",
    "accion": "evento_sospechoso",
    "resultado": "sospechoso",
    "ip": "172.16.0.25",
    "detalle": "CAMBIOS REPETIDOS DE CONFIGURACIÓN: 5 cambios en 120 segundos por usuario \"tecnico2\". Posible manipulación del sistema."
  }
  ```
- **Registro detallado:** Cada cambio individual también se registra como evento separado:
  ```json
  {
    "timestamp": "2026-08-24T16:44:30.000Z",
    "usuario": "tecnico2",
    "accion": "cambio_config_tanque",
    "resultado": "ok",
    "ip": "172.16.0.25",
    "detalle": "Configuración de tanque cambiada"
  }
  ```

---

## Procedimientos Generales de Respuesta

### Escalamiento
1. **Nivel 1 (Automático):** Rate limiting y detección de anomalías se ejecutan sin intervención humana.
2. **Nivel 2 (Administrador):** El administrador revisa el panel de alertas y toma acción manual.
3. **Nivel 3 (Equipo de TI):** Para incidentes mayores, se escala al equipo de seguridad de la organización.

### Comunicación
- **Interna:** Usar canal seguro (no email) para comunicar incidentes.
- **Externa:** Si hay compromiso de datos personales, notificar a los afectados según la normativa aplicable (GDPR, Ley de Protección de Datos).

### Lecciones aprendidas
Después de cada incidente, documentar:
1. Qué funcionó bien en la detección/respuesta.
2. Qué pudo haberse detectado antes.
3. Mejoras a implementar en el sistema.

---

## Contactos

| Rol | Nombre | Contacto |
|-----|--------|----------|
| Administrador del sistema | [Nombre] | [Email/Teléfono] |
| Responsable de seguridad | [Nombre] | [Email/Teléfono] |
| Soporte técnico | [Nombre] | [Email/Teléfono] |

---

*Plan de respuesta a incidentes — Sistema de Riego Automatizado ESP32*
*Fecha: Agosto 2026*
*Versión: 1.0*
