import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;

export const getGeminiClient = (): GoogleGenerativeAI | null => {
  if (!geminiApiKey || geminiApiKey.includes('your-gemini')) {
    return null;
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(geminiApiKey);
  }

  return genAI;
};
