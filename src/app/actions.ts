"use server";

import {
  generateProjectRecommendations,
  type GenerateProjectRecommendationsOutput,
  type GenerateProjectRecommendationsInput,
} from "@/ai/flows/generate-project-recommendations-flow";
import type { Message } from "@/app/page";

// Helper to format the frontend message history for the Genkit flow
function formatChatHistoryForAI(
  messages: Message[]
): GenerateProjectRecommendationsInput["chatHistory"] {
  return messages.map((message) => {
    let content: string;
    if (typeof message.content === "string") {
      content = message.content;
    } else {
      // For assistant messages that are structured objects, create a simple summary for the AI's context.
      content = "I have provided the user with a list of project recommendations.";
    }

    return {
      role: message.role === "user" ? "user" : "model",
      parts: [{ text: content }],
    };
  });
}

export async function getProjectRecommendations(
  messages: Message[]
): Promise<{
  data?: GenerateProjectRecommendationsOutput;
  error?: string;
}> {
  if (!messages || messages.length === 0) {
    return { error: "Message history cannot be empty." };
  }

  try {
    const chatHistory = formatChatHistoryForAI(messages);
    const response = await generateProjectRecommendations({
      chatHistory: chatHistory,
    });

    if (!response || !response.projects || response.projects.length === 0) {
      return { error: "The AI did not return any project recommendations. Try providing more details about your interests." };
    }

    return { data: response };
  } catch (e) {
    console.error("Error getting project recommendations:", e);
    return {
      error: "An unexpected error occurred while communicating with the AI. Please try again later.",
    };
  }
}
