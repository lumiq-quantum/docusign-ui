
"use client";

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentListItem } from '@/components/documents/DocumentListItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getProposalByIdAction, getProposalsAction, startSignatureAnalysisAction } from '@/lib/actions';
import type { Proposal, Document } from '@/types';
import { ArrowLeft, FileText, BarChart, CheckCircle, Clock, AlertCircle, RefreshCw, FileSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.proposalId as string;
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, startAnalyzingTransition] = useTransition();
  const { toast } = useToast();

  const fetchProposalDetails = useCallback(async () => {
    if (!proposalId) return;
    // Ensure proposalId is a number for API call
    const numericProposalId = parseInt(proposalId, 10);
    if (isNaN(numericProposalId)) {
        setError("Invalid Proposal ID format.");
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
      } else {
        setProposal(fetchedProposalResult.proposal || null);
         if (!fetchedProposalResult.proposal) setError("Proposal not found.");
      }

      if (fetchedAllProposalsResult.error) {
        // Non-critical error, dashboard sidebar might be empty
        console.warn("Failed to load all proposals for sidebar:", fetchedAllProposalsResult.error);
        setAllProposals([]);
      } else {
        setAllProposals(fetchedAllProposalsResult.proposals || []);
      }

    } catch (e) {
      setError("Failed to load proposal details.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    fetchProposalDetails();
  }, [fetchProposalDetails]);

  const handleUploadComplete = (newDocument: Document) => {
    // Refetch proposal to include the new document from the backend's perspective
    fetchProposalDetails();
  };

  const handleStartAnalysis = () => {
    if (!proposal) return;
    startAnalyzingTransition(async () => {
      const result = await startSignatureAnalysisAction(proposal.id);
      if (result.error) {
        toast({ title: "Analysis Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Analysis Started", description: result.message || "Signature analysis is in progress." });
      }
      // Refetch to get updated status from backend
      // Add a small delay to give backend time to update status potentially
      setTimeout(fetchProposalDetails, 1000); 
    });
  };
  
  const SignatureStatusIndicator = () => {
    if (!proposal || !proposal.signatureAnalysisStatus) return <Badge variant="outline">Not Started</Badge>;
    switch (proposal.signatureAnalysisStatus.toLowerCase()) { // API might return different casing
      case 'completed':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
      case 'in progress':
      case 'inprogress': // common variations
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3 animate-spin" />In Progress</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Failed</Badge>;
      default:
        return <Badge variant="outline">{proposal.signatureAnalysisStatus}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader title={<Skeleton className="h-8 w-3/4" />} description={<Skeleton className="h-4 w-1/2 mt-1" />} />
        <div className="space-y-6">
          <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <PageHeader title="Error" />
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error} <Button variant="link" onClick={() => router.push('/')}>Go to Dashboard</Button></AlertDescription>
        </Alert>
      </AppShell>
    );
  }

  if (!proposal) {
    return (
      <AppShell>
        <PageHeader title="Proposal Not Found" />
         <Alert>
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The proposal you are looking for does not exist. <Button variant="link" onClick={() => router.push('/')}>Go to Dashboard</Button></AlertDescription>
        </Alert>
      </AppShell>
    );
  }
  
  const analysisInProgress = proposal.signatureAnalysisStatus?.toLowerCase() === 'in progress' || proposal.signatureAnalysisStatus?.toLowerCase() === 'inprogress';


  return (
    <AppShell recentProposals={allProposals}>
      <Button variant="outline" size="sm" onClick={() => router.push('/')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      <PageHeader
        title={proposal.name}
        description={`Application No: ${proposal.applicationNumber || 'N/A'} | Created: ${new Date(proposal.createdAt).toLocaleDateString()}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" />Documents</CardTitle>
              <CardDescription>Upload and manage documents for this proposal.</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUpload proposalId={proposal.id} onUploadComplete={handleUploadComplete} />
              <div className="mt-6 space-y-3">
                {proposal.documents && proposal.documents.length > 0 ? (
                  proposal.documents.map(doc => (
                    <DocumentListItem key={doc.id} proposalId={proposal.id} document={doc} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><BarChart className="mr-2 h-5 w-5 text-primary" />Signature Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Status:</p>
                <SignatureStatusIndicator />
              </div>
              {proposal.signatureAnalysisStatus?.toLowerCase() === 'completed' && proposal.signatureAnalysisReportHtml && (
                 <Alert className="mb-3">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Analysis Complete</AlertTitle>
                  <AlertDescription className="text-xs">Report is available.</AlertDescription>
                </Alert>
              )}
              {proposal.signatureAnalysisStatus?.toLowerCase() === 'failed' && (
                 <Alert variant="destructive" className="mb-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Analysis Failed</AlertTitle>
                  <AlertDescription className="text-xs">The signature analysis process encountered an error. You may try again.</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex-col items-stretch space-y-2">
              <Button
                onClick={handleStartAnalysis}
                disabled={isAnalyzing || analysisInProgress || !proposal.documents || proposal.documents.length === 0}
                className="w-full"
              >
                {isAnalyzing || analysisInProgress ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSearch className="mr-2 h-4 w-4" />
                )}
                {proposal.signatureAnalysisStatus === 'Completed' || proposal.signatureAnalysisStatus === 'Failed' ? 'Re-analyze Signatures' : 'Start Signature Analysis'}
              </Button>
              {proposal.signatureAnalysisStatus?.toLowerCase() === 'completed' && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/proposals/${proposal.id}/signature-analysis/report`}>
                    View Analysis Report
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
