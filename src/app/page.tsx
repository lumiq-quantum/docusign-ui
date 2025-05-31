
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { CreateProposalDialog } from '@/components/proposals/CreateProposalDialog';
import { ProposalCard } from '@/components/proposals/ProposalCard';
import { getProposalsAction } from '@/lib/actions';
import type { Proposal } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, FileText as FileTextIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProposals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getProposalsAction();
      if (result.error) {
        setError(result.error);
        setProposals([]);
      } else {
        setProposals(result.proposals || []);
      }
    } catch (e: any) {
      setError("Failed to load proposals. Please try again later: " + e.message);
      setProposals([]);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleProposalCreated = () => {
    fetchProposals(); // Re-fetch proposals when a new one is created
  };

  const handleProposalDeleted = (deletedProposalId: number) => {
    setProposals(prevProposals => prevProposals.filter(p => p.id !== deletedProposalId));
    // Optionally, you can re-fetch all proposals from the server to ensure consistency
    // fetchProposals(); 
  };


  const filteredProposals = proposals.filter(proposal =>
    proposal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (proposal.applicationNumber && proposal.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppShell recentProposals={proposals}>
      <PageHeader
        title="Proposals Dashboard"
        description="Manage your proposals and documents."
        actions={<CreateProposalDialog onProposalCreated={handleProposalCreated} />}
      />
      
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search proposals by name or app number..."
            className="w-full rounded-lg bg-card pl-8 md:w-1/2 lg:w-1/3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProposals.length === 0 ? (
         <div className="text-center py-10">
            <FileTextIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No proposals found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm ? "Try adjusting your search term." : "Get started by creating a new proposal."}
            </p>
          </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} onProposalDeleted={handleProposalDeleted} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 p-4 border rounded-lg shadow bg-card">
      <Skeleton className="h-[20px] w-[200px] rounded-md" />
      <Skeleton className="h-[16px] w-[250px] rounded-md" />
      <div className="space-y-2 pt-4">
        <Skeleton className="h-[16px] w-full rounded-md" />
        <Skeleton className="h-[16px] w-[150px] rounded-md" />
      </div>
      <Skeleton className="h-[40px] w-full rounded-md mt-auto" />
    </div>
  );
}
