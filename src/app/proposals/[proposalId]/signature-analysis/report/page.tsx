
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
import { getProposalByIdAction, getProposalsAction, getSignatureAnalysisReportAction } from '@/lib/actions';
import type { Proposal } from '@/types';
import { ArrowLeft, FileText } from 'lucide-react';

export default function SignatureAnalysisReportPage() {
  const params = useParams();
  const router = useRouter();
  const proposalIdStr = params.proposalId as string;

  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!proposalIdStr) return;
    
    const numericProposalId = parseInt(proposalIdStr, 10);
    if (isNaN(numericProposalId)) {
        setError("Invalid Proposal ID format.");
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
       const [fetchedProposalResult, reportResult, fetchedAllProposalsResult] = await Promise.all([
        getProposalByIdAction(numericProposalId),
        getSignatureAnalysisReportAction(numericProposalId),
        getProposalsAction()
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

      if (reportResult.error) {
        setError(prevError => prevError ? `${prevError}\n${reportResult.error}` : reportResult.error);
        setReportHtml(null);
      } else {
        setReportHtml(reportResult.reportHtml || "<p>Report content is not available.</p>");
      }

      if (fetchedAllProposalsResult.error) {
        console.warn("Could not load all proposals for sidebar", fetchedAllProposalsResult.error);
        setAllProposals([]);
      } else {
        setAllProposals(fetchedAllProposalsResult.proposals || []);
      }

    } catch (e) {
      setError("Failed to load signature analysis report.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [proposalIdStr]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (isLoading) {
    return (
      <AppShell recentProposals={allProposals}>
        <PageHeader title="Signature Analysis Report" description={<Skeleton className="h-4 w-1/2 mt-1" />} />
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
      </AppShell>
    );
  }

  if (error && !reportHtml) { // Only show full page error if reportHtml couldn't be loaded at all
    return (
      <AppShell recentProposals={allProposals}>
        <PageHeader title="Error" />
        <Alert variant="destructive">
          <AlertTitle>Error Loading Report</AlertTitle>
          <AlertDescription>{error} <Button variant="link" onClick={() => router.push(`/proposals/${proposalIdStr}`)}>Back to Proposal</Button></AlertDescription>
        </Alert>
      </AppShell>
    );
  }
  
  if (!proposal && !isLoading) { // If proposal specifically failed to load
     return (
      <AppShell recentProposals={allProposals}>
        <PageHeader title="Not Found" />
         <Alert>
          <AlertTitle>Proposal Not Found</AlertTitle>
          <AlertDescription>The proposal related to this report could not be found. <Button variant="link" onClick={() => router.push('/')}>Go to Dashboard</Button></AlertDescription>
        </Alert>
      </AppShell>
    );
  }

  return (
    <AppShell recentProposals={allProposals}>
       <Button variant="outline" size="sm" asChild className="mb-4">
        <Link href={`/proposals/${proposal?.id || proposalIdStr}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Proposal: {proposal?.name || 'Loading...'}
        </Link>
      </Button>
      <PageHeader
        title="Signature Analysis Report"
        description={`Detailed analysis for proposal: ${proposal?.name || 'N/A'} (${proposal?.applicationNumber || 'N/A'})`}
      />
      {error && reportHtml && ( // Show non-critical error if reportHtml is still available
         <Alert variant="destructive" className="mb-4">
            <AlertTitle>Report Loading Issue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            Report Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportHtml ? (
            <div 
              className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-background shadow"
              dangerouslySetInnerHTML={{ __html: reportHtml }} 
            />
          ) : (
            <p className="text-muted-foreground">Report content is currently unavailable.</p>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
