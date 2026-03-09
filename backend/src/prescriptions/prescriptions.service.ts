import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from './prescription.entity';
import { Medicine } from '../medicines/medicine.entity';
import { GroqService, ExtractionResult } from '../groq/groq.service';

@Injectable()
export class PrescriptionsService {
    constructor(
        @InjectRepository(Prescription)
        private prescriptionRepo: Repository<Prescription>,
        @InjectRepository(Medicine)
        private medicineRepo: Repository<Medicine>,
        private groqService: GroqService,
    ) { }

    async upload(userId: number, imageUrl: string) {
        const prescription = this.prescriptionRepo.create({
            userId,
            imageUrl,
            status: 'pending',
        });
        return this.prescriptionRepo.save(prescription);
    }

    async process(prescriptionId: number, userId: number) {
        const prescription = await this.prescriptionRepo.findOne({
            where: { id: prescriptionId, userId },
        });
        if (!prescription) throw new NotFoundException('Prescription not found');

        try {
            const result = await this.extractPrescriptionData(prescription.imageUrl);

            // Update prescription with extracted data
            prescription.rawText = result.rawText;
            prescription.doctorName = result.doctorName || undefined;
            prescription.hospitalName = result.hospitalName || undefined;
            prescription.prescriptionDate = result.prescriptionDate || undefined;
            prescription.status = 'processed';
            await this.prescriptionRepo.save(prescription);

            // Save extracted medicines
            const medicines: Medicine[] = [];
            for (const med of result.medicines) {
                const medicine = this.medicineRepo.create({
                    prescriptionId: prescription.id,
                    name: med.name,
                    dose: med.dose,
                    frequency: med.frequency,
                    duration: med.duration,
                    instructions: med.instructions,
                });
                medicines.push(await this.medicineRepo.save(medicine));
            }

            return {
                prescription,
                medicines,
            };
        } catch (error) {
            prescription.status = 'error';
            prescription.notes = error.message;
            await this.prescriptionRepo.save(prescription);
            throw error;
        }
    }

    private async extractPrescriptionData(imagePath: string): Promise<ExtractionResult> {
        return this.groqService.extractPrescription(imagePath);
    }

    async findAll(userId: number) {
        return this.prescriptionRepo.find({
            where: { userId },
            relations: ['medicines'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number, userId: number) {
        const prescription = await this.prescriptionRepo.findOne({
            where: { id, userId },
            relations: ['medicines'],
        });
        if (!prescription) throw new NotFoundException('Prescription not found');
        return prescription;
    }

    async verify(id: number, userId: number, data: { medicines?: any[]; doctorName?: string; notes?: string }) {
        const prescription = await this.prescriptionRepo.findOne({
            where: { id, userId },
            relations: ['medicines'],
        });
        if (!prescription) throw new NotFoundException('Prescription not found');

        // Update prescription fields
        if (data.doctorName) prescription.doctorName = data.doctorName;
        if (data.notes) prescription.notes = data.notes;
        prescription.status = 'verified';
        await this.prescriptionRepo.save(prescription);

        // Update medicines if provided
        if (data.medicines) {
            // Replace existing medicines with the verified list, including an empty list.
            await this.medicineRepo.delete({ prescriptionId: id });

            for (const med of data.medicines) {
                const medicine = this.medicineRepo.create({
                    prescriptionId: id,
                    name: med.name,
                    dose: med.dose,
                    frequency: med.frequency,
                    duration: med.duration,
                    instructions: med.instructions,
                    validated: true,
                });
                await this.medicineRepo.save(medicine);
            }
        }

        return this.findOne(id, userId);
    }

    async remove(id: number, userId: number) {
        const prescription = await this.prescriptionRepo.findOne({ where: { id, userId } });
        if (!prescription) throw new NotFoundException('Prescription not found');
        await this.prescriptionRepo.remove(prescription);
        return { message: 'Prescription deleted' };
    }

    // Admin functions
    async findAllAdmin() {
        return this.prescriptionRepo.find({
            relations: ['medicines', 'user'],
            order: { createdAt: 'DESC' },
        });
    }

    async getStats() {
        const total = await this.prescriptionRepo.count();
        const pending = await this.prescriptionRepo.count({ where: { status: 'pending' } });
        const processed = await this.prescriptionRepo.count({ where: { status: 'processed' } });
        const verified = await this.prescriptionRepo.count({ where: { status: 'verified' } });
        return { total, pending, processed, verified };
    }
}
