// Shared save/settings storage for the launcher and the game.
(function () {
  'use strict';
  const LIST = 'blockhaven-worlds', SETTINGS = 'blockhaven-settings', LEGACY = 'blockhaven-save-v1';
  const DEFAULT_SETTINGS = { rd: 6, sens: 1, fov: 75 };

  function read(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  function seedFrom(text) {
    text = String(text == null ? '' : text).trim();
    if (!text) return (Math.random() * 2147483647) | 0;
    if (/^-?\d+$/.test(text)) return Number(text) | 0;
    let h = 2166136261;
    for (const ch of text) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
    return h | 0;
  }
  // Worlds saved by the first single-world version become a normal world entry.
  function migrate() {
    const old = read(LEGACY, null);
    if (!old || typeof old.seed !== 'number') return;
    const list = read(LIST, []);
    list.push({ id: 'legacy', name: 'My First World', mode: 'creative', seed: old.seed, created: Date.now(), lastPlayed: Date.now() });
    write(LIST, list);
    write('blockhaven-world-legacy', { edits: old.edits, player: old.player, time: old.time });
    try { localStorage.removeItem(LEGACY); } catch (e) {}
  }
  function listWorlds() {
    migrate();
    return read(LIST, []).sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
  }
  function createWorld({ name, mode, seed }) {
    const w = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: (name || '').trim() || 'New World',
      mode: mode === 'creative' ? 'creative' : 'survival',
      seed: seedFrom(seed), created: Date.now(), lastPlayed: Date.now(),
    };
    const list = read(LIST, []); list.push(w); write(LIST, list);
    return w;
  }
  function getWorld(id) { migrate(); return read(LIST, []).find(w => w.id === id) || null; }
  function updateWorld(id, patch) {
    const list = read(LIST, []), w = list.find(x => x.id === id);
    if (w) { Object.assign(w, patch); write(LIST, list); }
    return w;
  }
  function deleteWorld(id) {
    write(LIST, read(LIST, []).filter(w => w.id !== id));
    try { localStorage.removeItem('blockhaven-world-' + id); } catch (e) {}
  }
  const loadWorldData = id => read('blockhaven-world-' + id, null);
  const saveWorldData = (id, data) => write('blockhaven-world-' + id, data);
  const getSettings = () => Object.assign({}, DEFAULT_SETTINGS, read(SETTINGS, {}));
  const setSettings = patch => write(SETTINGS, Object.assign(getSettings(), patch));

  window.BlockhavenStore = { listWorlds, createWorld, getWorld, updateWorld, deleteWorld, loadWorldData, saveWorldData,
    getSettings, setSettings, seedFrom };
})();
