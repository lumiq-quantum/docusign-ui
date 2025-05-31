
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { getDocumentPagePdfUrlAction } from '@/lib/actions'; // This is a sync function now

interface PdfViewerProps {
  proposalId: number;
  documentId: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (newPage: number) => void;
}

export function PdfViewer({ proposalId, documentId, totalPages, currentPage, onPageChange }: PdfViewerProps) {
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Still useful for image load, not API call
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const fetchPageImage = useCallback(() => {
    setIsLoading(true); // For the visual loading state of the image itself
    setError(null);
    
    const result = getDocumentPagePdfUrlAction(proposalId, documentId, currentPage);
    
    if (result.error || !result.url) {
      setError(result.error || "Failed to construct page image URL.");
      setPageImageUrl(null);
      setIsLoading(false); // Stop loading if URL construction fails
    } else {
      setPageImageUrl(result.url);
      // setIsLoading(false) will be handled by Image component's onLoad/onError
    }
  }, [proposalId, documentId, currentPage]);

  useEffect(() => {
    fetchPageImage();
  }, [currentPage, fetchPageImage]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handleImageLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError(`Failed to load image for page ${currentPage}. Check network or API response.`);
    setPageImageUrl(null); // Clear broken image URL
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-2 border-b bg-card rounded-t-lg">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoomLevel <= 0.5 || isLoading}>
                <ZoomOut className="h-4 w-4" />
                <span className="sr-only">Zoom Out</span>
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoomLevel >= 2 || isLoading}>
                <ZoomIn className="h-4 w-4" />
                <span className="sr-only">Zoom In</span>
            </Button>
            <Button variant="outline" size="icon" onClick={handleResetZoom} disabled={zoomLevel === 1 || isLoading}>
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only">Reset Zoom</span>
            </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous Page</span>
          </Button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next Page</span>
          </Button>
        </div>
      </div>

      <div className="p-2 bg-muted/50 rounded-b-lg overflow-auto min-h-[600px] flex items-center justify-center">
        {isLoading && <Skeleton className="w-full h-[700px] max-w-[800px]" data-ai-hint="document page loading" />}
        {error && !isLoading && <div className="text-red-500 text-center py-10">{error}</div>}
        {!isLoading && !error && pageImageUrl && (
          <Image
            src={pageImageUrl}
            alt={`Document Page ${currentPage}`}
            width={800} 
            height={1100} 
            className="shadow-lg border"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: `calc(100vh - 200px)` }}
            data-ai-hint="document page content"
            priority={true} // For LCP
            unoptimized={true} // API serves raw image, no Next.js optimization needed/possible
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
         {!isLoading && !error && !pageImageUrl && (
          <div className="text-muted-foreground text-center py-10">Page content not available or URL construction failed.</div>
        )}
      </div>
    </div>
  );
}
