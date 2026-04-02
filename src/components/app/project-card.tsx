import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Rocket, Cpu, BarChart, Heart, Briefcase, Milestone, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useFirebase, useUser, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  id: string;
  conversationId: string;
  title: string;
  description: string;
  whyItMatchesUser: string;
  techStack: string;
  difficulty: string;
  resumeValue: string;
  roadmap: {
    learn: string;
    buildFirst: string;
    advanced: string;
  };
  isBookmarked?: boolean;
};

export function ProjectCard({ id, conversationId, title, description, whyItMatchesUser, techStack, difficulty, resumeValue, roadmap, isBookmarked }: ProjectCardProps) {
  const { firestore } = useFirebase();
  const { user } = useUser();

  const handleBookmarkToggle = () => {
    if (!user || !firestore || !conversationId || !id) return;

    const projectRef = doc(firestore, `users/${user.uid}/conversations/${conversationId}/projectRecommendations/${id}`);
    updateDocumentNonBlocking(projectRef, {
        isBookmarked: !isBookmarked
    });
  }
  
  return (
    <Card className="transition-all hover:shadow-lg hover:border-primary/30 flex flex-col bg-card/70 relative">
      <CardHeader>
        <CardTitle className="flex items-start gap-3 text-xl font-bold font-headline pr-12">
          <Rocket className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <span>{title}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-muted-foreground hover:text-primary"
          onClick={handleBookmarkToggle}
        >
          <Bookmark className={cn("w-5 h-5 transition-colors", isBookmarked && "fill-primary text-primary")} />
          <span className="sr-only">Bookmark project</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="space-y-2 p-3 bg-background/50 rounded-md border">
          <h4 className="font-semibold flex items-center gap-2 text-sm"><Heart className="w-4 h-4 text-primary" /> Why it's a good match</h4>
          <p className="text-sm">{whyItMatchesUser}</p>
        </div>

        <div className="space-y-2 p-3 bg-background/50 rounded-md border">
          <h4 className="font-semibold flex items-center gap-2 text-sm"><Briefcase className="w-4 h-4 text-primary" /> Resume Value</h4>
          <p className="text-muted-foreground text-sm">{resumeValue}</p>
        </div>

        <div className="space-y-2 p-3 bg-background/50 rounded-md border">
          <h4 className="font-semibold flex items-center gap-2 text-sm"><Milestone className="w-4 h-4 text-primary" /> Project Roadmap</h4>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li><strong className="font-medium text-foreground">1. Learn:</strong> {roadmap.learn}</li>
            <li><strong className="font-medium text-foreground">2. Build First:</strong> {roadmap.buildFirst}</li>
            <li><strong className="font-medium text-foreground">3. Advanced:</strong> {roadmap.advanced}</li>
          </ul>
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

    