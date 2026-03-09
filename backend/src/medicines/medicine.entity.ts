import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Prescription } from '../prescriptions/prescription.entity';

@Entity('medicines')
export class Medicine {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    prescriptionId: number;

    @ManyToOne(() => Prescription, (p) => p.medicines, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'prescriptionId' })
    prescription: Prescription;

    @Column()
    name: string;

    @Column({ nullable: true })
    dose: string;

    @Column({ nullable: true })
    frequency: string; // e.g., "Twice daily", "Morning & Night"

    @Column({ nullable: true })
    duration: string; // e.g., "5 days", "1 week"

    @Column({ type: 'text', nullable: true })
    instructions: string; // e.g., "After meals", "Before bed"

    @Column({ default: false })
    validated: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
