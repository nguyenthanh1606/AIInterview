import { config } from 'dotenv';
config();

import '@/ai/flows/post-interview-summary.ts';
import '@/ai/flows/cv-data-extraction.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/transcribe-audio.ts';
import '@/ai/flows/generate-interview-questions.ts';
import '@/ai/flows/generate-conversational-response.ts';
