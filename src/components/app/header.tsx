
import { Lightbulb, LayoutDashboard, LogOut, Sprout } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export function Header() {
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight font-headline">
            Project Idea Generator
          </h1>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" passHref>
            <Button variant="ghost">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/seed-gallery" passHref>
            <Button variant="ghost">
              <Sprout className="mr-2 h-4 w-4" />
              Seed Gallery
            </Button>
          </Link>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
