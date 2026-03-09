import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    async findById(id: number): Promise<User> {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async getProfile(userId: number) {
        const user = await this.findById(userId);
        const { password, ...result } = user;
        return result;
    }

    async updateProfile(userId: number, data: Partial<User>) {
        delete data.password; // Don't allow password update through profile
        delete data.role;
        await this.userRepo.update(userId, data);
        return this.getProfile(userId);
    }

    async findAll() {
        const users = await this.userRepo.find({
            select: ['id', 'name', 'email', 'phone', 'role', 'createdAt'],
        });
        return users;
    }

    async getStats() {
        const total = await this.userRepo.count();
        const patients = await this.userRepo.count({ where: { role: 'patient' } });
        const doctors = await this.userRepo.count({ where: { role: 'doctor' } });
        const admins = await this.userRepo.count({ where: { role: 'admin' } });
        return { total, byRole: { patient: patients, doctor: doctors, admin: admins } };
    }
}
