# FINTAVA Payment Integration Setup

## Overview
This document explains how to set up and configure the FINTAVA payment integration for NGN wallet deposits with auto-populated user data.

## Changes Made

### 1. Backend Changes

#### User Data Auto-Population
- Modified `PaymentsService.createVirtualWallet()` to automatically fetch user data from the database
- User's `firstName`, `lastName`, `email`, and `phoneNumber` are now auto-populated
- Added validation to ensure required fields (email, phone) are available

#### New DTOs
- **CreateSimpleVirtualWalletDto**: Simplified DTO requiring only `amount` and optional `expireTimeInMin`
- **CreateVirtualWalletDto**: Updated to make user fields optional (auto-populated)

#### New Endpoints
- `POST /payments/virtual-wallet/simple`: New simplified endpoint for creating virtual wallets
- `POST /payments/test-virtual-wallet`: Deprecated (redirects to simple endpoint)

#### Error Handling
- Added specific error messages for missing phone numbers
- Better error handling for FINTAVA API responses

### 2. Frontend Changes

#### Updated Hooks
- Modified `useCreateVirtualWallet` to use the new simplified endpoint
- Added specific error handling for common issues (missing phone, invalid API key)

## Setup Instructions

### Step 1: Environment Configuration

1. **Create .env file** in the backend directory:
   ```bash
   cd backend
   cp env.example .env
   ```

2. **Configure FINTAVA API Key** in your `.env` file:
   ```env
   # FINTAVA Configuration
   FINTAVA_API_KEY=your_actual_fintava_api_key_here
   FINTAVA_BASE_URL=https://dev.fintavapay.com/api/dev
   FINTAVA_WEBHOOK_URL=http://localhost:3001/api/v1/payments/webhook/fintava
   ```

### Step 2: Get FINTAVA API Key

1. **Log into your FINTAVA dashboard**
2. **Navigate to API settings**
3. **Generate or copy your API key** for the development environment
4. **Replace the placeholder** in your `.env` file

### Step 3: Configure Webhook URL

The webhook URL is automatically configured based on your environment:

**Development:**
```env
FINTAVA_WEBHOOK_URL=http://localhost:3001/api/v1/payments/webhook/fintava
```

**Production:**
```env
FINTAVA_WEBHOOK_URL=https://api.kltmines.com/api/v1/payments/webhook/fintava
```

**To get the current webhook URL programmatically:**
```bash
curl -X GET http://localhost:3001/api/v1/payments/webhook-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 4: User Profile Requirements

For the auto-population to work correctly, users must have:
- **Email**: Always required (from registration)
- **Phone Number**: Required for virtual wallet creation
- **First Name & Last Name**: Used to create customer name

### Step 5: Testing the Integration

1. **Start the backend server**:
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Test the endpoint** using the new simplified API:
   ```bash
   curl -X POST http://localhost:3001/payments/virtual-wallet/simple \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"amount": 1000}'
   ```

## API Endpoints

### Create Virtual Wallet (Simplified)
```http
POST /payments/virtual-wallet/simple
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 1000,
  "expireTimeInMin": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Virtual wallet created successfully",
  "data": {
    "_id": "...",
    "customerName": "John Doe",
    "email": "john@example.com",
    "phone": "08012345678",
    "amount": 1000,
    "bank": "Wema Bank",
    "virtualAcctName": "John Doe",
    "virtualAcctNo": "1234567890",
    "expiresAt": "2024-01-01T12:30:00.000Z",
    "status": "ACTIVE"
  }
}
```

## Error Handling

### Common Errors

1. **Invalid API Key**
   ```json
   {
     "message": "FINTAVA API error: Invalid API Key",
     "error": "Bad Request",
     "statusCode": 400
   }
   ```
   **Solution**: Check your FINTAVA_API_KEY in the .env file

2. **Missing Phone Number**
   ```json
   {
     "message": "User phone number is required but not found in profile. Please update your profile.",
     "error": "Bad Request",
     "statusCode": 400
   }
   ```
   **Solution**: User needs to update their phone number in their profile

3. **Missing Email**
   ```json
   {
     "message": "User email is required but not found in profile",
     "error": "Bad Request",
     "statusCode": 400
   }
   ```
   **Solution**: This shouldn't happen as email is required during registration

## User Experience Flow

1. **User clicks "Deposit" for NGN**
2. **User enters amount** in the frontend dialog
3. **Frontend calls** `/payments/virtual-wallet/simple` with just the amount
4. **Backend automatically:**
   - Fetches user data from database
   - Populates customerName as "FirstName LastName"
   - Uses user's email and phone number
   - Generates unique merchant reference
   - Sets description to "Wallet funding"
   - Creates virtual wallet with FINTAVA
5. **User receives** virtual bank account details with countdown timer
6. **User makes payment** to the provided account
7. **FINTAVA webhook** automatically credits user's wallet when payment is confirmed

## Security Notes

- API keys are stored securely in environment variables
- User data is fetched from authenticated user context
- All endpoints require JWT authentication
- Webhook endpoints validate incoming data structure

## Troubleshooting

### Check API Key
If you're getting "Invalid API Key" errors:
1. Verify the API key is correctly set in .env
2. Ensure there are no extra spaces or characters
3. Confirm the key is for the correct environment (dev/prod)
4. Check with FINTAVA support if the key is valid

### Check User Profile
If users can't create virtual wallets:
1. Ensure user has phone number in profile
2. Check if phone number format is correct
3. Verify user email is present

### Check Logs
Backend logs will show detailed error information:
```bash
cd backend
npm run start:dev
# Check console output for detailed error messages
``` 