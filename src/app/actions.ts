"use server";

import {
  generateProjectRecommendations,
  type GenerateProjectRecommendationsOutput,
} from "@/ai/flows/generate-project-recommendations-flow";

export async function getProjectRecommendations(
  userMessage: string
): Promise<{
  data?: GenerateProjectRecommendationsOutput;
  error?: string;
}> {
  if (!userMessage || userMessage.trim().length === 0) {
    return { error: "Message cannot be empty." };
  }

  try {
    const response = await generateProjectRecommendations({
      userMessage: userMessage,
    });

    if (!response || !response.projects || response.projects.length === 0) {
      return { error: "The AI did not return any project recommendations." };
    }

    return { data: response };
  } catch (e) {
    console.error("Error getting project recommendations:", e);
    return {
      error: "An unexpected error occurred while communicating with the AI. Please try again later.",
    };
  }
}
