import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Prescription } from '../prescriptions/prescription.entity';

@Entity('reminders')
export class Reminder {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @ManyToOne(() => User, (u) => u.reminders)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ nullable: true })
    prescriptionId: number;

    @ManyToOne(() => Prescription, (p) => p.reminders, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'prescriptionId' })
    prescription: Prescription;

    @Column()
    medicineName: string;

    @Column({ nullable: true })
    dose: string;

    @Column()
    time: string; // "08:00", "14:00", "21:00"

    @Column({ nullable: true })
    period: string; // "Morning", "Afternoon", "Night"

    @Column()
    phone: string;

    @Column({ default: 'active' })
    status: string; // active, paused, completed, cancelled

    @Column({ nullable: true })
    frequency: string; // "daily", "twice_daily", "thrice_daily"

    @Column({ nullable: true })
    duration: string;

    @Column({ nullable: true })
    startDate: string;

    @Column({ nullable: true })
    endDate: string;

    @Column({ nullable: true })
    lastSentAt: string;

    @Column({ default: 0 })
    sentCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
