'use server';
/**
 * @fileOverview A simple chat flow for conversational interaction.
 *
 * - chat - A function that takes conversation history and returns a text response.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({ text: z.string() })),
});

const ChatInputSchema = z.object({
  chatHistory: z
    .array(MessageSchema)
    .describe('The full conversation history between the user and the AI.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The AI response.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: { schema: ChatInputSchema },
  output: { schema: ChatOutputSchema },
  prompt: `You are a friendly and encouraging AI career coach who helps developers find projects. Your goal is to understand the user's interests, skills, and goals by having a natural conversation. Ask clarifying questions to gather more information. Keep your responses brief and conversational.

Conversation History:
{{#each chatHistory}}
{{this.role}}: {{#each this.parts}}{{this.text}}{{/each}}
{{/each}}`,
});

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { output } = await chatPrompt(input);
    return output!;
  }
);
