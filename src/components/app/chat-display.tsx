import type { Message } from "@/app/page";
import { cn } from "@/lib/utils";
import { Bot, Loader2, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type ChatDisplayProps = {
  messages: Message[];
  isLoading: boolean;
};

export function ChatDisplay({ messages, isLoading }: ChatDisplayProps) {
  if (messages.length === 0 && !isLoading) {
    return (
        <div className="flex justify-center items-center h-full text-muted-foreground">
            <p>Start a conversation by typing a message below.</p>
        </div>
    )
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
          {message.role === "assistant" && (
            <Avatar className="w-8 h-8">
              <AvatarFallback>
                <Bot />
              </AvatarFallback>
            </Avatar>
          )}
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
