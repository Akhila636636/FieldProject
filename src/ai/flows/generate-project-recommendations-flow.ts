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
  preferences: z.array(z.string()).describe("Inferred user preferences like 'creative', 'logical', 'design-focused', or 'data-driven' based on the conversation.").optional(),
  goals: z.array(z.string()).describe("Inferred user goals like 'learn a new language', 'build a portfolio piece', or 'find a job' based on the conversation.").optional(),
  projects: z.array(
    z.object({
      title: z.string().describe('The title of the project idea.'),
      description:
        z.string().describe('A brief, beginner-friendly description of the project idea.'),
      whyItMatchesUser: z.string().describe("A short, personalized explanation of why this specific project is a great match for the user's profile (interests, skills, goals). For example: 'This fits you because you enjoy creative work and are interested in AI.'"),
      techStack: z.string().describe("A comma-separated list of recommended technologies for the project."),
      difficulty: z.string().describe("The project's difficulty level (e.g., Easy, Medium, Hard)."),
      resumeValue: z.string().describe("A brief summary of why this project would be valuable to feature on a resume.")
    })
  ).describe('An array of 3-5 unique, creative, and highly personalized project ideas. Avoid generic suggestions like "todo app" or "blog".'),
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
  prompt: `You are a senior AI career coach that helps developers find the perfect project to build.

Your task is to generate highly personalized project recommendations based on a user's conversation history.

**Step 1: Build the User Profile**
First, analyze the entire \`Conversation History\` to create a detailed user profile. Extract the following information:
- **interests**: The user's technical interests (e.g., "Web Development", "Machine Learning").
- **skillLevel**: The user's inferred skill level (e.g., "Beginner", "Intermediate", "Advanced").
- **preferences**: Inferred user preferences (e.g., "creative", "logical", "design-focused", "data-driven").
- **goals**: Inferred user goals (e.g., "learn a new language", "build a portfolio piece", "find a job").

If you cannot confidently infer preferences or goals, do not include them.

**Step 2: Generate Project Recommendations**
Next, using the profile you just built, generate 3 to 5 unique and creative project ideas. These projects must be highly personalized to the user's profile.

**CRITICAL RULE: DO NOT SUGGEST GENERIC PROJECTS.** Avoid ideas like "Todo App," "Blog," "Weather App," or "Simple Calculator" at all costs. The projects must be interesting and demonstrate real-world skills.

For each project, provide the following details:
- **title**: A catchy title for the project.
- **description**: A brief description of what the project is.
- **whyItMatchesUser**: Write a short, personalized explanation for why this project is a great match. Directly reference the user's profile. For example: "This project is perfect for you because you have a preference for creative work and an interest in AI."
- **techStack**: A comma-separated list of recommended technologies.
- **difficulty**: The project's difficulty level (e.g., "Easy", "Medium", "Hard").
- **resumeValue**: Explain why this project would be impressive on a resume and what skills it demonstrates to potential employers.

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
