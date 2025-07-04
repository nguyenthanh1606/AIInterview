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
  summary: z
    .string()
    .describe(
      'A summary of the interview in the specified language, structured with a "Strengths:" section and an "Areas for improvement:" section, with bullet points for each.'
    ),
  competencyRatings: z
    .array(
      z.object({
        competency: z
          .string()
          .describe(
            "The name of the competency being evaluated (e.g., 'Communication', 'Problem Solving')."
          ),
        rating: z
          .number()
          .min(1)
          .max(10)
          .describe('A numerical rating from 1 to 10 for the competency.'),
        justification: z
          .string()
          .describe(
            'A brief justification for the given rating, based on the interview transcript.'
          ),
      })
    )
    .describe(
      "A list of competency ratings based on the candidate's performance."
    ),
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
  prompt: `You are an AI career coach providing feedback on a mock interview in {{{language}}}.

Based on the interview transcript, the candidate's CV, and the target job role, please provide:

1.  **A written summary:** This summary must be structured with a "Strengths:" section and an "Areas for improvement:" section, using bullet points for each. The feedback should be constructive and actionable.
2.  **A competency evaluation:** Rate the candidate on a scale of 1 to 10 for each of the following competencies:
    *   Giao tiếp (Communication)
    *   Giải quyết vấn đề (Problem Solving)
    *   Kiến thức chuyên môn (Technical Knowledge)
    *   Sự phù hợp với vai trò (Role Fit)

    For each competency, provide a numerical rating and a brief justification for your score based on specific examples from the interview.

Interview Transcript:
{{{interviewTranscript}}}

Job Role: {{{jobRole}}}

CV Text (Optional):
{{{cvText}}}
`,
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
