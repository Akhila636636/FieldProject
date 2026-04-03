'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Header } from '@/components/app/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const surveySchema = z.object({
  techExperience: z.enum(['no-idea', 'have-idea'], {
    required_error: 'Please select your tech experience.',
  }),
  specificTech: z.string().optional(),
  projectGoal: z.enum(['subject-project', 'resume', 'minor-major', 'fun'], {
    required_error: 'Please select your project goal.',
  }),
}).refine(data => {
  if (data.techExperience === 'have-idea' && (!data.specificTech || data.specificTech.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Please enter the technologies you know.",
  path: ["specificTech"],
});

type SurveyFormValues = z.infer<typeof surveySchema>;

export default function NewChatPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      specificTech: '',
    }
  });

  const techExperience = form.watch('techExperience');

  const onSubmit = async (data: SurveyFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to start a chat.',
      });
      return;
    }
    setIsLoading(true);

    try {
      // 1. Create a new conversation
      const conversationRef = await addDocumentNonBlocking(
        collection(firestore, `users/${user.uid}/conversations`),
        {
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      if (!conversationRef) {
        throw new Error('Failed to create conversation.');
      }
      const conversationId = conversationRef.id;

      // 2. Synthesize an initial user message from the survey
      const techExperienceText =
        data.techExperience === 'no-idea'
          ? 'I have no specific tech in mind and am looking for guidance'
          : `I have some technologies I want to use, specifically: ${data.specificTech}`;

      const projectGoalText = {
        'subject-project': 'a subject-based project for school',
        resume: 'a project to put on my resume',
        'minor-major': 'a minor or major project for my degree',
        fun: 'a fun project to work on',
      }[data.projectGoal];

      const initialUserMessage = `Hello! I'm looking to start a new project. To give you some context, ${techExperienceText}. My main goal is to build ${projectGoalText}. Can you start by asking me some questions about my interests?`;
      
      const firstAssistantMessage = `That's great! I can definitely help with that. To get started, could you tell me a little bit about what topics or hobbies you're passionate about? For example, are you into music, gaming, finance, art, or something else?`;

      // 3. Add initial messages to the conversation
      const messagesColRef = collection(
        firestore,
        `users/${user.uid}/conversations/${conversationId}/messages`
      );

      await addDocumentNonBlocking(messagesColRef, {
        sender: 'user',
        content: initialUserMessage,
        ownerId: user.uid,
        conversationId: conversationId,
        timestamp: serverTimestamp(),
      });
      
      await addDocumentNonBlocking(messagesColRef, {
        sender: 'assistant',
        content: firstAssistantMessage,
        ownerId: user.uid,
        conversationId: conversationId,
        timestamp: serverTimestamp(),
      });

      // 4. Redirect to the new chat page
      router.push(`/chat?id=${conversationId}`);
    } catch (error) {
      console.error('Error starting new chat:', error);
      toast({
        variant: 'destructive',
        title: 'Oh no!',
        description: 'Failed to start a new chat session. Please try again.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="w-6 h-6 text-primary" />
              New Project Chat
            </CardTitle>
            <CardDescription>
              First, let's set the stage. A few questions will help me tailor my
              recommendations for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="techExperience"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="font-semibold text-base">
                        Do you have any technology in mind?
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="no-idea" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              No, I'm a complete beginner and need ideas.
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="have-idea" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Yes, I have some languages or frameworks I'd like
                              to use.
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {techExperience === 'have-idea' && (
                  <FormField
                    control={form.control}
                    name="specificTech"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="font-semibold text-base">
                          What technologies do you know?
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. React, Node.js, Python, MongoDB..." 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="projectGoal"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="font-semibold text-base">
                        What's the main goal for this project?
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 p-4 border rounded-md has-[[data-state=checked]]:border-primary">
                            <FormControl>
                              <RadioGroupItem value="resume" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Build a resume project
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 p-4 border rounded-md has-[[data-state=checked]]:border-primary">
                            <FormControl>
                              <RadioGroupItem value="minor-major" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Minor/Major school project
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 p-4 border rounded-md has-[[data-state=checked]]:border-primary">
                            <FormControl>
                              <RadioGroupItem value="subject-project" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Subject-based project
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 p-4 border rounded-md has-[[data-state=checked]]:border-primary">
                            <FormControl>
                              <RadioGroupItem value="fun" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Just for fun!
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Start Chat
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
