'use server';

/**
 * @fileOverview Generates a signature analysis report in HTML format.
 *
 * - generateSignatureAnalysisReport - A function that generates the signature analysis report.
 * - GenerateSignatureAnalysisReportInput - The input type for the generateSignatureAnalysisReport function.
 * - GenerateSignatureAnalysisReportOutput - The return type for the generateSignatureAnalysisReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSignatureAnalysisReportInputSchema = z.object({
  proposalId: z.string().describe('The ID of the proposal to analyze.'),
  documentIds: z.array(z.string()).describe('The IDs of the documents to analyze.'),
});
export type GenerateSignatureAnalysisReportInput = z.infer<typeof GenerateSignatureAnalysisReportInputSchema>;

const GenerateSignatureAnalysisReportOutputSchema = z.object({
  reportHtml: z.string().describe('The HTML content of the signature analysis report.'),
});
export type GenerateSignatureAnalysisReportOutput = z.infer<typeof GenerateSignatureAnalysisReportOutputSchema>;

export async function generateSignatureAnalysisReport(
  input: GenerateSignatureAnalysisReportInput
): Promise<GenerateSignatureAnalysisReportOutput> {
  return generateSignatureAnalysisReportFlow(input);
}

const generateSignatureAnalysisReportPrompt = ai.definePrompt({
  name: 'generateSignatureAnalysisReportPrompt',
  input: {schema: GenerateSignatureAnalysisReportInputSchema},
  output: {schema: GenerateSignatureAnalysisReportOutputSchema},
  prompt: `You are an AI assistant specializing in generating signature analysis reports.

  Given the proposal ID and document IDs, analyze the documents for signatures and generate an HTML report summarizing the findings.
  The report should include details such as the confidence level of each signature, its location in the document, and any other relevant information.

  Proposal ID: {{{proposalId}}}
  Document IDs: {{#each documentIds}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Please generate the report in HTML format.
`,
});

const generateSignatureAnalysisReportFlow = ai.defineFlow(
  {
    name: 'generateSignatureAnalysisReportFlow',
    inputSchema: GenerateSignatureAnalysisReportInputSchema,
    outputSchema: GenerateSignatureAnalysisReportOutputSchema,
  },
  async input => {
    const {output} = await generateSignatureAnalysisReportPrompt(input);
    return output!;
  }
);
