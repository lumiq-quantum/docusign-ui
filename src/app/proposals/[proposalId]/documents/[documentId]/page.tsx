
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
import { getProposalByIdAction, getProposalsAction } from '@/lib/actions';
import type { Document, Proposal, Signature } from '@/types';
import { ArrowLeft } from 'lucide-react';

export default function DocumentViewerPage() {
  const params = useParams();
  const router = useRouter();
  const proposalIdStr = params.proposalId as string;
  const documentIdStr = params.documentId as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [signaturesOnPage, setSignaturesOnPage] = useState<Signature[]>([]);

  const fetchDocumentDetails = useCallback(async () => {
    if (!proposalIdStr || !documentIdStr) return;

    const numericProposalId = parseInt(proposalIdStr, 10);
    const numericDocumentId = parseInt(documentIdStr, 10);

    if (isNaN(numericProposalId) || isNaN(numericDocumentId)) {
      setError("Invalid ID format.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [fetchedProposalResult, fetchedAllProposalsResult] = await Promise.all([
        getProposalByIdAction(numericProposalId),
        getProposalsAction() 
      ]);

      if (fetchedProposalResult.error) {
        setError(fetchedProposalResult.error);
        setProposal(null);
        setDocument(null);
      } else if (fetchedProposalResult.proposal) {
        setProposal(fetchedProposalResult.proposal);
        const foundDoc = fetchedProposalResult.proposal.documents.find(d => d.id === numericDocumentId);
        if (foundDoc) {
          setDocument(foundDoc);
        } else {
          setError("Document not found in the proposal.");
          setDocument(null);
        }
      } else {
        setError("Proposal not found.");
        setProposal(null);
        setDocument(null);
      }

      if (fetchedAllProposalsResult.error) {
        console.warn("Could not load all proposals for sidebar", fetchedAllProposalsResult.error);
        setAllProposals([]);
      } else {
        setAllProposals(fetchedAllProposalsResult.proposals || []);
      }

    } catch (e: any) {
      setError("Failed to load document details: " + e.message);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [proposalIdStr, documentIdStr]);

  useEffect(() => {
    fetchDocumentDetails();
  }, [fetchDocumentDetails]);
  
  useEffect(() => {
    if (document && proposal?.signatureAnalysisStatus?.toLowerCase() === 'completed') {
      const currentPageData = document.pages.find(p => p.pageNumber === currentPageNumber);
      setSignaturesOnPage(currentPageData?.signatures || []);
    } else {
      setSignaturesOnPage([]);
    }
  }, [currentPageNumber, document, proposal?.signatureAnalysisStatus]);

  const handlePageChange = (newPage: number) => {
    if (document && newPage >= 1 && newPage <= document.totalPages) {
      setCurrentPageNumber(newPage);
    }
  };

  if (isLoading) {
    return (
      <AppShell recentProposals={allProposals}>
        <PageHeader title={<Skeleton className="h-8 w-3/4" />} description={<Skeleton className="h-4 w-1/2 mt-1" />} />
        <Skeleton className="h-[600px] w-full" />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell recentProposals={allProposals}>
        <PageHeader title="Error" />
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error} <Button variant="link" onClick={() => router.push(`/proposals/${proposalIdStr}`)}>Back to Proposal</Button></AlertDescription>
        </Alert>
      </AppShell>
    );
  }

  if (!document || !proposal) {
    return (
      <AppShell recentProposals={allProposals}>
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
        <Link href={`/proposals/${proposal.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Proposal: {proposal.name}
        </Link>
      </Button>
      <PageHeader title={document.name} description={`Viewing page ${currentPageNumber} of ${document.totalPages}`} />

      <Tabs defaultValue="pdf-view" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="pdf-view">PDF View</TabsTrigger>
          <TabsTrigger value="html-preview">HTML Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="pdf-view" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PdfViewer
                proposalId={proposal.id}
                documentId={document.id}
                totalPages={document.totalPages}
                currentPage={currentPageNumber}
                onPageChange={handlePageChange}
              />
            </div>
            <div className="lg:col-span-1">
              <SignatureViewer proposalId={proposal.id} signatures={signaturesOnPage} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="html-preview" className="mt-4">
            <HtmlPreview 
                proposalId={proposal.id} 
                documentId={document.id} 
                currentPage={currentPageNumber} 
            />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
