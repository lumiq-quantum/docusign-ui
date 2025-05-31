
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getProposalByIdAction, getProposalsAction } from '@/lib/actions';
import type { Proposal } from '@/types';
import { ArrowLeft, FileText } from 'lucide-react';

// API_BASE_URL is needed to construct the iframe URL directly
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function SignatureAnalysisReportPage() {
  const params = useParams();
  const router = useRouter();
  const proposalIdStr = params.proposalId as string;

  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // For proposal fetching errors
  const [iframeError, setIframeError] = useState<string | null>(null); // For iframe specific issues

  const fetchProposalDetailsAndSetReportUrl = useCallback(async () => {
    if (!proposalIdStr) return;
    
    const numericProposalId = parseInt(proposalIdStr, 10);
    if (isNaN(numericProposalId)) {
        setError("Invalid Proposal ID format.");
        setIsLoading(false);
        return;
    }

    if (!API_BASE_URL) {
      setIframeError("API base URL is not configured. Cannot load report.");
      setIsLoading(false);
      return;
    }
    setReportUrl(`${API_BASE_URL}/proposals/${numericProposalId}/signature-analysis/report`);


    setIsLoading(true);
    setError(null); // Reset proposal error
    setIframeError(null); // Reset iframe error

    try {
       const [fetchedProposalResult, fetchedAllProposalsResult] = await Promise.all([
        getProposalByIdAction(numericProposalId),
        getProposalsAction() // For sidebar
      ]);
      
      if (fetchedProposalResult.error) {
        setError(fetchedProposalResult.error);
        setProposal(null);
      } else if (fetchedProposalResult.proposal) {
        setProposal(fetchedProposalResult.proposal);
      } else {
        setError("Proposal not found.");
        setProposal(null);
      }

      if (fetchedAllProposalsResult.error) {
        console.warn("Could not load all proposals for sidebar", fetchedAllProposalsResult.error);
        setAllProposals([]);
      } else {
        setAllProposals(fetchedAllProposalsResult.proposals || []);
      }

    } catch (e: any) {
      setError("Failed to load proposal details: " + e.message);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [proposalIdStr]);

  useEffect(() => {
    fetchProposalDetailsAndSetReportUrl();
  }, [fetchProposalDetailsAndSetReportUrl]);

  if (isLoading) {
    return (
      <AppShell recentProposals={allProposals}>
        <PageHeader title="Signature Analysis Report" description={<Skeleton className="h-4 w-1/2 mt-1" />} />
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent><Skeleton className="h-[600px] w-full" /></CardContent>
        </Card>
      </AppShell>
    );
  }
  
  if (error && !proposal) { // Critical error fetching proposal
    return (
      <AppShell recentProposals={allProposals}>
        <PageHeader title="Error" />
        <Alert variant="destructive">
          <AlertTitle>Error Loading Proposal Details</AlertTitle>
          <AlertDescription>{error} <Button variant="link" onClick={() => router.push(`/proposals/${proposalIdStr}`)}>Back to Proposal</Button></AlertDescription>
        </Alert>
      </AppShell>
    );
  }
  
  return (
    <AppShell recentProposals={allProposals}>
       <Button variant="outline" size="sm" asChild className="mb-4">
        <Link href={`/proposals/${proposal?.id || proposalIdStr}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Proposal: {proposal?.name || 'Details'}
        </Link>
      </Button>
      <PageHeader
        title="Signature Analysis Report"
        description={`Detailed analysis for proposal: ${proposal?.name || 'N/A'} (${proposal?.applicationNumber || 'N/A'})`}
      />
      {error && proposal && ( // Non-critical error if proposal details somehow failed but we still have a URL
         <Alert variant="warning" className="mb-4">
            <AlertTitle>Proposal Data Issue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
       {iframeError && ( 
         <Alert variant="destructive" className="mb-4">
            <AlertTitle>Report Not Available</AlertTitle>
            <AlertDescription>{iframeError}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            Report Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reportUrl && !iframeError ? (
            <iframe
              src={reportUrl}
              title="Signature Analysis Report"
              className="w-full h-[70vh] min-h-[600px] border-0 rounded-b-md"
              sandbox="allow-scripts allow-same-origin" // Adjust sandbox as necessary
              data-ai-hint="signature analysis report content"
            />
          ) : !isLoading && !iframeError ? ( 
            <div className="p-6">
              <p className="text-muted-foreground">Report content is currently unavailable or could not be loaded.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}
