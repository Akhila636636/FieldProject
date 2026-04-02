'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a developer profile and personalized project recommendations based on a conversation.
 *
 * - generateProjectRecommendations - A function that takes a conversation history and returns an inferred profile and 3 project ideas.
 * - GenerateProjectRecommendationsInput - The input type for the generateProjectRecommendations function.
 * - GenerateProjectRecommendationsOutput - The return type for the generateProjectRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({ text: z.string() })),
});

const GenerateProjectRecommendationsInputSchema = z.object({
  chatHistory: z
    .array(MessageSchema)
    .describe('The full conversation history between the user and the AI.'),
});
export type GenerateProjectRecommendationsInput = z.infer<
  typeof GenerateProjectRecommendationsInputSchema
>;

const GenerateProjectRecommendationsOutputSchema = z.object({
  interests: z.array(z.string()).describe("A list of the user's inferred technical interests from the conversation."),
  skillLevel: z.string().describe("The user's inferred skill level (e.g., Beginner, Intermediate, Advanced) from the conversation."),
  projects: z.array(
    z.object({
      title: z.string().describe('The title of the project idea.'),
      description:
        z.string().describe('A brief, beginner-friendly description of the project idea.'),
      techStack: z.string().describe("A comma-separated list of recommended technologies for the project."),
      difficulty: z.string().describe("The project's difficulty level (e.g., Easy, Medium, Hard)."),
    })
  ).describe('An array of 3 unique and interesting personalized project ideas based on the entire conversation.'),
});
export type GenerateProjectRecommendationsOutput = z.infer<
  typeof GenerateProjectRecommendationsOutputSchema
>;

export async function generateProjectRecommendations(
  input: GenerateProjectRecommendationsInput
): Promise<GenerateProjectRecommendationsOutput> {
  return generateProjectRecommendationsFlow(input);
}

const projectRecommendationPrompt = ai.definePrompt({
  name: 'projectRecommendationPrompt',
  input: { schema: GenerateProjectRecommendationsInputSchema },
  output: { schema: GenerateProjectRecommendationsOutputSchema },
  prompt: `You are an AI assistant specialized in recommending programming projects.
Analyze the entire conversation history provided below to infer the user's technical interests and skill level.
Based on this analysis, propose 3 unique and interesting project ideas that are personalized to the user.

You must respond ONLY with a valid JSON object that conforms to the output schema. Do not include any other text or formatting.

Conversation History:
{{#each chatHistory}}
{{this.role}}: {{#each this.parts}}{{this.text}}{{/each}}
{{/each}}
`,
});

const generateProjectRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateProjectRecommendationsFlow',
    inputSchema: GenerateProjectRecommendationsInputSchema,
    outputSchema: GenerateProjectRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await projectRecommendationPrompt(input);
    return output!;
  }
);
