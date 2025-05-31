"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { getDocumentPagePdfUrlAction } from '@/lib/actions'; // Using action to get URL

interface PdfViewerProps {
  proposalId: string;
  documentId: string;
  totalPages: number;
  currentPage: number;
  onPageChange: (newPage: number) => void;
}

export function PdfViewer({ proposalId, documentId, totalPages, currentPage, onPageChange }: PdfViewerProps) {
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const fetchPageImage = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDocumentPagePdfUrlAction(proposalId, documentId, page);
      if (result.error || !result.url) {
        setError(result.error || "Failed to load page image.");
        setPageImageUrl(null);
      } else {
        setPageImageUrl(result.url);
      }
    } catch (e) {
      console.error("PdfViewer fetch error:", e);
      setError("An unexpected error occurred.");
      setPageImageUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [proposalId, documentId]);

  useEffect(() => {
    fetchPageImage(currentPage);
  }, [currentPage, fetchPageImage]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-2 border-b bg-card rounded-t-lg">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
                <ZoomOut className="h-4 w-4" />
                <span className="sr-only">Zoom Out</span>
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoomLevel >= 2}>
                <ZoomIn className="h-4 w-4" />
                <span className="sr-only">Zoom In</span>
            </Button>
            <Button variant="outline" size="icon" onClick={handleResetZoom} disabled={zoomLevel === 1}>
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
        {isLoading && <Skeleton className="w-full h-[700px] max-w-[800px]" data-ai-hint="document page" />}
        {error && <div className="text-red-500 text-center py-10">{error}</div>}
        {!isLoading && !error && pageImageUrl && (
          <Image
            src={pageImageUrl}
            alt={`Document Page ${currentPage}`}
            width={800 * zoomLevel} // Base width, adjust as needed
            height={1100 * zoomLevel} // Base height, adjust as needed
            className="shadow-lg border"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
            data-ai-hint="document page"
            priority={true} // Load current page image with priority
          />
        )}
         {!isLoading && !error && !pageImageUrl && (
          <div className="text-muted-foreground text-center py-10">Page content not available.</div>
        )}
      </div>
    </div>
  );
}
