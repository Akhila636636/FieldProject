
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type Auth,
  type AuthError,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." }),
});

type FormValues = z.infer<typeof formSchema>;

async function handleEmailAuthAction(
  auth: Auth,
  action: "signIn" | "signUp",
  data: FormValues
) {
  if (action === "signIn") {
    return signInWithEmailAndPassword(auth, data.email, data.password);
  }
  return createUserWithEmailAndPassword(auth, data.email, data.password);
}

async function handleGoogleSignIn(auth: Auth) {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,36.506,44,30.886,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}


export default function AuthPage() {
  const [isLoading, setIsLoading] = useState<"email" | "google" | false>(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  // A "real" user is one who has signed up with a provider (email, google, etc.)
  // Anonymous users will have an empty providerData array.
  const isRealUser = user && user.providerData.length > 0;

  useEffect(() => {
    // If a user object exists but it's not a "real" user (i.e., it's an old anonymous session),
    // sign them out to force a proper login.
    if (!isUserLoading && user && !isRealUser) {
      signOut(auth);
    }
  }, [user, isUserLoading, auth, isRealUser]);

  useEffect(() => {
    // If a "real" user is logged in, redirect them to the dashboard page.
    if (!isUserLoading && isRealUser) {
      router.replace("/dashboard");
    }
  }, [isRealUser, isUserLoading, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onGoogleSignIn = async () => {
    setIsLoading("google");
    try {
      await handleGoogleSignIn(auth);
      // onAuthStateChanged will handle the redirect via the useEffect hooks.
    } catch (error) {
      const authError = error as AuthError;
      console.error("Google Sign-In Error:", authError);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: authError.code === 'auth/popup-closed-by-user'
            ? 'The sign-in window was closed. Please try again.'
            : authError.message || "An unknown error occurred during Google sign-in.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (
    data: FormValues,
    action: "signIn" | "signUp"
  ) => {
    setIsLoading("email");
    try {
      await handleEmailAuthAction(auth, action, data);
      // onAuthStateChanged will handle the redirect via the useEffect hooks.
    } catch (error) {
      const authError = error as AuthError;
      console.error(authError);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: authError.message || "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show a loading spinner while checking auth state or if a real user is being redirected.
  if (isUserLoading || isRealUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight font-headline">
          Project Idea Generator
        </h1>
      </div>
      <div className="w-full max-w-sm">
        <Button
          variant="outline"
          className="w-full mb-4"
          onClick={onGoogleSignIn}
          disabled={!!isLoading}
        >
          {isLoading === 'google' ? <Loader2 className="animate-spin mr-2" /> : <GoogleIcon />}
          Sign in with Google
        </Button>
        <div className="flex items-center gap-2 my-4">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">OR</span>
          <Separator className="flex-1" />
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <Form {...form}>
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>
                    Sign in to access your projects and profile.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form
                    onSubmit={form.handleSubmit((data) =>
                      handleFormSubmit(data, "signIn")
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Email</Label>
                          <FormControl>
                            <Input
                              placeholder="you@example.com"
                              {...field}
                              type="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Password</Label>
                          <FormControl>
                            <Input
                              placeholder="••••••••"
                              {...field}
                              type="password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={!!isLoading}>
                      {isLoading === 'email' && <Loader2 className="animate-spin mr-2" />}
                      Sign In
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create an Account</CardTitle>
                  <CardDescription>
                    Get started generating amazing project ideas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form
                    onSubmit={form.handleSubmit((data) =>
                      handleFormSubmit(data, "signUp")
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Email</Label>
                          <FormControl>
                            <Input
                              placeholder="you@example.com"
                              {...field}
                              type="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Password</Label>
                          <FormControl>
                            <Input
                              placeholder="••••••••"
                              {...field}
                              type="password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={!!isLoading}>
                      {isLoading === 'email' && <Loader2 className="animate-spin mr-2" />}
                      Sign Up
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Form>
        </Tabs>
      </div>
    </div>
  );
}

    