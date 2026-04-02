
"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useFirebase,
  useUser,
  useMemoFirebase,
  useCollection,
  WithId,
} from "@/firebase";
import {
  collectionGroup,
  query,
  where,
  limit,
} from "firebase/firestore";
import type {
  ProjectRecommendation,
  UserProfileSummary,
} from "@/docs/backend-schema";
import { Header } from "@/components/app/header";
import { ProjectCard } from "@/components/app/project-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Bookmark,
  Code,
  Paintbrush,
  Star,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function DashboardSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <ProfileSkeleton />
        <div className="space-y-4 mt-8">
          <Skeleton className="h-10 w-[400px]" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
        </div>
      </main>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <Skeleton className="h-7 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectsGrid({ projects, isLoading }: { projects: WithId<ProjectRecommendation>[], isLoading: boolean }) {
  if (isLoading) {
    return (
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>No projects found.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          id={project.id}
          conversationId={project.conversationId}
          title={project.title}
          description={project.description}
          whyItMatchesUser={project.whyItMatchesUser}
          techStack={project.techStack}
          difficulty={project.difficulty}
          resumeValue={project.resumeValue}
          roadmap={project.roadmap}
          isBookmarked={project.isBookmarked}
        />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // Auth protection: Redirect if not loading and no real user is logged in.
  useEffect(() => {
    // A "real" user has a provider (e.g., password, google.com), not an anonymous one.
    const isRealUser = user && user.providerData.length > 0;
    if (!isUserLoading && !isRealUser) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  // Query for the user's most recent profile summary
  const profileQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(
            collectionGroup(firestore, "profileSummaries"),
            where("ownerId", "==", user.uid),
            limit(1)
          )
        : null,
    [user, firestore]
  );
  const { data: profileSummaries, isLoading: isLoadingProfile } =
    useCollection<UserProfileSummary>(profileQuery);
  const userProfile = profileSummaries?.[0];

  // Query for all project recommendations for the user
  const recommendationsQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(
            collectionGroup(firestore, "projectRecommendations"),
            where("ownerId", "==", user.uid)
          )
        : null,
    [user, firestore]
  );
  const { data: allRecommendations, isLoading: isLoadingRecs } =
    useCollection<WithId<ProjectRecommendation>>(recommendationsQuery);

  const sortedRecommendations = useMemo(
    () => allRecommendations?.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).sort((a,b) => a.order - b.order) || [],
    [allRecommendations]
  );

  const bookmarkedProjects = useMemo(
    () => sortedRecommendations?.filter((p) => p.isBookmarked) || [],
    [sortedRecommendations]
  );

  if (isUserLoading || !user || user.providerData.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Your profile and project recommendations at a glance.
          </p>
        </div>

        {isLoadingProfile ? (
          <ProfileSkeleton />
        ) : userProfile ? (
          <Card className="mb-8 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-headline">
                <User className="w-5 h-5 text-primary" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" /> Skill Level
                </h4>
                <Badge variant="secondary">{userProfile.summaryText}</Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4 text-primary" /> Interests
                </h4>
                <div className="flex flex-wrap gap-2">
                  {userProfile.inferredInterests.map((interest) => (
                    <Badge key={interest} variant="outline">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
              {userProfile.preferences && userProfile.preferences.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Paintbrush className="w-4 h-4 text-primary" /> Preferences
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.preferences.map((preference) => (
                      <Badge key={preference} variant="outline">
                        {preference}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {userProfile.goals && userProfile.goals.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" /> Goals
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.goals.map((goal) => (
                      <Badge key={goal} variant="outline">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          !isLoadingProfile && (
            <Card className="mb-8 text-center text-muted-foreground py-12">
              <p>Your profile will appear here after you chat with the AI.</p>
            </Card>
          )
        )}

        <Tabs defaultValue="bookmarked" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="bookmarked">
              <Bookmark className="mr-2 h-4 w-4" /> Bookmarked Projects
            </TabsTrigger>
            <TabsTrigger value="all">All Recommendations</TabsTrigger>
          </TabsList>
          <TabsContent value="bookmarked" className="mt-6">
             <ProjectsGrid projects={bookmarkedProjects} isLoading={isLoadingRecs} />
          </TabsContent>
          <TabsContent value="all" className="mt-6">
            <ProjectsGrid projects={sortedRecommendations || []} isLoading={isLoadingRecs} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
