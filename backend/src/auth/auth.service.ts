import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async register(data: { name: string; email: string; password: string; phone?: string; role?: string }) {
        const existing = await this.userRepo.findOne({ where: { email: data.email } });
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = this.userRepo.create({
            name: data.name,
            email: data.email,
            password: hashedPassword,
            phone: data.phone || '',
            role: data.role || 'patient',
        });

        const saved = await this.userRepo.save(user);
        const token = this.jwtService.sign({ sub: saved.id, email: saved.email, role: saved.role });

        return {
            user: { id: saved.id, name: saved.name, email: saved.email, role: saved.role },
            access_token: token,
        };
    }

    async login(email: string, password: string) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

        return {
            user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
            access_token: token,
        };
    }

    async getMe(userId: number) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('User not found');
        const { password, ...result } = user;
        return result;
    }
}
