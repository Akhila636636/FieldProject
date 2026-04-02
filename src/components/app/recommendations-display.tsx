import type { GenerateProjectRecommendationsOutput } from "@/ai/flows/generate-project-recommendations-flow";
import { User, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectCard } from "@/components/app/project-card";

type RecommendationsDisplayProps = {
  results: GenerateProjectRecommendationsOutput;
};

export function RecommendationsDisplay({ results }: RecommendationsDisplayProps) {
  return (
    <div className="space-y-8">
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-headline">
            <User className="w-5 h-5 text-primary" />
            Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-card-foreground/90">{results.userProfile}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-2xl font-bold tracking-tight font-headline flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-primary" />
          Project Ideas for You
        </h3>
        <div className="grid gap-4 md:grid-cols-1">
          {results.projectIdeas.map((project, index) => (
            <ProjectCard
              key={index}
              title={project.title}
              description={project.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
