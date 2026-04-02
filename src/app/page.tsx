"use client";

import { useState, useEffect, useRef } from "react";
import { getChatResponse } from "@/app/actions";
import { Header } from "@/components/app/header";
import { ChatForm } from "@/components/app/chat-form";
import { useToast } from "@/hooks/use-toast";
import { ChatDisplay } from "@/components/app/chat-display";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (message: string) => {
    setIsLoading(true);
    const newMessages: Message[] = [...messages, { role: "user", content: message }];
    setMessages(newMessages);

    const response = await getChatResponse(message);

    setIsLoading(false);
    if (response.error) {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: response.error,
      });
      setMessages(messages); 
    } else if (response.data) {
      setMessages([...newMessages, { role: "assistant", content: response.data.response }]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main ref={chatContainerRef} className="flex-1 w-full max-w-3xl mx-auto px-4 pt-4 pb-4 overflow-y-auto">
        <ChatDisplay messages={messages} isLoading={isLoading} />
      </main>
      <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-2 bg-background">
         <ChatForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
