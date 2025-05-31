
"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const { toast } = useToast();

  const fetchProposalData = useCallback(async (isFullLoad = true) => {
    if (!proposalId) return;
    
    const numericProposalId = parseInt(proposalId, 10);
    if (isNaN(numericProposalId)) {
        setError("Invalid Proposal ID format.");
        if (isFullLoad) setIsLoading(false);
        return;
    }

    if (isFullLoad) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsRefreshingStatus(true);
    }

    try {
      const promises = [getProposalByIdAction(numericProposalId)];
      if (isFullLoad) {
        promises.push(getProposalsAction());
      }

      const results = await Promise.all(promises);
      const fetchedProposalResult = results[0] as { proposal?: Proposal; error?: string };
      
      if (fetchedProposalResult.error) {
        if (isFullLoad) setError(fetchedProposalResult.error);
        else toast({ title: "Refresh Error", description: fetchedProposalResult.error, variant: "destructive" });
        setProposal(null);
      } else {
        setProposal(fetchedProposalResult.proposal || null);
         if (!fetchedProposalResult.proposal && isFullLoad) setError("Proposal not found.");
         else if (!fetchedProposalResult.proposal && !isFullLoad) toast({title: "Info", description: "Proposal data not found on refresh."})

      }

      if (isFullLoad) {
        const fetchedAllProposalsResult = results[1] as { proposals?: Proposal[]; error?: string };
        if (fetchedAllProposalsResult.error) {
          console.warn("Failed to load all proposals for sidebar:", fetchedAllProposalsResult.error);
          setAllProposals([]);
        } else {
          setAllProposals(fetchedAllProposalsResult.proposals || []);
        }
      }

    } catch (e: any) {
      if (isFullLoad) setError("Failed to load proposal details: " + e.message);
      else toast({ title: "Refresh Error", description: "Failed to refresh: " + e.message, variant: "destructive"});
      console.error(e);
    } finally {
      if (isFullLoad) setIsLoading(false);
      else setIsRefreshingStatus(false);
    }
  }, [proposalId, toast]);

  useEffect(() => {
    fetchProposalData(true); // Initial full load
  }, [fetchProposalData]);

  const handleUploadComplete = (newDocument: Document) => {
    fetchProposalData(false); // Re-fetch only proposal to update list and details
  };

  const handleStartAnalysis = async () => {
    if (!proposal) return;
    setIsAnalyzing(true);
    try {
      const result = await startSignatureAnalysisAction(proposal.id);
      if (result.error) {
        toast({ title: "Analysis Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Analysis Started", description: result.message || "Signature analysis is in progress." });
        // Refresh proposal data after a delay to allow backend processing
        setTimeout(() => fetchProposalData(false), 3000); 
      }
    } catch (e: any) {
      toast({ title: "Analysis Error", description: "An unexpected error occurred: " + e.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const SignatureStatusIndicator = () => {
    if (!proposal || !proposal.signatureAnalysisStatus) return <Badge variant="outline">Not Started</Badge>;
    const status = proposal.signatureAnalysisStatus.toLowerCase();
    switch (status) {
      case 'completed':
      case 'completed_success':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
      case 'in progress':
      case 'inprogress':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3 animate-spin" />In Progress</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Failed</Badge>;
      default:
        return <Badge variant="outline">{proposal.signatureAnalysisStatus}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AppShell recentProposals={allProposals}>
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
      <AppShell recentProposals={allProposals}>
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
      <AppShell recentProposals={allProposals}>
        <PageHeader title="Proposal Not Found" />
         <Alert>
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The proposal you are looking for does not exist. <Button variant="link" onClick={() => router.push('/')}>Go to Dashboard</Button></AlertDescription>
        </Alert>
      </AppShell>
    );
  }
  
  const analysisInProgress = proposal.signatureAnalysisStatus?.toLowerCase() === 'in progress' || proposal.signatureAnalysisStatus?.toLowerCase() === 'inprogress';
  const currentStatusLower = proposal.signatureAnalysisStatus?.toLowerCase();
  const isCompletedSuccessfully = currentStatusLower === 'completed' || currentStatusLower === 'completed_success';


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
                <div className="flex items-center">
                    <p className="text-sm font-medium">Status:</p>
                    <Button variant="ghost" size="icon" onClick={() => fetchProposalData(false)} className="ml-1 h-7 w-7" title="Refresh status" disabled={isAnalyzing || isRefreshingStatus}>
                        <RefreshCw className={`h-4 w-4 ${(isAnalyzing || isRefreshingStatus) ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <SignatureStatusIndicator />
              </div>
              {isCompletedSuccessfully && proposal.signatureAnalysisReportHtml && (
                 <Alert className="mb-3">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Analysis Complete</AlertTitle>
                  <AlertDescription className="text-xs">Report is available.</AlertDescription>
                </Alert>
              )}
              {currentStatusLower === 'failed' && (
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
                disabled={isAnalyzing || analysisInProgress || isRefreshingStatus || !proposal.documents || proposal.documents.length === 0}
                className="w-full"
              >
                {isAnalyzing || (analysisInProgress && isRefreshingStatus) ? ( 
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSearch className="mr-2 h-4 w-4" />
                )}
                {isCompletedSuccessfully || currentStatusLower === 'failed' ? 'Re-analyze Signatures' : 'Start Signature Analysis'}
              </Button>
              {isCompletedSuccessfully && (
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
