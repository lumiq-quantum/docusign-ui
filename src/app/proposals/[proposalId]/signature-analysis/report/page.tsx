
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { getSignatureAnalysisReportDataAction, getSignatureImageUrlAction, getProposalsAction } from '@/lib/actions';
import type { SignatureAnalysisReportData, ReportStatus, SignatureInstanceDetail, StakeholderAnalysis, Proposal } from '@/types';
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, FileText, Users, BarChart3, Link2, ExternalLink } from 'lucide-react'; // Link2 for Uniqueness, BarChart3 for status
import { format } from 'date-fns';

// Helper function to determine badge variant based on status
const getStatusBadgeVariant = (status: ReportStatus): "default" | "secondary" | "destructive" | "outline" => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('verified') || lowerStatus.includes('match') || lowerStatus.includes('unique')) return 'default'; // Greenish in default theme
  if (lowerStatus.includes('warning') || lowerStatus.includes('potential match') || lowerStatus.includes('requires review')) return 'secondary'; // Yellowish/Orange in default (often gray)
  if (lowerStatus.includes('mismatch') || lowerStatus.includes('error')) return 'destructive'; // Red
  return 'outline'; // Neutral
};

// Helper function to get an icon for status
const StatusIcon = ({ status }: { status: ReportStatus }) => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('verified') || lowerStatus.includes('match') || lowerStatus.includes('unique')) return <CheckCircle className="w-4 h-4 mr-1.5 text-green-600" />;
  if (lowerStatus.includes('warning') || lowerStatus.includes('potential match') || lowerStatus.includes('requires review')) return <AlertTriangle className="w-4 h-4 mr-1.5 text-yellow-600" />;
  if (lowerStatus.includes('mismatch') || lowerStatus.includes('error')) return <XCircle className="w-4 h-4 mr-1.5 text-red-600" />;
  return <BarChart3 className="w-4 h-4 mr-1.5 text-gray-500" />;
};


interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  signatureInstance?: SignatureInstanceDetail;
  stakeholderName?: string;
  proposalId?: number;
}

const SignatureImageModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, signatureInstance, stakeholderName, proposalId }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && signatureInstance && proposalId) {
      setLoadingImage(true);
      setImageError(null);
      const result = getSignatureImageUrlAction(proposalId, signatureInstance.signatureInstanceId);
      if (result.imageUrl) {
        setImageUrl(result.imageUrl);
      } else {
        setImageError(result.error || "Could not load image.");
        setImageUrl(null);
      }
      // For next/image, loading state is handled by the component itself, but we set initial loading
      // Simulating load complete for now, next/image handles this better
      setTimeout(() => setLoadingImage(false), 500); 
    } else {
      setImageUrl(null);
      setLoadingImage(false);
      setImageError(null);
    }
  }, [isOpen, signatureInstance, proposalId]);
  
  if (!isOpen || !signatureInstance) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Signature Details</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {loadingImage && <Skeleton className="w-full h-[150px] rounded-md" data-ai-hint="signature image large loading" />}
          {!loadingImage && imageUrl && (
            <Image src={imageUrl} alt={`Signature of ${stakeholderName} from ${signatureInstance.documentName}`} width={300} height={150} className="mx-auto mb-2 border rounded-md object-contain" data-ai-hint="signature image large content" unoptimized />
          )}
          {!loadingImage && (imageError || !imageUrl) && (
            <div className="signature-placeholder mx-auto flex items-center justify-center text-muted-foreground border-dashed border-2 rounded-md w-[300px] h-[150px]" data-ai-hint="signature image placeholder">
              {imageError || "Signature Image Not Available"}
            </div>
          )}
          <div className="mt-3 text-sm text-gray-700 space-y-1">
            <p><strong>Stakeholder:</strong> {stakeholderName}</p>
            <p><strong>Document:</strong> {signatureInstance.documentName} (Page {signatureInstance.pageNumber})</p>
            <p><strong>Role:</strong> {signatureInstance.role}</p>
            <p><strong>Signature ID:</strong> {signatureInstance.signatureInstanceId}</p>
          </div>
        </div>
         <DialogClose asChild>
            <Button type="button" variant="outline" className="mt-2">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};


export default function SignatureAnalysisReportPage() {
  const params = useParams();
  const router = useRouter();
  const proposalIdStr = params.proposalId as string;

  const [reportData, setReportData] = useState<SignatureAnalysisReportData | null>(null);
  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null); // For proposal name in back button
  const [allProposals, setAllProposals] = useState<Proposal[]>([]); // For sidebar
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSignatureForModal, setSelectedSignatureForModal] = useState<SignatureInstanceDetail | undefined>(undefined);
  const [selectedStakeholderNameForModal, setSelectedStakeholderNameForModal] = useState<string | undefined>(undefined);


  const fetchReportData = useCallback(async () => {
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
      const [reportResult, proposalsResult] = await Promise.all([
        getSignatureAnalysisReportDataAction(numericProposalId),
        getProposalsAction() // For sidebar recents
      ]);

      if (reportResult.error || !reportResult.reportData) {
        setError(reportResult.error || "Failed to load signature analysis report.");
        setReportData(null);
      } else {
        setReportData(reportResult.reportData);
        // Attempt to find the current proposal from the list for its name
        const foundProposal = proposalsResult.proposals?.find(p => p.id === numericProposalId);
        setCurrentProposal(foundProposal || null);
      }

      if (proposalsResult.error) {
        console.warn("Failed to load all proposals for sidebar", proposalsResult.error);
        setAllProposals([]);
      } else {
        setAllProposals(proposalsResult.proposals || []);
      }

    } catch (e: any) {
      setError("An unexpected error occurred: " + e.message);
      setReportData(null);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [proposalIdStr]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);
  
  const handleSignatureInstanceClick = (sigInstance: SignatureInstanceDetail, stakeholderName: string) => {
    setSelectedSignatureForModal(sigInstance);
    setSelectedStakeholderNameForModal(stakeholderName);
    setIsModalOpen(true);
  };


  if (isLoading) {
    return (
      <AppShell recentProposals={allProposals}>
        <PageHeader title="Signature Analysis Report" description={<Skeleton className="h-4 w-1/2 mt-1" />} />
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
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
           <Button variant="link" asChild className="mt-2"><Link href={`/proposals/${proposalIdStr}`}>Back to Proposal</Link></Button>
        </Alert>
      </AppShell>
    );
  }

  if (!reportData) {
    return (
      <AppShell recentProposals={allProposals}>
        <PageHeader title="Signature Analysis Report" description="No data available for this report." />
        <Alert>
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>The signature analysis report data could not be found or is empty.</AlertDescription>
            <Button variant="link" asChild className="mt-2"><Link href={`/proposals/${proposalIdStr}`}>Back to Proposal</Link></Button>
        </Alert>
      </AppShell>
    );
  }

  const { overallSummary, stakeholderAnalyses, crossStakeholderUniqueness } = reportData;
  const generationDate = format(new Date(reportData.generatedAt), "PPPpp"); // e.g., October 27, 2023 at 10:30 AM

  return (
    <AppShell recentProposals={allProposals}>
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href={`/proposals/${reportData.proposalId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Proposal: {currentProposal?.name || reportData.proposalName}
        </Link>
      </Button>

      {/* Report Header */}
      <header className="bg-gradient-to-r from-primary to-accent text-primary-foreground p-6 rounded-xl shadow-lg mb-8">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold">Signature Analysis Report</h1>
                <p className="text-sm opacity-90">Proposal: {reportData.proposalName} ({reportData.proposalApplicationNumber || 'N/A'})</p>
                <p className="text-sm opacity-90">Generated on: {generationDate}</p>
            </div>
            <div className="mt-4 md:mt-0">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068M15.75 21H9.75A2.25 2.25 0 0 1 7.5 18.75V5.25A2.25 2.25 0 0 1 9.75 3h4.509c1.056 0 2.026.415 2.748 1.138L19.5 6.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            </div>
        </div>
      </header>

      {/* Overall Summary */}
      <section className="mb-8">
        <h2 className="text-2xl font-headline font-semibold text-foreground mb-4">Overall Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center text-primary"><FileText className="w-6 h-6 mr-2" />Documents Analyzed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{overallSummary.documentsAnalyzed.count}</p>
              <p className="text-sm text-muted-foreground truncate" title={overallSummary.documentsAnalyzed.names.join(', ')}>{overallSummary.documentsAnalyzed.names.join(', ').substring(0,50)}...</p>
            </CardContent>
          </Card>
          <Card>
             <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center text-purple-600"><Users className="w-6 h-6 mr-2" />Stakeholders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{overallSummary.stakeholdersIdentified.count}</p>
              <p className="text-sm text-muted-foreground truncate" title={overallSummary.stakeholdersIdentified.names.join(', ')}>{overallSummary.stakeholdersIdentified.names.join(', ').substring(0,50)}...</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center"><StatusIcon status={overallSummary.overallStatus.status} />Overall Status</CardTitle>
            </CardHeader>
            <CardContent>
                <p className={`text-3xl font-bold ${getStatusBadgeVariant(overallSummary.overallStatus.status) === 'destructive' ? 'text-destructive' : getStatusBadgeVariant(overallSummary.overallStatus.status) === 'secondary' ? 'text-yellow-600' : 'text-green-600' }`}>
                    {overallSummary.overallStatus.status}
                </p>
              <p className="text-sm text-muted-foreground">{overallSummary.overallStatus.description}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Detailed Stakeholder Analysis */}
      <section className="mb-8">
        <h2 className="text-2xl font-headline font-semibold text-foreground mb-6">Detailed Stakeholder Analysis</h2>
        <div className="space-y-6">
          {stakeholderAnalyses.map((stakeholder) => (
            <Card key={stakeholder.stakeholderId}>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <CardTitle className="text-xl text-primary">{stakeholder.stakeholderName}</CardTitle>
                    <CardDescription>Roles: {stakeholder.roles}</CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(stakeholder.status)} className="mt-2 md:mt-0 self-start md:self-center">
                    <StatusIcon status={stakeholder.status} /> {stakeholder.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="text-md font-medium text-foreground mb-2">Signature Instances:</h4>
                  {stakeholder.signatureInstances.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stakeholder.signatureInstances.map((instance) => (
                        <div key={instance.signatureInstanceId} className="border p-3 rounded-lg bg-muted/50 hover:shadow-md transition-shadow">
                          <p className="text-sm font-medium text-foreground">{instance.documentName}</p>
                          <p className="text-xs text-muted-foreground mb-1">Page {instance.pageNumber} | Role: {instance.role}</p>
                          <Button variant="outline" size="sm" className="w-full" onClick={() => handleSignatureInstanceClick(instance, stakeholder.stakeholderName)}>
                             <ExternalLink className="w-3 h-3 mr-1.5"/> View Signature
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                     <p className="text-sm text-muted-foreground">No signature instances found for this stakeholder.</p>
                  )}
                </div>
                 <div>
                    <h4 className="text-md font-medium text-foreground mb-1">Analysis Results:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-4">
                        <li>
                            <span className="font-semibold text-foreground">Intra-Stakeholder Consistency:</span> {}
                            <Badge variant={getStatusBadgeVariant(stakeholder.analysisResults.intraStakeholderConsistency.result)} size="sm" className="ml-1">
                                {stakeholder.analysisResults.intraStakeholderConsistency.result}
                            </Badge>
                            {stakeholder.analysisResults.intraStakeholderConsistency.confidence && (
                                <span className="text-xs"> (Confidence: {(stakeholder.analysisResults.intraStakeholderConsistency.confidence * 100).toFixed(0)}%)</span>
                            )}
                            {stakeholder.analysisResults.intraStakeholderConsistency.notes && <p className="text-xs pl-5">{stakeholder.analysisResults.intraStakeholderConsistency.notes}</p>}
                        </li>
                        <li>
                            <span className="font-semibold text-foreground">Inter-Stakeholder Uniqueness:</span> {}
                             <Badge variant={getStatusBadgeVariant(stakeholder.analysisResults.interStakeholderUniqueness.result)} size="sm" className="ml-1">
                                {stakeholder.analysisResults.interStakeholderUniqueness.result}
                            </Badge>
                            {stakeholder.analysisResults.interStakeholderUniqueness.notes && <p className="text-xs pl-5">{stakeholder.analysisResults.interStakeholderUniqueness.notes}</p>}
                        </li>
                    </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Cross-Stakeholder Uniqueness Verification */}
      <section className="mb-8">
        <h2 className="text-2xl font-headline font-semibold text-foreground mb-4">Cross-Stakeholder Uniqueness</h2>
         <Card>
            <CardHeader>
                <div className="flex items-center text-teal-600">
                    <Link2 className="w-6 h-6 mr-2" />
                    <CardTitle className="text-xl">Uniqueness Check</CardTitle>
                </div>
                <CardDescription>This section confirms that no two distinct stakeholders share significantly similar signatures.</CardDescription>
            </CardHeader>
            <CardContent>
                {crossStakeholderUniqueness.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Stakeholder Pair</TableHead>
                        <TableHead>Comparison Result</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {crossStakeholderUniqueness.map((item, index) => (
                        <TableRow key={index}>
                        <TableCell className="font-medium">{item.stakeholderPair}</TableCell>
                        <TableCell>{item.comparisonResultDescription}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusBadgeVariant(item.status)}>
                                <StatusIcon status={item.status}/> {item.status}
                            </Badge>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                ) : (
                    <p className="text-sm text-muted-foreground">No cross-stakeholder uniqueness checks performed or available (e.g., less than 2 stakeholders).</p>
                )}
            </CardContent>
        </Card>
      </section>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} DocumentWise Signature Verification. Confidential Report.</p>
        <p>This report is based on automated analysis and should be used in conjunction with manual verification where necessary.</p>
      </footer>
      
      <SignatureImageModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        signatureInstance={selectedSignatureForModal}
        stakeholderName={selectedStakeholderNameForModal}
        proposalId={reportData.proposalId}
      />

    </AppShell>
  );
}
