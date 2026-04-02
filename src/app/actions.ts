"use server";

import { chat, type ChatOutput } from "@/ai/flows/simple-chat-flow";

export async function getChatResponse(
  message: string
): Promise<{
  data?: ChatOutput;
  error?: string;
}> {
  if (!message || message.trim().length === 0) {
    return { error: "Message cannot be empty." };
  }

  try {
    const response = await chat({
      message: message,
    });

    if (!response.response) {
      return { error: "The AI did not return a response." };
    }

    return { data: response };
  } catch (e) {
    console.error("Error getting chat response:", e);
    return {
      error: "An unexpected error occurred while communicating with the AI. Please try again later.",
    };
  }
}
