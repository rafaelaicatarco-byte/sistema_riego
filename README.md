This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# 🌿 Sistema de Riego Automatizado — ESP32 (Simulación)

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black.svg)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748.svg)](https://prisma.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://typescriptlang.org)
[![MySQL](https://img.shields.io/badge/MySQL-database-4479A1.svg)](https://mysql.com)
[![JWT](https://img.shields.io/badge/JWT-auth-000000.svg)](https://jwt.io)

Simulación web interactiva de un sistema de riego agrícola automatizado basado en **ESP32**. Replica en tiempo real la lógica de sensores capacitivos de humedad, relés, bombas y electroválvulas, con autenticación segura mediante **JWT + bcrypt**.

---

## 🚀 Características

### Simulación
- **Tanque de agua** de 20.000 L con visualización SVG en vivo y nivel dinámico
- **Sensor de humedad capacitivo** (ADC GPIO34) con gauge circular animado y 40 celdas de terreno con interpolación de color
- **Relé de control** (GPIO26) que activa/desactiva la bomba según umbrales configurables
- **Electroválvula de llenado automático** (GPIO25) con apertura al 20% y cierre al 98%
- **Monitor serie** estilo Arduino IDE a 115200 baud con scroll automático
- **Cultivos seleccionables**: fresa, frijol, lechuga, sandía, melón, lenteja, arveja, zanahoria, pimiento, cebolla (10 tipos en 3 categorías)
- **Tipos de riego**: goteo, microaspersión, aspersión, gravedad/surco
- **Tipos de tierra**: arenosa, franca, arcillosa
- **Bombas intercambiables**: 0.5 HP (periférica), 1 HP (centrífuga), 1.5 HP (sumergible), 2 HP (alta presión)
- **Cálculos en vivo**: consumo de agua, tiempo de riego, energía, eficiencia combinada
- **Velocidad de simulación** ajustable (×1, ×5, ×15, ×60)
- **Código Arduino equivalente** incrustado con los parámetros activos

### Seguridad
- **Autenticación JWT** con tokens de 7 días almacenados en cookies httpOnly
- **Contraseñas hasheadas** con bcryptjs (10 rondas de sal)
- **Validaciones** tanto en cliente como en servidor
- **Protección contra duplicados** en registro (usuario/email único)
- **CSRF mitigado** mediante cookies sameSite=lax
- **Sesión persistente** verificada al cargar la aplicación

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 16.2 (App Router) |
| **Lenguaje** | TypeScript 5 |
| **Base de datos** | MySQL + Prisma ORM 5.22 |
| **Autenticación** | JWT (jsonwebtoken) + bcryptjs |
| **Estilos** | Tailwind CSS 4 + CSS personalizado |
| **Fuentes** | Space Grotesk, Inter, JetBrains Mono (Google Fonts) |
| **Runtime** | Node.js (React 19, Server Components + Client Components) |

---

## 📦 Estructura del proyecto

```
sistema_riego/
├── .env                          # Variables de entorno (DATABASE_URL, JWT_SECRET)
├── package.json                  # Dependencias y scripts
├── tsconfig.json                 # Configuración de TypeScript
├── next.config.ts                # Configuración de Next.js
├── postcss.config.mjs            # Configuración de PostCSS / Tailwind
├── middleware.ts                 # Middleware global de Next.js
├── prisma/
│   └── schema.prisma             # Esquema de base de datos MySQL (modelo User)
├── lib/
│   ├── prisma.ts                 # Cliente singleton de Prisma
│   └── auth.ts                   # Utilidades JWT: hash, verify, generateToken, cookies
├── app/
│   ├── layout.tsx                # Layout raíz con fuentes globales
│   ├── page.tsx                  # Página principal → redirige a /simulacion
│   ├── globals.css               # Estilos base + animaciones + Tailwind
│   ├── register/
│   │   ├── page.tsx              # Página de registro (Server Component)
│   │   └── RegisterForm.tsx      # Formulario de registro (Client Component)
│   ├── simulacion/
│   │   ├── page.tsx              # Página de simulación (Server Component + metadata)
│   │   ├── SimulacionClient.tsx  # Lógica principal de simulación (Client Component)
│   │   ├── constants.ts          # Constantes: bombas, cultivos, riegos, suelos
│   │   └── components/
│   │       ├── LoginScreen.tsx    # Pantalla de inicio de sesión
│   │       ├── AuthModal.tsx      # Modal de confirmación/error de autenticación
│   │       ├── Dashboard.tsx      # Panel principal con estado del sistema
│   │       ├── TankPanel.tsx      # Visualización SVG del tanque de agua
│   │       ├── TerrainPanel.tsx   # Grid de terreno + gauge de humedad
│   │       ├── ControlsPanel.tsx  # Selectores: bomba, riego, cultivo, tierra, umbrales
│   │       ├── CalculationsPanel.tsx # Cálculos en vivo + código Arduino
│   │       └── SerialMonitor.tsx  # Terminal estilo Arduino IDE
│   └── api/
│       └── auth/
│           ├── register/route.ts  # POST: crear usuario + hashear contraseña + JWT
│           ├── login/route.ts     # POST: verificar credenciales + JWT
│           ├── logout/route.ts    # POST: eliminar cookie del token
│           └── me/route.ts        # GET: verificar token y devolver usuario actual
```

---

## 🔐 Sistema de autenticación (JWT + bcrypt)

### Flujo de autenticación

```
Registro/Login
     │
     ▼
Credenciales → servidor → verificar/bcrypt hash
     │
     ▼
Generar JWT (payload: { userId, username, email })
     │
     ▼
Almacenar en cookie httpOnly (7 días)
     │
     ▼
Cada request a /api/auth/me verifica el token
```

### Detalles técnicos

| Aspecto | Implementación |
|---------|---------------|
| **Algoritmo JWT** | HS256 (HMAC con SHA-256) |
| **Expiración** | 7 días (`expiresIn: '7d'`) |
| **Secreto** | `JWT_SECRET` desde variable de entorno |
| **Hash de contraseña** | bcryptjs con 10 rondas de sal |
| **Cookie** | `httpOnly: true`, `sameSite: 'lax'`, `secure: true` en producción |
| **Payload** | `{ userId, username, email }` |
| **Verificación** | En cada request a `/api/auth/me` se extrae el token de la cookie, se verifica y se devuelve el usuario |

### Endpoints de la API

| Método | Ruta | Descripción | Protegido |
|--------|------|-------------|-----------|
| `POST` | `/api/auth/register` | Crear usuario + devolver JWT en cookie | No |
| `POST` | `/api/auth/login` | Iniciar sesión + devolver JWT en cookie | No |
| `POST` | `/api/auth/logout` | Eliminar cookie del token | No |
| `GET` | `/api/auth/me` | Obtener usuario autenticado actual | Sí (valida JWT) |

### Registro de usuarios (validaciones)

- **Usuario**: mínimo 3 caracteres, único en base de datos
- **Contraseña**: mínimo 6 caracteres
- **Email**: formato válido, único en base de datos
- **Confirmación de contraseña**: validada en el cliente antes de enviar
- **Normalización**: usuario y email se almacenan en minúsculas

---

## 🧪 Cómo usar

### 1. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/sistema_riego"
JWT_SECRET="tu-secreto-jwt-aqui-minimo-32-caracteres"
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar la base de datos

```bash
npx prisma migrate dev --name init
```

Esto crea las tablas necesarias en MySQL según el esquema de Prisma.

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

### 5. Registrar un usuario

- Ir a `/register` o hacer clic en "Regístrate aquí" en la pantalla de login
- Completar el formulario con usuario, email y contraseña
- Al registrarse, se redirige automáticamente a la simulación

### 6. Usar la simulación

1. Configura el tipo de riego, bomba, cultivo y tierra en el panel de controles
2. Ajusta los umbrales de humedad ON/OFF según el cultivo
3. Presiona **▶ Iniciar** para comenzar la simulación
4. Observa cómo el sistema responde automáticamente: la bomba se activa cuando la humedad baja del umbral y se desactiva al alcanzar el umbral superior
5. El monitor serie muestra cada evento en tiempo real
6. Usa la velocidad de simulación para acelerar el proceso

---

## 🧠 Lógica de simulación

El comportamiento replica fielmente un sistema real con ESP32:

1. **Sensor capacitivo** lee la humedad del suelo (simulado como valor ADC 0-4095)
2. **Relé** activa la bomba (GPIO26 = HIGH) cuando la humedad ≤ umbral bajo
3. **Relé** desactiva la bomba (GPIO26 = LOW) cuando la humedad ≥ umbral alto o el tanque está vacío
4. **Electroválvula** se abre (GPIO25 = HIGH) cuando el tanque ≤ 20% y se cierra al llegar a 98%
5. La **humedad** aumenta según el caudal efectivo y disminuye según la evaporación del suelo
6. El **tanque** se vacía con el riego y se llena automáticamente con la válvula

### Fórmulas principales

- **Caudal efectivo** = caudal de la bomba × factor de flujo del tipo de riego
- **Agua requerida** = (área × L/m²) / (eficiencia del suelo × eficiencia del riego)
- **Tiempo de riego** = agua requerida / caudal efectivo
- **Ganancia de humedad** = (agua usada / agua total requerida) × 100
- **ADC simulado** = 4095 − (humedad / 100) × (4095 − 1200)

---

## 📝 Lógica equivalente (Arduino/ESP32)

El panel de cálculos incluye el código Arduino de referencia que replica la misma lógica de control, con los umbrales activos de la simulación:

```cpp
#define SOIL_PIN   34   // ADC1_CH6 (entrada analógica)
#define RELAY_PIN  26   // controla la bomba

int umbralBajo  = 30;   // % humedad → enciende bomba
int umbralAlto  = 65;   // % humedad → apaga bomba

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
}

void loop() {
  int lectura  = analogRead(SOIL_PIN);              // 0-4095
  int humedad  = map(lectura, 4095, 1200, 0, 100); // invertido

  Serial.printf("Humedad: %d%% | ADC: %d\n", humedad, lectura);

  if (humedad <= umbralBajo) {
    digitalWrite(RELAY_PIN, HIGH);   // activa la bomba
  } else if (humedad >= umbralAlto) {
    digitalWrite(RELAY_PIN, LOW);    // detiene la bomba
  }
  delay(2000);
}
```

---

## 🎯 Propósito

Herramienta educativa para entender el funcionamiento de un sistema de riego automatizado real con ESP32, permitiendo experimentar con diferentes configuraciones (bombas, cultivos, suelos, tipos de riego) sin necesidad de hardware físico. Ideal para:

- **Estudiantes** de agricultura de precisión y sistemas embebidos
- **Ingenieros** que diseñan sistemas de riego automatizado
- **Agricultores** que quieren entender la tecnología antes de implementarla

---

## 📄 Licencia

Proyecto educativo de código abierto.
