
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wand2, RefreshCw } from 'lucide-react';
import { extractHtmlAction, getDocumentPageHtmlViewUrlAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface HtmlPreviewProps {
  proposalId: number; 
  documentId: number; 
  currentPage: number;
}

export function HtmlPreview({ proposalId, documentId, currentPage }: HtmlPreviewProps) {
  const [htmlViewUrl, setHtmlViewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For loading the iframe URL
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false); // For triggering extraction
  const { toast } = useToast();
  const [iframeKey, setIframeKey] = useState(Date.now()); // To force iframe reload

  const prepareHtmlViewUrl = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const result = getDocumentPageHtmlViewUrlAction(proposalId, documentId, currentPage);
    if (result.error || !result.url) {
      setError(result.error || "Failed to construct HTML view URL.");
      setHtmlViewUrl(null);
    } else {
      setHtmlViewUrl(result.url);
      setIframeKey(Date.now()); // Change key to force iframe reload
    }
    // Simulate iframe loading, actual loading is handled by the browser
    setTimeout(() => setIsLoading(false), 500); 
  }, [proposalId, documentId, currentPage]);

  useEffect(() => {
    prepareHtmlViewUrl();
  }, [currentPage, prepareHtmlViewUrl]);

  const handleExtractHtml = async () => {
    setIsExtracting(true);
    setError(null); // Clear previous errors
    try {
      const result = await extractHtmlAction(proposalId, documentId, currentPage); 
      if (result.error) {
        setError(result.error);
        toast({ title: "Extraction Failed", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Extraction Triggered", description: result.message || "HTML extraction process has been started. Content will refresh shortly." });
        // Re-prepare the URL and refresh iframe after a delay
        setTimeout(() => {
          prepareHtmlViewUrl();
        }, 5000); 
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
            <CardDescription>Generated HTML for the current page.</CardDescription>
          </div>
          <Button onClick={handleExtractHtml} disabled={isExtracting || isLoading} size="sm">
            {isExtracting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {htmlViewUrl ? "Re-extract HTML" : "Extract HTML"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-h-[400px] max-h-[600px] overflow-hidden border rounded-md p-0 bg-muted/30">
        {isLoading && <Skeleton className="w-full h-full min-h-[380px]" />}
        {error && !isLoading && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        {!isLoading && !error && htmlViewUrl && (
          <iframe
            key={iframeKey}
            src={htmlViewUrl}
            title={`HTML Preview for Page ${currentPage}`}
            className="w-full h-full min-h-[380px] border-0"
            sandbox="allow-same-origin" // Adjust sandbox attributes as needed for security vs functionality
            data-ai-hint="document page html content"
          />
        )}
        {!isLoading && !error && !htmlViewUrl && (
          <div className="text-center text-muted-foreground py-10 p-4">
            <p>Click "Extract HTML" to generate a preview, or content may not be available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
