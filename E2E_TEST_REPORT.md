# E2E Investment System Test Report
Generated: 2025-08-29T10:35:27.505Z
Base URL: http://localhost:3001/api/v1

## Authentication
- Logged in as admin@kltmines.com
- User ID: 688e2ac7b9de4395e902d40e

## Plan Discovery
- Selected Plan: CADET (naira) [688e2ac6b9de4395e902d3c7] min=5000 max=25000

## Wallet Baseline
- Main Wallet before: Naira=₦66,492.37, USDT=0.00 USDT

## First Investment: Full Cycle
- Created Investment: 68b18270d640f0adecca3c8b, Amount=₦5,000.00
- Hourly ROI added: ₦10.42
- Daily cycle transferred: ₦10.42
- Completed investment, earnings: ₦10.42

## Edge Cases: Early Cancel
- Created Investment for Early Cancel: 68b18271d640f0adecca3cae
- Cancelled Investment Status: cancelled
- End cancelled investment: Expected failure -> POST /admin/investments/68b18271d640f0adecca3cae/test-end-investment failed 400: Investment must be active to test end of investment

## Failure Simulation
- Forced withdrawal failure: Expected failure -> POST /wallets/688e2ac7b9de4395e902d40e/withdraw failed 400: Insufficient naira balance

## Restart Consistency
- Snapshot before restart: mainWallet.naira=₦56,502.79
- Skipping manual restart (set E2E_MANUAL_RESTART=1 to enable)
- Snapshot after restart: mainWallet.naira=₦56,502.79

## Concurrency: Overlapping Cycle Triggers
- Created Investment for Concurrency: 68b18273d640f0adecca3cd0
- Concurrent hourly triggers: success=3, failures=0

## 30-Day Accelerated Simulation (CSV Export)
- 30d simulation final earnings: ₦312.50
- CSV written: /Users/irotochukwusamuel/Desktop/Personal/investment/backend/E2E_CYCLE_SIM.csv

## Final Wallet Validation
- Final wallet balance: Naira=₦46,825.71