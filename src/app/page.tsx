"use client";

import { useState, useRef, useEffect } from "react";
import { getProjectRecommendations } from "@/app/actions";
import { Header } from "@/components/app/header";
import { ChatForm } from "@/components/app/chat-form";
import { useToast } from "@/hooks/use-toast";
import { ChatDisplay } from "@/components/app/chat-display";
import type { GenerateProjectRecommendationsOutput } from "@/ai/flows/generate-project-recommendations-flow";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

interface AppState {
  chatHistory: ChatMessage[];
  lastRecommendation: GenerateProjectRecommendationsOutput | null;
  isLoading: boolean;
}

export default function Home() {
  const [state, setState] = useState<AppState>({
    chatHistory: [],
    lastRecommendation: null,
    isLoading: false,
  });
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the chat display when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [state.chatHistory, state.lastRecommendation]);


  const handleSubmit = async (message: string) => {
    const newUserMessage: ChatMessage = { role: "user", content: message };
    
    const newChatHistory = [...state.chatHistory, newUserMessage];

    // Update state with new user message and set loading
    setState(prevState => ({
      ...prevState,
      chatHistory: newChatHistory,
      isLoading: true,
    }));

    const response = await getProjectRecommendations(newChatHistory);

    if (response.error) {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: response.error,
      });
      setState(prevState => ({
        ...prevState,
        chatHistory: [...prevState.chatHistory, { role: "assistant", content: `Sorry, an error occurred: ${response.error}` }],
        isLoading: false,
      }));
    } else if (response.data) {
      setState(prevState => ({
        chatHistory: [...prevState.chatHistory, { role: "assistant", content: "Here are some project ideas based on our conversation. I've updated your profile and recommendations below." }],
        lastRecommendation: response.data,
        isLoading: false,
      }));
    } else {
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main ref={chatContainerRef} className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 overflow-y-auto">
        <ChatDisplay 
          chatHistory={state.chatHistory} 
          recommendations={state.lastRecommendation} 
          isLoading={state.isLoading} 
        />
      </main>
      <div className="sticky bottom-0 w-full bg-background/80 backdrop-blur-sm">
        <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-2">
          <ChatForm onSubmit={handleSubmit} isLoading={state.isLoading} />
        </div>
      </div>
    </div>
  );
}
