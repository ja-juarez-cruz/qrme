# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: qr-flow.spec.ts >> QR.me End-to-End Flow (Dev Environment) >> 2. Crear QR (Plantilla Web)
- Location: tests/e2e/qr-flow.spec.ts:35:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button:has(h3)').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('button:has(h3)').first()

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e4]:
        - link "QR .me" [ref=e5] [cursor=pointer]:
          - /url: /
          - generic [ref=e6]: QR
          - generic [ref=e7]: .me
        - generic [ref=e8]:
          - link "👤 Mi Perfil" [ref=e9] [cursor=pointer]:
            - /url: /dashboard/
          - link "📱 Mis QRs" [ref=e10] [cursor=pointer]:
            - /url: /dashboard/qrs/
      - generic [ref=e11]:
        - generic [ref=e12]: ja.juarez.cruz+test1@gmail.com
        - button "Salir" [ref=e13] [cursor=pointer]
    - generic [ref=e14]:
      - heading "Crear nuevo QR" [level=1] [ref=e15]
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]:
            - generic [ref=e19]: ¿Qué tipo de QR quieres crear?
            - generic [ref=e20]:
              - button "📱 Plantilla Web" [active] [ref=e21]
              - button "🔗 Redirigir URL" [ref=e22]
          - generic [ref=e23]:
            - generic [ref=e24]:
              - button "🎭 Social" [ref=e25]
              - button "💼 Profesionalpronto" [disabled] [ref=e26]
              - button "📣 Divulgaciónpronto" [disabled] [ref=e27]
            - generic [ref=e28]: Elige una plantilla
            - generic [ref=e29]:
              - paragraph [ref=e30]: No se pudieron cargar las plantillas
              - button "Reintentar" [ref=e31]
          - generic [ref=e32]:
            - generic [ref=e33]: Nombre del QR (interno)
            - textbox "Nombre del QR (interno)" [ref=e34]:
              - /placeholder: "Ej: Camiseta para la fiesta"
          - generic [ref=e35]:
            - generic [ref=e36]: Mensaje / Tagline
            - textbox "Mensaje / Tagline" [ref=e37]:
              - /placeholder: Tu mensaje aquí...
            - paragraph [ref=e38]: Este mensaje aparecerá en tu página pública al escanear el QR.
          - button "🚀 Crear QR" [disabled] [ref=e39] [cursor=pointer]
        - generic [ref=e40]:
          - heading "Vista previa" [level=3] [ref=e41]
          - generic [ref=e42]:
            - generic [ref=e43]: ✨
            - generic [ref=e44]: 👤
            - heading "Tu Nombre" [level=2] [ref=e45]
            - paragraph [ref=e46]: “Tu tagline aquí”
            - generic [ref=e47]:
              - generic [ref=e48]: 🎵 música
              - generic [ref=e49]: ✈️ viajes
            - paragraph [ref=e50]: Así se verá tu página al escanear el QR
  - generic [ref=e55] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e56]:
      - img [ref=e57]
    - generic [ref=e60]:
      - button "Open issues overlay" [ref=e61]:
        - generic [ref=e62]:
          - generic [ref=e63]: "0"
          - generic [ref=e64]: "1"
        - generic [ref=e65]: Issue
      - button "Collapse issues badge" [ref=e66]:
        - img [ref=e67]
  - alert [ref=e69]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // Use environment variables for real auth
  4   | const TEST_EMAIL = process.env.TEST_EMAIL || '';
  5   | const TEST_PASSWORD = process.env.TEST_PASSWORD || '';
  6   | 
  7   | test.describe('QR.me End-to-End Flow (Dev Environment)', () => {
  8   |   // Configured to run tests serially because we share the same user
  9   |   // and we don't want auth states conflicting.
  10  |   test.describe.configure({ mode: 'serial' });
  11  | 
  12  |   test.beforeEach(async ({ page }) => {
  13  |     if (!TEST_EMAIL || !TEST_PASSWORD) {
  14  |       test.skip(true, 'Faltan variables de entorno TEST_EMAIL o TEST_PASSWORD');
  15  |     }
  16  |   });
  17  | 
  18  |   test('1. Flujo de Login y Redirección', async ({ page }) => {
  19  |     await page.goto('/login');
  20  |     
  21  |     // Fill real credentials
  22  |     await page.fill('input[type="email"]', TEST_EMAIL);
  23  |     await page.fill('input[type="password"]', TEST_PASSWORD);
  24  |     
  25  |     // Click login
  26  |     await page.click('button[type="submit"]');
  27  |     
  28  |     // Wait for authentication and redirection to dashboard
  29  |     await page.waitForURL(/.*\/dashboard\/qrs/, { timeout: 10000 });
  30  |     
  31  |     // Check if the dashboard QR list page loaded
  32  |     await expect(page.locator('h1', { hasText: 'Mis Códigos QR' })).toBeVisible();
  33  |   });
  34  | 
  35  |   test('2. Crear QR (Plantilla Web)', async ({ page }) => {
  36  |     // First, login
  37  |     await page.goto('/login');
  38  |     await page.fill('input[type="email"]', TEST_EMAIL);
  39  |     await page.fill('input[type="password"]', TEST_PASSWORD);
  40  |     await page.click('button[type="submit"]');
  41  |     await page.waitForURL(/.*\/dashboard\/qrs/);
  42  |     // Go directly to create page
  43  |     await page.goto('/dashboard/qrs/new');
  44  |     
  45  |     // Ensure the Type selector is visible
  46  |     await expect(page.getByText('Plantilla Web')).toBeVisible();
  47  |     
  48  |     // Click "Plantilla Web" button
  49  |     await page.getByText('Plantilla Web').click();
  50  |     
  51  |     // The template selector should be visible
  52  |     await expect(page.getByText('Elige una plantilla')).toBeVisible();
  53  |     
  54  |     // We MUST select a template for the "Crear QR" button to become enabled
  55  |     // The template buttons contain an h3 with the template name, while the Type buttons do not.
  56  |     const firstTemplateBtn = page.locator('button:has(h3)').first();
> 57  |     await expect(firstTemplateBtn).toBeVisible({ timeout: 10000 });
      |                                    ^ Error: expect(locator).toBeVisible() failed
  58  |     await firstTemplateBtn.click();
  59  |     
  60  |     // Fill the internal label
  61  |     await page.fill('input#qr-label', 'Mi Fiesta Playwright');
  62  |     
  63  |     // Fill the tagline
  64  |     await page.fill('input#qr-tagline', 'E2E Testing is fun!');
  65  |     
  66  |     // Click create (now it should be enabled)
  67  |     await page.getByRole('button', { name: /Crear QR/i }).click();
  68  |     
  69  |     // Wait for the success state and QR code to appear
  70  |     await expect(page.getByText('¡QR Creado con éxito!')).toBeVisible();
  71  |     
  72  |     // Verify the URL was generated
  73  |     await expect(page.locator('input[readonly]')).toHaveValue(/http:\/\/localhost:3000\/u\/.+/);
  74  |   });
  75  | 
  76  |   test('3. Crear QR (Redirección)', async ({ page }) => {
  77  |     await page.goto('/login');
  78  |     await page.fill('input[type="email"]', TEST_EMAIL);
  79  |     await page.fill('input[type="password"]', TEST_PASSWORD);
  80  |     await page.click('button[type="submit"]');
  81  |     await page.waitForURL(/.*\/dashboard\/qrs/);
  82  | 
  83  |     await page.goto('/dashboard/qrs/new');
  84  |     
  85  |     // Select Redirect type
  86  |     await page.getByText('Redirigir URL').click();
  87  |     
  88  |     // The redirect URL input should be visible
  89  |     const urlInput = page.locator('input#redirect-url');
  90  |     await expect(urlInput).toBeVisible();
  91  |     
  92  |     // Fill the inputs
  93  |     await urlInput.fill('https://playwright.dev');
  94  |     await page.fill('input#qr-label', 'QR a Playwright');
  95  |     
  96  |     // The tagline input should NOT be visible for redirects
  97  |     await expect(page.locator('input#qr-tagline')).not.toBeVisible();
  98  |     
  99  |     // Click create
  100 |     await page.getByRole('button', { name: /Crear QR/i }).click();
  101 |     
  102 |     // Wait for success
  103 |     await expect(page.getByText('¡QR Creado con éxito!')).toBeVisible();
  104 |   });
  105 | 
  106 |   test('4. Consultar lista y Eliminar QR', async ({ page }) => {
  107 |     await page.goto('/login');
  108 |     await page.fill('input[type="email"]', TEST_EMAIL);
  109 |     await page.fill('input[type="password"]', TEST_PASSWORD);
  110 |     await page.click('button[type="submit"]');
  111 |     await page.waitForURL(/.*\/dashboard\/qrs/);
  112 |     
  113 |     // Wait for the list to load
  114 |     const qrs = page.locator('.glass-card', { hasText: 'Copiar link' });
  115 |     
  116 |     // There might be QRs from previous tests or the ones we just created.
  117 |     // We expect at least one QR to exist if we created one, or we just test the delete button
  118 |     if (await qrs.count() > 0) {
  119 |       const firstQr = qrs.first();
  120 |       
  121 |       // Click delete button (assuming the trash icon button exists and has a specific class or role)
  122 |       // Usually it's a danger button
  123 |       const deleteBtn = firstQr.locator('button.btn-danger');
  124 |       if (await deleteBtn.count() > 0) {
  125 |         await deleteBtn.click();
  126 |         
  127 |         // Wait for removal
  128 |         // (If there's a confirmation dialog, we would handle it here, but looking at the code it might just delete)
  129 |         // await page.on('dialog', dialog => dialog.accept()); 
  130 |       }
  131 |     }
  132 |   });
  133 | });
  134 | 
```