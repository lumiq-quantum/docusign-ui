
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDocumentPagePdfUrlAction } from '@/lib/actions'; 

interface PdfViewerProps {
  proposalId: number;
  documentId: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (newPage: number) => void; // Kept for potential future use, though not used by internal controls now
}

export function PdfViewer({ proposalId, documentId, totalPages, currentPage, onPageChange }: PdfViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  const fetchPagePdfUrl = useCallback(() => {
    setIsLoading(true); 
    setError(null);
    
    const result = getDocumentPagePdfUrlAction(proposalId, documentId, currentPage);
    
    if (result.error || !result.url) {
      setError(result.error || "Failed to construct page PDF URL.");
      setPdfUrl(null);
      setIsLoading(false); 
    } else {
      setPdfUrl(result.url);
      // setIsLoading(false) will be handled by object's onload/onerror or iframe might not have reliable one
      // For simplicity, we'll set loading to false after a short delay or assume it loads quickly.
      // A more robust solution for iframe/object loading state is complex.
      setTimeout(() => setIsLoading(false), 500); // Simulate load complete
    }
  }, [proposalId, documentId, currentPage]);

  useEffect(() => {
    fetchPagePdfUrl();
  }, [currentPage, fetchPagePdfUrl]);

  return (
    <div className="space-y-4">
      {/* Pagination controls removed from here */}
      <div className="p-2 bg-muted/50 rounded-lg min-h-[600px] flex items-center justify-center border">
        {isLoading && <Skeleton className="w-full h-[700px] max-w-[800px]" data-ai-hint="document page loading" />}
        {error && !isLoading && <div className="text-red-500 text-center py-10">{error}</div>}
        {!isLoading && !error && pdfUrl && (
          <object
            data={pdfUrl}
            type="application/pdf"
            width="100%"
            height="700px" // Adjust height as needed
            className="shadow-lg" // Removed border as parent has one
            aria-label={`Document Page ${currentPage} PDF`}
            data-ai-hint="document page content pdf"
          >
            <p className="p-4 text-center">
              It appears your browser does not support embedding PDFs. 
              You can <a href={pdfUrl} download className="underline text-primary">download the PDF</a> instead.
            </p>
          </object>
        )}
         {!isLoading && !error && !pdfUrl && (
          <div className="text-muted-foreground text-center py-10">Page content not available or URL construction failed.</div>
        )}
      </div>
    </div>
  );
}

