
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Signature } from '@/types';
import { getSignatureImageUrlAction } from '@/lib/actions'; // This is a sync function now
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Maximize } from 'lucide-react';

interface SignatureViewerProps {
  proposalId: number; 
  signatures: Signature[];
}

export function SignatureViewer({ proposalId, signatures }: SignatureViewerProps) {
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false); // For image loading itself
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    if (selectedSignature) {
      setIsLoadingImage(true); // For the new image load if signature changes
      setImageUrl(null); // Clear previous image
      setError(null);
      
      const result = getSignatureImageUrlAction(proposalId, selectedSignature.id);
      
      if (result.imageUrl) {
        setImageUrl(result.imageUrl);
        // isLoadingImage will be set to false by Image's onLoad or onError
      } else {
        setError(result.error || "Image URL could not be constructed.");
        setImageUrl(null); 
        setIsLoadingImage(false);
      }
    } else {
      setImageUrl(null);
      setError(null);
      setIsLoadingImage(false);
    }
  }, [selectedSignature, proposalId]);

  const handleImageLoad = () => {
    setIsLoadingImage(false);
    setError(null);
  };

  const handleImageError = () => {
    setIsLoadingImage(false);
    setError(`Failed to load signature image for ID ${selectedSignature?.id}.`);
    setImageUrl(null);
  };

  if (!signatures || signatures.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Signatures</CardTitle>
                <CardDescription>Detected signatures on this page.</CardDescription>
            </CardHeader>
            <CardContent>
                 <p className="text-sm text-muted-foreground text-center py-4">No signatures detected on this page or analysis not run/completed.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Signatures (Page Context)</CardTitle>
            <CardDescription>Click a signature to view its cropped image.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {signatures.map((sig, index) => (
                <Button
                    key={sig.id}
                    variant={selectedSignature?.id === sig.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSignature(sig)}
                    className="truncate"
                >
                    Signature {index + 1}
                </Button>
                ))}
            </div>

            {selectedSignature && (
                <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-2">Viewing Signature {signatures.findIndex(s => s.id === selectedSignature.id) + 1}</h4>
                {isLoadingImage && <Skeleton className="w-full h-[100px] rounded-md" data-ai-hint="signature image loading" />}
                {!isLoadingImage && imageUrl && (
                    <div className="relative group bg-white inline-block">
                        <Image 
                          src={imageUrl} 
                          alt={`Signature ${selectedSignature.id}`} 
                          width={200} height={80} 
                          className="border" data-ai-hint="signature image content" 
                          unoptimized={true} // API serves raw image
                          onLoad={handleImageLoad}
                          onError={handleImageError}
                        />
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => window.open(imageUrl, '_blank')}>
                            <Maximize className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                {!isLoadingImage && !imageUrl && <p className="text-sm text-destructive">{error || "Image not available."}</p>}
                <p className="text-xs text-muted-foreground mt-2">ID: {selectedSignature.id}</p>
                {selectedSignature.confidence !== undefined && selectedSignature.confidence !== null && (
                    <p className="text-xs text-muted-foreground">Confidence: {(selectedSignature.confidence * 100).toFixed(1)}%</p>
                )}
                </div>
            )}
            {!selectedSignature && <p className="text-sm text-muted-foreground text-center">Select a signature to view details.</p>}
        </CardContent>
    </Card>
  );
}
