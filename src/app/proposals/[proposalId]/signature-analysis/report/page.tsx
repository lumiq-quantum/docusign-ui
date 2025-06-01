
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getProposalByIdAction, getProposalsAction } from '@/lib/actions';
import type { Proposal } from '@/types';
import { ArrowLeft } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function SignatureAnalysisReportPage() {
  const params = useParams();
  const router = useRouter();
  const proposalIdStr = params.proposalId as string;

  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null);
  const [allProposals, setAllProposals] = useState<Proposal[]>([]); // For sidebar
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  const fetchProposalDetails = useCallback(async () => {
    if (!proposalIdStr) return;
    const numericProposalId = parseInt(proposalIdStr, 10);
    if (isNaN(numericProposalId)) {
      setError("Invalid Proposal ID.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [proposalResult, proposalsResult] = await Promise.all([
        getProposalByIdAction(numericProposalId),
        getProposalsAction() // For sidebar recents
      ]);

      if (proposalResult.error || !proposalResult.proposal) {
        setError(proposalResult.error || "Proposal not found. Cannot display report.");
        setCurrentProposal(null);
        setIframeSrc(null);
      } else {
        setCurrentProposal(proposalResult.proposal);
        if (!API_BASE_URL) {
          setError("API base URL is not configured. Cannot load report.");
          setIframeSrc(null);
        } else {
          setIframeSrc(`${API_BASE_URL}/proposals/${numericProposalId}/signature-analysis/report`);
        }
      }

      if (proposalsResult.error) {
        console.warn("Failed to load all proposals for sidebar", proposalsResult.error);
        setAllProposals([]);
      } else {
        setAllProposals(proposalsResult.proposals || []);
      }

    } catch (e: any) {
      setError("An unexpected error occurred: " + e.message);
      setCurrentProposal(null);
      setIframeSrc(null);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [proposalIdStr]);

  useEffect(() => {
    fetchProposalDetails();
  }, [fetchProposalDetails]);

  if (isLoading) {
    return (
      <AppShell recentProposals={allProposals}>
        <PageHeader title="Signature Analysis Report" description={<Skeleton className="h-4 w-1/2 mt-1" />} />
        <Skeleton className="h-[calc(100vh-15rem)] w-full" />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell recentProposals={allProposals}>
        <PageHeader title="Error" />
        <Alert variant="destructive">
          <AlertTitle>Could not load report</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
           <Button variant="link" asChild className="mt-2">
             <Link href={proposalIdStr ? `/proposals/${proposalIdStr}` : '/'}>Back to Proposal</Link>
           </Button>
        </Alert>
      </AppShell>
    );
  }

  if (!currentProposal || !iframeSrc) {
    return (
      <AppShell recentProposals={allProposals}>
        <PageHeader title="Signature Analysis Report" description="Report data is unavailable." />
        <Alert>
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>The signature analysis report could not be loaded.</AlertDescription>
            <Button variant="link" asChild className="mt-2">
              <Link href={proposalIdStr ? `/proposals/${proposalIdStr}` : '/'}>Back to Proposal</Link>
            </Button>
        </Alert>
      </AppShell>
    );
  }

  return (
    <AppShell recentProposals={allProposals}>
      <Button variant="outline" size="sm" asChild className="mb-4">
        <Link href={`/proposals/${currentProposal.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Proposal: {currentProposal.name}
        </Link>
      </Button>

      <PageHeader
        title="Signature Analysis Report"
        description={`Viewing report for proposal: ${currentProposal.name}`}
      />

      <div className="border rounded-lg overflow-hidden shadow-lg" style={{ height: 'calc(100vh - var(--header-height, 10rem) - 7rem)' }}>
        <iframe
          src={iframeSrc}
          title="Signature Analysis Report"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin" // Adjust sandbox as needed
          data-ai-hint="signature analysis report html content"
        />
      </div>
    </AppShell>
  );
}
