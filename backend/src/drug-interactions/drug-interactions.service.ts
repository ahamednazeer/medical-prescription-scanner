import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type Severity = 'high' | 'medium';

interface InteractionWarning {
    severity: Severity;
    pair: [string, string];
    message: string;
    source: 'openfda';
}

export interface DrugInteractionCheckResult {
    score: number;
    level: 'Good' | 'Caution' | 'High Risk';
    warnings: InteractionWarning[];
    checked: string[];
    unmatched: string[];
    source: 'openfda';
    disclaimer: string;
}

interface OpenFdaLabelResult {
    drug_interactions?: string[];
    drug_interactions_table?: string[];
}

interface OpenFdaResponse {
    results?: OpenFdaLabelResult[];
}

interface CacheValue {
    text: string;
    expiresAt: number;
}

@Injectable()
export class DrugInteractionsService {
    private readonly logger = new Logger(DrugInteractionsService.name);
    private readonly openFdaBaseUrl = 'https://api.fda.gov/drug/label.json';
    private readonly cache = new Map<string, CacheValue>();
    private readonly cacheTtlMs: number;

    constructor(private configService: ConfigService) {
        this.cacheTtlMs = Number(this.configService.get('OPENFDA_CACHE_TTL_MS', '21600000')); // 6h
    }

    async checkInteractions(medicines: string[]): Promise<DrugInteractionCheckResult> {
        const checked = Array.from(
            new Set(
                medicines
                    .map((m) => this.normalizeName(m))
                    .filter((m) => m.length > 0),
            ),
        );

        if (checked.length < 2) {
            return {
                score: 100,
                level: 'Good',
                warnings: [],
                checked,
                unmatched: [],
                source: 'openfda',
                disclaimer:
                    'Data sourced from FDA labeling (openFDA). Use this as a screening aid; always confirm with a clinician.',
            };
        }

        const textsByDrug = new Map<string, string>();
        const unmatched: string[] = [];

        await Promise.all(
            checked.map(async (drug) => {
                const text = await this.fetchDrugInteractionText(drug);
                if (!text) {
                    unmatched.push(drug);
                    return;
                }
                textsByDrug.set(drug, text);
            }),
        );

        const warnings: InteractionWarning[] = [];
        for (let i = 0; i < checked.length; i += 1) {
            for (let j = i + 1; j < checked.length; j += 1) {
                const a = checked[i];
                const b = checked[j];
                const aText = textsByDrug.get(a) || '';
                const bText = textsByDrug.get(b) || '';

                if (!aText && !bText) continue;

                const mentions = this.mentionsDrug(aText, b) || this.mentionsDrug(bText, a);
                if (!mentions) continue;

                const severity = this.detectSeverity(`${aText} ${bText}`);
                warnings.push({
                    severity,
                    pair: [a, b],
                    message:
                        severity === 'high'
                            ? 'Labeling indicates this combination may be high risk. Do not combine without medical advice.'
                            : 'Labeling indicates this combination may need caution or monitoring.',
                    source: 'openfda',
                });
            }
        }

        const high = warnings.filter((w) => w.severity === 'high').length;
        const medium = warnings.filter((w) => w.severity === 'medium').length;
        const score = Math.max(0, 100 - high * 30 - medium * 15);
        const level: DrugInteractionCheckResult['level'] =
            score >= 80 ? 'Good' : score >= 55 ? 'Caution' : 'High Risk';

        return {
            score,
            level,
            warnings,
            checked,
            unmatched: Array.from(new Set(unmatched)),
            source: 'openfda',
            disclaimer:
                'Data sourced from FDA labeling (openFDA). Use this as a screening aid; always confirm with a clinician.',
        };
    }

    private normalizeName(value: string): string {
        return value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    private mentionsDrug(interactionText: string, targetDrug: string): boolean {
        if (!interactionText) return false;
        if (interactionText.includes(targetDrug)) return true;

        // fallback token check for common brand/generic partial matches
        const tokens = targetDrug.split(' ').filter((token) => token.length > 3);
        return tokens.some((token) => interactionText.includes(token));
    }

    private detectSeverity(interactionText: string): Severity {
        const highRiskPatterns = [
            'contraindicated',
            'avoid concomitant',
            'avoid use',
            'serious',
            'life-threatening',
            'fatal',
            'major',
            'significant bleeding',
        ];
        return highRiskPatterns.some((pattern) => interactionText.includes(pattern))
            ? 'high'
            : 'medium';
    }

    private async fetchDrugInteractionText(drug: string): Promise<string> {
        const now = Date.now();
        const fromCache = this.cache.get(drug);
        if (fromCache && fromCache.expiresAt > now) {
            return fromCache.text;
        }

        const escapedDrug = drug.replace(/"/g, '');
        const search = `(openfda.generic_name:"${escapedDrug}"+OR+openfda.brand_name:"${escapedDrug}")+AND+_exists_:drug_interactions`;
        const params = new URLSearchParams({
            search,
            limit: '3',
        });

        const apiKey = this.configService.get<string>('OPENFDA_API_KEY');
        if (apiKey) {
            params.set('api_key', apiKey);
        }

        try {
            const response = await fetch(`${this.openFdaBaseUrl}?${params.toString()}`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
            });
            if (!response.ok) {
                this.logger.warn(`openFDA lookup failed for "${drug}" (${response.status})`);
                return '';
            }

            const payload = (await response.json()) as OpenFdaResponse;
            const results = payload.results || [];
            const chunks: string[] = [];
            results.forEach((entry) => {
                if (Array.isArray(entry.drug_interactions)) {
                    chunks.push(...entry.drug_interactions);
                }
                if (Array.isArray(entry.drug_interactions_table)) {
                    chunks.push(...entry.drug_interactions_table);
                }
            });

            const text = chunks.join(' ').toLowerCase();
            this.cache.set(drug, {
                text,
                expiresAt: now + this.cacheTtlMs,
            });
            return text;
        } catch (error: any) {
            this.logger.warn(`openFDA request error for "${drug}": ${error.message}`);
            return '';
        }
    }
}
