
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wand2, RefreshCw } from 'lucide-react';
import { extractHtmlAction, getDocumentPageHtmlAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface HtmlPreviewProps {
  proposalId: number; 
  documentId: number; 
  currentPage: number;
}

export function HtmlPreview({ proposalId, documentId, currentPage }: HtmlPreviewProps) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For fetching HTML
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false); // For triggering extraction
  const { toast } = useToast();

  const fetchHtmlContent = useCallback(async (pageToFetch: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDocumentPageHtmlAction(proposalId, documentId, pageToFetch);
      if (result.error) {
        setError(result.error);
        // Don't set htmlContent to null if there was a previous successful fetch,
        // unless the error specifically indicates content is gone (e.g. 404 after extraction)
        if (result.html === "<p>HTML content not available for this page.</p>" || !htmlContent) {
             setHtmlContent("<p>No HTML content available for this page.</p>");
        }
      } else {
        setHtmlContent(result.html || "<p>No HTML content available for this page.</p>");
      }
    } catch (e: any) {
      setError("Failed to fetch HTML content: " + e.message);
      setHtmlContent("<p>No HTML content available for this page.</p>");
    } finally {
      setIsLoading(false);
    }
  }, [proposalId, documentId, htmlContent]); // Added htmlContent to dependency

  useEffect(() => {
    fetchHtmlContent(currentPage);
  }, [currentPage, fetchHtmlContent]);

  const handleExtractHtml = async () => {
    setIsExtracting(true);
    setError(null);
    try {
      const result = await extractHtmlAction(proposalId, documentId, currentPage); 
      if (result.error) {
        setError(result.error);
        toast({ title: "Extraction Failed", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Extraction Triggered", description: result.message || "HTML extraction process has been started. Content will refresh shortly." });
        // Automatically refetch HTML after a delay to allow backend processing
        setTimeout(() => fetchHtmlContent(currentPage), 5000); // Increased delay
      }
    } catch (e: any) {
      setError("An unexpected error occurred during HTML extraction: " + e.message);
      toast({ title: "Error", description: "An unexpected error occurred: " + e.message, variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>HTML Preview (Page {currentPage})</CardTitle>
            <CardDescription>AI-generated HTML representation of the current page.</CardDescription>
          </div>
          <Button onClick={handleExtractHtml} disabled={isExtracting || isLoading} size="sm">
            {isExtracting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {htmlContent && htmlContent !== "<p>No HTML content available for this page.</p>" ? "Re-extract HTML" : "Extract HTML"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-h-[200px] max-h-[400px] overflow-y-auto border rounded-md p-4 bg-muted/30">
        {isLoading && <Skeleton className="w-full h-[150px]" />}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!isLoading && !error && htmlContent && (
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="prose dark:prose-invert max-w-none" />
        )}
        {!isLoading && !error && !htmlContent && (
          <div className="text-center text-muted-foreground py-10">
            <p>Click "Extract HTML" to generate a preview, or content may not be available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
