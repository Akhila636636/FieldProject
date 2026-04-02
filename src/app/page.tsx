"use client";

import { useState } from "react";
import type { GenerateProjectRecommendationsOutput } from "@/ai/flows/generate-project-recommendations-flow";
import { getRecommendations } from "@/app/actions";
import { Header } from "@/components/app/header";
import { ChatForm } from "@/components/app/chat-form";
import { LoadingSkeleton } from "@/components/app/loading-skeleton";
import { RecommendationsDisplay } from "@/components/app/recommendations-display";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GenerateProjectRecommendationsOutput | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (message: string) => {
    setIsLoading(true);
    setResults(null);

    const response = await getRecommendations(message);

    if (response.error) {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: response.error,
      });
    } else if (response.data) {
      setResults(response.data);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col gap-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight font-headline">
              Find Your Next Project
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Describe your coding interests, skills, or what you want to learn, and our AI will suggest the perfect starter projects for you.
            </p>
          </div>

          <ChatForm onSubmit={handleSubmit} isLoading={isLoading} />

          <div className="animate-in fade-in duration-500">
            {isLoading && <LoadingSkeleton />}
            {results && <RecommendationsDisplay results={results} />}
          </div>
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>Powered by DevPath</p>
      </footer>
    </div>
  );
}
