
import type { ChatMessage } from "@/app/chat/page";
import type { GenerateProjectRecommendationsOutput } from "@/ai/flows/generate-project-recommendations-flow";
import { cn } from "@/lib/utils";
import { Bot, Loader2, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RecommendationsDisplay } from "@/components/app/recommendations-display";
import { Lightbulb } from "lucide-react";
import { useEffect, useRef } from "react";
import type { WithId } from "@/firebase";
import type { ProjectRecommendation } from "@/docs/backend-schema";

export type EnrichedRecommendations = Omit<GenerateProjectRecommendationsOutput, 'projects'> & {
  projects: WithId<ProjectRecommendation>[];
};

type ChatDisplayProps = {
  chatHistory: ChatMessage[];
  recommendations: EnrichedRecommendations | null;
  isLoading: boolean;
};

export function ChatDisplay({ chatHistory, recommendations, isLoading }: ChatDisplayProps) {
  const showWelcomeMessage = chatHistory.length === 0 && !recommendations && !isLoading;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, recommendations, isLoading]);


  return (
    <div className="space-y-6">
      {showWelcomeMessage ? (
         <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 rounded-lg bg-card border">
         <Lightbulb className="w-12 h-12 mb-4 text-primary" />
         <h2 className="text-2xl font-semibold text-foreground mb-2">
           Welcome to the Project Idea Generator
         </h2>
         <p>
           Tell me about your interests, skills, and experience level, and I'll
           suggest some personalized project ideas for you.
         </p>
         <p className="mt-4 text-sm">
           For example: "I'm a beginner interested in web development and music."
           or "I'm an experienced Python developer who loves machine learning."
         </p>
       </div>
      ) : (
        <>
          {chatHistory.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.sender === "assistant" && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    <Bot />
                  </AvatarFallback>
                </Avatar>
              )}
    
              <div
                className={cn(
                  "p-3 rounded-lg max-w-sm md:max-w-md",
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
    
              {message.sender === "user" && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </>
      )}

      {recommendations && (
        <div className="w-full pt-4">
          <RecommendationsDisplay results={recommendations} />
        </div>
      )}

      {isLoading && (
        <div className="flex items-start gap-3 justify-start">
          <Avatar className="w-8 h-8">
            <AvatarFallback>
              <Bot />
            </AvatarFallback>
          </Avatar>
          <div className="p-3 rounded-lg bg-muted flex items-center justify-center">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
