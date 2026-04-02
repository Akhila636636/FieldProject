'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating personalized, beginner-friendly project recommendations.
 *
 * - generateProjectRecommendations - A function that takes user interests and returns a user profile summary and 3 project ideas.
 * - GenerateProjectRecommendationsInput - The input type for the generateProjectRecommendations function.
 * - GenerateProjectRecommendationsOutput - The return type for the generateProjectRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProjectRecommendationsInputSchema = z.object({
  interests: z
    .string()
    .describe(
      'A description of the user\'s technical interests, skills, and experience.'
    ),
});
export type GenerateProjectRecommendationsInput = z.infer<
  typeof GenerateProjectRecommendationsInputSchema
>;

const GenerateProjectRecommendationsOutputSchema = z.object({
  userProfile:
    z.string().describe("A simple summary of the user's technical interests, skills, and experience."),
  projectIdeas: z.array(
    z.object({
      title: z.string().describe('The title of the project idea.'),
      description:
        z.string().describe('A brief, beginner-friendly description of the project idea.'),
    })
  ).describe('An array of 3 personalized, beginner-friendly project ideas.'),
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
  prompt: `You are an AI assistant specialized in recommending beginner-friendly programming projects. 
Based on the user's interests, generate a simple user profile summary and then propose 3 project ideas.
Each project idea should be personalized to the user's interests, very beginner-friendly, and include a clear title and a brief description.

User Interests: {{{interests}}}`,
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
