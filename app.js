/* ==========================================================
   R-CONSTRUCT : logique applicative (Vanilla JS, localStorage)
   ========================================================== */

const DB_KEY = 'rconstruct_db';
const SESSION_KEY = 'rconstruct_session';
const ACTIVE_KEY = 'rconstruct_chantier';

/* ---------- Données initiales ---------- */
const SEED = {
  users: [
    { id: 'u1', name: 'Administrateur R-CONSTRUCT', role: 'admin',      chantierId: null, initials: 'AD' },
    { id: 'u2', name: 'Jean K.',                    role: 'conducteur', chantierId: 'c1', initials: 'JK' },
    { id: 'u3', name: 'Paul M.',                    role: 'compagnon',  chantierId: 'c1', initials: 'PM' },
    { id: 'u4', name: 'Mme Dupont',                 role: 'client',     chantierId: 'c1', initials: 'MD' }
  ],
  chantiers: [
    { id: 'c1', nom: 'Résidence Mont-Ngafula', adresse: 'Avenue des Usines, Kinshasa', statut: 'en-cours' },
    { id: 'c2', nom: 'Villa Lemba',            adresse: 'Quartier Lemba, Kinshasa',    statut: 'planifie' }
  ],
  zones: [
    { id: 'z1', chantierId: 'c1', nom: 'Fondations' },
    { id: 'z2', chantierId: 'c1', nom: 'Gros œuvre – RDC' },
    { id: 'z3', chantierId: 'c1', nom: 'Étage 2' },
    { id: 'z4', chantierId: 'c2', nom: 'Extérieur' }
  ],
  photos: [],
  reserves: [
    { id: 'r1', chantierId: 'c1', zoneId: 'z3', description: 'Enduit à reprendre au 2e étage', statut: 'ouverte',
      assigneA: 'u3', echeance: '2026-11-20', visibleClient: false, photo: null, createdAt: '2026-11-02T08:00:00.000Z' }
  ],
  rapports: [],
  pointages: []
};

/* ---------- Base de données (localStorage) ---------- */
const DB = {
  load() {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(DB_KEY) || 'null'); } catch (e) { stored = null; }
    const base = structuredClone(SEED);
    if (!stored) { DB.save(base); return base; }
    return { ...base, ...stored };
  },
  save(data) {
    try { localStorage.setItem(DB_KEY, JSON.stringify(data)); return true; }
    catch (e) { showToast('Stockage plein : supprimez d\'anciennes photos'); return false; }
  }
};

let db = DB.load();
let currentUser = null;
let activeChantierId = null;
let liveTimer = null;
let pendingPhoto = null;
let pendingReservePhoto = null;

const persist = () => DB.save(db);

/* ---------- Utilitaires ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

const ROLE_LABELS = { admin: 'Direction', conducteur: 'Conducteur de travaux', compagnon: 'Compagnon', client: 'Client' };
const STATUS_LABELS = { 'en-cours': 'En cours', 'termine': 'Terminé', 'planifie': 'Planifié' };
const METEO = { soleil: 'Ensoleillé', nuages: 'Nuageux', pluie: 'Pluie', orage: 'Orage' };

const isClient = () => currentUser?.role === 'client';
const canManage = () => ['admin', 'conducteur'].includes(currentUser?.role);

const chantierName = id => db.chantiers.find(c => c.id === id)?.nom ?? '—';
const zoneName = id => db.zones.find(z => z.id === id)?.nom ?? 'Sans zone';
const userName = id => db.users.find(u => u.id === id)?.name ?? '';
const zonesActives = () => db.zones.filter(z => z.chantierId === activeChantierId);

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function localISODate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtDay(value) {
  const d = new Date(value.length === 10 ? value + 'T12:00:00' : value);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function fmtDateTime(iso) {
  return `${fmtDay(iso)} · ${fmtTime(iso)}`;
}
function formatDuration(ms) {
  const m = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
}
function formatHMS(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = n => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
}

function fileToDataURL(file, maxSize = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

let toastTimer = null;
function showToast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------- Écrans, feuilles, navigation ---------- */
function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.target === id));
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function setNavVisible(visible) { $('#bottom-nav').hidden = !visible; }

function openSheet(id) {
  $('#' + id).hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeSheet(id) {
  $('#' + id).hidden = true;
  pendingPhoto = null;
  pendingReservePhoto = null;
  if ($$('.sheet-backdrop').every(s => s.hidden)) document.body.style.overflow = '';
}

function fillZoneSelect(select, selected = '') {
  const zones = zonesActives();
  select.innerHTML = '<option value="">Choisir une zone</option>' +
    zones.map(z => `<option value="${esc(z.id)}">${esc(z.nom)}</option>`).join('');
  select.value = zones.some(z => z.id === selected) ? selected : '';
}

/* ---------- Connexion ---------- */
function renderLogin() {
  $('#user-list').innerHTML = db.users.map(u => `
    <button class="user-btn" data-user="${esc(u.id)}">
      <span class="avatar">${esc(u.initials)}</span>
      <span>
        <span class="name">${esc(u.name)}</span>
        <span class="role-badge">${esc(ROLE_LABELS[u.role])}</span>
      </span>
    </button>`).join('');
}

function resolveChantier() {
  if (currentUser.role !== 'admin') {
    activeChantierId = currentUser.chantierId;
    return;
  }
  const saved = localStorage.getItem(ACTIVE_KEY);
  activeChantierId = db.chantiers.some(c => c.id === saved) ? saved : db.chantiers[0]?.id ?? null;
}

function login(userId, silent = false) {
  const user = db.users.find(u => u.id === userId);
  if (!user) return;
  currentUser = user;
  localStorage.setItem(SESSION_KEY, user.id);
  resolveChantier();
  setNavVisible(true);
  renderAll();
  showScreen('screen-home');
  if (!silent) showToast(`Bienvenue, ${user.name.split(' ')[0]}`);
}

function logout() {
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  stopTimer();
  setNavVisible(false);
  showScreen('screen-login');
}

function renderAll() {
  if (!currentUser) return;
  renderHome();
  renderPhotos();
  renderReserves();
  renderRapports();
  renderProfil();
  const label = chantierName(activeChantierId);
  $('#photo-chantier').textContent = label;
  $('#reserve-chantier').textContent = label;
  $('#rapport-chantier').textContent = label;
  $('#btn-zone-add').hidden = !canManage();
}

/* ---------- Accueil ---------- */
function chantiersVisibles() {
  if (currentUser.role === 'admin') return db.chantiers;
  return db.chantiers.filter(c => c.id === currentUser.chantierId);
}

function renderHome() {
  $('#home-user-name').textContent = currentUser.name;
  const list = chantiersVisibles();
  const ids = list.map(c => c.id);
  $('#stat-chantiers').textContent = list.length;

  if (isClient()) {
    $('#stat-label-2').textContent = 'Réserves levées';
    $('#stat-reserves').textContent = db.reserves.filter(r =>
      ids.includes(r.chantierId) && r.visibleClient && r.statut === 'levee').length;
  } else {
    $('#stat-label-2').textContent = 'Réserves ouvertes';
    $('#stat-reserves').textContent = db.reserves.filter(r =>
      ids.includes(r.chantierId) && r.statut === 'ouverte').length;
  }

  $('#chantier-list').innerHTML = list.length ? list.map(c => `
    <button class="chantier-card ${c.id === activeChantierId ? 'selected' : ''}" data-chantier="${esc(c.id)}">
      <h4>${esc(c.nom)}</h4>
      <p class="addr">${esc(c.adresse)}</p>
      <span class="status ${esc(c.statut)}">${esc(STATUS_LABELS[c.statut] || c.statut)}</span>
    </button>`).join('') : '<div class="empty">Aucun chantier assigné pour le moment.</div>';
}

/* ---------- Photos ---------- */
function renderPhotos() {
  const sel = $('#photo-zone-filter');
  const prev = sel.value;
  const zones = zonesActives();
  sel.innerHTML = '<option value="">Toutes les zones</option>' +
    zones.map(z => `<option value="${esc(z.id)}">${esc(z.nom)}</option>`).join('');
  sel.value = zones.some(z => z.id === prev) ? prev : '';

  let items = db.photos.filter(p => p.chantierId === activeChantierId);
  if (isClient()) items = items.filter(p => p.visibleClient);
  if (sel.value) items = items.filter(p => p.zoneId === sel.value);
  items.sort((a, b) => b.date.localeCompare(a.date));

  $('#photo-grid').innerHTML = items.length ? items.map(p => `
    <button class="photo-tile" data-photo="${esc(p.id)}">
      <img src="${esc(p.imageUrl)}" alt="${esc(p.commentaire || 'Photo de chantier')}" loading="lazy">
      <span class="tile-label">${esc(zoneName(p.zoneId))}</span>
      ${p.visibleClient && !isClient() ? '<span class="tile-badge">Client</span>' : ''}
    </button>`).join('') : '<div class="empty" style="grid-column:1/-1">Aucune photo pour le moment.</div>';

  $('#fab-photo').hidden = isClient();
}

function openLightbox(id) {
  const p = db.photos.find(x => x.id === id);
  if (!p) return;
  $('#lb-img').src = p.imageUrl;
  $('#lb-meta').innerHTML = `<strong>${esc(zoneName(p.zoneId))}</strong><br>
    ${esc(p.commentaire || 'Sans commentaire')}<br>
    <small>${esc(p.auteur)} · ${esc(fmtDateTime(p.date))}</small>`;
  const btn = $('#lb-toggle');
  btn.hidden = !canManage();
  btn.dataset.id = id;
  btn.textContent = p.visibleClient ? 'Retirer du portail' : 'Publier au client';
  openSheet('sheet-lightbox');
}

/* ---------- Réserves ---------- */
function renderReserves() {
  let items = db.reserves.filter(r => r.chantierId === activeChantierId);
  if (isClient()) items = items.filter(r => r.visibleClient && r.statut === 'levee');
  items.sort((a, b) =>
    (a.statut === 'ouverte' ? 0 : 1) - (b.statut === 'ouverte' ? 0 : 1) ||
    (a.echeance || '9999').localeCompare(b.echeance || '9999'));

  const today = localISODate();
  $('#reserve-list').innerHTML = items.length ? items.map(r => {
    const ouverte = r.statut === 'ouverte';
    const late = ouverte && r.echeance && r.echeance < today;
    return `
    <article class="item-card ${ouverte ? '' : 'is-done'}">
      ${r.photo ? `<img class="item-thumb" src="${esc(r.photo)}" alt="Photo de la réserve">` : ''}
      <div class="item-body">
        <div class="item-head">
          <span class="pill ${ouverte ? 'pill-open' : 'pill-done'}">${ouverte ? 'Ouverte' : 'Levée'}</span>
          ${late ? '<span class="pill pill-late">En retard</span>' : ''}
        </div>
        <h4>${esc(r.description)}</h4>
        <p class="addr">${esc(zoneName(r.zoneId))} · ${esc(userName(r.assigneA) || 'Non assignée')}
          ${r.echeance ? ` · Échéance ${esc(fmtDay(r.echeance))}` : ''}</p>
        <div class="item-actions">
          ${ouverte && !isClient() ? `<button class="btn-small btn-success" data-levee="${esc(r.id)}">Marquer comme levée</button>` : ''}
          ${canManage() ? `<button class="btn-small btn-ghost-sm" data-visible="${esc(r.id)}">${r.visibleClient ? 'Visible client' : 'Masquée client'}</button>` : ''}
        </div>
      </div>
    </article>`;
  }).join('') : '<div class="empty">Aucune réserve.</div>';

  $('#fab-reserve').hidden = isClient();
}

function openReserveSheet() {
  $('#form-reserve').reset();
  pendingReservePhoto = null;
  const img = $('#reserve-preview');
  img.hidden = true;
  img.removeAttribute('src');
  fillZoneSelect($('#reserve-zone'));
  const staff = db.users.filter(u => u.chantierId === activeChantierId && u.role !== 'client');
  $('#reserve-assignee').innerHTML = '<option value="">Non assignée</option>' +
    staff.map(u => `<option value="${esc(u.id)}">${esc(u.name)} (${esc(ROLE_LABELS[u.role])})</option>`).join('');
  openSheet('sheet-reserve');
}

/* ---------- Rapports ---------- */
function renderRapports() {
  let items = db.rapports.filter(r => r.chantierId === activeChantierId);
  if (isClient()) items = items.filter(r => r.visibleClient);
  items.sort((a, b) => b.date.localeCompare(a.date));

  $('#rapport-list').innerHTML = items.length ? items.map(r => `
    <article class="item-card rapport-card">
      <div class="item-head">
        <span class="pill pill-date">${esc(fmtDay(r.date))}</span>
        <span class="pill pill-meteo">${esc(METEO[r.meteo] || r.meteo)}</span>
      </div>
      <p class="addr">Effectif : ${Number(r.effectif) || 0} personne(s) · Par ${esc(r.auteur)}</p>
      <h4>Travaux réalisés</h4>
      <p class="prewrap">${esc(r.travaux)}</p>
      ${r.incidents ? `<h4 class="warn">Incidents</h4><p class="prewrap">${esc(r.incidents)}</p>` : ''}
      ${canManage() ? `<button class="btn-small btn-ghost-sm" data-rvisible="${esc(r.id)}">${r.visibleClient ? 'Visible client' : 'Masqué client'}</button>` : ''}
    </article>`).join('') : '<div class="empty">Aucun rapport.</div>';

  $('#fab-rapport').hidden = isClient();
}

function openRapportSheet() {
  $('#form-rapport').reset();
  $('#rapport-date').value = fmtDay(new Date().toISOString());
  openSheet('sheet-rapport');
}

/* ---------- Profil & pointage ---------- */
const openPointage = () => db.pointages.find(p => p.userId === currentUser.id && !p.heureCheckOut);

function renderProfil() {
  $('#profil-card').innerHTML = `
    <span class="avatar avatar-lg">${esc(currentUser.initials)}</span>
    <div>
      <h3>${esc(currentUser.name)}</h3>
      <p class="addr">${esc(ROLE_LABELS[currentUser.role])} · ${esc(chantierName(activeChantierId))}</p>
    </div>`;

  const block = $('#pointage-block');
  if (isClient()) {
    stopTimer();
    block.innerHTML = '<div class="info-box">Espace client en lecture seule : retrouvez vos photos, réserves levées et rapports publiés.</div>';
    $('#pointage-history').innerHTML = '';
    return;
  }

  const open = openPointage();
  if (open) {
    block.innerHTML = `
      <div class="clock-card on">
        <p class="clock-label">Pointage en cours depuis ${esc(fmtTime(open.heureCheckIn))}</p>
        <p class="clock-time" id="elapsed">00:00:00</p>
        <button class="btn-big btn-white" id="btn-checkout">Check-out</button>
      </div>`;
    startTimer(open.heureCheckIn);
  } else {
    stopTimer();
    block.innerHTML = `
      <div class="clock-card">
        <p class="clock-label">Vous n'êtes pas pointé</p>
        <button class="btn-big btn-orange" id="btn-checkin">Check-in</button>
      </div>`;
  }
  renderHistory();
}

function startTimer(startISO) {
  stopTimer();
  const tick = () => {
    const el = $('#elapsed');
    if (el) el.textContent = formatHMS(Date.now() - new Date(startISO));
  };
  tick();
  liveTimer = setInterval(tick, 1000);
}
function stopTimer() {
  clearInterval(liveTimer);
  liveTimer = null;
}

function renderHistory() {
  const items = db.pointages
    .filter(p => p.userId === currentUser.id && p.heureCheckOut)
    .sort((a, b) => b.heureCheckIn.localeCompare(a.heureCheckIn));
  const total = items.reduce((s, p) => s + (new Date(p.heureCheckOut) - new Date(p.heureCheckIn)), 0);

  $('#pointage-history').innerHTML = items.length
    ? `<div class="section-title-inline">Historique · Total ${esc(formatDuration(total))}</div>` +
      items.map(p => `
        <div class="log-row">
          <span>${esc(fmtDay(p.heureCheckIn))}</span>
          <span>${esc(fmtTime(p.heureCheckIn))} → ${esc(fmtTime(p.heureCheckOut))}</span>
          <strong>${esc(formatDuration(new Date(p.heureCheckOut) - new Date(p.heureCheckIn)))}</strong>
        </div>`).join('')
    : '<div class="empty">Aucun pointage terminé.</div>';
}

/* ---------- Événements ---------- */
function bindEvents() {
  $('#user-list').addEventListener('click', e => {
    const btn = e.target.closest('[data-user]');
    if (btn) login(btn.dataset.user);
  });

  $('#btn-logout').addEventListener('click', () => {
    logout();
    showToast('Vous êtes déconnecté');
  });

  $('#bottom-nav').addEventListener('click', e => {
    const btn = e.target.closest('.nav-item');
    if (btn) showScreen(btn.dataset.target);
  });

  // Sélection du chantier (admin) : pilote tous les modules
  $('#chantier-list').addEventListener('click', e => {
    const card = e.target.closest('[data-chantier]');
    if (!card || currentUser.role !== 'admin') return;
    activeChantierId = card.dataset.chantier;
    localStorage.setItem(ACTIVE_KEY, activeChantierId);
    renderAll();
    showToast(`Chantier sélectionné : ${chantierName(activeChantierId)}`);
  });

  // Fermeture des feuilles
  document.addEventListener('click', e => {
    const closer = e.target.closest('[data-close]');
    if (closer) closeSheet(closer.dataset.close);
    if (e.target.classList.contains('sheet-backdrop')) closeSheet(e.target.id);
  });

  // Photos
  $('#fab-photo').addEventListener('click', () => {
    if (zonesActives().length === 0) {
      if (canManage()) openSheet('sheet-zone');
      else showToast('Un conducteur doit d\'abord créer une zone');
      return;
    }
    $('#photo-input').click();
  });

  $('#photo-input').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      pendingPhoto = await fileToDataURL(file);
    } catch (err) {
      showToast('Image illisible');
      return;
    } finally {
      e.target.value = '';
    }
    $('#form-photo').reset();
    $('#photo-preview').src = pendingPhoto;
    fillZoneSelect($('#photo-form-zone'), $('#photo-zone-filter').value);
    openSheet('sheet-photo');
  });

  $('#form-photo').addEventListener('submit', e => {
    e.preventDefault();
    const zoneId = $('#photo-form-zone').value;
    if (!zoneId || !pendingPhoto) return showToast('Choisissez une zone');
    db.photos.push({
      id: uid(), chantierId: activeChantierId, zoneId, imageUrl: pendingPhoto,
      commentaire: $('#photo-comment').value.trim(), auteur: currentUser.name,
      date: new Date().toISOString(), visibleClient: $('#photo-visible').checked
    });
    persist();
    closeSheet('sheet-photo');
    renderAll();
    showToast('Photo enregistrée');
  });

  $('#photo-grid').addEventListener('click', e => {
    const tile = e.target.closest('[data-photo]');
    if (tile) openLightbox(tile.dataset.photo);
  });

  $('#photo-zone-filter').addEventListener('change', renderPhotos);

  $('#lb-toggle').addEventListener('click', e => {
    const p = db.photos.find(x => x.id === e.currentTarget.dataset.id);
    if (!p) return;
    p.visibleClient = !p.visibleClient;
    persist();
    closeSheet('sheet-lightbox');
    renderAll();
    showToast(p.visibleClient ? 'Photo publiée au client' : 'Photo retirée du portail');
  });

  // Zones
  $('#btn-zone-add').addEventListener('click', () => {
    $('#form-zone').reset();
    openSheet('sheet-zone');
    $('#zone-name').focus();
  });

  $('#form-zone').addEventListener('submit', e => {
    e.preventDefault();
    const nom = $('#zone-name').value.trim();
    if (!nom) return;
    db.zones.push({ id: uid(), chantierId: activeChantierId, nom });
    persist();
    closeSheet('sheet-zone');
    renderAll();
    showToast('Zone ajoutée');
  });

  // Réserves
  $('#fab-reserve').addEventListener('click', openReserveSheet);

  $('#reserve-photo').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      pendingReservePhoto = await fileToDataURL(file);
      const img = $('#reserve-preview');
      img.src = pendingReservePhoto;
      img.hidden = false;
    } catch (err) {
      showToast('Image illisible');
    } finally {
      e.target.value = '';
    }
  });

  $('#form-reserve').addEventListener('submit', e => {
    e.preventDefault();
    const description = $('#reserve-desc').value.trim();
    if (!description) return showToast('Décrivez la réserve');
    db.reserves.push({
      id: uid(), chantierId: activeChantierId,
      zoneId: $('#reserve-zone').value || null,
      description, statut: 'ouverte',
      assigneA: $('#reserve-assignee').value || null,
      echeance: $('#reserve-date').value || null,
      visibleClient: $('#reserve-visible').checked,
      photo: pendingReservePhoto,
      createdAt: new Date().toISOString()
    });
    persist();
    closeSheet('sheet-reserve');
    renderAll();
    showToast('Réserve créée');
  });

  $('#reserve-list').addEventListener('click', e => {
    const levee = e.target.closest('[data-levee]');
    if (levee) {
      const r = db.reserves.find(x => x.id === levee.dataset.levee);
      if (!r) return;
      r.statut = 'levee';
      r.dateLevee = new Date().toISOString();
      persist();
      renderAll();
      showToast('Réserve marquée comme levée');
      return;
    }
    const vis = e.target.closest('[data-visible]');
    if (vis) {
      const r = db.reserves.find(x => x.id === vis.dataset.visible);
      if (!r) return;
      r.visibleClient = !r.visibleClient;
      persist();
      renderAll();
      showToast(r.visibleClient ? 'Visible par le client' : 'Masquée au client');
    }
  });

  // Rapports
  $('#fab-rapport').addEventListener('click', openRapportSheet);

  $('#form-rapport').addEventListener('submit', e => {
    e.preventDefault();
    const travaux = $('#rapport-travaux').value.trim();
    if (!travaux) return showToast('Décrivez les travaux réalisés');
    db.rapports.push({
      id: uid(), chantierId: activeChantierId,
      date: new Date().toISOString(),
      auteur: currentUser.name,
      meteo: $('#rapport-meteo').value,
      effectif: Number($('#rapport-effectif').value) || 0,
      travaux,
      incidents: $('#rapport-incidents').value.trim(),
      visibleClient: $('#rapport-visible').checked
    });
    persist();
    closeSheet('sheet-rapport');
    renderAll();
    showToast('Rapport enregistré');
  });

  $('#rapport-list').addEventListener('click', e => {
    const btn = e.target.closest('[data-rvisible]');
    if (!btn) return;
    const r = db.rapports.find(x => x.id === btn.dataset.rvisible);
    if (!r) return;
    r.visibleClient = !r.visibleClient;
    persist();
    renderAll();
    showToast(r.visibleClient ? 'Rapport visible par le client' : 'Rapport masqué au client');
  });

  // Pointage
  $('#pointage-block').addEventListener('click', e => {
    if (e.target.closest('#btn-checkin')) {
      db.pointages.push({
        id: uid(), chantierId: activeChantierId, userId: currentUser.id,
        heureCheckIn: new Date().toISOString(), heureCheckOut: null
      });
      persist();
      renderAll();
      showToast('Check-in enregistré');
    } else if (e.target.closest('#btn-checkout')) {
      const p = openPointage();
      if (!p) return;
      p.heureCheckOut = new Date().toISOString();
      persist();
      renderAll();
      showToast(`Check-out : ${formatDuration(new Date(p.heureCheckOut) - new Date(p.heureCheckIn))}`);
    }
  });
}

/* ---------- Démarrage ---------- */
function init() {
  bindEvents();
  renderLogin();
  const saved = db.users.find(u => u.id === localStorage.getItem(SESSION_KEY));
  if (saved) {
    login(saved.id, true);
  } else {
    setNavVisible(false);
    showScreen('screen-login');
  }
}

document.addEventListener('DOMContentLoaded', init);
