"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Signature } from '@/types'; // Assuming Signature type includes coordinates or an ID
import { getSignatureImageUrlAction } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Maximize } from 'lucide-react';

interface SignatureViewerProps {
  proposalId: string;
  signatures: Signature[]; // Array of detected signatures for the current page/document
}

export function SignatureViewer({ proposalId, signatures }: SignatureViewerProps) {
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedSignature) {
      setIsLoading(true);
      setImageUrl(null);
      getSignatureImageUrlAction(proposalId, selectedSignature.id)
        .then(result => {
          if (result.imageUrl) setImageUrl(result.imageUrl);
          else setImageUrl(null); // Or a placeholder error image
        })
        .catch(() => setImageUrl(null))
        .finally(() => setIsLoading(false));
    } else {
      setImageUrl(null);
    }
  }, [selectedSignature, proposalId]);

  if (!signatures || signatures.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Signatures</CardTitle>
                <CardDescription>Detected signatures on this page.</CardDescription>
            </CardHeader>
            <CardContent>
                 <p className="text-sm text-muted-foreground text-center py-4">No signatures detected on this page or analysis not run.</p>
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
                {isLoading && <Skeleton className="w-full h-[100px] rounded-md" data-ai-hint="signature image" />}
                {!isLoading && imageUrl && (
                    <div className="relative group">
                        <Image src={imageUrl} alt={`Signature ${selectedSignature.id}`} width={200} height={80} className="border bg-white" data-ai-hint="signature image" />
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => window.open(imageUrl, '_blank')}>
                            <Maximize className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                {!isLoading && !imageUrl && <p className="text-sm text-destructive">Image not available.</p>}
                <p className="text-xs text-muted-foreground mt-2">ID: {selectedSignature.id}</p>
                {/* Display more signature details if available, e.g., confidence */}
                {selectedSignature.confidence && <p className="text-xs text-muted-foreground">Confidence: {(selectedSignature.confidence * 100).toFixed(1)}%</p>}
                </div>
            )}
            {!selectedSignature && <p className="text-sm text-muted-foreground text-center">Select a signature to view details.</p>}
        </CardContent>
    </Card>
  );
}
