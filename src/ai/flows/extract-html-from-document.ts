'use server';
/**
 * @fileOverview An AI agent that extracts HTML from a document page.
 *
 * - extractHtmlFromDocument - A function that handles the HTML extraction process.
 * - ExtractHtmlFromDocumentInput - The input type for the extractHtmlFromDocument function.
 * - ExtractHtmlFromDocumentOutput - The return type for the extractHtmlFromDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractHtmlFromDocumentInputSchema = z.object({
  documentPageDataUri: z
    .string()
    .describe(
      "A document page, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractHtmlFromDocumentInput = z.infer<typeof ExtractHtmlFromDocumentInputSchema>;

const ExtractHtmlFromDocumentOutputSchema = z.object({
  html: z.string().describe('The extracted HTML content of the document page.'),
});
export type ExtractHtmlFromDocumentOutput = z.infer<typeof ExtractHtmlFromDocumentOutputSchema>;

export async function extractHtmlFromDocument(input: ExtractHtmlFromDocumentInput): Promise<ExtractHtmlFromDocumentOutput> {
  return extractHtmlFromDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractHtmlFromDocumentPrompt',
  input: {schema: ExtractHtmlFromDocumentInputSchema},
  output: {schema: ExtractHtmlFromDocumentOutputSchema},
  prompt: `You are an expert in extracting HTML content from document pages.

  You will receive a document page as input, and your task is to extract the HTML content from it.

  Document Page: {{media url=documentPageDataUri}}

  Extract the HTML content from the document page.`,
});

const extractHtmlFromDocumentFlow = ai.defineFlow(
  {
    name: 'extractHtmlFromDocumentFlow',
    inputSchema: ExtractHtmlFromDocumentInputSchema,
    outputSchema: ExtractHtmlFromDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
