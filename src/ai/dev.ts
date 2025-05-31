import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-document-signatures.ts';
import '@/ai/flows/extract-html-from-document.ts';
import '@/ai/flows/generate-signature-analysis-report.ts';