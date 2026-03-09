import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Medicine } from '../medicines/medicine.entity';
import { Reminder } from '../reminders/reminder.entity';

@Entity('prescriptions')
export class Prescription {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @ManyToOne(() => User, (u) => u.prescriptions)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ nullable: true })
    imageUrl: string;

    @Column({ type: 'text', nullable: true })
    rawText: string;

    @Column({ default: 'pending' })
    status: string; // pending, processed, verified, error

    @Column({ nullable: true })
    doctorName: string;

    @Column({ nullable: true })
    hospitalName: string;

    @Column({ nullable: true })
    prescriptionDate: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @OneToMany(() => Medicine, (m) => m.prescription, { cascade: true })
    medicines: Medicine[];

    @OneToMany(() => Reminder, (r) => r.prescription)
    reminders: Reminder[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
