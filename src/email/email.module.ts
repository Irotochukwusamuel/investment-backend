import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { BrevoEmailProvider } from './providers/brevo.provider';
import { NodemailerEmailProvider } from './providers/nodemailer.provider';
import { ConsoleEmailProvider } from './providers/console.provider';

@Module({
  imports: [ConfigModule],
  controllers: [EmailController],
  providers: [
    EmailService,
    BrevoEmailProvider,
    NodemailerEmailProvider,
    ConsoleEmailProvider,
  ],
  exports: [EmailService],
})
export class EmailModule {} 