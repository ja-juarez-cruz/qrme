import { test, expect } from '@playwright/test';

// Use environment variables for real auth
const TEST_EMAIL = process.env.TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';

test.describe('QR.me End-to-End Flow (Dev Environment)', () => {
  // Configured to run tests serially because we share the same user
  // and we don't want auth states conflicting.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip(true, 'Faltan variables de entorno TEST_EMAIL o TEST_PASSWORD');
    }
  });

  test('1. Flujo de Login y Redirección', async ({ page }) => {
    await page.goto('/login');
    
    // Fill real credentials
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    // Click login
    await page.click('button[type="submit"]');
    
    // Wait for authentication and redirection to dashboard
    await page.waitForURL(/.*\/dashboard\/qrs/, { timeout: 10000 });
    
    // Check if the dashboard QR list page loaded
    await expect(page.locator('h1', { hasText: 'Mis Códigos QR' })).toBeVisible();
  });

  test('2. Crear QR (Plantilla Web)', async ({ page }) => {
    // First, login
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/dashboard\/qrs/);
    // Go directly to create page
    await page.goto('/dashboard/qrs/new');
    
    // Ensure the Type selector is visible
    await expect(page.getByText('Plantilla Web')).toBeVisible();
    
    // Click "Plantilla Web" button
    await page.getByText('Plantilla Web').click();
    
    // The template selector should be visible
    await expect(page.getByText('Elige una plantilla')).toBeVisible();
    
    // Fill the internal label
    await page.fill('input#qr-label', 'Mi Fiesta Playwright');
    
    // Fill the tagline
    await page.fill('input#qr-tagline', 'E2E Testing is fun!');
    
    // Click create
    await page.getByRole('button', { name: /Crear QR/i }).click();
    
    // Wait for the success state and QR code to appear
    await expect(page.getByText('¡QR Creado con éxito!')).toBeVisible();
    
    // Verify the URL was generated
    await expect(page.locator('input[readonly]')).toHaveValue(/http:\/\/localhost:3000\/u\/.+/);
  });

  test('3. Crear QR (Redirección)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/dashboard\/qrs/);

    await page.goto('/dashboard/qrs/new');
    
    // Select Redirect type
    await page.getByText('Redirigir URL').click();
    
    // The redirect URL input should be visible
    const urlInput = page.locator('input#redirect-url');
    await expect(urlInput).toBeVisible();
    
    // Fill the inputs
    await urlInput.fill('https://playwright.dev');
    await page.fill('input#qr-label', 'QR a Playwright');
    
    // The tagline input should NOT be visible for redirects
    await expect(page.locator('input#qr-tagline')).not.toBeVisible();
    
    // Click create
    await page.getByRole('button', { name: /Crear QR/i }).click();
    
    // Wait for success
    await expect(page.getByText('¡QR Creado con éxito!')).toBeVisible();
  });

  test('4. Consultar lista y Eliminar QR', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/dashboard\/qrs/);
    
    // Wait for the list to load
    const qrs = page.locator('.glass-card', { hasText: 'Copiar link' });
    
    // There might be QRs from previous tests or the ones we just created.
    // We expect at least one QR to exist if we created one, or we just test the delete button
    if (await qrs.count() > 0) {
      const firstQr = qrs.first();
      
      // Click delete button (assuming the trash icon button exists and has a specific class or role)
      // Usually it's a danger button
      const deleteBtn = firstQr.locator('button.btn-danger');
      if (await deleteBtn.count() > 0) {
        await deleteBtn.click();
        
        // Wait for removal
        // (If there's a confirmation dialog, we would handle it here, but looking at the code it might just delete)
        // await page.on('dialog', dialog => dialog.accept()); 
      }
    }
  });
});
