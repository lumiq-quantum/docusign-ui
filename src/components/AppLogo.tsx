import { FileText } from 'lucide-react';
import Link from 'next/link';

export function AppLogo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="DocumentWise Home">
      <FileText className="h-7 w-7 text-primary" />
      <span className="text-xl font-headline font-bold text-foreground">
        DocumentWise
      </span>
    </Link>
  );
}
