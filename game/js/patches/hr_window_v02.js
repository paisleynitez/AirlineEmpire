/* HR_WINDOW_v02 — Human Resources window brought to the approved mockup on top of
   hr_compact_v01 (which builds the two-column structure). This layer only decorates:
   fixed larger frame, line icons in place of emoji, second line on the morale tile,
   title-case Approve button, circular chevron, roster arrow. Every onclick and game
   behaviour is untouched — nodes are tagged with classes and icons swapped in place.
   Idempotent: a MutationObserver re-decorates after tab switches / re-renders.
   Styling lives in css/hr-window-v02.css (.ae-hr-v2). */
(function hrWindowV02(){
  'use strict';
  if (window.AEHrWindowV02) return;
  window.AEHrWindowV02 = true;
  const CLS = 'ae-hr-v2';
  const I = {
    people:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2c2.7.2 5 2 5 4.8"/></svg>',
    clipboard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h3"/></svg>',
    lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>',
    trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 01-10 0V4zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3M12 14v3M8 20h8M10 17h4"/></svg>',
    wallet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/></svg>',
    down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.2l2.3 2.3 4.7-4.8"/></svg>',
    heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/></svg>',
    refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 01-14.5 4.6M4 12a8 8 0 0114.5-4.6M18 4v4h-4M6 20v-4h4"/></svg>',
    shirt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4l4 2 4-2 4 4-3 2v10H7V10L4 8l4-4z"/></svg>'
  };
  const icon = (k, cls) => { const s = document.createElement('span'); s.className = 'hrv2-ic ' + (cls || ''); s.innerHTML = I[k]; return s; };
  const EMOJI = /^[\s\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u{2640}\u{2642}▸▾\u{1F53B}✅\u{1F49A}\u{1F3C6}\u{1F4CB}\u{1F512}\u{1F504}\u{1F454}]+/u;
  function swapEmoji(el, key, cls){
    if (!el || el.dataset.hrv2) return; el.dataset.hrv2 = '1';
    const t = el.childNodes[0];
    if (t && t.nodeType === 3) t.textContent = t.textContent.replace(EMOJI, '');
    else if (el.childNodes.length === 0 || (el.textContent || '').match(EMOJI)) el.textContent = (el.textContent || '').replace(EMOJI, '');
    el.insertBefore(icon(key, cls), el.firstChild);
  }

  function decorate(c){
    if (!c || !c.classList.contains(CLS)) return;
    const title = c.querySelector('.modal-title');
    if (title && !title.dataset.hrv2) { title.dataset.hrv2 = '1'; title.innerHTML = I.shirt.replace('<svg', '<svg class="hrv2-ic hrv2-ic-title"') + ' HUMAN RESOURCES'; }
    /* stats: second line on the morale tile */
    c.querySelectorAll('.hr-stat').forEach(s => { s.classList.add('hrv2-stat'); if (!s.querySelector('.hr-stat-s')) { const d = document.createElement('div'); d.className = 'hr-stat-s'; d.textContent = 'Current crew sentiment'; s.appendChild(d); } });
    /* crew budget */
    const sec = c.querySelector('.hrc-left .hr-section');
    if (sec) { const k = sec.querySelector('.hr-section-k'); if (k && !k.dataset.hrv2) { k.dataset.hrv2 = '1'; k.insertBefore(icon('wallet'), k.firstChild); }
      const keys = ['down', 'check', 'heart'];
      sec.querySelectorAll('.hr-budget-btn').forEach((b, i) => { if (b.dataset.hrv2) return; b.dataset.hrv2 = '1'; const label = (b.textContent || '').replace(EMOJI, '').trim(); b.innerHTML = ''; b.appendChild(icon(keys[i] || 'check')); const sp = document.createElement('span'); sp.textContent = label; b.appendChild(sp); }); }
    /* recognition */
    const left = c.querySelector('.hrc-left');
    if (left) Array.from(left.children).forEach(d => { if (d.classList.contains('hr-stat-grid') || d.classList.contains('hr-section')) return; if (!d.classList.contains('hrv2-recog')) { d.classList.add('hrv2-recog'); const head = d.firstElementChild && d.firstElementChild.firstElementChild; if (head) swapEmoji(head, 'trophy'); const body = d.lastElementChild; if (body && body !== d.firstElementChild) body.textContent = 'No awards yet. Recognise standout crew below. A medal on each card can auto-award a top performer each quarter.'; } });
    /* right column */
    const right = c.querySelector('.hrc-right');
    if (right) {
      const roster = right.querySelector('[onclick*="openModal(\'crew\')"]');
      if (roster && !roster.classList.contains('hrv2-roster')) { roster.classList.add('hrv2-roster'); const ic = roster.querySelector('span'); if (ic) { ic.textContent = ''; ic.appendChild(icon('people')); ic.classList.add('hrv2-roster-ic'); } const cta = roster.lastElementChild; if (cta && cta.tagName === 'SPAN') { cta.classList.add('hrv2-roster-cta'); cta.textContent = 'Open Roster →'; } }
      const tab = right.querySelector('#ctab-recruit'); if (tab && tab.parentElement) tab.parentElement.classList.add('hrv2-tabs');
      Array.from(right.children).forEach(d => { if (d.textContent && d.textContent.includes('\u{1F512}') && !d.classList.contains('hrv2-lock')) { d.classList.add('hrv2-lock'); swapEmoji(d, 'lock'); } });
    }
    const content = c.querySelector('#crew-tab-content');
    if (content) {
      Array.from(content.children).forEach(d => {
        if (d.classList.contains('hrc-cand')) return;
        const txt = (d.textContent || '').trim();
        if (d.children.length === 0 && /CANDIDATES|INCIDENT/i.test(txt) && txt.length < 40) d.classList.add('hrv2-h');
        else if (txt.includes('\u{1F4CB}') || /HR screened|fully staffed|short-staffed|need/i.test(txt)) { if (!d.classList.contains('hrv2-note')) { d.classList.add('hrv2-note'); const s = d.querySelector('span'); if (s) { s.textContent = ''; s.appendChild(icon('clipboard')); } } }
        else if (txt.includes('\u{1F504}') || /new applicants/i.test(txt)) { if (!d.classList.contains('hrv2-refresh')) { d.classList.add('hrv2-refresh'); const s = d.querySelector('span'); if (s) { s.textContent = ''; s.appendChild(icon('refresh')); } } }
      });
      content.querySelectorAll('.hrc-cand').forEach(card => {
        if (card.dataset.hrv2) return; card.dataset.hrv2 = '1';
        const head = card.firstElementChild; if (head) { head.classList.add('hrv2-cand-head'); const av = head.firstElementChild; if (av) av.classList.add('hrv2-avatar'); }
        const chev = card.querySelector('.hrc-chev'); if (chev) chev.textContent = '›';
        const acts = card.lastElementChild; if (acts) { acts.classList.add('hrv2-acts'); const bs = acts.querySelectorAll('button'); if (bs[0]) { bs[0].classList.add('hrv2-approve'); bs[0].textContent = '✓ Approve — Hire'; } if (bs[1]) bs[1].classList.add('hrv2-pill'); if (bs[2]) bs[2].classList.add('hrv2-pill'); }
      });
    }
  }

  function size(c){ c.style.setProperty('width', 'min(1000px, 94vw)', 'important'); c.style.setProperty('max-width', 'min(1000px, 94vw)', 'important'); c.style.setProperty('height', 'min(716px, 90vh)', 'important'); c.style.setProperty('max-height', 'min(716px, 90vh)', 'important'); c.dataset.aeFixed = '1'; c._hrv2 = true; }
  function unsize(c){ if (!c || !c._hrv2) return; ['width','max-width','height','max-height'].forEach(p => c.style.removeProperty(p)); delete c.dataset.aeFixed; c._hrv2 = false; c.classList.remove(CLS); }

  let mo = null, pending = false;
  function watch(c){ if (mo) return; mo = new MutationObserver(() => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; if (c.classList.contains(CLS)) decorate(c); }); }); mo.observe(c, { childList: true, subtree: true }); }

  function wrap(){
    const orig = window.openModal;
    if (typeof orig !== 'function' || orig.__aeHrV2 || typeof window.approveCandidate !== 'function') return false;
    const w = function(type){
      const c = document.getElementById('modal-content'); if (c) unsize(c);
      const out = orig.apply(this, arguments);
      if (c) { if (type === 'hr') { c.classList.add(CLS); size(c); decorate(c); watch(c); setTimeout(() => decorate(c), 60); } }
      return out;
    };
    w.__aeHrV2 = true; window.openModal = w;
    /* approveCandidate / passCandidate rebuild the modal body directly (bypassing openModal), which
       drops hr_compact's two-column structure; route them back through openModal('hr'). */
    ['approveCandidate', 'passCandidate'].forEach(fn => {
      const of = window[fn]; if (typeof of !== 'function' || of.__aeHrV2) return;
      const wf = function(){ const r = of.apply(this, arguments); const c = document.getElementById('modal-content');
        if (c && c.classList.contains(CLS) && !c.querySelector('.hrc-wrap')) { try { openModal('hr'); } catch (e) {} }
        return r; };
      wf.__aeHrV2 = true; window[fn] = wf;
    });
    const oc = window.closeModal;
    if (typeof oc === 'function' && !oc.__aeHrV2) { const wc = function(){ const r = oc.apply(this, arguments); unsize(document.getElementById('modal-content')); return r; }; wc.__aeHrV2 = true; window.closeModal = wc; }
    return true;
  }
  function init(){ if (!wrap()) setTimeout(init, 250); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
