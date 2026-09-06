/* HR_COMPACT_v01 — Human Resources window becomes the approved compact two-column
   layout (prototypes/hr-window, Prototype B rev 4):
   left column  = slim one-line stat rows + Crew Budget + Recognition;
   right column = Roster link + Recruit/Incidents tabs (tab pane scrolls internally).
   Recruit candidate cards render collapsed to one header row with a chevron —
   skills and trait details expand on click; Approve/Profile/Pass stay visible.
   The window opens compact and centred with no main-body scrolling.
   UI-only: wraps openModal() and REARRANGES the nodes game.js already rendered —
   no markup is rebuilt, so every onclick and game behaviour is untouched.
   Roster ('crew') view and all other windows are left exactly as they were.
   Styling lives in css/hr-compact-v01.css (.ae-hr-compact). */
(function hrCompactV01(){
  'use strict';
  if (window.AEHrCompactV01) return;
  window.AEHrCompactV01 = true;

  const CLS = 'ae-hr-compact';

  function restructure(c){
    const body = c.querySelector('.modal-body');
    if (!body || body.querySelector('.hrc-wrap')) return;

    const kids = Array.from(body.children);
    const stats   = body.querySelector('.hr-stat-grid');
    const budget  = body.querySelector(':scope > .hr-section');
    const tabsBtn = body.querySelector('#ctab-recruit') || body.querySelector('#ctab-incidents');
    const tabsBar = tabsBtn ? tabsBtn.parentElement : null;
    const content = body.querySelector('#crew-tab-content');
    const hint    = kids.find(d => (d.getAttribute && (d.getAttribute('onclick')||'').includes("openModal('crew')")));
    const recog   = kids.find(d => d !== budget && d.textContent.includes('RECOGNITION'));
    const lock    = kids.find(d => d.textContent.includes('\u{1F512}'));

    // If the game's markup ever changes shape, do nothing and keep the stock layout.
    if (!stats || !budget || !tabsBar || !content) return;

    // The stock body scrolls at 72vh; the compact layout scrolls per-column instead.
    body.style.maxHeight = 'none';
    body.style.overflowY = 'hidden';
    body.style.maxWidth = 'none';

    const wrap  = document.createElement('div'); wrap.className  = 'hrc-wrap';
    const left  = document.createElement('div'); left.className  = 'hrc-left';
    const right = document.createElement('div'); right.className = 'hrc-right';

    left.appendChild(stats);
    left.appendChild(budget);
    if (recog) left.appendChild(recog);

    if (hint) right.appendChild(hint);
    right.appendChild(tabsBar);
    right.appendChild(content);
    if (lock) right.appendChild(lock);

    wrap.appendChild(left);
    wrap.appendChild(right);
    body.appendChild(wrap);

    watchTabContent(content);
  }

  // ── Recruit cards: collapse to header + actions, details behind a chevron ──
  function compactRecruits(container){
    Array.from(container.children).forEach(card => {
      if (card.dataset.aeHrcCard) return;                       // already processed
      if (!(card.innerHTML || '').includes('approveCandidate(')) return;
      const rows = Array.from(card.children);
      if (rows.length < 3) return;                              // header + ≥1 detail + actions
      card.dataset.aeHrcCard = '1';

      const header  = rows[0];
      const actions = rows[rows.length - 1];
      const details = document.createElement('div');
      details.className = 'hrc-cand-details';
      rows.slice(1, -1).forEach(rw => details.appendChild(rw));
      card.insertBefore(details, actions);

      const chev = document.createElement('button');
      chev.type = 'button';
      chev.className = 'hrc-chev';
      chev.setAttribute('aria-label', 'Show details');
      chev.textContent = '\u25B8';                             // ▸
      header.appendChild(chev);

      card.classList.add('hrc-cand');                           // collapsed by default
      const toggle = () => {
        const open = card.classList.toggle('open');
        chev.textContent = open ? '\u25BE' : '\u25B8';        // ▾ / ▸
        chev.setAttribute('aria-label', open ? 'Hide details' : 'Show details');
      };
      chev.addEventListener('click', e => { e.stopPropagation(); toggle(); });
      header.addEventListener('click', e => {
        if (e.target.closest('button') && e.target !== chev && !chev.contains(e.target)) return;
        if (e.target.closest('.hrc-chev')) return;              // chevron handled above
        toggle();
      });
      header.style.cursor = 'pointer';
    });
  }

  // Tab content is (re)filled ~30ms after render and on every tab switch,
  // so watch it and compact whatever recruit cards appear.
  function watchTabContent(content){
    const run = () => compactRecruits(content);
    new MutationObserver(run).observe(content, { childList: true });
    run();
  }

  function wrap(){
    const orig = window.openModal;
    if (typeof orig !== 'function' || orig.__aeHrCompact) return false;
    const w = function(type){
      const out = orig.apply(this, arguments);
      const c = document.getElementById('modal-content');
      if (c){
        if (type === 'hr'){ c.classList.add(CLS); restructure(c); }
        else c.classList.remove(CLS);
      }
      return out;
    };
    w.__aeHrCompact = true;
    window.openModal = w;
    return true;
  }

  function init(){ if (!wrap()) setTimeout(init, 250); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
