"use server";

import {
  generateProjectRecommendations,
  type GenerateProjectRecommendationsOutput,
  type GenerateProjectRecommendationsInput,
} from "@/ai/flows/generate-project-recommendations-flow";
import { chat as simpleChat, type ChatInput } from "@/ai/flows/simple-chat-flow";


export async function getSimpleChatResponse(
  chatHistory: ChatInput['chatHistory']
): Promise<{ data?: string; error?: string }> {
  if (!chatHistory || chatHistory.length === 0) {
    return { error: "Message history cannot be empty." };
  }

  try {
    const response = await simpleChat({
      chatHistory: chatHistory,
    });

    if (!response || !response.response) {
      return { error: "The AI did not return a response." };
    }

    return { data: response.response };
  } catch (e: any) {
    console.error("Error getting chat response:", e);
    
    // Check if it's a rate limit error (429)
    const errorMessage = e?.message || "";
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("Quota exceeded")) {
      return { error: "The AI is currently overloaded with requests right now. Please wait about a minute and try again!" };
    }

    return {
      error: errorMessage || "An unexpected error occurred while communicating with the AI. Please try again later.",
    };
  }
}

export async function getProjectRecommendations(
  chatHistory: GenerateProjectRecommendationsInput['chatHistory'],
  bookmarkedProjects: string[]
): Promise<{
  data?: GenerateProjectRecommendationsOutput;
  error?: string;
}> {
  if (!chatHistory || chatHistory.length === 0) {
    return { error: "Message history cannot be empty." };
  }

  try {
    const response = await generateProjectRecommendations({
      chatHistory: chatHistory,
      bookmarkedProjects: bookmarkedProjects,
    });

    if (!response || !response.projects || response.projects.length === 0) {
      return { error: "The AI did not return any project recommendations. Try providing more details about your interests." };
    }

    return { data: response };
  } catch (e: any) {
    console.error("Error getting project recommendations:", e);

    // Check if it's a rate limit error (429)
    const errorMessage = e?.message || "";
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("Quota exceeded")) {
      return { error: "The AI is currently overloaded with requests right now. Please wait about a minute and try again!" };
    }

    return {
      error: errorMessage || "An unexpected error occurred while communicating with the AI. Please try again later.",
    };
  }
}
