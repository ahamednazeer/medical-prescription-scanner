import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('doctors')
export class Doctor {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    specialization: string;

    @Column({ nullable: true })
    hospital: string;

    @Column({ nullable: true })
    email: string;

    @CreateDateColumn()
    createdAt: Date;
}
