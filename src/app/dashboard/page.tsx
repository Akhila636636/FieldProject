
"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useFirebase,
  useUser,
  WithId,
} from "@/firebase";
import {
  collectionGroup,
  query,
  where,
  limit,
  getDocs,
  collection,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import type {
  ProjectRecommendation,
  UserProfileSummary,
  Conversation,
} from "@/docs/backend-schema";
import { formatDistanceToNow } from "date-fns";
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
  Plus,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const [userProfile, setUserProfile] = useState<UserProfileSummary | null>(null);
  const [allRecommendations, setAllRecommendations] = useState<WithId<ProjectRecommendation>[]>([]);
  const [conversations, setConversations] = useState<WithId<Conversation & {updatedAt: Timestamp}>[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Auth protection: Redirect if not loading and no real user is logged in.
  useEffect(() => {
    // A "real" user has a provider (e.g., password, google.com), not an anonymous one.
    const isRealUser = user && user.providerData.length > 0;
    if (!isUserLoading && !isRealUser) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    // Only run queries if we have a real user and firestore is available
    if (user && user.providerData.length > 0 && firestore) {
      setIsLoadingData(true);
      const fetchDashboardData = async () => {
        try {
          // Profile query
          const profileQuery = query(
            collectionGroup(firestore, "profileSummaries"),
            where("ownerId", "==", user.uid),
            limit(1)
          );
          const profileSnapshot = await getDocs(profileQuery);
          if (!profileSnapshot.empty) {
            setUserProfile(profileSnapshot.docs[0].data() as UserProfileSummary);
          }

          // Recommendations query. Using 'in' operator to leverage the composite index.
          const recommendationsQuery = query(
            collectionGroup(firestore, "projectRecommendations"),
            where("ownerId", "==", user.uid),
            where("isBookmarked", "in", [true, false])
          );
          const recsSnapshot = await getDocs(recommendationsQuery);
          const recs = recsSnapshot.docs.map(doc => ({ ...doc.data() as ProjectRecommendation, id: doc.id }));
          setAllRecommendations(recs);

          // Conversations query
          const convosQuery = query(
            collection(firestore, `users/${user.uid}/conversations`),
            orderBy("updatedAt", "desc"),
            limit(5)
          );
          const convosSnapshot = await getDocs(convosQuery);
          const convos = convosSnapshot.docs.map(doc => ({ ...(doc.data() as Conversation & {updatedAt: Timestamp}), id: doc.id }));
          setConversations(convos);

        } catch (error) {
          console.error("Error fetching dashboard data:", error);
          // Optionally set an error state here to display a message to the user
        } finally {
          setIsLoadingData(false);
        }
      };

      fetchDashboardData();
    } else if (!isUserLoading) {
      // If there's no user and we are not loading the user, there's no data to fetch.
      setIsLoadingData(false);
    }
  }, [user, firestore, isUserLoading]);


  const sortedRecommendations = useMemo(
    () => [...allRecommendations].sort((a, b) => a.order - b.order) || [],
    [allRecommendations]
  );

  const bookmarkedProjects = useMemo(
    () => sortedRecommendations?.filter((p) => p.isBookmarked) || [],
    [sortedRecommendations]
  );

  if (isUserLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Your profile and project recommendations at a glance.
            </p>
          </div>
          <Link href="/new-chat" passHref>
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Start New Chat
            </Button>
          </Link>
        </div>

        {isLoadingData ? (
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
          !isLoadingData && (
            <Card className="mb-8 text-center text-muted-foreground py-12">
              <p>Your profile will appear here after you chat with the AI.</p>
            </Card>
          )
        )}
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-headline">
              <MessageSquare className="w-5 h-5 text-primary" />
              Recent Chats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border"><Skeleton className="h-5 w-48" /> <Skeleton className="h-8 w-20" /></div>
                <div className="flex items-center justify-between p-3 rounded-lg border"><Skeleton className="h-5 w-48" /> <Skeleton className="h-8 w-20" /></div>
              </div>
            ) : conversations.length > 0 ? (
              <ul className="space-y-2">
                {conversations.map((convo) => (
                  <li key={convo.id}>
                    <Link
                      href={`/chat?id=${convo.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="font-medium">Chat Session</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(convo.updatedAt.toDate(), { addSuffix: true })}
                        </p>
                      </div>
                      <span className="text-sm text-primary hover:underline">View &rarr;</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
               <div className="text-center text-muted-foreground py-8">
                <p>No chat history yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="bookmarked" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="bookmarked">
              <Bookmark className="mr-2 h-4 w-4" /> Bookmarked Projects
            </TabsTrigger>
            <TabsTrigger value="all">All Recommendations</TabsTrigger>
          </TabsList>
          <TabsContent value="bookmarked" className="mt-6">
             <ProjectsGrid projects={bookmarkedProjects} isLoading={isLoadingData} />
          </TabsContent>
          <TabsContent value="all" className="mt-6">
            <ProjectsGrid projects={sortedRecommendations || []} isLoading={isLoadingData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

    
