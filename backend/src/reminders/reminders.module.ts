import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Reminder } from './reminder.entity';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { SmsService } from './sms.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Reminder]),
        ConfigModule,
    ],
    controllers: [RemindersController],
    providers: [RemindersService, SmsService],
    exports: [RemindersService],
})
export class RemindersModule { }
