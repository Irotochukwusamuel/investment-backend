"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const seeds_service_1 = require("./seeds.service");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('DatabaseSeeder');
    try {
        logger.log('Starting database seeding process...');
        const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
        const seedsService = app.get(seeds_service_1.SeedsService);
        const command = process.argv[2];
        switch (command) {
            case 'clear':
                await seedsService.clearDatabase();
                break;
            case 'seed':
                await seedsService.seedAll();
                break;
            case 'reset':
                await seedsService.resetAndSeed();
                break;
            case 'plans':
                await seedsService.seedInvestmentPlans();
                break;
            case 'admin':
                await seedsService.seedAdminUser();
                break;
            default:
                logger.log('Available commands:');
                logger.log('  clear  - Clear all seeded data');
                logger.log('  seed   - Seed all data');
                logger.log('  reset  - Clear and re-seed all data');
                logger.log('  plans  - Seed only investment plans');
                logger.log('  admin  - Seed only admin user');
                logger.log('');
                logger.log('Usage: npm run seed <command>');
                process.exit(1);
        }
        await app.close();
        logger.log('Seeding process completed successfully!');
        process.exit(0);
    }
    catch (error) {
        logger.error('Seeding process failed:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=seed.js.map