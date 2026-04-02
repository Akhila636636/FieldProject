"use client";

import { useState, useRef, useEffect } from "react";
import { getProjectRecommendations, getSimpleChatResponse } from "@/app/actions";
import { Header } from "@/components/app/header";
import { ChatForm } from "@/components/app/chat-form";
import { useToast } from "@/hooks/use-toast";
import { ChatDisplay } from "@/components/app/chat-display";
import type { GenerateProjectRecommendationsOutput } from "@/ai/flows/generate-project-recommendations-flow";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

interface AppState {
  chatHistory: ChatMessage[];
  lastRecommendation: GenerateProjectRecommendationsOutput | null;
}

// After this many USER messages, the "Generate" button will appear.
const USER_MESSAGES_THRESHOLD = 2;

export default function Home() {
  const [state, setState] = useState<AppState>({
    chatHistory: [],
    lastRecommendation: null,
  });
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isGenerationLoading, setIsGenerationLoading] = useState(false);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the chat display when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [state.chatHistory, state.lastRecommendation, isChatLoading]);

  const userMessageCount = state.chatHistory.filter(
    (msg) => msg.role === "user"
  ).length;

  const canGenerate =
    userMessageCount >= USER_MESSAGES_THRESHOLD &&
    !isChatLoading &&
    !isGenerationLoading;

  // Handles submitting messages for the initial information gathering phase
  const handleChatSubmit = async (message: string) => {
    const newUserMessage: ChatMessage = { role: "user", content: message };
    const newChatHistory = [...state.chatHistory, newUserMessage];

    // When a user starts a new line of conversation, clear old recommendations
    setState({
      chatHistory: newChatHistory,
      lastRecommendation: null,
    });
    setIsChatLoading(true);

    const response = await getSimpleChatResponse(newChatHistory);

    if (response.error) {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: response.error,
      });
      setState((prevState) => ({
        ...prevState,
        chatHistory: [
          ...prevState.chatHistory,
          {
            role: "assistant",
            content: `Sorry, an error occurred: ${response.error}`,
          },
        ],
      }));
    } else if (response.data) {
      const newAssistantMessage: ChatMessage = {
        role: "assistant",
        content: response.data,
      };
      setState((prevState) => ({
        ...prevState,
        chatHistory: [...prevState.chatHistory, newAssistantMessage],
      }));
    }
    setIsChatLoading(false);
  };

  // Handles the "Generate Projects" button click to create recommendations
  const handleGenerateClick = async () => {
    if (!canGenerate) return;

    setIsGenerationLoading(true);
    // Clear previous recommendations before fetching new ones
    setState((prevState) => ({ ...prevState, lastRecommendation: null }));

    const response = await getProjectRecommendations(state.chatHistory);

    if (response.error) {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: response.error,
      });
      const newAssistantMessage: ChatMessage = {
        role: "assistant",
        content: `I encountered an error trying to generate projects: ${response.error}`,
      };
      setState((prevState) => ({
        ...prevState,
        chatHistory: [...prevState.chatHistory, newAssistantMessage],
      }));
    } else if (response.data) {
      const newAssistantMessage: ChatMessage = {
        role: "assistant",
        content:
          "Here are some project ideas based on our conversation. I've updated your profile and recommendations below.",
      };
      setState((prevState) => ({
        ...prevState,
        chatHistory: [...prevState.chatHistory, newAssistantMessage],
        lastRecommendation: response.data,
      }));
    }
    setIsGenerationLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main
        ref={chatContainerRef}
        className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 overflow-y-auto"
      >
        <ChatDisplay
          chatHistory={state.chatHistory}
          recommendations={state.lastRecommendation}
          isLoading={isChatLoading}
        />
      </main>
      <div className="sticky bottom-0 w-full bg-background/80 backdrop-blur-sm">
        <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-2 space-y-3">
          {userMessageCount >= USER_MESSAGES_THRESHOLD && (
            <div className="flex justify-center border-t pt-3">
              <Button
                onClick={handleGenerateClick}
                disabled={!canGenerate}
                size="lg"
              >
                {isGenerationLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "✨ Generate Project Ideas"
                )}
              </Button>
            </div>
          )}
          <ChatForm
            onSubmit={handleChatSubmit}
            isLoading={isChatLoading || isGenerationLoading}
          />
        </div>
      </div>
    </div>
  );
}
