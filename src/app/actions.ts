"use server";

import {
  generateProjectRecommendations,
  type GenerateProjectRecommendationsOutput,
  type GenerateProjectRecommendationsInput,
} from "@/ai/flows/generate-project-recommendations-flow";
import { chat as simpleChat, type ChatInput } from "@/ai/flows/simple-chat-flow";
import { withAiRetryAndFallback } from "@/lib/ai-retry";

async function callGroqChat(chatHistory: ChatInput['chatHistory']) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const messages = chatHistory.map((msg: any) => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.parts.map((p: any) => p.text).join('\n')
  }));

  messages.unshift({
    role: 'system',
    content: "You are a friendly and encouraging AI career coach who helps developers find projects. Your goal is to understand the user's interests, skills, and goals by having a natural conversation. Ask clarifying questions to gather more information. Keep your responses brief and conversational."
  });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: messages
    })
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("RATE_LIMIT_OVERLOAD");
    throw new Error(`Groq API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function getSimpleChatResponse(
  chatHistory: ChatInput['chatHistory'],
  useFallback: boolean = false
): Promise<{ data?: string; error?: string }> {
  if (!chatHistory || chatHistory.length === 0) {
    return { error: "Message history cannot be empty." };
  }

  return withAiRetryAndFallback(
    async () => {
      try {
        const response = await callGroqChat(chatHistory);
        return { data: response };
      } catch (e: any) {
        return { error: e.message || "API Error" };
      }
    },
    {
      useFallbackFn: async () => {
        try {
          const response = await simpleChat({
            chatHistory: chatHistory,
          });

          if (!response || !response.response) {
            return { error: "The AI did not return a response." };
          }
          return { data: response.response };
        } catch (e: any) {
          return { error: e.message || "An unexpected error occurred while communicating with the AI. Please try again later." };
        }
      }
    }
  );
}

async function callGroqRecommendations(chatHistory: any, bookmarkedProjects: string[]) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured.");

  const messages = chatHistory.map((msg: any) => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.parts.map((p: any) => p.text).join('\n')
  }));

  const systemMessage = `Analyze the conversation history. Produce a structured JSON object containing a profile summary and project recommendations. The JSON MUST conform perfectly to the following schema:
{
  "skillLevel": "string",
  "interests": ["string"],
  "preferences": ["string"],
  "goals": ["string"],
  "projects": [
     {
       "title": "string",
       "description": "string",
       "whyItMatchesUser": "string",
       "techStack": "string",
       "difficulty": "Beginner" | "Intermediate" | "Advanced",
       "resumeValue": "string",
       "roadmap": ["string"]
     }
  ]
}
Avoid recommending projects matching these already bookmarked: ${bookmarkedProjects.join(", ")}`;

  messages.unshift({ role: "system", content: systemMessage });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: messages,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("RATE_LIMIT_OVERLOAD");
    throw new Error(`Groq API Error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content;
  return JSON.parse(text);
}


export async function getProjectRecommendations(
  chatHistory: GenerateProjectRecommendationsInput['chatHistory'],
  bookmarkedProjects: string[],
  useFallback: boolean = false
): Promise<{
  data?: GenerateProjectRecommendationsOutput;
  error?: string;
}> {
  if (!chatHistory || chatHistory.length === 0) {
    return { error: "Message history cannot be empty." };
  }

  return withAiRetryAndFallback(
    async () => {
      try {
        const response = await callGroqRecommendations(chatHistory, bookmarkedProjects);
        return { data: response };
      } catch (e: any) {
        return { error: e.message || "API Error" };
      }
    },
    {
      useFallbackFn: async () => {
        try {
          const response = await generateProjectRecommendations({
            chatHistory: chatHistory,
            bookmarkedProjects: bookmarkedProjects,
          });

          if (!response || !response.projects || response.projects.length === 0) {
            return { error: "The AI did not return any project recommendations. Try providing more details about your interests." };
          }

          return { data: response as GenerateProjectRecommendationsOutput };
        } catch (e: any) {
          return { error: e.message || "An unexpected error occurred while communicating with the AI. Please try again later." };
        }
      }
    }
  );
}

