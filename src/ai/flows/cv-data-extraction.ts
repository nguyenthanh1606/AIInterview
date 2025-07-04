'use server';

/**
 * @fileOverview A flow to extract data from a CV.
 *
 * - extractCvData - A function that handles the CV data extraction process.
 * - CvDataExtractionInput - The input type for the extractCvData function.
 * - CvDataExtractionOutput - The return type for the extractCvData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CvDataExtractionInputSchema = z.object({
  cvDataUri: z
    .string()
    .describe(
      "The CV file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type CvDataExtractionInput = z.infer<typeof CvDataExtractionInputSchema>;

const CvDataExtractionOutputSchema = z.object({
  name: z.string().describe('The name of the candidate.'),
  email: z.string().describe('The email address of the candidate.'),
  phone: z.string().describe('The phone number of the candidate.'),
  skills: z.array(z.string()).describe('A list of skills of the candidate.'),
  experience: z
    .array(
      z.object({
        title: z.string().describe('The job title.'),
        company: z.string().describe('The company name.'),
        years: z.string().describe('The years of employment.'),
        description: z.string().describe('The job description.'),
      })
    )
    .describe('A list of the candidate past job experiences.'),
  education: z
    .array(
      z.object({
        degree: z.string().describe('The degree name.'),
        university: z.string().describe('The university name.'),
        years: z.string().describe('The years of attendance.'),
      })
    )
    .describe('A list of the candidate education history.'),
});
export type CvDataExtractionOutput = z.infer<typeof CvDataExtractionOutputSchema>;

export async function extractCvData(input: CvDataExtractionInput): Promise<CvDataExtractionOutput> {
  return extractCvDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cvDataExtractionPrompt',
  input: {schema: CvDataExtractionInputSchema},
  output: {schema: CvDataExtractionOutputSchema},
  prompt: `You are an expert CV parser. You will extract the following information from the CV: name, email, phone, skills, experience, and education.

CV: {{media url=cvDataUri}}`,
});

const extractCvDataFlow = ai.defineFlow(
  {
    name: 'extractCvDataFlow',
    inputSchema: CvDataExtractionInputSchema,
    outputSchema: CvDataExtractionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
