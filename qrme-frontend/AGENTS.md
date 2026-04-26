<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Pruebas End-to-End (E2E) con Playwright

Hemos configurado **Playwright** para probar automáticamente el frontend (Login, Consultar QR, Crear QR, Eliminar QR).
Actualmente, el entorno local de tu máquina no tenía conexión a internet al momento de intentar instalar los binarios de los navegadores, por lo que **necesitas ejecutar los siguientes comandos manualmente** una vez que recuperes tu conexión a internet:

## 1. Instalación Manual (Solo la primera vez)

Abre tu terminal, asegúrate de tener conexión a internet y ejecuta:

```bash
cd qrme-frontend
npm install
npx playwright install --with-deps
```

*(Esto descargará los navegadores necesarios como Chromium para que las pruebas puedan correr en segundo plano).*

## 2. Ejecutar las Pruebas

Para correr las pruebas E2E (usarán los datos simulados locales `USE_MOCK` por lo que no afectarán tu base de datos en AWS):

```bash
cd qrme-frontend
npm run test:e2e
```

Si quieres ver cómo Playwright abre el navegador y hace los clics paso a paso (modo visual):

```bash
cd qrme-frontend
npx playwright test --ui
```

## Integración con CI/CD (GitHub Actions)

El archivo `.github/workflows/deploy-dev.yml` ha sido modificado para que:
1. **Ejecute las pruebas de Playwright** automáticamente al hacer un push a `dev`.
2. Si las pruebas pasan, **solo despliegue el backend**. El frontend ya no se subirá a S3 en el entorno `dev`, garantizando que este entorno se pruebe localmente.
