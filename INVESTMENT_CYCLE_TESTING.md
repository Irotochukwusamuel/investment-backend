# Investment Cycle Testing Guide

This document explains how to use the new investment cycle testing features that allow administrators to manually test different investment scenarios.

## Overview

The testing system provides three main test scenarios:
1. **Hourly Cycle Test** - Simulates 1 hour of ROI accumulation
2. **Daily Cycle Test** - Simulates completion of a 24-hour ROI cycle
3. **End Investment Test** - Simulates completion of the entire investment

## API Endpoints

### 1. Test Hourly ROI Cycle
```http
POST /admin/investments/:id/test-hourly-cycle
```

**What it does:**
- Adds 1 hour worth of ROI to the current cycle earnings
- Updates `earnedAmount` with the new hourly ROI
- Updates `lastRoiUpdate` and `nextRoiUpdate` timestamps

**Response:**
```json
{
  "message": "Hourly cycle test completed",
  "investment": { /* updated investment object */ },
  "hourlyRoiAdded": 2.08,
  "newEarnedAmount": 15.62
}
```

### 2. Test Daily ROI Cycle
```http
POST /admin/investments/:id/test-daily-cycle
```

**What it does:**
- Transfers current cycle earnings to `totalAccumulatedRoi`
- Resets `earnedAmount` to 0
- Updates timestamps for next cycle

**Response:**
```json
{
  "message": "Daily cycle test completed",
  "investment": { /* updated investment object */ },
  "cycleEarningsTransferred": 15.62,
  "newTotalAccumulatedRoi": 45.86
}
```

### 3. Test End of Investment
```http
POST /admin/investments/:id/test-end-investment
```

**What it does:**
- Marks investment as completed
- Transfers all earnings to user's wallet
- Creates transaction record
- Sends notification to user
- Updates investment status and end date

**Response:**
```json
{
  "message": "Investment end test completed",
  "investment": { /* updated investment object */ },
  "totalEarningsTransferred": 45.86,
  "finalReturnAmount": 5045.86
}
```

## Frontend Integration

The admin interface now includes test buttons for active investments:

- **Test Hourly** (Blue) - Tests hourly ROI cycle
- **Test Daily** (Green) - Tests daily ROI cycle completion
- **Test End** (Red) - Tests investment completion

These buttons only appear for investments with `status: 'active'`.

## Usage Examples

### Testing Hourly Accumulation
Use this when you want to:
- Verify hourly ROI calculations
- Test the progression of current cycle earnings
- Debug timing issues with ROI updates

### Testing Daily Cycle Completion
Use this when you want to:
- Verify 24-hour cycle logic
- Test the transfer of cycle earnings to total accumulated ROI
- Ensure proper timestamp updates for next cycle

### Testing Investment Completion
Use this when you want to:
- Verify end-of-investment logic
- Test wallet transfers
- Ensure proper status updates and notifications

## Important Notes

⚠️ **Warning**: These tests modify actual investment data in your database. Use them carefully in production environments.

### Prerequisites
- Investment must have `status: 'active'`
- Admin authentication required
- Valid investment ID

### Data Integrity
- All tests update timestamps to maintain consistency
- ROI calculations follow the same logic as the production system
- Wallet transfers and notifications are fully processed

## Testing Script

A test script is provided at `scripts/test-investment-cycles.js` that demonstrates how to use these endpoints programmatically.

### Running the Test Script
1. Update `TEST_INVESTMENT_ID` with an actual active investment ID
2. Update `ADMIN_TOKEN` with a valid admin JWT token
3. Ensure your backend API is running
4. Run: `node scripts/test-investment-cycles.js`

## Error Handling

The system includes comprehensive error handling:
- Investment not found
- Investment not in active status
- Wallet transfer failures (with rollback)
- Database connection issues

## Monitoring

After running tests, monitor:
- Investment status changes
- ROI calculations
- Wallet balance updates
- Transaction records
- User notifications

## Use Cases

### Development & Testing
- Verify ROI calculation logic
- Test edge cases
- Debug timing issues
- Validate business rules

### Production Support
- Manual intervention when needed
- Emergency fixes for stuck investments
- Verification of automated processes
- Customer support scenarios

## Security

- All endpoints require admin authentication
- Input validation on investment IDs
- Status checks before operations
- Rollback mechanisms for failed operations

## Future Enhancements

Potential improvements:
- Bulk testing for multiple investments
- Scheduled testing scenarios
- Test result logging and analytics
- Integration with monitoring systems


