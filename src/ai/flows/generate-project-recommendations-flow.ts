'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a developer profile and personalized project recommendations.
 *
 * - generateProjectRecommendations - A function that takes a user message and returns their inferred profile and 3 project ideas.
 * - GenerateProjectRecommendationsInput - The input type for the generateProjectRecommendations function.
 * - GenerateProjectRecommendationsOutput - The return type for the generateProjectRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProjectRecommendationsInputSchema = z.object({
  userMessage: z
    .string()
    .describe(
      "A description of the user's technical interests, skills, and experience."
    ),
});
export type GenerateProjectRecommendationsInput = z.infer<
  typeof GenerateProjectRecommendationsInputSchema
>;

const GenerateProjectRecommendationsOutputSchema = z.object({
  interests: z.array(z.string()).describe("A list of the user's inferred technical interests."),
  skillLevel: z.string().describe("The user's inferred skill level (e.g., Beginner, Intermediate, Advanced)."),
  projects: z.array(
    z.object({
      title: z.string().describe('The title of the project idea.'),
      description:
        z.string().describe('A brief, beginner-friendly description of the project idea.'),
      techStack: z.string().describe("A comma-separated list of recommended technologies for the project."),
      difficulty: z.string().describe("The project's difficulty level (e.g., Easy, Medium, Hard)."),
    })
  ).describe('An array of 3 unique and interesting personalized project ideas.'),
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
Based on the user's message, you will first infer their technical interests and skill level.
Then, you will propose 3 unique and interesting project ideas that are personalized to the user.
For each project idea, provide a clear title, a brief description, a recommended tech stack, and a difficulty level.

You must respond ONLY with a valid JSON object that conforms to the output schema. Do not include any other text or formatting.

User Message:
{{{userMessage}}}`,
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
