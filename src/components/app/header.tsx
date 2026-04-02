import { Lightbulb } from 'lucide-react';

export function Header() {
  return (
    <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="max-w-3xl mx-auto flex items-center gap-2">
        <Lightbulb className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight font-headline">
          Project Idea Generator
        </h1>
      </div>
    </header>
  );
}
