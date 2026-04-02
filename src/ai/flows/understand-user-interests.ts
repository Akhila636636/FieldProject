'use server';
/**
 * @fileOverview This file defines a Genkit flow to understand a user's technical interests,
 * skills, and experience from their chat message.
 *
 * - understandUserInterests - A function that processes the user's message to extract their technical profile.
 * - UnderstandUserInterestsInput - The input type for the understandUserInterests function.
 * - UnderstandUserInterestsOutput - The return type for the understandUserInterests function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const UnderstandUserInterestsInputSchema = z.object({
  userMessage: z
    .string()
    .describe(
      "The user's chat message describing their technical interests, skills, and experience."
    ),
});
export type UnderstandUserInterestsInput = z.infer<
  typeof UnderstandUserInterestsInputSchema
>;

const UnderstandUserInterestsOutputSchema = z.object({
  inferredInterests: z
    .array(z.string())
    .describe(
      'A list of technical interests inferred from the user\'s message (e.g., "Web Development", "Machine Learning", "Mobile Apps").'
    ),
  inferredSkills: z
    .array(z.string())
    .describe(
      'A list of technical skills inferred from the user\'s message (e.g., "JavaScript", "Python", "React", "Firebase").'
    ),
  inferredExperienceLevel: z
    .string()
    .describe(
      'The user\'s overall technical experience level inferred from the message (e.g., "Beginner", "Intermediate", "Advanced", "No experience").'
    ),
});
export type UnderstandUserInterestsOutput = z.infer<
  typeof UnderstandUserInterestsOutputSchema
>;

export async function understandUserInterests(
  input: UnderstandUserInterestsInput
): Promise<UnderstandUserInterestsOutput> {
  return understandUserInterestsFlow(input);
}

const understandUserInterestsPrompt = ai.definePrompt({
  name: 'understandUserInterestsPrompt',
  input: { schema: UnderstandUserInterestsInputSchema },
  output: { schema: UnderstandUserInterestsOutputSchema },
  prompt: `Analyze the following user message to understand their technical interests, skills, and experience. Extract a list of their inferred interests, a list of their inferred skills, and their overall technical experience level. If the user does not specify an experience level, default to 'Beginner'.

User Message:
{{{userMessage}}}`,
});

const understandUserInterestsFlow = ai.defineFlow(
  {
    name: 'understandUserInterestsFlow',
    inputSchema: UnderstandUserInterestsInputSchema,
    outputSchema: UnderstandUserInterestsOutputSchema,
  },
  async (input) => {
    const { output } = await understandUserInterestsPrompt(input);
    if (!output) {
      throw new Error('Failed to infer user interests.');
    }
    return output;
  }
);
