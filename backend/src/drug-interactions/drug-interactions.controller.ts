import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
    DrugInteractionCheckResult,
    DrugInteractionsService,
} from './drug-interactions.service';

@Controller('drug-interactions')
@UseGuards(JwtAuthGuard)
export class DrugInteractionsController {
    constructor(private readonly drugInteractionsService: DrugInteractionsService) { }

    @Post('check')
    async check(
        @Body() body: { medicines?: string[] },
    ): Promise<DrugInteractionCheckResult> {
        const medicines = Array.isArray(body?.medicines)
            ? body.medicines.filter((m) => typeof m === 'string')
            : [];
        return this.drugInteractionsService.checkInteractions(medicines);
    }
}
