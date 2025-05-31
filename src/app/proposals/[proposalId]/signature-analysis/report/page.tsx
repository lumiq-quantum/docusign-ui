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
import { getProposalById, getProposals } from '@/lib/mockData';
import { getSignatureAnalysisReportAction } from '@/lib/actions';
import type { Proposal } from '@/types';
import { ArrowLeft, FileText } from 'lucide-react';

export default function SignatureAnalysisReportPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.proposalId as string;

  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!proposalId) return;
    setIsLoading(true);
    setError(null);
    try {
       const [fetchedProposal, reportResult, fetchedAllProposals] = await Promise.all([
        getProposalById(proposalId),
        getSignatureAnalysisReportAction(proposalId),
        getProposals()
      ]);
      
      if (fetchedProposal) {
        setProposal(fetchedProposal);
      } else {
        setError("Proposal not found.");
      }

      if (reportResult.error) {
        setError(reportResult.error);
        setReportHtml(null);
      } else {
        setReportHtml(reportResult.reportHtml || "<p>Report content is not available.</p>");
      }
      setAllProposals(fetchedAllProposals);

    } catch (e) {
      setError("Failed to load signature analysis report.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader title="Signature Analysis Report" description={<Skeleton className="h-4 w-1/2 mt-1" />} />
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
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
  
  if (!proposal) {
     return (
      <AppShell>
        <PageHeader title="Not Found" />
         <Alert>
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The proposal related to this report could not be found. <Button variant="link" onClick={() => router.push('/')}>Go to Dashboard</Button></AlertDescription>
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
      <PageHeader
        title="Signature Analysis Report"
        description={`Detailed analysis for proposal: ${proposal.name} (${proposal.applicationNumber})`}
      />
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
            <p className="text-muted-foreground">Report content is not available.</p>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
