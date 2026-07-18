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

Simulación web interactiva de un sistema de riego agrícola automatizado basado en **ESP32**. Replica la lógica de sensores capacitivos de humedad, relés, bombas y electroválvulas en tiempo real.

## 🚀 Características

- **Tanque de agua** de 20.000L con visualización SVG en vivo
- **Sensor de humedad capacitivo** (ADC GPIO34) con gauge circular animado
- **Relé de control** (GPIO26) que activa/desactiva la bomba según umbrales
- **Electroválvula de llenado automático** (GPIO25)
- **Monitor serie** estilo Arduino IDE a 115200 baud
- **Cultivos seleccionables**: fresa, frijol, lechuga, sandía y más (10 tipos)
- **Tipos de riego**: goteo, microaspersión, aspersión, gravedad
- **Tipos de tierra**: arenosa, franca, arcillosa
- **Bombas intercambiables**: 0.5HP a 2HP
- **Cálculos en vivo**: consumo de agua, tiempo de riego, energía, eficiencia
- **Velocidad de simulación** ajustable (×1 a ×60)
- **Pantalla de login** con demo incluida
- **Diseño oscuro** profesional con paleta verde/azul

## 🛠️ Tecnologías

- HTML5 + CSS3 (vanilla)
- JavaScript (ES6+)
- Google Fonts (Space Grotesk, Inter, JetBrains Mono)
- Sin dependencias externas

## 📦 Estructura del proyecto

```
├── index.html    # Interfaz principal
├── style.css     # Estilos visuales
├── script.js     # Lógica de simulación y control
└── README.md     # Este archivo
```

## 🧪 Cómo usar

1. Abre `index.html` en cualquier navegador moderno
2. Inicia sesión con las credenciales demo: **admin** / **riego2026**
3. Configura el tipo de riego, bomba, cultivo y tierra
4. Presiona **▶ Iniciar** para comenzar la simulación
5. Observa cómo el sistema responde automáticamente a los cambios de humedad

## 🎯 Propósito

Herramienta educativa para entender el funcionamiento de un sistema de riego automatizado real con ESP32, permitiendo experimentar con diferentes configuraciones sin necesidad de hardware físico.

## 📝 Lógica equivalente (Arduino)

El panel incluye el código Arduino/ESP32 de referencia que replica la misma lógica de control con umbrales de humedad ON/OFF.

## 👨‍🌾 Demo

| Campo | Valor |
|-------|-------|
| Usuario | `admin` |
| Contraseña | `riego2026` |
