
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { PdfViewer } from '@/components/documents/PdfViewer';
import { HtmlPreview } from '@/components/documents/HtmlPreview';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from '@/components/ui/scroll-area';
import { getProposalByIdAction, getProposalsAction } from '@/lib/actions';
import type { Document, Proposal } from '@/types';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChatInterface } from '@/components/chat/ChatInterface';


const PageNavigationSidebar = ({ totalPages, currentPage, onPageChange }: {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 0) return null;

  return (
    <div className="w-48 flex-shrink-0 border-r pr-2 flex flex-col">
      <h3 className="text-base font-semibold mb-2 px-2 text-muted-foreground">Document Pages</h3>
      <ScrollArea className="h-full">
        <div className="flex flex-col space-y-1 pr-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={currentPage === pageNumber ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              className="w-full justify-start text-left h-8"
            >
              Page {pageNumber}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

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
  const [isChatOpen, setIsChatOpen] = useState(false);

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
      const [proposalResult, allProposalsResult] = await Promise.all([
        getProposalByIdAction(numericProposalId),
        getProposalsAction()
      ]);

      if (proposalResult.error || !proposalResult.proposal) {
        setError(proposalResult.error || "Proposal not found.");
        setProposal(null);
        setDocument(null);
      } else {
        setProposal(proposalResult.proposal);
        const foundDoc = proposalResult.proposal.documents.find(d => d.id === numericDocumentId);
        if (foundDoc) {
          setDocument(foundDoc);
          if (foundDoc.totalPages > 0 && currentPageNumber > foundDoc.totalPages) {
            setCurrentPageNumber(1);
          } else if (foundDoc.totalPages === 0) {
            setCurrentPageNumber(1);
          }
        } else {
          setError("Document not found in the proposal.");
          setDocument(null);
        }
      }

      if (allProposalsResult.error) {
        console.warn("Could not load all proposals for sidebar", allProposalsResult.error);
        setAllProposals([]);
      } else {
        setAllProposals(allProposalsResult.proposals || []);
      }

    } catch (e: any) {
      setError("Failed to load document details: " + e.message);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [proposalIdStr, documentIdStr, currentPageNumber]);

  useEffect(() => {
    fetchDocumentDetails();
  }, [fetchDocumentDetails]);

  const handlePageChange = (newPage: number) => {
    if (document && newPage >= 1 && newPage <= document.totalPages) {
      setCurrentPageNumber(newPage);
    } else if (document && document.totalPages === 0 && newPage === 1) {
      setCurrentPageNumber(newPage);
    }
  };

  const pageHeaderActions = document?.chatSessionId ? (
    <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="mr-2 h-4 w-4" />
          Chat about Document
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg w-full p-0">
        <ChatInterface sessionId={document.chatSessionId} chatTitleProp={`Chat: ${document.name}`} />
      </SheetContent>
    </Sheet>
  ) : null;


  if (isLoading) {
    return (
      <AppShell recentProposals={allProposals}>
        <PageHeader title={<Skeleton className="h-8 w-3/4" />} description={<Skeleton className="h-4 w-1/2 mt-1" />} />
        <div className="flex flex-row mt-2 flex-1">
          <div className="w-48 flex-shrink-0 border-r pr-2">
            <Skeleton className="h-6 w-3/4 mb-3 px-2" />
            <div className="space-y-1 pr-2 h-[calc(100vh-20rem)]"> 
              {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          </div>
          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 pl-6 h-full">
            <Skeleton className="h-full min-h-[600px] w-full" />
            <Skeleton className="h-full min-h-[600px] w-full" />
          </div>
        </div>
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
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/proposals/${proposal.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Proposal: {proposal.name}
          </Link>
        </Button>
        {pageHeaderActions}
      </div>
      
      <PageHeader 
        title={document.name} 
        description={`Viewing page ${currentPageNumber} of ${document.totalPages > 0 ? document.totalPages : 'N/A' }`}
      />

      <div className="flex flex-1 mt-2" style={{ height: 'calc(100vh - var(--header-height, 10rem) - 4rem)' }}>
        {document.totalPages > 0 && (
          <PageNavigationSidebar
            totalPages={document.totalPages}
            currentPage={currentPageNumber}
            onPageChange={handlePageChange}
          />
        )}
        <div className={`flex-grow grid grid-cols-1 ${document.totalPages > 0 ? 'md:grid-cols-2 pl-6' : 'md:grid-cols-1'} gap-6 h-full`}>
          {document.totalPages > 0 ? (
            <>
              <div className="h-full">
                <PdfViewer
                  proposalId={proposal.id}
                  documentId={document.id}
                  totalPages={document.totalPages}
                  currentPage={currentPageNumber}
                  onPageChange={handlePageChange}
                />
              </div>
              <div className="h-full">
                <HtmlPreview
                  proposalId={proposal.id}
                  documentId={document.id}
                  currentPage={currentPageNumber}
                />
              </div>
            </>
          ) : (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              This document has no pages to display.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
