const fs = require('fs');
require('dotenv').config();

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3001';
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@kltmines.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin123';

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

async function cleanup() {
  try {
    console.log('🧹 Cleaning up existing investments...');
    
    // Login
    const login = await http('POST', '/auth/login', {
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const token = login?.access_token || login?.token;
    const userId = (login?.user?.id || login?.user?._id || '').toString();
    
    // Get current investments
    const investments = await http('GET', '/investments/my', { token });
    console.log(`Found ${investments.length} investments`);
    
    for (const inv of investments) {
      if (inv.status === 'active') {
        console.log(`Completing active investment ${inv._id}...`);
        try {
          // Complete the investment
          await http('POST', `/admin/investments/${inv._id}/test-end-investment`, { token });
          console.log(`✅ Completed ${inv._id}`);
        } catch (err) {
          console.log(`❌ Failed to complete ${inv._id}: ${err.message}`);
          // Try to cancel instead
          try {
            await http('POST', `/investments/${inv._id}/cancel`, {
              token,
              body: { reason: 'E2E cleanup' }
            });
            console.log(`✅ Cancelled ${inv._id}`);
          } catch (cancelErr) {
            console.log(`❌ Failed to cancel ${inv._id}: ${cancelErr.message}`);
          }
        }
      } else {
        console.log(`Skipping ${inv._id} (status: ${inv.status})`);
      }
    }
    
    console.log('✨ Cleanup completed!');
    
  } catch (err) {
    console.error('Cleanup failed:', err.message);
    process.exit(1);
  }
}

cleanup();
