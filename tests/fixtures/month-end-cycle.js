// Loaded only by the test server into an isolated browser profile.
window.addEventListener('load', () => {
  const stage = new URL(location.href).searchParams.get('cycle');
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const near = (a, b, message) => check(Math.abs(a - b) < 0.000001, `${message}: ${a} != ${b}`);
  const coreFunctions = Object.fromEntries(['endTurn','processRoute','maintTick','applySave','budgetBreakdown'].map(name => [name, window[name]]));
  const stableCore = () => Object.entries(coreFunctions).forEach(([name, fn]) => check(window[name] === fn, `${name} was replaced during gameplay`));
  const economy = () => JSON.stringify({fuel:ECON.fuelPerSeatMile, crew:ECON.crewPerFlight, engine:MAINTENANCE_CHECKS.engine.cost});
  let reportCount = 0;
  const present = AEReports.present;
  AEReports.present = function(){ reportCount++; return present.apply(this, arguments); };
  const snapshot = () => JSON.stringify({
    cash: STATE.cash, month: STATE.month, year: STATE.year, abs: STATE._absMonth,
    research: STATE.research, rp: STATE.researchPoints, planes: STATE.planes,
    routes: STATE.routes, finance: STATE.financeLog, flow: STATE._cashflow,
    trials:STATE.marketIntel?.trials, history: STATE._finHist, ytd: STATE.profitThisYear, thirdSlotNoted:STATE._rbThirdSlotNoted
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
    const trialAge = STATE.marketIntel?.trials?.[0]?.age;
    const reportsBefore = reportCount;
    endTurn();
    stableCore();
    if (trialAge != null) check(STATE.marketIntel.trials[0].age === trialAge + 1, 'developer trial did not advance exactly once');
    check(reportCount === reportsBefore + 1, 'duplicate or missing month-end report');
    const hiddenReport = localStorage.getItem('ae_hide_operations_report_v1') === '1';
    check(AEReports.isOpen() === !hiddenReport, 'report visibility preference');
    if (!hiddenReport) {
      check(document.querySelectorAll('.ops-report-shell').length === 1, 'duplicate report UI');
      startTimer();
      check(STATE.timerInterval === null, 'timer running behind report');
    }
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
      check(JSON.stringify(saved.marketIntel?.trials) === JSON.stringify(STATE.marketIntel?.trials), 'developer trial saved before advancing');
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
          if (window.AEDevTunerMonthEnd) STATE.marketIntel.trials.push({from:'Chicago',to:'New York',age:0,stage:'Trial',monthsRemaining:3,offer:{estimatedProfit:3},load:70,satisfaction:75});
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
          navGo(null, 'research');
          check(document.getElementById('modal-content').classList.contains('modal-research-board'), 'research navigation failed');
          openModal('budget');
          check(!document.getElementById('modal-content').classList.contains('modal-research-board'), 'research frame leaked to budget');
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
          localStorage.setItem('cycle-economy', economy());
          finish();
        } catch (error) { finish(error); }
      }, 1600);
    } else {
      document.getElementById('intro').classList.add('hidden');
      loadFromSlot(0);
      stableCore();
      check(!AEReports.isOpen() && !STATE._operationsReportOpen, 'reload retained transient report lock');
      check(economy() === localStorage.getItem('cycle-economy'), 'reload changed research economy effects');
      check(snapshot() === localStorage.getItem('cycle-expected'), 'fresh browser autosave reload differs');
      STATE.cash = -123; STATE.researchPoints = -1;
      loadFromSlot(1);
      check(snapshot() === localStorage.getItem('cycle-expected'), 'manual reload differs');
      check(economy() === localStorage.getItem('cycle-economy'), 'repeated reload compounded research effects');
      turn(1, 0.9);
      check(STATE.research.run.r_composite === 2, 'reload repeated or skipped research month');
      // Eras advances a quarter: charge and progress all three months once.
      STATE.gameType = 'eras'; STATE.objective = {kind:'eras', years:60};
      turn(3, 2.7);
      check(STATE.research.done.includes('r_composite'), 'quarter research completion');
      check(STATE._rbThirdSlotNoted && AE_RESEARCH_CATALOG.cfg.slots === 3, 'third research slot not settled before saving');
      const expected = snapshot();
      revertTo('ae_revert_1');
      check(snapshot() === expected, 'checkpoint reload differs');
      // Hidden reports must leave the clock usable and remain hidden after a turn.
      STATE.timerMode = 'normal';
      AEReports.present(STATE._lastMonthProfit, STATE.financeLog.at(-1).pax);
      check(AEReports.isOpen(), 'report not opened for clock test');
      closeModalOutside({target:document.getElementById('modal-overlay')});
      check(STATE.timerInterval !== null, 'closing report did not restart clock');
      clearInterval(STATE.timerInterval); STATE.timerMode = 'off';
      check(!AEReports.isOpen() && !STATE._operationsReportOpen && !STATE.paused, 'report close did not resume gameplay');
      localStorage.setItem('ae_hide_operations_report_v1', '1');
      STATE.gameType = 'scenario'; STATE.objective = {kind:'scenario'};
      STATE.month = 11; STATE._absMonth = 11;
      const endedYear = STATE.year;
      turn(1, 0.9);
      check(STATE.month === 0 && STATE.year === endedYear + 1, 'calendar rollover');
      check(STATE.financeLog.at(-1).label === `DEC ${endedYear}`, 'December report year');
      // A pre-research save still loads over defaults and can complete another month.
      const legacy = JSON.parse(localStorage.getItem(SAVE_KEY(0)));
      delete legacy.state.research; delete legacy.state.researchPoints; delete legacy.state.cargo;
      delete legacy.state._rbThirdSlotNoted;
      applySave(JSON.stringify(legacy));
      check(!STATE._operationsReportOpen && !AEReports.isOpen(), 'legacy reload report lock');
      turn(1, 0);
      check(STATE.research.done.length === 0, 'legacy save inherited research');
      stableCore();
      STATE.gameOver = true;
      const stopped = snapshot(), reportsBefore = reportCount; endTurn();
      check(reportCount === reportsBefore, 'blocked turn presented a report');
      check(snapshot() === stopped, 'blocked turn changed finances/research');
      finish();
    }
  } catch (error) { finish(error); }
});
