"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const compression = require("compression");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
const seeds_service_1 = require("./seeds/seeds.service");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));
    app.use(compression());
    app.enableCors({
        origin: configService.get('FRONTEND_URL') || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        errorHttpStatusCode: 422,
        disableErrorMessages: configService.get('NODE_ENV') === 'production',
    }));
    app.setGlobalPrefix('api/v1');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('KLTMINES Investment Platform API')
        .setDescription(`
      Backend API for KLTMINES investment platform
      
      ## Features
      - User authentication and authorization
      - Investment plan management
      - Investment tracking and ROI calculations
      - Wallet and transaction management
      - Admin dashboard and analytics
      - Email notifications
      - Real-time updates via WebSocket
      
      ## Authentication
      Most endpoints require authentication. Include the JWT token in the Authorization header:
      \`Authorization: Bearer <your-jwt-token>\`
    `)
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .addTag('auth', 'Authentication endpoints')
        .addTag('users', 'User management')
        .addTag('investments', 'Investment operations')
        .addTag('wallet', 'Wallet and transaction management')
        .addTag('admin', 'Admin operations')
        .addTag('plans', 'Investment plans')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'none',
            filter: true,
            showRequestDuration: true,
        },
        customSiteTitle: 'KLTMINES API Documentation',
    });
    if (configService.get('AUTO_SEED_ON_STARTUP') === 'true') {
        try {
            logger.log('Auto-seeding enabled. Checking and seeding database...');
            const seedsService = app.get(seeds_service_1.SeedsService);
            await seedsService.seedInvestmentPlans();
            logger.log('Startup seeding completed successfully');
        }
        catch (error) {
            logger.error('Startup seeding failed:', error);
        }
    }
    const port = configService.get('PORT') || 3001;
    await app.listen(port);
    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
    logger.log(`🌍 Environment: ${configService.get('NODE_ENV')}`);
    logger.log(`🔗 Frontend URL: ${configService.get('FRONTEND_URL')}`);
}
bootstrap().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map