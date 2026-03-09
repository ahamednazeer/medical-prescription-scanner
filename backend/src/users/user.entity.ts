import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Prescription } from '../prescriptions/prescription.entity';
import { Reminder } from '../reminders/reminder.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  address: string;

  @Column({ default: 'patient' })
  role: string; // patient, doctor, admin

  @Column({ nullable: true })
  profilePhoto: string;

  @Column({ nullable: true })
  emergencyContact: string;

  @Column({ nullable: true })
  emergencyPhone: string;

  @OneToMany(() => Prescription, (p) => p.user)
  prescriptions: Prescription[];

  @OneToMany(() => Reminder, (r) => r.user)
  reminders: Reminder[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
