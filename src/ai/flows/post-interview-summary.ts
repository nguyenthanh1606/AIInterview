'use server';

/**
 * @fileOverview Generates a summary of a mock interview, highlighting strengths and areas for improvement.
 *
 * - generateInterviewSummary - A function that generates the interview summary.
 * - GenerateInterviewSummaryInput - The input type for the generateInterviewSummary function.
 * - GenerateInterviewSummaryOutput - The return type for the generateInterviewSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInterviewSummaryInputSchema = z.object({
  interviewTranscript: z
    .string()
    .describe('The transcript of the mock interview.'),
  jobRole: z.string().describe('The job role the user is interviewing for.'),
  cvText: z
    .string()
    .optional()
    .describe("The text content of the user's CV, if provided."),
  language: z
    .string()
    .optional()
    .default('Vietnamese')
    .describe(
      'The language for the summary (e.g., "Vietnamese", "English").'
    ),
});

export type GenerateInterviewSummaryInput = z.infer<
  typeof GenerateInterviewSummaryInputSchema
>;

const GenerateInterviewSummaryOutputSchema = z.object({
  summary: z.string().describe('The AI-generated summary of the interview.'),
});

export type GenerateInterviewSummaryOutput = z.infer<
  typeof GenerateInterviewSummaryOutputSchema
>;

export async function generateInterviewSummary(
  input: GenerateInterviewSummaryInput
): Promise<GenerateInterviewSummaryOutput> {
  return generateInterviewSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInterviewSummaryPrompt',
  input: {schema: GenerateInterviewSummaryInputSchema},
  output: {schema: GenerateInterviewSummaryOutputSchema},
  prompt: `You are an AI career coach providing feedback on a mock interview.

  Based on the interview transcript and the target job role, provide a summary of the candidate's strengths and areas for improvement in {{{language}}}. The summary must be structured with a "Strengths:" section and an "Areas for improvement:" section, with bullet points for each.

  Interview Transcript: {{{interviewTranscript}}}
  Job Role: {{{jobRole}}}
  CV Text (Optional): {{{cvText}}}

  Summary:`,
});

const generateInterviewSummaryFlow = ai.defineFlow(
  {
    name: 'generateInterviewSummaryFlow',
    inputSchema: GenerateInterviewSummaryInputSchema,
    outputSchema: GenerateInterviewSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
