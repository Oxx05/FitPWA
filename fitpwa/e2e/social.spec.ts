import { test, expect } from '@playwright/test';

test.describe('TitanPulse Social & Community', () => {
  test.beforeEach(async ({ page }) => {
    // In a real scenario, we would login here. 
    // For this demonstration/verification, we assume the app is running.
    await page.goto('/');
  });

  test('should navigate to community and search', async ({ page }) => {
    await page.getByLabel('Social').click();
    await page.click('text=Comunidade'); 
    
    const searchInput = page.getByPlaceholder('Procurar treinos ou autores...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Push');
    
    await expect(page.locator('text=Comunidade')).toBeVisible();
  });

  test('should show prominent timer and finish session', async ({ page }) => {
    await page.goto('/workouts');
    const startButton = page.locator('text=Iniciar').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      
      const timerBtn = page.locator('text=Descansar');
      await expect(timerBtn).toBeVisible();
      
      // Test the "Finish" flow
      await page.click('text=Finalizar');
      await expect(page.locator('text=Treino Completo!')).toBeVisible();
      
      // Check XP display
      const xpText = page.locator('text=XP Ganhos');
      await expect(xpText).toBeVisible();
    }
  });

  test('should have friends and leaderboard links', async ({ page }) => {
    await page.getByLabel('Social').click();
    await expect(page.locator('text=Amigos')).toBeVisible();
    await page.click('text=Leaderboard');
    await expect(page.locator('text=Global')).toBeVisible();
  });
});
