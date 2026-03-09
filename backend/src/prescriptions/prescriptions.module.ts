import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Prescription } from './prescription.entity';
import { Medicine } from '../medicines/medicine.entity';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';
import { GroqModule } from '../groq/groq.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Prescription, Medicine]),
        MulterModule.register({ dest: './uploads' }),
        GroqModule,
    ],
    controllers: [PrescriptionsController],
    providers: [PrescriptionsService],
    exports: [PrescriptionsService],
})
export class PrescriptionsModule { }
