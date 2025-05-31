
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Proposal } from '@/types';
import { FileText, ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProposalCardProps {
  proposal: Proposal;
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

export function ProposalCard({ proposal }: ProposalCardProps) {
  const formattedDate = new Date(proposal.createdAt).toLocaleDateString();
  const signatureStatus = proposal.signatureAnalysisStatus || 'Not Started';
  const lowerSignatureStatus = signatureStatus.toLowerCase();

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
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/proposals/${proposal.id}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
