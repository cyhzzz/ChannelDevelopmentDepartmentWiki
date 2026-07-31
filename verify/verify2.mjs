// 第二轮：滚动全页+逐区截图，确保 6 个 section 都被 IntersectionObserver 触发
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';

const URL = 'https://cyhzzz.github.io/ChannelDevelopmentDepartmentWiki/?v=' + Date.now();
const EXEC = '/tmp/chrome-linux/chrome';

(async () => {
  const consoleMessages = [];
  const pageErrors = [];

  const browser = await chromium.launch({
    executablePath: EXEC,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  page.on('console', m => consoleMessages.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', e => pageErrors.push(String(e)));

  console.log('navigate (force latest)...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);

  // 把所有 section 强制设为可见（避免 IntersectionObserver 时序问题）
  await page.evaluate(() => {
    document.querySelectorAll('.section').forEach(s => s.classList.add('is-visible'));
  });
  await page.waitForTimeout(400);

  // 1) 浅色全页（用 documentElement.scrollHeight）
  await page.screenshot({ path: '/workspace/shots/04-light-full-with-all-sections.png', fullPage: true });

  // 2) 切深色 + 浅色 IntersectionObserver 触发后再全页
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/workspace/shots/05-dark-full-with-all-sections.png', fullPage: true });

  // 3) 各 section 单独定位截图
  const sections = await page.$$('.section');
  console.log('section count:', sections.length);
  for (let i = 0; i < sections.length; i++) {
    const title = await sections[i].$eval('.section-title', el => el.textContent.trim()).catch(() => `section-${i}`);
    await sections[i].scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `/workspace/shots/06-section-dark-${i}-${title}.png`, fullPage: false });
  }

  // 4) 切回浅色，每个 section 再截一次
  await page.evaluate(() => {
    localStorage.setItem('theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(300);
  for (let i = 0; i < sections.length; i++) {
    const title = await sections[i].$eval('.section-title', el => el.textContent.trim()).catch(() => `section-${i}`);
    await sections[i].scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `/workspace/shots/07-section-light-${i}-${title}.png`, fullPage: false });
  }

  // 5) 单独看 13 个目标站点的图标 - 拉一张卡片矩阵
  await page.evaluate(() => window.scrollTo(0, 0));
  const targetNames = ['周报','小红书聚光','视频号助手','公众号平台','腾讯广告','巨量引擎','华为应用市场','小米应用市场','Oppo应用市场','vivo应用市场','苹果应用市场','稿定设计','阿里本地通'];
  const cards = await page.$$('.site-card');
  for (const c of cards) {
    const n = await c.$eval('.site-name', el => el.textContent.trim()).catch(() => '');
    if (targetNames.includes(n)) {
      await c.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      const box = await c.boundingBox();
      if (box) {
        await page.screenshot({
          path: `/workspace/shots/08-card-${n}.png`,
          clip: { x: box.x - 4, y: box.y - 4, width: box.width + 8, height: box.height + 8 },
        });
      }
    }
  }

  // 6) 提取每个目标站点的 brand 颜色（r,g,b）— 跟期望比对
  const detail = await page.evaluate((names) => {
    return names.map(n => {
      const card = Array.from(document.querySelectorAll('.site-card'))
        .find(c => c.querySelector('.site-name')?.textContent?.trim() === n);
      if (!card) return { name: n, found: false };
      const fav = card.querySelector('.site-favicon');
      const use = fav?.querySelector('use');
      const brand = fav ? getComputedStyle(fav).getPropertyValue('--brand').trim() : null;
      const bg = fav ? getComputedStyle(fav).backgroundColor : null;
      const color = fav ? getComputedStyle(fav).color : null;
      return {
        name: n, found: true,
        iconHref: use?.getAttribute('href') || use?.getAttribute('xlink:href'),
        brand, bg, color,
      };
    });
  }, targetNames);
  writeFileSync('/workspace/shots/13-targets-detail.json', JSON.stringify(detail, null, 2));

  // 7) 终态 console dump
  writeFileSync('/workspace/shots/console2.json', JSON.stringify({ console: consoleMessages, errors: pageErrors }, null, 2));

  await browser.close();
  console.log('done');
})();
