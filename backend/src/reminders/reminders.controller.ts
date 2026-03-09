import {
    Controller, Post, Get, Put, Delete,
    Body, Param, UseGuards, Request, ParseIntPipe,
} from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
    constructor(private service: RemindersService) { }

    @Post()
    async create(@Request() req, @Body() body: any) {
        return this.service.create({ ...body, userId: req.user.sub });
    }

    @Post('from-prescription')
    async createFromPrescription(
        @Request() req,
        @Body() body: { prescriptionId: number; phone: string; medicines: any[] },
    ) {
        return this.service.createFromPrescription(
            req.user.sub,
            body.prescriptionId,
            body.phone,
            body.medicines,
        );
    }

    @Get()
    async findAll(@Request() req) {
        return this.service.findByUser(req.user.sub);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.service.findOne(id, req.user.sub);
    }

    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Request() req, @Body() body: any) {
        return this.service.update(id, req.user.sub, body);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.service.remove(id, req.user.sub);
    }

    @Post(':id/trigger')
    async trigger(@Param('id', ParseIntPipe) id: number) {
        return this.service.triggerReminder(id);
    }
}
