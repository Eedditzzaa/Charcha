import { MessageSquareQuote } from 'lucide-react';

export default function Logo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <div className="flex items-center gap-2 font-serif text-xl font-bold tracking-tight">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-charcha-purple text-white shadow-md shadow-charcha-purple/20">
        <MessageSquareQuote className={className} />
      </div>
      <span className="bg-gradient-to-r from-charcha-purple to-indigo-500 bg-clip-text text-transparent dark:from-white dark:to-charcha-lavender">
        Charcha
      </span>
    </div>
  );
}
