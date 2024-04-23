import { IJupyterLabPage, expect, test } from '@jupyterlab/galata';
import { Page } from '@playwright/test';

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

// https://github.com/jupyterlab/jupyterlab/blob/9844a6fdb680aeae28a4d6238433f751ce5a6204/galata/src/fixtures.ts#L319-L336
async function myWaitForApplication({ baseURL }, use) {
  const waitIsReady = async (
    page: Page,
    helpers: IJupyterLabPage
  ): Promise<void> => {
    await page.waitForSelector('#jupyterlab-splash', {
      state: 'detached'
    });
    //! not wait for launcher tab.
  };
  await use(waitIsReady);
}

test('should emit an activation console message', async ({ page, waitForApplication: myWaitForApplication }) => {
  const logs: string[] = [];

  page.on('console', message => {
    logs.push(message.text());
  });

  await page.goto();

  expect(
    logs.filter(s => s === 'JupyterLab extension sidestickies is activated!')
  ).toHaveLength(1);
});
