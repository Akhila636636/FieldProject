import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Rocket, Cpu, BarChart, Heart, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type ProjectCardProps = {
  title: string;
  description: string;
  whyItMatchesUser: string;
  techStack: string;
  difficulty: string;
  resumeValue: string;
};

export function ProjectCard({ title, description, whyItMatchesUser, techStack, difficulty, resumeValue }: ProjectCardProps) {
  return (
    <Card className="transition-all hover:shadow-lg hover:border-primary/30 flex flex-col bg-card/70">
      <CardHeader>
        <CardTitle className="flex items-start gap-3 text-xl font-bold font-headline">
          <Rocket className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <span>{title}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="space-y-2 p-3 bg-background/50 rounded-md border">
          <h4 className="font-semibold flex items-center gap-2 text-sm"><Heart className="w-4 h-4 text-primary" /> Why it's a good match</h4>
          <p className="text-muted-foreground text-sm">{whyItMatchesUser}</p>
        </div>

        <div className="space-y-2 p-3 bg-background/50 rounded-md border">
          <h4 className="font-semibold flex items-center gap-2 text-sm"><Briefcase className="w-4 h-4 text-primary" /> Resume Value</h4>
          <p className="text-muted-foreground text-sm">{resumeValue}</p>
        </div>

        <Separator />

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <div className="flex items-center gap-2">
            <BarChart className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">Difficulty:</span>
            <Badge variant="outline">{difficulty}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">Tech:</span>
             <span className="text-muted-foreground">{techStack}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
