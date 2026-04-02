import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Cpu, BarChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ProjectCardProps = {
  title: string;
  description: string;
  techStack: string;
  difficulty: string;
};

export function ProjectCard({ title, description, techStack, difficulty }: ProjectCardProps) {
  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/20 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <Rocket className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="flex flex-wrap gap-4 text-sm">
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
