import { Controller, Get, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(
        private usersService: UsersService,
        private prescriptionsService: PrescriptionsService,
    ) { }

    private checkAdmin(req: any) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Admin access required');
        }
    }

    @Get('stats')
    async getStats(@Request() req) {
        this.checkAdmin(req);
        const userStats = await this.usersService.getStats();
        const prescriptionStats = await this.prescriptionsService.getStats();
        return { users: userStats, prescriptions: prescriptionStats };
    }

    @Get('users')
    async getUsers(@Request() req) {
        this.checkAdmin(req);
        return this.usersService.findAll();
    }

    @Get('prescriptions')
    async getPrescriptions(@Request() req) {
        this.checkAdmin(req);
        return this.prescriptionsService.findAllAdmin();
    }
}
