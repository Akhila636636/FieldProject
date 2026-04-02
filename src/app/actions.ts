"use server";

import {
  generateProjectRecommendations,
  type GenerateProjectRecommendationsOutput,
} from "@/ai/flows/generate-project-recommendations-flow";

export async function getRecommendations(
  message: string
): Promise<{
  data?: GenerateProjectRecommendationsOutput;
  error?: string;
}> {
  if (!message || message.trim().length === 0) {
    return { error: "Message cannot be empty." };
  }

  try {
    const recommendations = await generateProjectRecommendations({
      userMessage: message,
    });

    if (!recommendations.projects || recommendations.projects.length === 0) {
      return { error: "Could not generate recommendations based on your input. Please try being more specific." };
    }

    return { data: recommendations };
  } catch (e) {
    console.error("Error getting recommendations:", e);
    return {
      error: "An unexpected error occurred while communicating with the AI. Please try again later.",
    };
  }
}
