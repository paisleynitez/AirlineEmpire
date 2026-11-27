// Loaded only by the test server into an isolated browser profile.
window.addEventListener('load', () => {
  const stage = new URL(location.href).searchParams.get('cycle');
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const near = (a, b, message) => check(Math.abs(a - b) < 0.000001, `${message}: ${a} != ${b}`);
  const snapshot = () => JSON.stringify({
    cash: STATE.cash, month: STATE.month, year: STATE.year, abs: STATE._absMonth,
    research: STATE.research, rp: STATE.researchPoints, planes: STATE.planes,
    routes: STATE.routes, finance: STATE.financeLog, flow: STATE._cashflow,
    history: STATE._finHist, ytd: STATE.profitThisYear
  });
  function finish(error) {
    clearInterval(STATE.timerInterval);
    const result = document.createElement('pre'); result.id = 'cycle-result';
    result.textContent = error ? `FAIL ${stage}: ${error.stack}` : `PASS ${stage}`;
    document.body.appendChild(result);
  }
  function turn(months, upkeep) {
    const before = STATE._absMonth || 0;
    const rp = STATE.researchPoints, ytd = STATE.profitThisYear;
    const yearEnd = ((STATE._absMonth || 0) + months) % 12 === 0;
    const label = `${MONTHS[STATE.month]} ${STATE.year}`;
    endTurn();
    clearInterval(STATE.timerInterval);
    check(STATE._absMonth === before + months, 'turn did not advance');
    check(STATE.researchPoints > rp, 'research income missing');
    check(window.AECargo && typeof AECargo.cashflowLines === 'function', 'cargo engine not installed');
    const flow = STATE._cashflow;
    check(flow.inc.some(x => x[0] === 'Belly cargo'), 'cargo breakdown missing');
    near(flow.exp.find(x => x[0] === 'Research upgrade upkeep')?.[1] || 0, upkeep, 'upkeep');
    near(flow.inc.reduce((s,x) => s+x[1],0) - flow.exp.reduce((s,x) => s+x[1],0), flow.net, 'cashflow totals');
    const log = STATE.financeLog.at(-1);
    check(log.label === label, 'finance report labelled with next month');
    check(Math.abs(log.profit - (log.income - log.expenses)) <= 0.011, 'reported rounded profit');
    if (yearEnd) near(STATE.profitThisYear, 0, 'YTD reset');
    else near(STATE.profitThisYear - ytd, STATE._lastMonthProfit, 'YTD profit');
    const expected = snapshot();
    const auto = localStorage.getItem(SAVE_KEY(0));
    const checkpoint = localStorage.getItem('ae_revert_1');
    check(auto && checkpoint, 'missing autosave/checkpoint');
    for (const raw of [auto, checkpoint]) {
      const saved = JSON.parse(raw).state;
      check(JSON.stringify(saved.research) === JSON.stringify(STATE.research), 'saved research differs');
      near(saved.cash, STATE.cash, 'saved cash');
      check(JSON.stringify(saved._cashflow) === JSON.stringify(flow), 'saved breakdown differs');
      check(JSON.stringify(saved.routes) === JSON.stringify(STATE.routes), 'saved routes differ');
    }
    return expected;
  }
  try {
    if (stage === 'save') {
      localStorage.clear(); localStorage.setItem('ae_tour_done', '1');
      startGame('intro');
      setTimeout(() => {
        try {
          STATE.timerMode = 'off'; clearInterval(STATE.timerInterval);
          const plane = Object.keys(STATE.planes)[0];
          const owned = STATE.planes[plane].owned;
          buyPlaneQty(plane, 1);
          check(STATE.planes[plane].owned === owned + 1, 'aircraft purchase failed');
          openModal('new-route');
          document.getElementById('modal-content').innerHTML = buildNewRoute(STATE.homeBase, 'New York');
          document.getElementById('r-to').value = 'New York';
          _nrPlanes = { [plane]: 1 };
          confirmRoute(false);
          check(STATE.routes.length === 1, 'route creation failed');
          AEResearchBoard.start('r_winglet');
          check(STATE.research.run.r_winglet === 2, 'research start failed');
          turn(1, 0); check(STATE.research.run.r_winglet === 1, 'research countdown');
          turn(1, 0); check(STATE.research.done.includes('r_winglet'), 'research completion');
          AEResearchBoard.buy('u_hangar');
          check(STATE.research.owned.includes('u_hangar'), 'upgrade purchase');
          AEResearchBoard.start('r_composite');
          turn(1, 0.9);
          check(STATE.research.run.r_composite === 3, 'second research countdown');
          saveToSlot(1);
          localStorage.setItem('cycle-expected', snapshot());
          finish();
        } catch (error) { finish(error); }
      }, 1600);
    } else {
      document.getElementById('intro').classList.add('hidden');
      loadFromSlot(0);
      check(snapshot() === localStorage.getItem('cycle-expected'), 'fresh browser autosave reload differs');
      STATE.cash = -123; STATE.researchPoints = -1;
      loadFromSlot(1);
      check(snapshot() === localStorage.getItem('cycle-expected'), 'manual reload differs');
      turn(1, 0.9);
      check(STATE.research.run.r_composite === 2, 'reload repeated or skipped research month');
      // Eras advances a quarter: charge and progress all three months once.
      STATE.gameType = 'eras'; STATE.objective = {kind:'eras', years:60};
      turn(3, 2.7);
      check(STATE.research.done.includes('r_composite'), 'quarter research completion');
      const expected = snapshot();
      revertTo('ae_revert_1');
      check(snapshot() === expected, 'checkpoint reload differs');
      STATE.gameType = 'scenario'; STATE.objective = {kind:'scenario'};
      STATE.month = 11; STATE._absMonth = 11;
      const endedYear = STATE.year;
      turn(1, 0.9);
      check(STATE.month === 0 && STATE.year === endedYear + 1, 'calendar rollover');
      check(STATE.financeLog.at(-1).label === `DEC ${endedYear}`, 'December report year');
      STATE.gameOver = true;
      const stopped = snapshot(); endTurn();
      check(snapshot() === stopped, 'blocked turn changed finances/research');
      finish();
    }
  } catch (error) { finish(error); }
});
