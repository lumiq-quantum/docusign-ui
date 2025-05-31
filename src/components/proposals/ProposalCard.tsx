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
  switch (status) {
    case 'Completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'In Progress':
      return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'Failed':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

export function ProposalCard({ proposal }: ProposalCardProps) {
  const formattedDate = new Date(proposal.createdAt).toLocaleDateString();

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-headline text-lg">{proposal.name}</CardTitle>
        <CardDescription>
          App No: {proposal.applicationNumber} | Created: {formattedDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <FileText className="mr-2 h-4 w-4" />
          <span>{proposal.documents.length} document{proposal.documents.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center text-sm">
          <StatusIcon status={proposal.signatureAnalysisStatus} />
          <span className="ml-2">Signature Analysis:</span>
          <Badge variant={
            proposal.signatureAnalysisStatus === 'Completed' ? 'default' : 
            proposal.signatureAnalysisStatus === 'In Progress' ? 'secondary' :
            proposal.signatureAnalysisStatus === 'Failed' ? 'destructive' : 'outline'
          } className="ml-2 text-xs">
            {proposal.signatureAnalysisStatus || 'Not Started'}
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
