"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useFirebase,
  useUser,
  updateDocumentNonBlocking,
} from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
} from "firebase/firestore";
import type { BenchmarkProject } from "@/docs/backend-schema";
import type { WithId } from "@/firebase";
import { Header } from "@/components/app/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  TrendingUp,
  HardHat,
  CheckCircle2,
  ThumbsUp,
  Sprout,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SeedGalleryPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [myProjects, setMyProjects] = useState<WithId<BenchmarkProject>[]>([]);
  const [communityProjects, setCommunityProjects] = useState<WithId<BenchmarkProject>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Auth protection
  useEffect(() => {
    const isRealUser = user && user.providerData.length > 0;
    if (!isUserLoading && !isRealUser) {
      router.replace("/");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (!user || !firestore || user.providerData.length === 0) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch the current user's seeded projects
        const myQuery = query(
          collection(firestore, "benchmarkGallery"),
          where("seededByUserId", "==", user.uid)
        );
        const mySnap = await getDocs(myQuery);
        const myData = mySnap.docs.map((d) => ({
          ...(d.data() as BenchmarkProject),
          id: d.id,
        }));
        setMyProjects(myData);

        // Fetch community projects (top by upvotes, excluding own)
        const communityQuery = query(
          collection(firestore, "benchmarkGallery"),
          orderBy("upvotes", "desc"),
          limit(20)
        );
        const communitySnap = await getDocs(communityQuery);
        const communityData = communitySnap.docs
          .map((d) => ({ ...(d.data() as BenchmarkProject), id: d.id }))
          .filter((p) => p.seededByUserId !== user.uid);
        setCommunityProjects(communityData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, firestore]);

  const updateProject = (id: string, changes: Partial<BenchmarkProject>) => {
    setMyProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...changes } : p))
    );
    if (firestore) {
      updateDocumentNonBlocking(doc(firestore, "benchmarkGallery", id), changes);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Seed Gallery
          </h1>
          <p className="text-muted-foreground mt-1">
            Track projects you're building, mark completions, and share recommendations with the community.
          </p>
        </div>

        <Tabs defaultValue="mine" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
            <TabsTrigger value="mine" className="flex items-center gap-2">
              <Sprout className="w-4 h-4" /> My Projects
              {myProjects.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{myProjects.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Community
              {communityProjects.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{communityProjects.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* MY PROJECTS TAB */}
          <TabsContent value="mine">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
              </div>
            ) : myProjects.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent className="flex flex-col items-center gap-4">
                  <HardHat className="w-12 h-12 text-muted-foreground" />
                  <p className="text-muted-foreground text-lg">No projects yet.</p>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    Go to your project recommendations and click <strong>"🚀 I'm Building This"</strong> on any card to track it here.
                  </p>
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    View My Recommendations
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {myProjects.map((bp) => (
                  <Card
                    key={bp.id}
                    className={cn(
                      "flex flex-col justify-between transition-all hover:shadow-lg",
                      bp.isCompleted
                        ? "border-emerald-500/50 bg-emerald-950/10"
                        : "border-primary/20"
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{bp.category}</Badge>
                          {bp.isCompleted && (
                            <Badge className="bg-emerald-600 text-white text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                            </Badge>
                          )}
                          {bp.wouldRecommend && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              <ThumbsUp className="w-3 h-3 mr-1" /> Recommended
                            </Badge>
                          )}
                        </div>
                        <Badge variant="secondary" className="shrink-0 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-primary" /> {bp.upvotes}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-2 leading-tight">{bp.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">{bp.description}</p>

                      {bp.techStack && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Tech: </span>
                          {bp.techStack}
                        </p>
                      )}

                      <Badge
                        variant={
                          bp.difficulty === "Beginner"
                            ? "default"
                            : bp.difficulty === "Intermediate"
                            ? "secondary"
                            : "destructive"
                        }
                        className="w-fit"
                      >
                        {bp.difficulty}
                      </Badge>

                      {/* Progress controls */}
                      <div className="pt-3 border-t border-border/50 space-y-2">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                          Your Progress
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={bp.isCompleted ? "default" : "outline"}
                            className={cn(
                              "flex-1 gap-1 text-xs",
                              bp.isCompleted &&
                                "bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white"
                            )}
                            onClick={() =>
                              updateProject(bp.id, { isCompleted: !bp.isCompleted })
                            }
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {bp.isCompleted ? "Completed ✓" : "Mark Complete"}
                          </Button>
                          <Button
                            size="sm"
                            variant={bp.wouldRecommend ? "default" : "outline"}
                            className={cn(
                              "flex-1 gap-1 text-xs",
                              bp.wouldRecommend &&
                                "bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
                            )}
                            onClick={() =>
                              updateProject(bp.id, {
                                wouldRecommend: !bp.wouldRecommend,
                              })
                            }
                          >
                            <ThumbsUp className="w-3 h-3" />
                            {bp.wouldRecommend ? "Recommended 👍" : "Recommend?"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* COMMUNITY TAB */}
          <TabsContent value="community">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
              </div>
            ) : communityProjects.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent className="flex flex-col items-center gap-4">
                  <Users className="w-12 h-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No community projects yet. Be the first to seed one!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {communityProjects.map((bp) => (
                  <Card
                    key={bp.id}
                    className="hover:border-primary transition-colors flex flex-col justify-between"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{bp.category}</Badge>
                          {bp.wouldRecommend && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              <ThumbsUp className="w-3 h-3 mr-1" /> Recommended
                            </Badge>
                          )}
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-primary" /> {bp.upvotes}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-2 line-clamp-2">{bp.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                        {bp.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            bp.difficulty === "Beginner"
                              ? "default"
                              : bp.difficulty === "Intermediate"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {bp.difficulty}
                        </Badge>
                        {bp.isCompleted && (
                          <span className="text-xs text-emerald-500 font-medium">✓ Completed by creator</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
