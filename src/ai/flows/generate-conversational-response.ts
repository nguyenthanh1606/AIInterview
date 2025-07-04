'use server';

/**
 * @fileOverview Generates a conversational response in a mock interview.
 *
 * - generateConversationalResponse - A function that generates a natural-sounding AI response.
 * - GenerateConversationalResponseInput - The input type for the function.
 * - GenerateConversationalResponseOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateConversationalResponseInputSchema = z.object({
  jobRole: z.string().describe('The job role the user is interviewing for.'),
  previousQuestion: z.string().describe('The question the AI just asked.'),
  userAnswer: z.string().describe("The user's answer to the previous question."),
  nextQuestion: z.string().describe('The next question the AI should ask.'),
  language: z
    .string()
    .optional()
    .default('Vietnamese')
    .describe('The language for the response (e.g., "Vietnamese", "English").'),
});
export type GenerateConversationalResponseInput = z.infer<
  typeof GenerateConversationalResponseInputSchema
>;

const GenerateConversationalResponseOutputSchema = z.object({
  aiResponse: z
    .string()
    .describe('A natural, conversational response that acknowledges the user answer and asks the next question.'),
});
export type GenerateConversationalResponseOutput = z.infer<
  typeof GenerateConversationalResponseOutputSchema
>;

export async function generateConversationalResponse(
  input: GenerateConversationalResponseInput
): Promise<GenerateConversationalResponseOutput> {
  return generateConversationalResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateConversationalResponsePrompt',
  input: {schema: GenerateConversationalResponseInputSchema},
  output: {schema: GenerateConversationalResponseOutputSchema},
  prompt: `You are an expert hiring manager conducting an interview in {{{language}}}.
Your goal is to make the conversation feel natural and engaging.

You just asked the candidate this question for the role of {{{jobRole}}}:
"{{{previousQuestion}}}"

The candidate responded with:
"{{{userAnswer}}}"

Your task is to generate a brief, encouraging, and conversational transition before asking the next question. Acknowledge their answer in 1-2 sentences, then seamlessly introduce the next question.

The next question you need to ask is:
"{{{nextQuestion}}}"

Keep your transition natural and brief. For example:
- "Cảm ơn bạn đã chia sẻ. Điều đó cho tôi một góc nhìn rõ hơn. Bây giờ, chúng ta hãy chuyển sang câu hỏi tiếp theo: {{{nextQuestion}}}"
- "Tôi hiểu rồi. Thật thú vị khi bạn đề cập đến... Tiếp theo, bạn có thể cho tôi biết: {{{nextQuestion}}}"
- "Cảm ơn câu trả lời của bạn. Về chủ đề đó, {{{nextQuestion}}}"

Do not ask for more details unless the next question itself asks for them. Just provide a smooth transition. Your entire output should be just the conversational response containing the next question.`,
});

const generateConversationalResponseFlow = ai.defineFlow(
  {
    name: 'generateConversationalResponseFlow',
    inputSchema: GenerateConversationalResponseInputSchema,
    outputSchema: GenerateConversationalResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
