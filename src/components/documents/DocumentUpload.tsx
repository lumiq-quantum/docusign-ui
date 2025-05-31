
"use client";

import { useState, useTransition, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, XCircle, CheckCircle } from 'lucide-react';
import type { Document } from '@/types';
import { addDocumentToProposalAction } from '@/lib/actions';

interface DocumentUploadProps {
  proposalId: number; // Changed from string
  onUploadComplete: (newDocument: Document) => void;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export function DocumentUpload({ proposalId, onUploadComplete }: DocumentUploadProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid File Type",
          description: "Please upload PDF files only.",
          variant: "destructive",
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; 
        }
        return;
      }
      handleUpload(file);
    }
  };

  const handleUpload = (file: File) => {
    setUploadProgress({ fileName: file.name, progress: 0, status: 'uploading' });

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      if (currentProgress <= 100) {
        setUploadProgress(prev => prev ? { ...prev, progress: currentProgress } : null);
      } else {
        clearInterval(interval);
      }
    }, 100);

    startTransition(async () => {
      try {
        const result = await addDocumentToProposalAction(proposalId, file);
        clearInterval(interval); 

        if (result.error || !result.document) {
          setUploadProgress(prev => prev ? { ...prev, status: 'error', error: result.error || "Upload failed." } : null);
          toast({
            title: "Upload Failed",
            description: result.error || "Could not upload the document.",
            variant: "destructive",
          });
        } else {
          setUploadProgress(prev => prev ? { ...prev, status: 'success', progress: 100 } : null);
          toast({
            title: "Upload Successful",
            description: `${file.name} has been uploaded.`,
          });
          onUploadComplete(result.document);
          setTimeout(() => {
            setUploadProgress(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = ""; 
            }
          }, 3000);
        }
      } catch (e) {
        clearInterval(interval);
        setUploadProgress(prev => prev ? { ...prev, status: 'error', error: "An unexpected error occurred." } : null);
        toast({
          title: "Upload Error",
          description: "An unexpected error occurred during upload.",
          variant: "destructive",
        });
        console.error(e);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="document-upload" className="sr-only">Choose PDF file</Label>
        <div className="flex items-center gap-2">
        <Input
            id="document-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isPending || (uploadProgress !== null && uploadProgress.status === 'uploading')}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            ref={fileInputRef}
          />
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isPending || (uploadProgress !== null && uploadProgress.status === 'uploading')}
            variant="outline"
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            {isPending ? "Uploading..." : "Upload PDF"}
          </Button>
        </div>
      </div>

      {uploadProgress && (
        <div className="p-3 border rounded-md bg-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium truncate max-w-[70%]">{uploadProgress.fileName}</p>
            {uploadProgress.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {uploadProgress.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
          </div>
          <Progress value={uploadProgress.progress} className="w-full h-2" />
          {uploadProgress.status === 'error' && uploadProgress.error && (
            <p className="text-xs text-red-600 mt-1">{uploadProgress.error}</p>
          )}
           {uploadProgress.status === 'success' && (
            <p className="text-xs text-green-600 mt-1">Upload complete!</p>
          )}
        </div>
      )}
    </div>
  );
}
