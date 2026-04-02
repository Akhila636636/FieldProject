"use server";

import { understandUserInterests } from "@/ai/flows/understand-user-interests";
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
    const userInterests = await understandUserInterests({ userMessage: message });

    const interestsString = `The user describes themselves as a ${
      userInterests.inferredExperienceLevel
    }. Their interests include: ${userInterests.inferredInterests.join(
      ", "
    )}. They have the following skills: ${userInterests.inferredSkills.join(", ")}.`;

    const recommendations = await generateProjectRecommendations({
      interests: interestsString,
    });

    if (!recommendations.userProfile || recommendations.projectIdeas.length === 0) {
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
