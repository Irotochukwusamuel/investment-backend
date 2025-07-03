# KLTMINES Investment Platform Backend

A comprehensive NestJS backend for the KLTMINES investment platform, providing secure APIs for user management, investment operations, wallet management, and real-time notifications.

## 🚀 Features

### Core Features
- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User, Admin, Moderator)
  - Email verification
  - Password reset functionality
  - Two-factor authentication support
  - Session management

- **Investment Management**
  - Investment plan creation and management
  - User investment tracking
  - Daily ROI calculations and payouts
  - Auto-reinvest functionality
  - Investment statistics and analytics
  - Multiple currency support (NGN, USDT)

- **Wallet & Transaction System**
  - Multi-wallet support (Main, Profit, Locked)
  - Transaction history and tracking
  - Deposit and withdrawal processing
  - Internal transfers
  - Fee calculation and management
  - Payment method integration

- **Referral System**
  - Referral code generation
  - Referral tracking and bonuses
  - Multi-level referral support
  - Referral statistics

- **Email Notifications (Brevo Integration)**
  - Welcome emails
  - Email verification
  - Password reset emails
  - Investment confirmations
  - ROI payout notifications
  - Withdrawal confirmations
  - Referral bonus notifications
  - Security alerts

- **Admin Dashboard**
  - User management
  - Investment oversight
  - Transaction monitoring
  - System analytics
  - KYC verification
  - Support ticket management

### Security Features
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive request validation
- **Password Hashing**: Secure password storage with bcrypt
- **JWT Tokens**: Secure authentication with refresh tokens
- **CORS Protection**: Cross-origin resource sharing configuration
- **Helmet Security**: Security headers and protection

### Advanced Features
- **Scheduled Tasks**: Automated ROI updates and transaction processing
- **Queue Management**: Background job processing with Bull
- **File Upload**: Secure file upload for KYC documents
- **Payment Integration**: Support for multiple payment gateways
- **Analytics**: Comprehensive reporting and statistics
- **Admin Dashboard**: Full admin interface for platform management

## 🛠️ Tech Stack

- **Framework**: NestJS 11.x
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Queue**: Bull with Redis
- **Authentication**: JWT, Passport.js
- **Email**: Brevo (Sendinblue)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Logging**: Winston
- **Security**: Helmet, bcrypt, express-rate-limit

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 6+
- Redis 6+
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Configure your `.env` file with the following variables:
   ```env
   # Application
   NODE_ENV=development
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/kltmines
   
   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   
   # Brevo (Email)
   BREVO_API_KEY=your-brevo-api-key
   SENDER_EMAIL=noreply@kltmines.com
   SENDER_NAME=KLTMINES
   
   # Rate Limiting
   RATE_LIMIT_TTL=60
   RATE_LIMIT_LIMIT=100
   
   # Security
   BCRYPT_SALT_ROUNDS=12
   
   # File Upload
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   
   # Payment Gateways (Optional)
   PAYSTACK_SECRET_KEY=your-paystack-secret
   FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret
   ```

4. **Start the application**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

## 📚 API Documentation

Once the application is running, you can access the API documentation at:
- **Swagger UI**: `http://localhost:3001/api/docs`
- **API Base URL**: `http://localhost:3001/api/v1`

### Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Main Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/verify-email` - Verify email address
- `GET /auth/profile` - Get user profile

#### Users
- `GET /users` - Get all users (Admin)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (Admin)
- `POST /users/change-password` - Change password
- `GET /users/referrals` - Get user referrals
- `GET /users/dashboard-stats` - Get dashboard statistics

#### Investment Plans
- `GET /investment-plans` - Get all investment plans
- `GET /investment-plans/:id` - Get plan by ID
- `POST /investment-plans` - Create plan (Admin)
- `PUT /investment-plans/:id` - Update plan (Admin)
- `DELETE /investment-plans/:id` - Delete plan (Admin)

#### Investments
- `GET /investments` - Get user investments
- `GET /investments/:id` - Get investment by ID
- `POST /investments` - Create investment
- `PUT /investments/:id` - Update investment
- `DELETE /investments/:id` - Cancel investment
- `POST /investments/:id/pause` - Pause investment
- `POST /investments/:id/resume` - Resume investment

#### Wallet
- `GET /wallet/balance` - Get wallet balance
- `GET /wallet/transactions` - Get transaction history
- `POST /wallet/transfer` - Internal transfer
- `POST /wallet/deposit` - Create deposit
- `POST /wallet/withdraw` - Create withdrawal
- `PUT /wallet/bank-account` - Update bank account
- `PUT /wallet/crypto-wallet` - Update crypto wallet
- `GET /wallet/stats` - Get wallet statistics

#### Transactions
- `GET /transactions` - Get all transactions
- `GET /transactions/:id` - Get transaction by ID
- `POST /transactions/:id/process` - Process transaction (Admin)
- `POST /transactions/:id/cancel` - Cancel transaction
- `POST /transactions/:id/retry` - Retry failed transaction

#### Admin
- `GET /admin/dashboard` - Admin dashboard stats
- `GET /admin/users` - User management
- `GET /admin/investments` - Investment management
- `GET /admin/transactions` - Transaction management
- `POST /admin/kyc/approve` - Approve KYC
- `POST /admin/kyc/reject` - Reject KYC

## 🔧 Configuration

### Database Configuration
The application uses MongoDB with Mongoose. Configure your connection in `app.module.ts`:

```typescript
MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/kltmines')
```

### Redis Configuration
Redis is used for caching and session storage. Configure in `app.module.ts`:

```typescript
BullModule.forRoot({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
})
```

### Email Configuration
Brevo (Sendinblue) is used for email services. Configure in `email.service.ts`:

```typescript
const configuration = new SibApiV3Sdk.Configuration({
  apiKey: process.env.BREVO_API_KEY,
});
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📊 Database Schema

### User Schema
- Authentication fields (email, password, tokens)
- Profile information (name, phone, address)
- Wallet balances (NGN, USDT)
- Investment statistics
- Referral system
- KYC information
- Settings and preferences

### Investment Plan Schema
- Plan details (name, description, currency)
- Financial parameters (min/max amount, ROI rates)
- Duration and terms
- Bonuses and features
- Statistics and popularity metrics

### Investment Schema
- User and plan references
- Investment amount and currency
- ROI tracking and calculations
- Payout history
- Status management
- Auto-reinvest settings

### Transaction Schema
- Transaction type and amount
- Payment method and details
- Status tracking
- Fee calculations
- Metadata and audit trail

## 🔒 Security Features

### Authentication & Authorization
- JWT tokens with refresh mechanism
- Role-based access control
- Password hashing with bcrypt
- Session management
- Two-factor authentication support

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting

### API Security
- Helmet.js security headers
- CORS configuration
- Request size limits
- File upload restrictions
- Error message sanitization

## 📈 Performance Optimization

### Database Optimization
- Proper indexing on frequently queried fields
- Aggregation pipelines for complex queries
- Connection pooling
- Query optimization

### Caching Strategy
- Redis for session storage
- Cache frequently accessed data
- Background job processing with Bull
- Database query result caching

### Monitoring
- Request/response logging
- Performance metrics
- Error tracking
- Health checks
- Database query monitoring

## 🚀 Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://your-mongodb-uri
REDIS_HOST=your-redis-host
REDIS_PORT=6379
JWT_SECRET=your-production-jwt-secret
BREVO_API_KEY=your-brevo-api-key
```

### PM2 Deployment
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔧 Development

### Code Style
- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- Consistent naming conventions

### Git Workflow
- Feature branches
- Pull request reviews
- Commit message conventions
- Automated testing

### Debugging
```bash
# Debug mode
npm run start:debug

# Logs
npm run logs

# Database connection test
npm run test:db
```

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/api/docs`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 Changelog

### Version 1.0.0
- Initial release
- Complete investment platform backend
- User authentication and management
- Investment and transaction systems
- Email notifications
- Admin dashboard
- Security features
- API documentation

## 🌱 Database Seeding

The application includes a comprehensive seeding system to populate the database with initial data including investment plans and admin users.

### Available Seeding Commands

```bash
# Seed everything (plans + admin user)
npm run seed:all

# Seed only investment plans
npm run seed:plans

# Seed only admin user  
npm run seed:admin

# Clear all seeded data
npm run seed:clear

# Clear and re-seed everything
npm run seed:reset

# Show available commands
npm run seed
```

### Investment Plans Seeded

The seeding system creates the following investment plans:

#### Naira Plans
1. **Starter Plan** - Perfect for beginners
   - Amount: ₦5,000 - ₦50,000
   - Daily ROI: 1.5% | Total ROI: 45%
   - Duration: 30 days

2. **Growth Plan** - Steady growth for moderate investors
   - Amount: ₦50,000 - ₦500,000
   - Daily ROI: 2.0% | Total ROI: 60%
   - Duration: 30 days

3. **Premium Plan** - Maximum returns with premium features
   - Amount: ₦500,000 - ₦2,000,000
   - Daily ROI: 2.5% | Total ROI: 75%
   - Duration: 30 days

4. **Elite Plan** - Exclusive plan for high-net-worth individuals
   - Amount: ₦2,000,000 - ₦10,000,000
   - Daily ROI: 3.0% | Total ROI: 90%
   - Duration: 30 days

#### USDT Plans
1. **USDT Starter** - Entry-level cryptocurrency investment
   - Amount: USDT50 - USDT500
   - Daily ROI: 1.2% | Total ROI: 36%
   - Duration: 30 days

2. **USDT Growth** - Advanced crypto investment
   - Amount: USDT500 - USDT5,000
   - Daily ROI: 1.8% | Total ROI: 54%
   - Duration: 30 days

### Automatic Seeding

You can enable automatic seeding on application startup by setting:

```bash
AUTO_SEED_ON_STARTUP=true
```

This will automatically seed investment plans when the application starts if they don't already exist.

### API Seeding Endpoint

You can also trigger seeding via the API:

```bash
POST /api/v1/plans/seed
```

This endpoint is useful for re-seeding plans after updates or in production environments.

### Custom Seeding

To add custom investment plans or modify existing ones, edit the seeding data in:
```
src/seeds/seeds.service.ts
```

## 🚀 Quick Start

### Development Mode
```bash
npm install
npm run seed:all    # Seed database with initial data
npm run start:dev   # Start in watch mode
```

### Production Deployment
```bash
npm run build
npm run start:prod
```

## 📚 API Documentation

Once running, access the interactive API documentation at:
- **Swagger UI**: `http://localhost:3001/api/docs`
- **Health Check**: `http://localhost:3001/api/v1/health`

### Key API Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration  
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/send-otp` - Send OTP for verification
- `POST /auth/verify-otp` - Verify OTP

#### Investment Plans
- `GET /plans` - Get all investment plans
- `GET /plans/:id` - Get plan by ID
- `POST /plans` - Create new plan (Admin)
- `PUT /plans/:id` - Update plan (Admin)
- `DELETE /plans/:id` - Delete plan (Admin)
- `POST /plans/seed` - Seed default plans

#### Investments
- `GET /investments/my` - Get user's investments
- `POST /investments` - Create new investment
- `GET /investments/:id` - Get investment details
- `POST /investments/:id/cancel` - Cancel investment

#### User Profile
- `GET /users/profile` - Get current user profile
- `PATCH /users/profile` - Update user profile

#### Wallet Management
- `GET /wallets` - Get user wallets
- `POST /wallets/deposit` - Create deposit
- `POST /wallets/withdraw` - Create withdrawal
- `POST /wallets/transfer` - Internal transfer

#### Transactions
- `GET /transactions/my` - Get user transactions
- `GET /transactions/:id` - Get transaction details
