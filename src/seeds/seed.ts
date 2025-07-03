import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedsService } from './seeds.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('DatabaseSeeder');
  
  try {
    logger.log('Starting database seeding process...');
    
    const app = await NestFactory.createApplicationContext(AppModule);
    const seedsService = app.get(SeedsService);

    // Get command line arguments
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
  } catch (error) {
    logger.error('Seeding process failed:', error);
    process.exit(1);
  }
}

bootstrap(); 