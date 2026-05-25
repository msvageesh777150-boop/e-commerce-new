import { GoogleGenAI } from '@google/genai';
import { Groq } from 'groq-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize GROQ as Primary
let groqClient: Groq | null = null;
if (process.env.GROQ_API_KEY) {
  try {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  } catch (e) {
    console.warn('Failed to init GROQ API');
  }
}

// Fetch Gemini Keys for Fallback
const geminiKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
  .split(',')
  .map(k => k.trim())
  .filter(Boolean);

export type ChatMessage = { role: 'user' | 'model' | 'system'; content: string };

export const SYSTEM_PROMPT = `
You are ANTIGRAVITY Assistant, an advanced, professional, and friendly AI chatbot for an e-commerce platform.
Your goals:
1. Answer customer questions intelligently, naturally, and professionally.
2. If the user asks about products, orders, coupons, or their account, use the provided context to answer.
3. NEVER say "I don't know", "I am an AI", or show internal errors. If you lack exact info, give a related helpful answer and ask a follow-up question.
4. Maintain a smart e-commerce assistant persona. 
5. Keep answers concise, modern, and friendly.

Here is the current live data context for the user. Use this to provide personalized answers:
`;

export async function generateChatResponse(messages: ChatMessage[], context: string): Promise<string> {
  const fullMessages = [
    { role: 'system' as const, content: SYSTEM_PROMPT + context },
    ...messages
  ];

  // Try GROQ first (Primary)
  if (groqClient) {
    try {
      const groqMessages = fullMessages.map(m => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.content
      }));

      const chatCompletion = await groqClient.chat.completions.create({
        messages: groqMessages as any,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
      });

      if (chatCompletion.choices[0]?.message?.content) {
        return chatCompletion.choices[0].message.content;
      }
    } catch (error) {
      console.error('GROQ API failed, falling back to Gemini:', error);
    }
  }

  // Fallback to Gemini with Round-Robin / Random Key Selection
  if (geminiKeys.length > 0) {
    try {
      // Pick a random key from the pool to load-balance / avoid rate limits
      const randomKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
      const geminiClient = new GoogleGenAI({ apiKey: randomKey });

      const geminiHistory = fullMessages.map(m => ({
        role: m.role === 'system' ? 'user' : m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      
      const response = await geminiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: geminiHistory,
      });

      if (response.text) return response.text;
    } catch (error) {
      console.error('Gemini API fallback failed as well:', error);
    }
  }

  return generateSafeFallback();
}

function generateSafeFallback(): string {
  return "I'm currently processing a lot of requests, but I'm here to help! Could you provide a bit more detail, or would you like to connect with our human support team directly?";
}
