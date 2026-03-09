import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrugInteractionsController } from './drug-interactions.controller';
import { DrugInteractionsService } from './drug-interactions.service';

@Module({
    imports: [ConfigModule],
    controllers: [DrugInteractionsController],
    providers: [DrugInteractionsService],
    exports: [DrugInteractionsService],
})
export class DrugInteractionsModule { }
