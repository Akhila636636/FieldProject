
"use client";

import { useMemo } from "react";
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
  orderBy,
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

function ProjectsGrid({ projects }: { projects: WithId<ProjectRecommendation>[] }) {
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
  const { user } = useUser();

  // Query for the user's most recent profile summary
  const profileQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(
            collectionGroup(firestore, "profileSummaries"),
            where("ownerId", "==", user.uid),
            orderBy("updatedAt", "desc"),
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
            where("ownerId", "==", user.uid),
            orderBy("order", "asc")
          )
        : null,
    [user, firestore]
  );
  const { data: allRecommendations, isLoading: isLoadingRecs } =
    useCollection<WithId<ProjectRecommendation>>(recommendationsQuery);

  const bookmarkedProjects = useMemo(
    () => allRecommendations?.filter((p) => p.isBookmarked) || [],
    [allRecommendations]
  );

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
            {isLoadingRecs ? (
              <p>Loading bookmarked projects...</p>
            ) : (
              <ProjectsGrid projects={bookmarkedProjects} />
            )}
          </TabsContent>
          <TabsContent value="all" className="mt-6">
            {isLoadingRecs ? (
              <p>Loading all recommendations...</p>
            ) : (
              <ProjectsGrid projects={allRecommendations || []} />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

    