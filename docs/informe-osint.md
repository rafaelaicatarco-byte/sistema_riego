# Informe de Exposición OSINT — Sistema de Riego Automatizado

## Contexto

Este informe documenta, desde la perspectiva de un atacante externo, qué información podría filtrarse o explotarse en la aplicación web del Sistema de Riego Automatizado ESP32. El análisis se basa en la revisión del código fuente, configuración y comportamiento observable de la aplicación.

---

## 1. Fugas de información por headers HTTP

### Hallazgo
Los headers HTTP de respuestas del servidor Next.js pueden revelar información sobre la infraestructura.

**Ejemplo de headers observables:**
```
X-Powered-By: Next.js
Server: Vercel / Node.js
X-Nextjs-Id: [identificador interno]
```

**Riesgo:** Un atacante puede identificar la versión exacta de Next.js y buscar CVEs conocidos.

**Mitigación aplicada:**
- En `next.config.ts`, configurar headers personalizados para eliminar `X-Powered-By`.
- Usar un reverse proxy (nginx/Cloudflare) que reescriba los headers del servidor.

```ts
// next.config.ts
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Powered-By', value: '' },
        { key: 'Server', value: 'Web Server' },
      ],
    },
  ],
};
```

---

## 2. Tokens JWT expuestos o manejados incorrectamente

### Hallazgo
El sistema utiliza JWT almacenados en cookies httpOnly. Sin embargo:

- **En la práctica**, si algún endpoint retornara el token en el body de la respuesta, podría filtrarse.
- El payload del JWT contiene: `userId`, `username`, `email`. Un atacante que intercepte el token puede decodificar el payload (aunque no forjarlo sin la clave secreta).
- La clave secreta JWT está hardcodeada como fallback: `const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';`

**Riesgo:** Si no se configura la variable de entorno `JWT_SECRET`, la clave por defecto es predecible y cualquier persona puede forjar tokens válidos.

**Mitigación aplicada:**
- Eliminar el fallback `fallback-secret` en producción.
- Forzar la configuración de `JWT_SECRET` como variable de entorno obligatoria.
- Nunca retornar tokens en URLs o logs.

---

## 3. Mensajes de error excesivamente detallados

### Hallazgo
Los mensajes de error del backend actualmente revelan:
- `"Credenciales inválidas"` (sin distinción usuario/contraseña — ✅ bueno)
- `"Ya existe un usuario con ese usuario"` (revela qué campo del пароль duplicado — ❌ malo)
- Errores de Prisma pueden filtrar detalles de la base de datos

**Riesgo:** Mensajes de error detallados permiten enumeración de usuarios y revelan estructura de la BD.

**Mitigación aplicada:**
- Mensajes genéricos: `"Ya existe una cuenta con esos datos"` (no especifica si es username o email).
- Los errores de Prisma se capturan y se retorna un mensaje genérico `"Error interno del servidor"`.

---

## 4. Datos sensibles expuestos en el cliente

### Hallazgo
La aplicación es un Next.js con Client Components. Datos potencialmente expuestos:

- **Constantes de configuración** (PUMPS, PLANTS, SOILS, IRRIGATION): visibles en el JS bundle. No son sensibles, pero revelan la lógica de negocio.
- **Cálculos de riego**: la fórmula completa de cálculo de humedad, caudal y energía está expuesta en el bundle del cliente.
- **Código Arduino visible**: el panel de "código equivalente en Arduino" muestra la lógica completa del ESP32.

**Riesgo:** Un atacante puede entender completamente la lógica del sistema y buscar manipulaciones.

**Mitigación aplicada:**
- Para un prototipo educativo, esto es aceptable.
- En producción, la lógica crítica de control de motores NO debería ejecutarse en el cliente.

---

## 5. Ausencia de Content Security Policy (CSP)

### Hallazgo
No se observan headers CSP en las respuestas HTTP.

**Riesgo:** Sin CSP, la aplicación es vulnerable a inyección de scripts maliciosos (XSS). Un atacante podría inyectar JavaScript que robe cookies oAntiForgeryToken.

**Mitigación recomendada:**
```ts
// En next.config.ts o middleware
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
```

---

## 6. Rate Limiting limitado al login

### Hallazgo
El rate limiting implementado solo cubre la ruta `/api/auth/login`. Las demás API routes no tienen protección contra abuso.

**Riesgo:** Un atacante podría:
- Hacer flood de peticiones a `/api/simulation/actions` para generar miles de logs.
- Abusar de `/api/auth/register` para crear cuentas masivamente.
- Consumir recursos del servidor con peticiones legítimas pero excesivas.

**Mitigación recomendada:**
- Implementar rate limiting global por IP en el middleware.
- Limitar registros por IP (máximo 3 registros por hora por IP).

---

## 7. Cookie sin atributo `__Host-` prefix

### Hallazgo
La cookie `token` usa `httpOnly: true` y `secure: true` en producción, pero no usa el prefijo `__Host-`.

**Riesgo:** Sin el prefijo `__Host-`, un subdominio comprometido podría manipular la cookie.

**Mitigación recomendada:**
```ts
response.cookies.set('__Host-token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
  // No se necesita domain con __Host-
});
```

---

## 8. Logger persistido en filesystem

### Hallazgo
Los logs de seguridad se almacenan en `/data/security-logs.json` en el filesystem del servidor.

**Riesgo:** 
- Un atacante con acceso al servidor podría leer o modificar los logs.
- El archivo crece indefinidamente (aunque se limita a 500 entradas en memoria).
- No hay rotación de logs configurada.

**Mitigación recomendada:**
- En producción, usar un servicio de logging centralizado (ELK, Datadog, etc.).
- Implementar rotación de archivos.
- Los logs deben ser write-only para la aplicación (el servidor no debería exponerlos).

---

## 9. Información del ESP32 expuesta en la interfaz

### Hallazgo
La interfaz muestra:
- Número de pin GPIO (GPIO26 para relé, GPIO25 para válvula, GPIO34 para sensor)
- Rango del ADC (0-4095)
- Baud rate (115200)
- Fórmula de conversión ADC → humedad

**Riesgo:** Un atacante físico podría usar esta información para manipular el hardware ESP32.

**Mitigación:** Aceptable para prototipo educativo. En producción, esta información NO debería mostrarse en la interfaz web.

---

## 10. Ausencia de HTTPS forzado en desarrollo

### Hallazgo
La cookie `secure` se configura solo en producción: `secure: process.env.NODE_ENV === 'production'`.

**Riesgo:** En desarrollo con HTTP, las cookies se transmiten en texto plano, permitiendo interceptación.

**Mitigación:** Usar `localhost` con certificado auto-firmado o herramientas como `mkcert` para desarrollo local con HTTPS.

---

## Resumen de hallazgos

| # | Hallazgo | Severidad | Estado |
|---|----------|-----------|--------|
| 1 | Headers revelan versión de Next.js | Media | Pendiente |
| 2 | JWT secret con fallback predecible | Alta | Pendiente |
| 3 | Mensajes de error detallados | Media | ✅ Mitigado |
| 4 | Datos sensibles en cliente | Baja | Aceptable (prototipo) |
| 5 | Sin Content Security Policy | Alta | Pendiente |
| 6 | Rate limiting limitado | Media | ✅ Parcial |
| 7 | Cookie sin prefijo __Host- | Baja | Pendiente |
| 8 | Logger en filesystem | Media | Pendiente |
| 9 | Info de hardware expuesta | Baja | Aceptable (prototipo) |
| 10 | Sin HTTPS en desarrollo | Baja | Pendiente |

---

*Informe generado como parte de la macroactividad de ciberseguridad.*
*Fecha: Agosto 2026*
