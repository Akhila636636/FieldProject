
import type { Message } from "@/app/page";
import { cn } from "@/lib/utils";
import { Bot, Loader2, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RecommendationsDisplay } from "@/components/app/recommendations-display";
import { Lightbulb } from "lucide-react";

type ChatDisplayProps = {
  messages: Message[];
  isLoading: boolean;
};

export function ChatDisplay({ messages, isLoading }: ChatDisplayProps) {
  if (messages.length === 0 && !isLoading) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            "flex items-start gap-3",
            message.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {message.role === "assistant" && typeof message.content === 'string' && (
            <Avatar className="w-8 h-8">
              <AvatarFallback>
                <Bot />
              </AvatarFallback>
            </Avatar>
          )}

          {typeof message.content === 'string' ? (
             <div
             className={cn(
               "p-3 rounded-lg max-w-sm md:max-w-md",
               message.role === "user"
                 ? "bg-primary text-primary-foreground"
                 : "bg-muted"
             )}
           >
             <p className="whitespace-pre-wrap">{message.content}</p>
           </div>
          ) : (
            <div className="w-full">
                <RecommendationsDisplay results={message.content} />
            </div>
          )}

          {message.role === "user" && (
            <Avatar className="w-8 h-8">
              <AvatarFallback>
                <User />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}
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
    </div>
  );
}
