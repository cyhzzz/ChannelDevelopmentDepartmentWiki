// 直接用 chrome-remote-interface 或 puppeteer-core 控制已下载的 chromium
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';

const URL = 'https://cyhzzz.github.io/ChannelDevelopmentDepartmentWiki/?v=' + Date.now();
const EXEC = '/tmp/chrome-linux/chrome';

const TARGET_SITES = [
  { name: '周报',          expectedIcon: 'b-doc',     expectedColor: '#3b82f6', note: '蓝色文档' },
  { name: '小红书聚光',    expectedIcon: 'b-spark',   expectedColor: '#ff2442', note: '红色星' },
  { name: '视频号助手',    expectedIcon: 'b-wechat',  expectedColor: '#07c160', note: '绿色微信气泡' },
  { name: '公众号平台',    expectedIcon: 'b-wechat',  expectedColor: '#07c160', note: '绿色微信气泡' },
  { name: '腾讯广告',      expectedIcon: 'b-tencent', expectedColor: '#0052d9', note: '蓝色企鹅' },
  { name: '巨量引擎',      expectedIcon: 'b-douyin',  expectedColor: '#000000', note: '黑色抖音音符' },
  { name: '华为应用市场',  expectedIcon: 'b-huawei',  expectedColor: '#cf0a2c', note: '红色花瓣' },
  { name: '小米应用市场',  expectedIcon: 'b-xiaomi',  expectedColor: '#ff6700', note: '橙色MI条' },
  { name: 'Oppo应用市场',  expectedIcon: 'b-oppo',    expectedColor: '#1aad19', note: '绿色椭圆' },
  { name: 'vivo应用市场',  expectedIcon: 'b-vivo',    expectedColor: '#415fff', note: '蓝色横条+绿弧' },
  { name: '苹果应用市场',  expectedIcon: 'b-apple',   expectedColor: '#555555', note: '灰色苹果咬痕' },
  { name: '稿定设计',      expectedIcon: 'b-gaoding', expectedColor: '#7c3aed', note: '紫色G字母' },
  { name: '阿里本地通',    expectedIcon: 'b-alibaba', expectedColor: '#ff6a00', note: '橙色阿里符号' },
];

function rgbToHex(rgb) {
  if (!rgb) return null;
  if (rgb.startsWith('#')) return rgb.toLowerCase();
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('').toLowerCase();
}

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

  console.log('--- 步骤 1: navigate (首次，确保拿最新) ---');
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('--- 步骤 2: navigate (再次刷新确保最新) ---');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });

  // 等动画/字体
  await page.waitForTimeout(1500);

  console.log('--- 步骤 3: 浅色全页截图 ---');
  await page.screenshot({ path: '/workspace/shots/01-light-full.png', fullPage: true });
  await page.screenshot({ path: '/workspace/shots/01-light-viewport.png', fullPage: false });

  console.log('--- 步骤 4: 浅色 DOM snapshot (核心卡片区) ---');
  const lightSnapshot = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.site-card')).map(c => {
      const fav = c.querySelector('.site-favicon');
      const svg = fav?.querySelector('svg');
      const use = svg?.querySelector('use');
      const name = c.querySelector('.site-name')?.textContent?.trim();
      const brand = fav ? getComputedStyle(fav).getPropertyValue('--brand').trim() : null;
      return {
        name,
        brand,
        iconId: use?.getAttribute('href') || use?.getAttribute('xlink:href') || null,
        innerHTML: fav?.innerHTML?.slice(0, 60) || null,
        innerText: fav?.textContent?.trim() || null,
      };
    });
    return cards;
  });
  writeFileSync('/workspace/shots/light-snapshot.json', JSON.stringify(lightSnapshot, null, 2));

  console.log('--- 步骤 5: 切深色 + 深色全页截图 ---');
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/workspace/shots/02-dark-full.png', fullPage: true });
  await page.screenshot({ path: '/workspace/shots/02-dark-viewport.png', fullPage: false });

  const darkSnapshot = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.site-card')).map(c => {
      const fav = c.querySelector('.site-favicon');
      const svg = fav?.querySelector('svg');
      const use = svg?.querySelector('use');
      const name = c.querySelector('.site-name')?.textContent?.trim();
      const brand = fav ? getComputedStyle(fav).getPropertyValue('--brand').trim() : null;
      return { name, brand, iconId: use?.getAttribute('href') || use?.getAttribute('xlink:href') || null };
    });
    return cards;
  });
  writeFileSync('/workspace/shots/dark-snapshot.json', JSON.stringify(darkSnapshot, null, 2));

  console.log('--- 步骤 6: 切回浅色 + Hover 卡片截图 ---');
  await page.evaluate(() => {
    localStorage.setItem('theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(300);

  // 找到"稿定设计"卡片并 hover
  const targetName = '稿定设计';
  const cardHandle = await page.evaluateHandle((n) => {
    return Array.from(document.querySelectorAll('.site-card'))
      .find(c => c.querySelector('.site-name')?.textContent?.trim() === n);
  }, targetName);
  if (cardHandle && (await cardHandle.asElement())) {
    await cardHandle.asElement().hover();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `/workspace/shots/03-hover-${targetName}.png`, fullPage: false });
  } else {
    // 退而求其次：hover 第一个分类的第一个卡片
    const first = await page.$('.site-card');
    if (first) {
      await first.hover();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/workspace/shots/03-hover-first.png', fullPage: false });
    }
  }

  console.log('--- 步骤 7: Hover 状态下读取 brand shadow ---');
  const hoverInfo = await page.evaluate((n) => {
    const card = Array.from(document.querySelectorAll('.site-card'))
      .find(c => c.querySelector('.site-name')?.textContent?.trim() === n);
    if (!card) return null;
    const fav = card.querySelector('.site-favicon');
    return {
      favBoxShadow: fav ? getComputedStyle(fav).boxShadow : null,
      favBorderColor: fav ? getComputedStyle(fav).borderColor : null,
      brand: fav ? getComputedStyle(fav).getPropertyValue('--brand').trim() : null,
      transform: fav ? getComputedStyle(fav).transform : null,
    };
  }, targetName);
  writeFileSync('/workspace/shots/hover-info.json', JSON.stringify(hoverInfo, null, 2));

  console.log('--- 步骤 8: 控制台/错误 ---');
  writeFileSync('/workspace/shots/console.json', JSON.stringify({ console: consoleMessages, errors: pageErrors }, null, 2));

  // 一次性把"13 个目标站点"的 brand 与 期望对账
  const audit = TARGET_SITES.map(t => {
    const card = lightSnapshot.find(c => c.name === t.name);
    if (!card) return { ...t, found: false };
    const actualColor = card.brand ? card.brand.toLowerCase() : null;
    return {
      ...t,
      found: true,
      actualIcon: card.iconId,
      actualColor,
      iconOk: card.iconId === '#' + t.expectedIcon,
      colorOk: actualColor === t.expectedColor,
    };
  });
  writeFileSync('/workspace/shots/audit.json', JSON.stringify(audit, null, 2));

  await browser.close();
  console.log('--- 完成 ---');
})();
