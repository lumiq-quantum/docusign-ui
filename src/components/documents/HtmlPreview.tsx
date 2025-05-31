"use client";

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wand2, RefreshCw } from 'lucide-react';
import { extractHtmlAction, getDocumentPageHtmlAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface HtmlPreviewProps {
  proposalId: string;
  documentId: string;
  currentPage: number; // To link HTML to the current PDF page
}

export function HtmlPreview({ proposalId, documentId, currentPage }: HtmlPreviewProps) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, startExtractingTransition] = useTransition();
  const { toast } = useToast();

  const fetchHtmlContent = useCallback(async (pageToFetch: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDocumentPageHtmlAction(proposalId, documentId, pageToFetch);
      if (result.error) {
        setError(result.error);
        setHtmlContent(null);
      } else {
        setHtmlContent(result.html || "<p>No HTML content available for this page.</p>");
      }
    } catch (e) {
      setError("Failed to fetch HTML content.");
      setHtmlContent(null);
    } finally {
      setIsLoading(false);
    }
  }, [proposalId, documentId]);

  // Fetch HTML when component mounts or current page changes
  useEffect(() => {
    fetchHtmlContent(currentPage);
  }, [currentPage, fetchHtmlContent]);

  const handleExtractHtml = () => {
    startExtractingTransition(async () => {
      setIsLoading(true);
      setError(null);
      setHtmlContent(null); // Clear previous HTML
      try {
        const result = await extractHtmlAction(proposalId, documentId, currentPage);
        if (result.error || !result.html) {
          setError(result.error || "HTML extraction failed.");
          toast({ title: "Extraction Failed", description: result.error || "Could not extract HTML.", variant: "destructive" });
        } else {
          setHtmlContent(result.html);
          toast({ title: "Extraction Successful", description: "HTML content has been generated." });
        }
      } catch (e) {
        setError("An unexpected error occurred during HTML extraction.");
        toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    });
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
            {htmlContent ? "Re-extract HTML" : "Extract HTML"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-h-[200px] max-h-[400px] overflow-y-auto border rounded-md p-4 bg-muted/30">
        {isLoading && <Skeleton className="w-full h-[150px]" />}
        {error && (
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
            <p>Click "Extract HTML" to generate a preview.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
