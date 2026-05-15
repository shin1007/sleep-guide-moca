import { test, expect } from '@playwright/test';

test.describe('Sleep Guide Moca Audio Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    // Audio playback usually requires user interaction, 
    // but Playwright can bypass some of these with specific flags or by just clicking.
  });

  test('should start playback and update status', async ({ page }) => {
    const playButton = page.locator('button.primary');
    await expect(playButton).toBeVisible();
    
    // Click play
    await playButton.click();
    
    // Check if status changed to playing
    await expect(page.locator('.app-shell')).toHaveClass(/is-playing/);
    await expect(page.locator('.stage-label')).not.toHaveText('待漸進的筋弛緩法　▶　4-7-8呼吸法　▶　認知シャッフル睡眠法 の順で進みます');
    
    // Verify audio element has a source
    const audioSrc = await page.getAttribute('audio', 'src');
    expect(audioSrc).toBeTruthy();
    expect(audioSrc).toContain('.aac');

    // Check if audio is actually playing (currentTime increasing)
    // We wait a bit and check currentTime
    await page.waitForTimeout(1000);
    const currentTime = await page.evaluate(() => {
      const audio = document.querySelector('audio');
      return audio ? audio.currentTime : 0;
    });
    expect(currentTime).toBeGreaterThan(0);
  });

  test('should adjust volume settings', async ({ page }) => {
    // Start playback first to ensure volume can be applied
    await page.locator('button.primary').click();
    await expect(page.locator('.app-shell')).toHaveClass(/is-playing/);
    await page.waitForTimeout(500); // Wait for fade in etc

    const voiceSlider = page.locator('label.slider-row').filter({ hasText: 'ボイス音量' }).locator('input[type="range"]');

    // Change value (voice volume directly controls playback volume)
    await voiceSlider.fill('0.5');
    await page.waitForTimeout(100); // Allow react state to propagate

    // Verify internal volume of audio element changed
    const volumes = await page.evaluate(() => {
      const audio = document.querySelector('audio');
      return {
        elementVolume: audio ? audio.volume : -1,
        audioPaused: audio ? audio.paused : true
      };
    });

    console.log('Detected Volumes:', volumes);

    // volume = voiceVolume (initially after change 0.5)
    expect(volumes.elementVolume).toBeCloseTo(0.5, 2);
  });

  test('should not have audio errors on play', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.locator('button.primary').click();
    await page.waitForTimeout(1000);
    
    // Filter for audio errors we logged
    const audioErrors = errors.filter(e => e.includes('Audio error'));
    expect(audioErrors).toHaveLength(0);
    
    // Check status message for any "Audio error"
    const statusText = await page.locator('.status-panel').textContent();
    expect(statusText).not.toContain('Audio error');
  });
});
