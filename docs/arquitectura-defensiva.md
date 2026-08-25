# Diagrama de Arquitectura con Enfoque Defensivo

## Sistema de Riego Automatizado ESP32 — Vista de Seguridad

```mermaid
flowchart TD
    subgraph EXTERNO["🌐 EXTERNO"]
        USER["👤 Usuario\n(Navegador Web)"]
    end

    subgraph EDGE["🛡️ CAPA DE BORDE (Middleware)"]
        MW["middleware.ts\nVerificación JWT\nRedirección si no autenticado"]
    end

    subgraph PUBLIC["🔓 RUTAS PÚBLICAS"]
        HOME["/ (Home)"]
        LOGIN["/api/auth/login\nRate limiting\nValidación de entrada"]
        REGISTER["/api/auth/register\nValidación email/password\nHash bcrypt"]
        ME["/api/auth/me\nVerificación de sesión"]
        LOGOUT["/api/auth/logout\nEliminación de cookie"]
    end

    subgraph PRIVATE["🔒 RUTAS PROTEGIDAS"]
        SIM["/simulacion\nDashboard de riego"]
        SIM_ACTIONS["/api/simulation/actions\nLogging de acciones críticas"]
        SEC_LOGS["/api/security/logs\nLogs de seguridad"]
    end

    subgraph SECURITY["🔐 MÓDULOS DE SEGURIDAD"]
        AUTH["lib/auth.ts\nBcrypt hash\nJWT generate/verify"]
        VALIDATION["lib/validation.ts\nRate limiting\nValidación de entrada"]
        LOGGER["lib/logger.ts\nLogging estructurado\nTrazabilidad de eventos"]
        ANOMALY["lib/anomaly-detection.ts\nDetección de fuerza bruta\nDetección de activaciones anómalas\nDetección de cambios repetidos"]
    end

    subgraph DATA["💾 CAPA DE DATOS"]
        DB["Prisma + MySQL\nTabla: User"]
        LOGS_FILE["/data/security-logs.json\nLogs de seguridad"]
    end

    subgraph SIMULATION["⚙️ LÓGICA DE RIEGO"]
        TANK["Tanque 20,000L\nControl de válvula"]
        PUMP["Bomba/Relé\nGPIO26"]
        SENSOR["Sensor Capacitivo\nGPIO34"]
        CALC["Cálculos de riego\nHumedad, caudal, energía"]
    end

    %% Conexiones
    USER -->|"HTTP Request"| MW

    MW -->|"Token válido"| PRIVATE
    MW -->|"Sin token / token inválido"| PUBLIC
    MW -->|"Redirige a /simulacion"| USER

    LOGIN --> AUTH
    LOGIN --> VALIDATION
    LOGIN --> LOGGER
    REGISTER --> AUTH
    REGISTER --> VALIDATION
    REGISTER --> LOGGER
    ME --> AUTH
    LOGOUT -->|"Clear cookie"| USER

    SIM_ACTIONS --> AUTH
    SIM_ACTIONS --> LOGGER
    SEC_LOGS --> AUTH
    SEC_LOGS --> LOGGER

    LOGGER --> ANOMALY
    LOGGER --> LOGS_FILE
    ANOMALY -->|"Evento sospechoso"| LOGGER

    AUTH --> DB
    SIM --> SIMULATION

    TANK -->|"Estado del tanque"| CALC
    PUMP -->|"Activar/Desactivar"| CALC
    SENSOR -->|"Lectura ADC"| CALC

    %% Estilos de seguridad
    style MW fill:#E2574C,stroke:#B22,stroke-width:3px,color:#fff
    style AUTH fill:#3FA7D6,stroke:#1A6B8C,stroke-width:2px
    style VALIDATION fill:#D98E3B,stroke:#A66A1F,stroke-width:2px
    style LOGGER fill:#59C36A,stroke:#2A7A36,stroke-width:2px
    style ANOMALY fill:#E2574C,stroke:#B22,stroke-width:2px
    style LOGIN fill:#D98E3B,stroke:#A66A1F
    style REGISTER fill:#D98E3B,stroke:#A66A1F
    style SEC_LOGS fill:#59C36A,stroke:#2A7A36
```

---

## Puntos de Validación de Seguridad

| # | Punto | Ubicación | Principio Aplicado |
|---|-------|-----------|-------------------|
| 1 | **Middleware de autenticación** | `middleware.ts` | Defensa en profundidad — primera línea de defensa |
| 2 | **Rate limiting de login** | `lib/validation.ts` → `app/api/auth/login/` | Mitigación de fuerza bruta |
| 3 | **Validación de email** | `lib/validation.ts` → `app/api/auth/register/` | Validación de entrada |
| 4 | **Fortaleza de contraseña** | `lib/validation.ts` → `app/api/auth/register/` | Contraseñas fuertes |
| 5 | **Hash de contraseña (bcrypt)** | `lib/auth.ts` | Protección de credenciales |
| 6 | **Verificación JWT (firma + exp)** | `lib/auth.ts` → `app/api/auth/*/` | Integridad de tokens |
| 7 | **Cookie httpOnly + secure** | `app/api/auth/login/` | Mitigación XSS + CSRF |
| 8 | **Mensajes genéricos de error** | Todas las API routes | Prevención de enumeración |
| 9 | **Logging de eventos** | `lib/logger.ts` | Trazabilidad y auditoría |
| 10 | **Detección de anomalías** | `lib/anomaly-detection.ts` | Detección de intrusos |
| 11 | **Verificación server-side** | Todas las API routes protegidas | No confiar en el cliente |

---

## Flujo de Autenticación

```mermaid
sequenceDiagram
    participant U as 👤 Usuario
    participant M as 🛡️ Middleware
    participant L as 🔑 Login API
    participant V as ✅ Validación
    participant A as 🔐 Auth (bcrypt/JWT)
    participant D as 💾 Base de Datos
    participant S as 📝 Logger
    participant AN as ⚠️ Anomaly Detection

    U->>M: POST /api/auth/login
    M->>M: ¿Ruta pública? → Sí (api/auth/*)
    M->>L: Forward request

    L->>V: checkRateLimit(ip, username)
    V-->>L: { blocked: false }

    L->>L: Validar campos obligatorios
    L->>D: Buscar usuario
    D-->>L: Usuario encontrado

    L->>A: verifyPassword(password, hash)
    A->>A: bcrypt.compare()
    A-->>L: false (contraseña incorrecta)

    L->>V: recordFailedAttempt(ip, username)
    L->>S: logSecurityEvent(login_fallido)
    S->>AN: analyzeEvent()
    AN->>AN: ¿Fuerza bruta? (>3 intentos en 5min)
    AN-->>S: Alerta generada

    L-->>U: 401 "Credenciales inválidas"
```

---

## Diagrama de Capas de Seguridad

```mermaid
graph TB
    subgraph L1["🔴 CAPA 1: Middleware"]
        direction LR
        M1["Verificación de token"]
        M2["Redirección si no autenticado"]
        M3["Whitelist de rutas públicas"]
    end

    subgraph L2["🟠 CAPA 2: API Routes"]
        direction LR
        A1["Rate limiting"]
        A2["Validación de entrada"]
        A3["Verificación JWT completa"]
    end

    subgraph L3["🟡 CAPA 3: Lógica de Negocio"]
        direction LR
        B1["Bcrypt hash"]
        B2["Mensajes genéricos"]
        B3["Logging de eventos"]
    end

    subgraph L4["🟢 CAPA 4: Monitoreo"]
        direction LR
        C1["Detección de anomalías"]
        C2["Panel de alertas"]
        C3["Logs forenses"]
    end

    L1 --> L2 --> L3 --> L4

    style L1 fill:#E2574C,stroke:#B22,color:#fff
    style L2 fill:#D98E3B,stroke:#A66A1F,color:#fff
    style L3 fill:#F2C879,stroke:#B2882A
    style L4 fill:#59C36A,stroke:#2A7A36,color:#fff
```

---

*Diagrama de arquitectura defensiva — Sistema de Riego Automatizado ESP32*
*Fecha: Agosto 2026*
