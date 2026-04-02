import type { GenerateProjectRecommendationsOutput } from "@/ai/flows/generate-project-recommendations-flow";
import { User, Lightbulb, Star, Code, Paintbrush, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectCard } from "@/components/app/project-card";
import { Badge } from "@/components/ui/badge";

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
        <CardContent className="space-y-4">
            <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2"><Star className="w-4 h-4 text-primary" /> Skill Level</h4>
                <Badge variant="secondary">{results.skillLevel}</Badge>
            </div>
            <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2"><Code className="w-4 h-4 text-primary" /> Interests</h4>
                <div className="flex flex-wrap gap-2">
                    {results.interests.map(interest => (
                        <Badge key={interest} variant="outline">{interest}</Badge>
                    ))}
                </div>
            </div>
            {results.preferences && results.preferences.length > 0 && (
              <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2"><Paintbrush className="w-4 h-4 text-primary" /> Preferences</h4>
                  <div className="flex flex-wrap gap-2">
                      {results.preferences.map(preference => (
                          <Badge key={preference} variant="outline">{preference}</Badge>
                      ))}
                  </div>
              </div>
            )}
            {results.goals && results.goals.length > 0 && (
              <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Goals</h4>
                  <div className="flex flex-wrap gap-2">
                      {results.goals.map(goal => (
                          <Badge key={goal} variant="outline">{goal}</Badge>
                      ))}
                  </div>
              </div>
            )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-2xl font-bold tracking-tight font-headline flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-primary" />
          Project Ideas for You
        </h3>
        <div className="grid gap-6 md:grid-cols-1">
          {results.projects.map((project, index) => (
            <ProjectCard
              key={index}
              title={project.title}
              description={project.description}
              whyItMatchesUser={project.whyItMatchesUser}
              techStack={project.techStack}
              difficulty={project.difficulty}
              resumeValue={project.resumeValue}
              roadmap={project.roadmap}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
