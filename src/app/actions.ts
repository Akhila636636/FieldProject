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
  } catch (e) {
    console.error("Error getting chat response:", e);
    return {
      error: "An unexpected error occurred while communicating with the AI. Please try again later.",
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
  } catch (e) {
    console.error("Error getting project recommendations:", e);
    return {
      error: "An unexpected error occurred while communicating with the AI. Please try again later.",
    };
  }
}
