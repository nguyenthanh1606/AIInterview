import { config } from 'dotenv';
config();

import '@/ai/flows/post-interview-summary.ts';
import '@/ai/flows/cv-data-extraction.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/transcribe-audio.ts';
