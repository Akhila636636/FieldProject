"use server";

import {
  generateProjectRecommendations,
  type GenerateProjectRecommendationsOutput,
  type GenerateProjectRecommendationsInput,
} from "@/ai/flows/generate-project-recommendations-flow";
import type { ChatMessage } from "@/app/page";

// Helper to format the frontend message history for the Genkit flow
function formatChatHistoryForAI(
  messages: ChatMessage[]
): GenerateProjectRecommendationsInput["chatHistory"] {
  return messages.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: message.content }],
  }));
}

export async function getProjectRecommendations(
  messages: ChatMessage[]
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
