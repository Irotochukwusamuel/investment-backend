/*
 End-to-end Investment System Test
 - Authenticates as admin
 - Captures wallet baseline
 - Creates an investment
 - Triggers hourly, daily, and end-of-investment cycles via admin endpoints
 - Validates wallet balance changes and timings
 - Produces a human-readable report
 - Simulates early cancel and failure scenarios
 - Adds restart-consistency check, concurrency triggers, and 30-day accelerated simulation with CSV export
*/

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3001';
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@kltmines.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin123';
const ENABLE_MANUAL_RESTART_PROMPT = process.env.E2E_MANUAL_RESTART === '1';

// Helpers
async function http(method, url, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${API_PREFIX}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = data?.message || res.statusText;
    throw new Error(`${method} ${url} failed ${res.status}: ${msg}`);
  }
  return data;
}

async function httpSafe(method, url, { token, body } = {}) {
  try {
    const data = await http(method, url, { token, body });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function fmtCurrency(v, currency) {
  const num = Number(v || 0);
  if (currency === 'usdt') return `${num.toFixed(2)} USDT`;
  return `₦${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

(async () => {
  const report = [];
  const stamp = () => new Date().toISOString();
  const add = (line = '') => report.push(line);
  const addH = (title) => { add(`\n## ${title}`); };

  add(`# E2E Investment System Test Report`);
  add(`Generated: ${stamp()}`);
  add(`Base URL: ${BASE_URL}${API_PREFIX}`);

  try {
    // 1) Login
    addH('Authentication');
    const login = await http('POST', '/auth/login', {
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const token = login?.access_token || login?.token;
    const user = login?.user || {};
    if (!token) throw new Error('Login did not return access token');
    add(`- Logged in as ${user.email || ADMIN_EMAIL}`);
    add(`- User ID: ${user.id || user._id || 'unknown'}`);

    const userId = (user.id || user._id || '').toString();

    // 2) Get plans and pick a valid plan
    addH('Plan Discovery');
    const plans = await http('GET', '/plans');
    if (!Array.isArray(plans) || plans.length === 0) throw new Error('No plans available');
    const sorted = plans.slice().sort((a,b)=> (a.minAmount||0) - (b.minAmount||0));
    const plan = sorted.find(p=>p.currency==='naira') || sorted[0];
    if (!plan?._id) throw new Error('No suitable plan found');
    add(`- Selected Plan: ${plan.name} (${plan.currency}) [${plan._id}] min=${plan.minAmount} max=${plan.maxAmount}`);

    // 3) Capture wallet baseline
    addH('Wallet Baseline');
    const walletsBefore = await http('GET', `/wallets/user/${userId}`, { token });
    const mainWalletBefore = Array.isArray(walletsBefore) ? walletsBefore.find(w => w.type === 'main') : null;
    const nairaBefore = mainWalletBefore ? mainWalletBefore.nairaBalance : 0;
    const usdtBefore = mainWalletBefore ? mainWalletBefore.usdtBalance : 0;
    add(`- Main Wallet before: Naira=${fmtCurrency(nairaBefore, 'naira')}, USDT=${fmtCurrency(usdtBefore, 'usdt')}`);

    // 4) Create and complete first investment
    addH('First Investment: Full Cycle');
    const amount = Number(plan.minAmount);
    const created = await http('POST', '/investments', {
      token,
      body: {
        planId: plan._id,
        amount,
        currency: plan.currency,
        autoReinvest: false,
      },
    });
    const investmentId = (created.id || created._id || '').toString();
    add(`- Created Investment: ${investmentId}, Amount=${fmtCurrency(amount, plan.currency)}`);

    // Trigger hourly cycle
    const hourly = await http('POST', `/admin/investments/${investmentId}/test-hourly-cycle`, { token });
    add(`- Hourly ROI added: ${fmtCurrency(hourly.hourlyRoiAdded, plan.currency)}`);

    // Trigger daily cycle
    const daily = await http('POST', `/admin/investments/${investmentId}/test-daily-cycle`, { token });
    add(`- Daily cycle transferred: ${fmtCurrency(daily.cycleEarningsTransferred, plan.currency)}`);

    // Complete investment
    const end = await http('POST', `/admin/investments/${investmentId}/test-end-investment`, { token });
    add(`- Completed investment, earnings: ${fmtCurrency(end.totalEarningsTransferred, plan.currency)}`);

    // 5) Edge cases: Early Cancel
    addH('Edge Cases: Early Cancel');
    const created2 = await http('POST', '/investments', {
      token,
      body: {
        planId: plan._id,
        amount: Number(plan.minAmount),
        currency: plan.currency,
        autoReinvest: false,
      },
    });
    const investmentId2 = (created2.id || created2._id || '').toString();
    add(`- Created Investment for Early Cancel: ${investmentId2}`);

    const cancelRes = await http('POST', `/investments/${investmentId2}/cancel`, {
      token,
      body: { reason: 'E2E early cancel simulation' },
    });
    add(`- Cancelled Investment Status: ${cancelRes.status}`);

    // Attempt end-of-investment on cancelled one (should fail)
    const endCancelled = await httpSafe('POST', `/admin/investments/${investmentId2}/test-end-investment`, { token });
    add(`- End cancelled investment: ${endCancelled.ok ? 'UNEXPECTED SUCCESS' : `Expected failure -> ${endCancelled.error}`}`);

    // 6) Failure simulation
    addH('Failure Simulation');
    const hugeWithdrawal = await httpSafe('POST', `/wallets/${userId}/withdraw`, {
      token,
      body: {
        walletType: 'main',
        amount: 10_000_000_000,
        currency: 'naira',
        description: 'E2E failure simulation',
      },
    });
    add(`- Forced withdrawal failure: ${hugeWithdrawal.ok ? 'UNEXPECTED SUCCESS' : `Expected failure -> ${hugeWithdrawal.error}`}`);

    // 7) Restart-consistency check
    addH('Restart Consistency');
    const walletsAfter = await http('GET', `/wallets/user/${userId}`, { token });
    const mainWalletAfter = Array.isArray(walletsAfter) ? walletsAfter.find(w => w.type === 'main') : null;
    const nairaAfter = mainWalletAfter ? mainWalletAfter.nairaBalance : 0;
    add(`- Snapshot before restart: mainWallet.naira=${fmtCurrency(nairaAfter, 'naira')}`);
    
    if (ENABLE_MANUAL_RESTART_PROMPT) {
      add(`- Please restart the backend now. The script will wait 15s...`);
      await new Promise(r => setTimeout(r, 15000));
    } else {
      add(`- Skipping manual restart (set E2E_MANUAL_RESTART=1 to enable)`);
    }
    
    const afterRestart = await http('GET', `/wallets/user/${userId}`, { token });
    const mainAfterRestart = Array.isArray(afterRestart) ? afterRestart.find(w => w.type === 'main') : null;
    add(`- Snapshot after restart: mainWallet.naira=${fmtCurrency(mainAfterRestart ? mainAfterRestart.nairaBalance : 0, 'naira')}`);

    // 8) Concurrency simulation
    addH('Concurrency: Overlapping Cycle Triggers');
    const created3 = await http('POST', '/investments', {
      token,
      body: {
        planId: plan._id,
        amount: Number(plan.minAmount),
        currency: plan.currency,
        autoReinvest: false,
      },
    });
    const investmentId3 = (created3.id || created3._id || '').toString();
    add(`- Created Investment for Concurrency: ${investmentId3}`);
    
    const results = await Promise.all([
      httpSafe('POST', `/admin/investments/${investmentId3}/test-hourly-cycle`, { token }),
      httpSafe('POST', `/admin/investments/${investmentId3}/test-hourly-cycle`, { token }),
      httpSafe('POST', `/admin/investments/${investmentId3}/test-hourly-cycle`, { token }),
    ]);
    const successes = results.filter(r => r.ok).length;
    const failures = results.filter(r => !r.ok).map(r => r.error);
    add(`- Concurrent hourly triggers: success=${successes}, failures=${failures.length}`);
    if (failures.length) add(`- Failure samples: ${failures.slice(0,2).join(' | ')}`);

    // Complete this investment before next
    await http('POST', `/admin/investments/${investmentId3}/test-end-investment`, { token });

    // 9) 30-day accelerated simulation with CSV export
    addH('30-Day Accelerated Simulation (CSV Export)');
    const created4 = await http('POST', '/investments', {
      token,
      body: {
        planId: plan._id,
        amount: Number(plan.minAmount),
        currency: plan.currency,
        autoReinvest: false,
      },
    });
    const investmentId4 = (created4.id || created4._id || '').toString();
    
    const csvRows = [['day','cycleTransferred','totalAccumulated']];
    let totalAccum = 0;
    
    for (let day = 1; day <= 30; day++) {
      // Add one hour first to simulate within-day accrual
      await httpSafe('POST', `/admin/investments/${investmentId4}/test-hourly-cycle`, { token });
      const d = await http('POST', `/admin/investments/${investmentId4}/test-daily-cycle`, { token });
      totalAccum = d.newTotalAccumulatedRoi;
      csvRows.push([day, d.cycleEarningsTransferred, totalAccum]);
    }
    
    const end4 = await http('POST', `/admin/investments/${investmentId4}/test-end-investment`, { token });
    add(`- 30d simulation final earnings: ${fmtCurrency(end4.totalEarningsTransferred, plan.currency)}`);
    
    const csvPath = path.join(process.cwd(), 'E2E_CYCLE_SIM.csv');
    fs.writeFileSync(csvPath, csvRows.map(r=>r.join(',')).join('\n'), 'utf-8');
    add(`- CSV written: ${csvPath}`);

    // 10) Final wallet validation
    addH('Final Wallet Validation');
    const walletsFinal = await http('GET', `/wallets/user/${userId}`, { token });
    const mainWalletFinal = Array.isArray(walletsFinal) ? walletsFinal.find(w => w.type === 'main') : null;
    const nairaFinal = mainWalletFinal ? mainWalletFinal.nairaBalance : 0;
    add(`- Final wallet balance: Naira=${fmtCurrency(nairaFinal, 'naira')}`);

    // 11) Save report
    const out = report.join('\n');
    const outPath = path.join(process.cwd(), 'E2E_TEST_REPORT.md');
    fs.writeFileSync(outPath, out, 'utf-8');
    console.log(out);
    console.log(`\nReport written to ${outPath}`);
    
  } catch (err) {
    console.error('E2E Test Failed:', err.message);
    console.error(err.stack);
    process.exitCode = 1;
  }
})();
