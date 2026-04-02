
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getProjectRecommendations,
  getSimpleChatResponse,
} from "@/app/actions";
import { Header } from "@/components/app/header";
import { ChatForm } from "@/components/app/chat-form";
import { useToast } from "@/hooks/use-toast";
import { ChatDisplay } from "@/components/app/chat-display";
import type {
  GenerateProjectRecommendationsOutput,
  GenerateProjectRecommendationsInput,
} from "@/ai/flows/generate-project-recommendations-flow";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  useFirebase,
  useUser,
  useMemoFirebase,
  addDocumentNonBlocking,
  setDocumentNonBlocking,
  useCollection,
  WithId,
} from "@/firebase";
import {
  collection,
  query,
  orderBy,
  doc,
  serverTimestamp,
  collectionGroup,
  where,
  getDocs,
} from "firebase/firestore";
import type { ProjectRecommendation } from "@/docs/backend-schema";
import { Skeleton } from "@/components/ui/skeleton";

export type ChatMessage = {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp?: any;
  ownerId?: string;
  conversationId?: string;
};

// After this many USER messages, the "Generate" button will appear.
const USER_MESSAGES_THRESHOLD = 2;

function ChatPageSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main
        className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 overflow-y-auto"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-3 justify-start">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="flex items-start gap-3 justify-end">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        </div>
      </main>
      <div className="sticky bottom-0 w-full bg-background/80 backdrop-blur-sm">
         <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-2 space-y-3">
            <Skeleton className="h-12 w-full" />
         </div>
      </div>
    </div>
  );
}


export default function ChatPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialConversationId = searchParams.get('id');
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isGenerationLoading, setIsGenerationLoading] = useState(false);

  const { toast } = useToast();

  // Auth protection: Redirect if not loading and no real user is logged in.
  useEffect(() => {
    // A "real" user has a provider (e.g., password, google.com), not an anonymous one.
    const isRealUser = user && user.providerData.length > 0;
    if (!isUserLoading && !isRealUser) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  // Effect to create a new conversation for the user if no ID is in the URL
  useEffect(() => {
    if (user && firestore && !conversationId) {
      const newConversationRef = addDocumentNonBlocking(
        collection(firestore, `users/${user.uid}/conversations`),
        {
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );
      newConversationRef.then((ref) => {
        if (ref) {
          router.replace(`/chat?id=${ref.id}`, { scroll: false });
          setConversationId(ref.id);
        }
      });
    }
  }, [user, firestore, conversationId, router]);

  // Subscribe to chat messages for the current conversation
  const messagesQuery = useMemoFirebase(
    () =>
      user && conversationId && firestore
        ? query(
            collection(
              firestore,
              `users/${user.uid}/conversations/${conversationId}/messages`
            ),
            orderBy("timestamp", "asc")
          )
        : null,
    [user, conversationId, firestore]
  );
  const { data: chatHistory, isLoading: isMessagesLoading } =
    useCollection<ChatMessage>(messagesQuery);

  // Subscribe to profile summaries for the current conversation
  const profileQuery = useMemoFirebase(
    () =>
      user && conversationId && firestore
        ? query(
            collection(
              firestore,
              `users/${user.uid}/conversations/${conversationId}/profileSummaries`
            )
          )
        : null,
    [user, conversationId, firestore]
  );
  const { data: profileSummaries } = useCollection<any>(profileQuery);

  // Subscribe to project recommendations for the current conversation
  const recommendationsQuery = useMemoFirebase(
    () =>
      user && conversationId && firestore
        ? query(
            collection(
              firestore,
              `users/${user.uid}/conversations/${conversationId}/projectRecommendations`
            ),
            orderBy("order", "asc")
          )
        : null,
    [user, conversationId, firestore]
  );
  const { data: projectRecommendations } =
    useCollection<WithId<ProjectRecommendation>>(recommendationsQuery);


  // Construct the full recommendations object for the UI
  const recommendations = useMemo<GenerateProjectRecommendationsOutput | null>(() => {
    if (!profileSummaries?.[0] || !projectRecommendations) {
      return null;
    }
    const profile = profileSummaries[0];
    return {
      interests: profile.inferredInterests || [],
      skillLevel: profile.summaryText || 'Not specified',
      preferences: profile.preferences || [],
      goals: profile.goals || [],
      projects: projectRecommendations,
    };
  }, [profileSummaries, projectRecommendations]);

  const userMessageCount =
    chatHistory?.filter((msg) => msg.sender === "user").length || 0;

  const canGenerate =
    userMessageCount >= USER_MESSAGES_THRESHOLD &&
    !isChatLoading &&
    !isGenerationLoading;

  const formatChatHistoryForAI = (
    messages: WithId<ChatMessage>[]
  ): GenerateProjectRecommendationsInput["chatHistory"] => {
    return messages.map((message) => ({
      role: message.sender === "user" ? "user" : "model",
      parts: [{ text: message.content }],
    }));
  };

  // Handles submitting messages for the initial information gathering phase
  const handleChatSubmit = async (message: string) => {
    if (!user || !firestore || !conversationId) return;

    const newUserMessage = {
      sender: "user" as const,
      content: message,
      ownerId: user.uid,
      conversationId: conversationId,
      timestamp: serverTimestamp(),
    };

    addDocumentNonBlocking(
      collection(
        firestore,
        `users/${user.uid}/conversations/${conversationId}/messages`
      ),
      newUserMessage
    );

    setIsChatLoading(true);

    const currentChatHistory = [
      ...(chatHistory || []),
      { ...newUserMessage, id: "temp-user" },
    ];
    const response = await getSimpleChatResponse(
      formatChatHistoryForAI(currentChatHistory)
    );

    if (response.error) {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: response.error,
      });
      addDocumentNonBlocking(
        collection(
          firestore,
          `users/${user.uid}/conversations/${conversationId}/messages`
        ),
        {
          sender: "assistant",
          content: `Sorry, an error occurred: ${response.error}`,
          ownerId: user.uid,
          conversationId: conversationId,
          timestamp: serverTimestamp(),
        }
      );
    } else if (response.data) {
      addDocumentNonBlocking(
        collection(
          firestore,
          `users/${user.uid}/conversations/${conversationId}/messages`
        ),
        {
          sender: "assistant",
          content: response.data,
          ownerId: user.uid,
          conversationId: conversationId,
          timestamp: serverTimestamp(),
        }
      );
    }
    setIsChatLoading(false);
  };

  // Handles the "Generate Projects" button click to create recommendations
  const handleGenerateClick = async () => {
    if (!canGenerate || !user || !firestore || !conversationId || !chatHistory)
      return;

    setIsGenerationLoading(true);

    const bookmarkedProjectsQuery = query(
      collectionGroup(firestore, "projectRecommendations"),
      where("ownerId", "==", user.uid),
      where("isBookmarked", "==", true)
    );
    
    const bookmarkedProjectsSnapshot = await getDocs(bookmarkedProjectsQuery);
    const bookmarkedProjects = bookmarkedProjectsSnapshot.docs.map(doc => {
        const data = doc.data();
        return `${data.title} (Tech: ${data.techStack})`;
    });

    const response = await getProjectRecommendations(
      formatChatHistoryForAI(chatHistory),
      bookmarkedProjects
    );

    if (response.error) {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: response.error,
      });
      addDocumentNonBlocking(
        collection(
          firestore,
          `users/${user.uid}/conversations/${conversationId}/messages`
        ),
        {
          sender: "assistant",
          content: `I encountered an error trying to generate projects: ${response.error}`,
          ownerId: user.uid,
          conversationId: conversationId,
          timestamp: serverTimestamp(),
        }
      );
    } else if (response.data) {
      // Add the summary message
      addDocumentNonBlocking(
        collection(
          firestore,
          `users/${user.uid}/conversations/${conversationId}/messages`
        ),
        {
          sender: "assistant",
          content:
            "Here are some project ideas based on our conversation. I've updated your profile and recommendations below.",
          ownerId: user.uid,
          conversationId: conversationId,
          timestamp: serverTimestamp(),
        }
      );

      // Save the profile summary
      const profileSummaryData = {
        ownerId: user.uid,
        conversationId: conversationId,
        summaryText: response.data.skillLevel,
        inferredInterests: response.data.interests,
        preferences: response.data.preferences || [],
        goals: response.data.goals || [],
        updatedAt: serverTimestamp(),
      };
      // Since we want to overwrite previous summaries for this conversation, we use a fixed ID.
      setDocumentNonBlocking(
        doc(
          firestore,
          `users/${user.uid}/conversations/${conversationId}/profileSummaries/main_summary`
        ),
        profileSummaryData,
        { merge: true }
      );

      // Save each project recommendation
      response.data.projects.forEach((project, index) => {
        const projectData = {
          ...project,
          ownerId: user.uid,
          conversationId: conversationId,
          order: index,
          isBookmarked: false,
        };
        // Using set with merge to overwrite existing projects if regenerate is clicked
        setDocumentNonBlocking(
          doc(
            firestore,
            `users/${user.uid}/conversations/${conversationId}/projectRecommendations/project_${index}`
          ),
          projectData,
          { merge: true }
        );
      });
    }
    setIsGenerationLoading(false);
  };

  if (isUserLoading || !user || user.providerData.length === 0) {
    return <ChatPageSkeleton />;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main
        className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 overflow-y-auto"
      >
        <ChatDisplay
          chatHistory={chatHistory || []}
          recommendations={recommendations}
          isLoading={isChatLoading || isMessagesLoading}
        />
      </main>
      <div className="sticky bottom-0 w-full bg-background/80 backdrop-blur-sm">
        <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-2 space-y-3">
          {userMessageCount >= USER_MESSAGES_THRESHOLD && (
            <div className="flex justify-center border-t pt-3">
              <Button
                onClick={handleGenerateClick}
                disabled={!canGenerate}
                size="lg"
              >
                {isGenerationLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "✨ Generate Project Ideas"
                )}
              </Button>
            </div>
          )}
          <ChatForm
            onSubmit={handleChatSubmit}
            isLoading={isChatLoading || isGenerationLoading}
          />
        </div>
      </div>
    </div>
  );
}
