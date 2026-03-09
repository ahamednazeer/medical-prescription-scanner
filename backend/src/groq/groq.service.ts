import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';

export interface ExtractedMedicine {
    name: string;
    dose: string;
    frequency: string;
    duration: string;
    instructions: string;
}

export interface ExtractionResult {
    rawText: string;
    medicines: ExtractedMedicine[];
    doctorName?: string;
    hospitalName?: string;
    prescriptionDate?: string;
}

@Injectable()
export class GroqService {
    private client: Groq;
    private readonly logger = new Logger(GroqService.name);

    constructor(private configService: ConfigService) {
        this.client = new Groq({
            apiKey: this.configService.get('GROQ_API_KEY'),
        });
    }

    async extractPrescription(imagePath: string): Promise<ExtractionResult> {
        try {
            const absolutePath = path.resolve(imagePath);
            const imageBuffer = fs.readFileSync(absolutePath);
            const base64Image = imageBuffer.toString('base64');

            const ext = path.extname(imagePath).toLowerCase();
            const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp',
                '.gif': 'image/gif',
            };
            const mimeType = mimeMap[ext] || 'image/jpeg';

            const prompt = `You are a medical prescription analysis expert. Analyze this prescription image and extract ALL information.

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just raw JSON):
{
  "rawText": "The full text visible on the prescription",
  "doctorName": "Doctor's name if visible",
  "hospitalName": "Hospital/clinic name if visible",
  "prescriptionDate": "Date on prescription if visible",
  "medicines": [
    {
      "name": "Medicine name",
      "dose": "Dosage (e.g., 500mg, 250mg)",
      "frequency": "How often (e.g., Twice daily, Three times a day, Once daily)",
      "duration": "How long (e.g., 5 days, 1 week, 10 days)",
      "instructions": "Special instructions (e.g., After meals, Before bed, With water)"
    }
  ]
}

Rules:
- Extract EVERY medicine mentioned
- If a field is not visible, use "Not specified"
- Be precise with dosage amounts
- Standardize frequency (e.g., "BD" → "Twice daily", "TDS" → "Three times a day", "OD" → "Once daily")
- Return ONLY the JSON, nothing else`;

            const response = await this.client.chat.completions.create({
                model: this.getModel(),
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`,
                                },
                            },
                        ],
                    },
                ],
                temperature: 0.1,
                max_tokens: 2048,
            });

            const content = response.choices[0]?.message?.content || '';
            this.logger.log(`Groq raw response: ${content.substring(0, 200)}...`);
            return this.parseJsonResponse(content);
        } catch (error) {
            this.logger.error(`Groq extraction failed: ${error.message}`);
            throw error;
        }
    }

    async extractFromText(rawText: string): Promise<ExtractionResult> {
        try {
            const prompt = `You are a medical prescription text parser. You are given OCR text from a handwritten prescription.

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just raw JSON):
{
  "rawText": "The full text visible on the prescription",
  "doctorName": "Doctor's name if visible",
  "hospitalName": "Hospital/clinic name if visible",
  "prescriptionDate": "Date on prescription if visible",
  "medicines": [
    {
      "name": "Medicine name",
      "dose": "Dosage (e.g., 500mg, 250mg)",
      "frequency": "How often (e.g., Twice daily, Three times a day, Once daily)",
      "duration": "How long (e.g., 5 days, 1 week, 10 days)",
      "instructions": "Special instructions (e.g., After meals, Before bed, With water)"
    }
  ]
}

Rules:
- OCR may contain noise; infer carefully but do not hallucinate
- If a field is not visible, use "Not specified"
- Extract every medicine with best-effort dose/frequency/duration
- Standardize frequency abbreviations when clear (BD/TDS/OD etc.)

OCR text:
${rawText}`;

            const response = await this.client.chat.completions.create({
                model: this.getModel(),
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.1,
                max_tokens: 2048,
            });

            const content = response.choices[0]?.message?.content || '';
            this.logger.log(`Groq raw response (text mode): ${content.substring(0, 200)}...`);
            return this.parseJsonResponse(content, rawText);
        } catch (error) {
            this.logger.error(`Groq extraction failed: ${error.message}`);
            throw error;
        }
    }

    private getModel(): string {
        return this.configService.get('GROQ_MODEL', 'llama-4-scout-17b-16e-instruct');
    }

    private parseJsonResponse(content: string, fallbackRawText = 'Not specified'): ExtractionResult {
        let jsonStr = content.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
        }

        const result = JSON.parse(jsonStr);
        return {
            rawText: result.rawText || fallbackRawText,
            doctorName: result.doctorName || 'Not specified',
            hospitalName: result.hospitalName || 'Not specified',
            prescriptionDate: result.prescriptionDate || 'Not specified',
            medicines: Array.isArray(result.medicines) ? result.medicines : [],
        };
    }
}
