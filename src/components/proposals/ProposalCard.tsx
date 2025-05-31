
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Proposal } from '@/types';
import { FileText, ArrowRight, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteProposalAction } from '@/lib/actions';

interface ProposalCardProps {
  proposal: Proposal;
  onProposalDeleted: (proposalId: number) => void;
}

const StatusIcon = ({ status }: { status: Proposal['signatureAnalysisStatus'] }) => {
  if (!status) return <Clock className="h-4 w-4 text-muted-foreground" />;
  const lowerStatus = status.toLowerCase();
  switch (lowerStatus) {
    case 'completed':
    case 'completed_success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'in progress':
    case 'inprogress':
      return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

export function ProposalCard({ proposal, onProposalDeleted }: ProposalCardProps) {
  const formattedDate = new Date(proposal.createdAt).toLocaleDateString();
  const signatureStatus = proposal.signatureAnalysisStatus || 'Not Started';
  const lowerSignatureStatus = signatureStatus.toLowerCase();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let statusText = signatureStatus;

  if (lowerSignatureStatus === 'completed' || lowerSignatureStatus === 'completed_success') {
    badgeVariant = 'default';
    statusText = 'Completed';
  } else if (lowerSignatureStatus === 'in progress' || lowerSignatureStatus === 'inprogress') {
    badgeVariant = 'secondary';
    statusText = 'In Progress';
  } else if (lowerSignatureStatus === 'failed') {
    badgeVariant = 'destructive';
    statusText = 'Failed';
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteProposalAction(proposal.id);
      if (result.success) {
        toast({ title: "Proposal Deleted", description: `Proposal "${proposal.name}" has been deleted.` });
        onProposalDeleted(proposal.id);
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete proposal.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: "An unexpected error occurred: " + e.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setIsAlertOpen(false);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-headline text-lg">{proposal.name}</CardTitle>
        <CardDescription>
          App No: {proposal.applicationNumber || 'N/A'} | Created: {formattedDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <FileText className="mr-2 h-4 w-4" />
          <span>{proposal.documents?.length || 0} document{proposal.documents?.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center text-sm">
          <StatusIcon status={signatureStatus} />
          <span className="ml-2">Signature Analysis:</span>
          <Badge variant={badgeVariant} className="ml-2 text-xs">
            {statusText}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button asChild variant="outline" className="w-full sm:w-auto flex-grow">
          <Link href={`/proposals/${proposal.id}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full sm:w-auto" disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the proposal "{proposal.name}" and all its associated documents.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
