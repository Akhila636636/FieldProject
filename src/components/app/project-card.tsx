import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Rocket, Cpu, BarChart, Heart, Briefcase, Milestone, Bookmark, HardHat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useFirebase, useUser, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { doc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [isBuilding, setIsBuilding] = useState(false);
  const [isBuildingLoading, setIsBuildingLoading] = useState(false);

  // Check if user is already building this project
  useEffect(() => {
    if (!user || !firestore || !id) return;
    const checkBuilding = async () => {
      const q = query(
        collection(firestore, "benchmarkGallery"),
        where("seededByUserId", "==", user.uid),
        where("sourceProjectId", "==", id)
      );
      const snap = await getDocs(q);
      setIsBuilding(!snap.empty);
    };
    checkBuilding();
  }, [user, firestore, id]);

  const handleBookmarkToggle = () => {
    if (!user || !firestore || !conversationId || !id) return;
    const projectRef = doc(firestore, `users/${user.uid}/conversations/${conversationId}/projectRecommendations/${id}`);
    updateDocumentNonBlocking(projectRef, {
        isBookmarked: !isBookmarked
    });
  };

  const handleBuildingToggle = async () => {
    if (!user || !firestore || !id) return;
    setIsBuildingLoading(true);
    try {
      const q = query(
        collection(firestore, "benchmarkGallery"),
        where("seededByUserId", "==", user.uid),
        where("sourceProjectId", "==", id)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        // Already seeded — remove it
        for (const docSnap of snap.docs) {
          await deleteDoc(docSnap.ref);
        }
        setIsBuilding(false);
        toast({ title: "Removed from Seed Gallery", description: `"${title}" has been removed from your seed gallery.` });
      } else {
        // Add to seed gallery
        await addDocumentNonBlocking(collection(firestore, "benchmarkGallery"), {
          title,
          description,
          category: techStack.split(",")[0]?.trim() || "General",
          difficulty,
          techStack,
          upvotes: 0,
          seededByUserId: user.uid,
          sourceProjectId: id,
          isBuildingThis: true,
          isCompleted: false,
          wouldRecommend: false,
        });
        setIsBuilding(true);
        toast({ title: "Added to Seed Gallery! 🌱", description: `"${title}" has been added to the community seed gallery.` });
      }
    } finally {
      setIsBuildingLoading(false);
    }
  };

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

        <Button
          variant={isBuilding ? "default" : "outline"}
          size="sm"
          className={cn(
            "w-full gap-2 transition-all",
            isBuilding && "bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white"
          )}
          onClick={handleBuildingToggle}
          disabled={isBuildingLoading}
        >
          <HardHat className="w-4 h-4" />
          {isBuilding ? "✅ I'm Building This!" : "🚀 I'm Building This"}
        </Button>
      </CardContent>
    </Card>
  );
}

    