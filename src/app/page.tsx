
"use client";

import { useState, useRef, useEffect } from "react";
import { getProjectRecommendations } from "@/app/actions";
import { Header } from "@/components/app/header";
import { ChatForm } from "@/components/app/chat-form";
import { useToast } from "@/hooks/use-toast";
import { ChatDisplay } from "@/components/app/chat-display";
import type { GenerateProjectRecommendationsOutput } from "@/ai/flows/generate-project-recommendations-flow";

export type Message = {
  role: "user" | "assistant";
  content: string | GenerateProjectRecommendationsOutput;
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the chat display when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);


  const handleSubmit = async (message: string) => {
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: message }]);

    const response = await getProjectRecommendations(message);

    setIsLoading(false);
    if (response.error) {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: response.error,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, an error occurred: ${response.error}` }]);
    } else if (response.data) {
      setMessages((prev) => [...prev, { role: "assistant", content: response.data }]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main ref={chatContainerRef} className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 overflow-y-auto">
        <ChatDisplay messages={messages} isLoading={isLoading} />
      </main>
      <div className="sticky bottom-0 w-full bg-background/80 backdrop-blur-sm">
        <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-2">
          <ChatForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
