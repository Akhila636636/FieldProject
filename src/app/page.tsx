"use client";

import { useState } from "react";
import { getProjectRecommendations } from "@/app/actions";
import { Header } from "@/components/app/header";
import { ChatForm } from "@/components/app/chat-form";
import { useToast } from "@/hooks/use-toast";
import { RecommendationsDisplay } from "@/components/app/recommendations-display";
import { LoadingSkeleton } from "@/components/app/loading-skeleton";
import type { GenerateProjectRecommendationsOutput } from "@/ai/flows/generate-project-recommendations-flow";
import { Lightbulb } from "lucide-react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GenerateProjectRecommendationsOutput | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (message: string) => {
    setIsLoading(true);
    setResults(null); 

    const response = await getProjectRecommendations(message);

    setIsLoading(false);
    if (response.error) {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: response.error,
      });
    } else if (response.data) {
      setResults(response.data);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        {!isLoading && !results && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 rounded-lg bg-card border">
            <Lightbulb className="w-12 h-12 mb-4 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome to the Project Idea Generator</h2>
            <p>
              Tell me about your interests, skills, and experience level, and I'll suggest some personalized project ideas for you.
            </p>
            <p className="mt-4 text-sm">
                For example: "I'm a beginner interested in web development and music." or "I'm an experienced Python developer who loves machine learning."
            </p>
          </div>
        )}
        {isLoading && <LoadingSkeleton />}
        {results && <RecommendationsDisplay results={results} />}
      </main>
      <div className="sticky bottom-0 w-full bg-background/80 backdrop-blur-sm">
        <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-2">
            <ChatForm 
                onSubmit={handleSubmit} 
                isLoading={isLoading} 
            />
        </div>
      </div>
    </div>
  );
}
