"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { PdfViewer } from '@/components/documents/PdfViewer';
import { HtmlPreview } from '@/components/documents/HtmlPreview';
import { SignatureViewer } from '@/components/documents/SignatureViewer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getDocumentById, getProposalById, getProposals } from '@/lib/mockData';
import type { Document, Proposal, Signature } from '@/types';
import { ArrowLeft } from 'lucide-react';

export default function DocumentViewerPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.proposalId as string;
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Mock signatures for the current page, in a real app this would come from analysis results
  const [signaturesOnPage, setSignaturesOnPage] = useState<Signature[]>([]);

  const fetchDocumentDetails = useCallback(async () => {
    if (!proposalId || !documentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedDoc, fetchedProposal, fetchedAllProposals] = await Promise.all([
        getDocumentById(proposalId, documentId),
        getProposalById(proposalId),
        getProposals() // For sidebar
      ]);

      if (fetchedDoc) {
        setDocument(fetchedDoc);
      } else {
        setError("Document not found.");
      }
      if (fetchedProposal) {
        setProposal(fetchedProposal);
      } else {
        // This case might imply inconsistent data or proposal was deleted
        if(!fetchedDoc) setError("Proposal and Document not found.");
        else setError("Parent proposal not found.");
      }
      setAllProposals(fetchedAllProposals);

    } catch (e) {
      setError("Failed to load document details.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [proposalId, documentId]);

  useEffect(() => {
    fetchDocumentDetails();
  }, [fetchDocumentDetails]);
  
  // Mock effect to load signatures for the current page
  useEffect(() => {
    if(document && proposal?.signatureAnalysisStatus === 'Completed') {
      // Simulate fetching signatures for the current page
      // This is highly dependent on how signature data is structured and stored
      const mockSignatures: Signature[] = [
        { id: `sig_${documentId}_${currentPage}_1`, documentId, pageNumber: currentPage, coordinates: {x:100,y:200,w:150,h:50}, confidence: 0.95 },
        { id: `sig_${documentId}_${currentPage}_2`, documentId, pageNumber: currentPage, coordinates: {x:300,y:500,w:120,h:40}, confidence: 0.88 },
      ].filter(sig => Math.random() > 0.5); // Randomly show some signatures
      setSignaturesOnPage(mockSignatures);
    } else {
      setSignaturesOnPage([]);
    }
  }, [currentPage, document, proposal?.signatureAnalysisStatus, documentId]);

  const handlePageChange = (newPage: number) => {
    if (document && newPage >= 1 && newPage <= document.totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader title={<Skeleton className="h-8 w-3/4" />} />
        <Skeleton className="h-[600px] w-full" />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <PageHeader title="Error" />
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error} <Button variant="link" onClick={() => router.push(`/proposals/${proposalId}`)}>Back to Proposal</Button></AlertDescription>
        </Alert>
      </AppShell>
    );
  }

  if (!document || !proposal) {
    return (
      <AppShell>
        <PageHeader title="Not Found" />
         <Alert>
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The document or proposal could not be found. <Button variant="link" onClick={() => router.push('/')}>Go to Dashboard</Button></AlertDescription>
        </Alert>
      </AppShell>
    );
  }

  return (
    <AppShell recentProposals={allProposals}>
      <Button variant="outline" size="sm" asChild className="mb-4">
        <Link href={`/proposals/${proposalId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Proposal: {proposal.name}
        </Link>
      </Button>
      <PageHeader title={document.name} description={`Viewing page ${currentPage} of ${document.totalPages}`} />

      <Tabs defaultValue="pdf-view" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="pdf-view">PDF View</TabsTrigger>
          <TabsTrigger value="html-preview">HTML Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="pdf-view" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PdfViewer
                proposalId={proposalId}
                documentId={documentId}
                totalPages={document.totalPages}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            </div>
            <div className="lg:col-span-1">
              <SignatureViewer proposalId={proposalId} signatures={signaturesOnPage} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="html-preview" className="mt-4">
            <HtmlPreview 
                proposalId={proposalId} 
                documentId={documentId} 
                currentPage={currentPage} 
            />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
