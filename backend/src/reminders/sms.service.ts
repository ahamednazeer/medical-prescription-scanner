import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';

@Injectable()
export class SmsService {
    private client: Twilio.Twilio;
    private fromNumber: string;
    private readonly logger = new Logger(SmsService.name);
    private isConfigured: boolean = false;

    constructor(private configService: ConfigService) {
        const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
        this.fromNumber = this.configService.get('TWILIO_PHONE_NUMBER', '');

        if (accountSid && authToken && this.fromNumber && accountSid.startsWith('AC')) {
            try {
                this.client = Twilio.default(accountSid, authToken);
                this.isConfigured = true;
                this.logger.log('Twilio SMS service configured successfully');
            } catch (e) {
                this.logger.warn('Twilio SMS initialization failed — SMS will be logged but not sent');
            }
        } else {
            this.logger.warn('Twilio SMS not configured — SMS will be logged but not sent');
        }
    }

    async sendReminder(phone: string, medicineName: string, dose: string, time: string, prescriptionId?: number): Promise<boolean> {
        const message = `💊 Medicine Reminder:\n\nTake ${medicineName} ${dose} now\nTime: ${time}\n${prescriptionId ? `Prescription ID: RX${prescriptionId}` : ''}\n\n- Medical Prescription Scanner`;

        if (!this.isConfigured) {
            this.logger.log(`[SMS MOCK] To: ${phone}\n${message}`);
            return true;
        }

        try {
            const result = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: phone,
            });
            this.logger.log(`SMS sent to ${phone}, SID: ${result.sid}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send SMS to ${phone}: ${error.message}`);
            return false;
        }
    }
}
