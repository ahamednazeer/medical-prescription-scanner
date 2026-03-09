import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reminder } from './reminder.entity';
import { SmsService } from './sms.service';

@Injectable()
export class RemindersService {
    private readonly logger = new Logger(RemindersService.name);

    constructor(
        @InjectRepository(Reminder)
        private reminderRepo: Repository<Reminder>,
        private smsService: SmsService,
    ) { }

    async create(data: {
        userId: number;
        prescriptionId?: number;
        medicineName: string;
        dose?: string;
        time: string;
        period?: string;
        phone: string;
        frequency?: string;
        duration?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const reminder = this.reminderRepo.create({
            userId: data.userId,
            prescriptionId: data.prescriptionId,
            medicineName: data.medicineName,
            dose: data.dose || '',
            time: data.time,
            period: data.period || this.getPeriodFromTime(data.time),
            phone: data.phone,
            frequency: data.frequency || 'daily',
            duration: data.duration,
            startDate: data.startDate || new Date().toISOString().split('T')[0],
            endDate: data.endDate,
            status: 'active',
        });
        return this.reminderRepo.save(reminder);
    }

    async createFromPrescription(
        userId: number,
        prescriptionId: number,
        phone: string,
        medicines: { name: string; dose: string; frequency: string; duration: string }[],
    ) {
        const reminders: Reminder[] = [];
        for (const med of medicines) {
            const times = this.getTimesFromFrequency(med.frequency);
            for (const time of times) {
                const reminder = await this.create({
                    userId,
                    prescriptionId,
                    medicineName: med.name,
                    dose: med.dose,
                    time,
                    phone,
                    frequency: med.frequency,
                    duration: med.duration,
                });
                reminders.push(reminder);
            }
        }
        return reminders;
    }

    async findByUser(userId: number) {
        return this.reminderRepo.find({
            where: { userId },
            order: { time: 'ASC' },
        });
    }

    async findOne(id: number, userId: number) {
        const reminder = await this.reminderRepo.findOne({ where: { id, userId } });
        if (!reminder) throw new NotFoundException('Reminder not found');
        return reminder;
    }

    async update(id: number, userId: number, data: Partial<Reminder>) {
        const reminder = await this.findOne(id, userId);
        Object.assign(reminder, data);
        return this.reminderRepo.save(reminder);
    }

    async remove(id: number, userId: number) {
        const reminder = await this.findOne(id, userId);
        await this.reminderRepo.remove(reminder);
        return { message: 'Reminder deleted' };
    }

    async triggerReminder(id: number) {
        const reminder = await this.reminderRepo.findOne({ where: { id } });
        if (!reminder || reminder.status !== 'active') return;

        const sent = await this.smsService.sendReminder(
            reminder.phone,
            reminder.medicineName,
            reminder.dose,
            `${reminder.period || reminder.time}`,
            reminder.prescriptionId,
        );

        if (sent) {
            reminder.lastSentAt = new Date().toISOString();
            reminder.sentCount += 1;
            await this.reminderRepo.save(reminder);
        }

        return { sent, reminder };
    }

    // Check reminders every minute
    // @Cron(CronExpression.EVERY_MINUTE) // Uncomment to enable auto-scheduling
    async checkAndSendReminders() {
        const now = new Date();
        const currentTime = now.toTimeString().substring(0, 5); // "HH:MM"

        const reminders = await this.reminderRepo.find({
            where: { status: 'active', time: currentTime },
        });

        this.logger.log(`Checking reminders at ${currentTime}: found ${reminders.length}`);

        for (const reminder of reminders) {
            // Check if already sent today
            if (reminder.lastSentAt) {
                const lastSent = new Date(reminder.lastSentAt);
                if (lastSent.toDateString() === now.toDateString()) {
                    continue; // Already sent today
                }
            }

            // Check end date
            if (reminder.endDate && new Date(reminder.endDate) < now) {
                reminder.status = 'completed';
                await this.reminderRepo.save(reminder);
                continue;
            }

            await this.triggerReminder(reminder.id);
        }
    }

    private getPeriodFromTime(time: string): string {
        const hour = parseInt(time.split(':')[0]);
        if (hour < 12) return 'Morning';
        if (hour < 17) return 'Afternoon';
        return 'Night';
    }

    private getTimesFromFrequency(frequency: string): string[] {
        const freq = frequency.toLowerCase();
        if (freq.includes('once') || freq === 'od') return ['08:00'];
        if (freq.includes('twice') || freq === 'bd') return ['08:00', '20:00'];
        if (freq.includes('three') || freq.includes('thrice') || freq === 'tds') return ['08:00', '14:00', '20:00'];
        if (freq.includes('four') || freq === 'qds') return ['08:00', '12:00', '16:00', '20:00'];
        return ['08:00'];
    }
}
