import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { RemindersModule } from './reminders/reminders.module';
import { GroqModule } from './groq/groq.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { DrugInteractionsModule } from './drug-interactions/drug-interactions.module';

import { User } from './users/user.entity';
import { Prescription } from './prescriptions/prescription.entity';
import { Medicine } from './medicines/medicine.entity';
import { Reminder } from './reminders/reminder.entity';
import { Doctor } from './doctors/doctor.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: join(__dirname, '..', 'database.sqlite'),
      entities: [User, Prescription, Medicine, Reminder, Doctor],
      synchronize: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    UsersModule,
    PrescriptionsModule,
    RemindersModule,
    GroqModule,
    AdminModule,
    HealthModule,
    DrugInteractionsModule,
  ],
})
export class AppModule { }
