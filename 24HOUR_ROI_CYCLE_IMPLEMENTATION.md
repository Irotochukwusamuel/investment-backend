# 24-Hour ROI Cycle Implementation

## Overview

This document describes the implementation of the new 24-hour ROI cycle system that automatically transfers accumulated Daily ROI to users' Available Balance every 24 hours from when their investment was activated.

## Key Changes

### 1. Database Schema Updates

#### Investment Schema (`backend/src/investments/schemas/investment.schema.ts`)
- Added `activatedAt`: Date when the investment became active
- Added `nextRoiCycleDate`: Next 24-hour ROI cycle date
- Updated database indexes for performance

#### DTO Updates (`backend/src/investments/dto/create-investment.dto.ts`)
- Added `activatedAt` and `nextRoiCycleDate` fields to CreateInvestmentDto

### 2. ROI Management System

#### New Cron Jobs (`backend/src/tasks/tasks.service.ts`)

**Hourly ROI Accumulation** (`accumulateRoiDuringCycle`)
- Runs every hour
- Accumulates ROI in the `earnedAmount` field (green highlighted area)
- Only processes investments that haven't reached their 24-hour cycle

**24-Hour ROI Cycle Processing** (`updateInvestmentRoi`)
- Runs every 10 seconds to check for due cycles
- Transfers accumulated ROI to user's wallet
- Resets `earnedAmount` to 0
- Sets next cycle date to 24 hours from now

#### Removed Old System
- Removed hourly ROI deposits to wallet
- Removed daily midnight ROI reset
- Removed `nextRoiUpdate` hourly logic

### 3. Manual Withdrawal Updates

#### `withdrawDailyRoi` Method (`backend/src/investments/investments.service.ts`)
- Now resets the 24-hour cycle when manual withdrawal occurs
- Sets `nextRoiCycleDate` to 24 hours from withdrawal time
- Maintains independence between investments

## How It Works

### 1. Investment Creation
```
Investment created → activatedAt = now
                → nextRoiCycleDate = now + 24 hours
                → earnedAmount = 0
```

### 2. During 24-Hour Cycle
```
Every hour: earnedAmount += (dailyRoi / 24)
           (This shows in the green highlighted area)
```

### 3. At End of 24-Hour Cycle
```
System detects: nextRoiCycleDate <= now
Action: Transfer earnedAmount to wallet
        Reset earnedAmount to 0
        Set nextRoiCycleDate = now + 24 hours
```

### 4. Manual Withdrawal
```
User clicks "Withdraw Daily ROI"
Action: Transfer earnedAmount to wallet
        Reset earnedAmount to 0
        Reset 24-hour cycle (nextRoiCycleDate = now + 24 hours)
```

## Benefits

1. **Independent Cycles**: Each investment has its own 24-hour cycle from activation
2. **Automatic Transfers**: ROI automatically moves to Available Balance every 24 hours
3. **Manual Override**: Users can still manually withdraw before the cycle completes
4. **Cycle Reset**: Manual withdrawal resets the 24-hour cycle
5. **Accurate Tracking**: `totalAccumulatedRoi` tracks total earnings, never resets

## Migration

### Running the Migration Script
```bash
cd backend
node scripts/migrate-to-24hour-roi-cycles.js
```

This script will:
- Find all active investments without the new fields
- Set `activatedAt` to `startDate` or `createdAt`
- Set `nextRoiCycleDate` to 24 hours from now
- Verify all investments are migrated

## Testing

### Test Scenarios
1. **New Investment**: Verify 24-hour cycle starts from activation
2. **Existing Investment**: Verify migration sets correct dates
3. **Manual Withdrawal**: Verify cycle resets to 24 hours from withdrawal
4. **Automatic Transfer**: Verify ROI moves to wallet after 24 hours
5. **Multiple Investments**: Verify independent cycles for each investment

### Monitoring
- Check logs for "24-hour ROI cycle" messages
- Monitor `nextRoiCycleDate` field updates
- Verify `earnedAmount` resets to 0 after cycles
- Confirm wallet balance increases after automatic transfers

## Configuration

### Cron Job Timing
- **ROI Accumulation**: Every hour (`@Cron(CronExpression.EVERY_HOUR)`)
- **Cycle Processing**: Every 10 seconds (`@Cron(CronExpression.EVERY_10_SECONDS)`)

### Timezone
All cron jobs use `Africa/Lagos` timezone for consistency.

## Troubleshooting

### Common Issues
1. **Migration Failures**: Check MongoDB connection and permissions
2. **Cycle Not Processing**: Verify `nextRoiCycleDate` is set correctly
3. **ROI Not Accumulating**: Check if investment is active and within cycle
4. **Wallet Not Updating**: Verify wallet service integration

### Debug Logs
Enable debug logging to see detailed ROI cycle processing:
```typescript
this.logger.log(`💰 Processing 24-hour ROI cycle for investment ${investment._id}`);
this.logger.log(`✅ Transferred ${currentAccumulatedRoi} ${investment.currency} ROI to wallet`);
```

## Future Enhancements

1. **Flexible Cycle Lengths**: Allow different cycle durations per plan
2. **ROI Notifications**: Send emails when ROI is automatically transferred
3. **Cycle History**: Track all ROI cycles for audit purposes
4. **Performance Metrics**: Monitor ROI processing performance
