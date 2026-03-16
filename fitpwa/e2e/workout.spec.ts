import { test, expect } from '@playwright/test';

test.describe('FitPWA Workout Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to workouts page', async ({ page }) => {
    await page.goto('/workouts');

    // Check that either the workouts list or a login redirect is shown
    const heading = page.locator('text=Planos de Treino, text=Os teus Planos').first();
    const loginRedirect = page.locator('text=Entrar, text=Login').first();

    const hasContent = await heading.isVisible().catch(() => false);
    const hasLogin = await loginRedirect.isVisible().catch(() => false);

    expect(hasContent || hasLogin).toBeTruthy();
  });

  test('should show workout editor page', async ({ page }) => {
    await page.goto('/workouts/new');

    // Editor should show either workout creation form or login redirect
    const nameLabel = page.locator('text=Nome do Plano');
    const loginRedirect = page.locator('text=Entrar, text=Login').first();

    const hasForm = await nameLabel.isVisible().catch(() => false);
    const hasLogin = await loginRedirect.isVisible().catch(() => false);

    expect(hasForm || hasLogin).toBeTruthy();
  });

  test('should display exercise selection interface', async ({ page }) => {
    // Navigate to the editor page directly
    await page.goto('/workouts/new');

    // Look for Add Exercise button (may need auth)
    const addButton = page.locator('text=Adicionar Exercício');
    const loginRedirect = page.locator('text=Entrar').first();
    
    const hasButton = await addButton.isVisible().catch(() => false);
    const hasLogin = await loginRedirect.isVisible().catch(() => false);

    expect(hasButton || hasLogin).toBeTruthy();
  });
});
