// Smoke test for an installed Blockhaven build.
// Start the app with --remote-debugging-port=<port>, then run:  node scripts/smoke-test.mjs <port> <screenshot-dir>
// It drives the real app window through the Chrome DevTools Protocol: launcher -> new Survival world -> game,
// checks the world generates and crafting works, and saves screenshots. Exits non-zero on any failure.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const port = process.argv[2] || '9222';
const shotDir = process.argv[3] || 'smoke-screenshots';
const sleep = ms => new Promise(r => setTimeout(r, ms));
mkdirSync(shotDir, { recursive: true });

async function findPage() {
  for (let i = 0; i < 90; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find(t => t.type === 'page' && t.url.includes('/app/'));
      if (page) return page.webSocketDebuggerUrl;
    } catch (e) { /* app still starting */ }
    await sleep(1000);
  }
  throw new Error('The app window never appeared');
}
function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pending = new Map();
    ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
    ws.onerror = () => reject(new Error('Could not connect to the app'));
    ws.onopen = () => {
      const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
      const evaluate = async expression => {
        const m = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (m.error) throw new Error(m.error.message);
        if (m.result.exceptionDetails) throw new Error(m.result.exceptionDetails.exception?.description || m.result.exceptionDetails.text);
        return m.result.result.value;
      };
      resolve({ send, evaluate, close: () => ws.close() });
    };
  });
}
async function waitFor(app, expression, label, seconds = 40) {
  let lastErr = '';
  for (let i = 0; i < seconds * 2; i++) {
    try { const v = await app.evaluate(expression); if (v) return v; } catch (e) { lastErr = e.message; }
    await sleep(500);
  }
  throw new Error(`Timed out waiting for: ${label}${lastErr ? ` (last error: ${lastErr})` : ''}`);
}
async function screenshot(app, name) {
  const m = await app.send('Page.captureScreenshot', { format: 'png' });
  if (m.result?.data) writeFileSync(join(shotDir, name), Buffer.from(m.result.data, 'base64'));
}

const app = await connect(await findPage());
try {
  const version = await waitFor(app, `(() => { const v = document.getElementById('version'); return v && v.textContent.startsWith('Version') && v.textContent; })()`,
    'launcher to load with the desktop bridge');
  console.log(`✔ Launcher loaded: ${version}`);
  await sleep(1000);
  await screenshot(app, '1-launcher.png');

  await app.evaluate(`(() => { const w = BlockhavenStore.createWorld({ name: 'Smoke Test', mode: 'survival', seed: 'smoke' });
    location.href = 'game.html?world=' + w.id; return true; })()`);
  const noGl = await waitFor(app, `(document.body && document.body.innerText.includes('NO 3D SUPPORT')) ? 'nogl' : (typeof blockhaven === 'object' && blockhaven.chunks.size > 20 ? 'ok' : '')`,
    'game world to generate', 60);
  if (noGl === 'nogl') throw new Error('The game reported that WebGL could not start');
  console.log(`✔ Game loaded: ${await app.evaluate('blockhaven.chunks.size')} chunks, mode ${await app.evaluate('blockhaven.mode')}`);

  const planks = await app.evaluate(`(() => { blockhaven.addItem(6, 2); blockhaven.craft(blockhaven.RECIPES[0], 1); return blockhaven.countItem(8); })()`);
  if (planks !== 4) throw new Error(`Crafting check failed: expected 4 planks, got ${planks}`);
  console.log('✔ Inventory and crafting work');

  await app.evaluate(`blockhaven.setPlaying(true)`);
  await sleep(3000);
  await screenshot(app, '2-game.png');
  await app.evaluate(`blockhaven.openInventory()`);
  await sleep(800);
  await screenshot(app, '3-inventory.png');
  await app.evaluate(`(() => { blockhaven.saveGame(); location.href = 'index.html'; return true; })()`);
  await waitFor(app, `document.querySelectorAll('.world').length > 0`, 'launcher to list the saved world');
  console.log('✔ Saved world appears in the launcher');
  await screenshot(app, '4-launcher-with-world.png');
  console.log('SMOKE TEST PASSED');
} catch (e) {
  await screenshot(app, 'failure.png').catch(() => {});
  console.error('SMOKE TEST FAILED:', e.message);
  process.exitCode = 1;
} finally {
  app.close();
}
