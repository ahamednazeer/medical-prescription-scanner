import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';

@Module({
    imports: [UsersModule, PrescriptionsModule],
    controllers: [AdminController],
})
export class AdminModule { }
