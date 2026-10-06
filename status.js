// the public WebSocket trackers, asked from this browser: an announce as a leecher wanting no peers, for a well-known
// infohash (the WebTorrent demo film Sintel), answered with the tracker's counts. Nothing else is sent, nothing is logged.
const TRACKERS = ['wss://tracker.openwebtorrent.com', 'wss://tracker.webtorrent.dev', 'wss://tracker.novage.com.ua', 'wss://tracker.btorrent.xyz', 'wss://tracker.fastcast.nz', 'wss://tracker.files.fm:7073/announce'];
const SINTEL = '08ada5a7a6183aae1e09d831df6748d566095a10';
const bin = (hex) => String.fromCharCode(...hex.match(/../g).map((x) => parseInt(x, 16)));
const peerId = '-WO0001-' + Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, '0')).join('');
const ask = (url) => new Promise((resolve) => {
  const t0 = Date.now(); let ws, opened = false; const done = (r) => { try { ws.close(); } catch {} resolve({ url, ms: Date.now() - t0, ...r }); };
  const timer = setTimeout(() => done({ error: opened ? 'connected, no reply' : 'no answer' }), 8000);
  try { ws = new WebSocket(url); } catch { clearTimeout(timer); return done({ error: 'bad URL' }); }
  ws.onopen = () => { opened = true; ws.send(JSON.stringify({ action: 'announce', info_hash: bin(SINTEL), peer_id: peerId, numwant: 0, uploaded: 0, downloaded: 0, left: 129302391, event: 'started', offers: [] })); };
  ws.onmessage = (m) => { let d; try { d = JSON.parse(m.data); } catch { return; } if (d.action === 'announce' && d.interval) { clearTimeout(timer); done({ seeders: d.complete ?? 0, leechers: d.incomplete ?? 0 }); } else if (d['failure reason']) { clearTimeout(timer); done({ error: d['failure reason'] }); } };
  ws.onerror = () => { if (!opened) { clearTimeout(timer); done({ error: 'refused' }); } }; ws.onclose = () => { if (!opened) { clearTimeout(timer); done({ error: 'refused' }); } };
});
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const rows = await Promise.all(TRACKERS.map(ask)); const alive = rows.filter((r) => !r.error).length;
document.getElementById('trk').innerHTML = rows.map((r) => `<tr><td class="mono">${esc(r.url.replace('wss://', ''))}</td><td>${r.error ? `<span class="bad">${esc(r.error)}</span>` : `<span class="ok">alive</span> <span class="tiny mut">· Sintel: ${r.seeders} seeders, ${r.leechers} leechers</span>`}</td><td class="n">${r.ms}</td></tr>`).join('');
document.getElementById('trk-note').textContent = rows.every((r) => r.error && r.error === 'no answer') ? 'Every socket silent with no refusal: this browser is not letting the connections out (Brave Shields does this). Firefox and Chromium answer.' : `${alive} of ${TRACKERS.length} answered at ${new Date().toLocaleTimeString()}. That is the whole public infrastructure for browser swarms.`;
