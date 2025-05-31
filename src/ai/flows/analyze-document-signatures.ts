// src/ai/flows/analyze-document-signatures.ts
'use server';

/**
 * @fileOverview Analyzes signatures in uploaded documents.
 *
 * - analyzeDocumentSignatures - A function to start signature analysis on proposal documents.
 * - AnalyzeDocumentSignaturesInput - The input type for the analyzeDocumentSignatures function.
 * - AnalyzeDocumentSignaturesOutput - The return type for the analyzeDocumentSignatures function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeDocumentSignaturesInputSchema = z.object({
  proposalId: z.string().describe('The ID of the proposal to analyze.'),
});
export type AnalyzeDocumentSignaturesInput = z.infer<typeof AnalyzeDocumentSignaturesInputSchema>;

const AnalyzeDocumentSignaturesOutputSchema = z.object({
  status: z.string().describe('The status of the signature analysis.'),
  reportSummary: z.string().optional().describe('A summary of the signature analysis report.'),
});
export type AnalyzeDocumentSignaturesOutput = z.infer<typeof AnalyzeDocumentSignaturesOutputSchema>;

export async function analyzeDocumentSignatures(input: AnalyzeDocumentSignaturesInput): Promise<AnalyzeDocumentSignaturesOutput> {
  return analyzeDocumentSignaturesFlow(input);
}

const analyzeDocumentSignaturesPrompt = ai.definePrompt({
  name: 'analyzeDocumentSignaturesPrompt',
  input: {schema: AnalyzeDocumentSignaturesInputSchema},
  output: {schema: AnalyzeDocumentSignaturesOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing document signatures.
  Your task is to analyze the signatures in the documents associated with proposal ID {{{proposalId}}}.
  Provide a summary of your analysis in the reportSummary field.  If analysis is initiated, set status to "initiated"`,
});

const analyzeDocumentSignaturesFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentSignaturesFlow',
    inputSchema: AnalyzeDocumentSignaturesInputSchema,
    outputSchema: AnalyzeDocumentSignaturesOutputSchema,
  },
  async input => {
    const {output} = await analyzeDocumentSignaturesPrompt(input);
    return output!;
  }
);
