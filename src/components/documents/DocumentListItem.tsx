
import Link from 'next/link';
import type { Document } from '@/types';
import { FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DocumentListItemProps {
  proposalId: number; // Changed from string
  document: Document;
}

export function DocumentListItem({ proposalId, document }: DocumentListItemProps) {
  const formattedDate = new Date(document.uploadedAt).toLocaleDateString();
  // Size is no longer in Document type as per API, remove if not re-added
  // const fileSize = (document.size / (1024 * 1024)).toFixed(2) + ' MB'; 

  // Check if any page has HTML content
  const hasExtractedHtml = document.pages && document.pages.some(page => !!page.htmlContent);

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <Link href={`/proposals/${proposalId}/documents/${document.id}`} className="font-medium text-foreground hover:underline">
            {document.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {/* Uploaded: {formattedDate} | Size: {fileSize} | Pages: {document.totalPages} */}
            Uploaded: {formattedDate} | Pages: {document.totalPages}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {hasExtractedHtml && (
           <Badge variant="secondary">HTML Extracted</Badge>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link href={`/proposals/${proposalId}/documents/${document.id}`}>
            <Eye className="mr-1 h-4 w-4" /> View
          </Link>
        </Button>
      </div>
    </div>
  );
}
