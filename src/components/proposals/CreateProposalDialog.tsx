
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProposalAction } from '@/lib/actions';
import type { ProposalCreatePayload } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from 'lucide-react';

export function CreateProposalDialog({ onProposalCreated }: { onProposalCreated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.length < 3) {
      toast({ title: "Validation Error", description: "Proposal name must be at least 3 characters.", variant: "destructive" });
      return;
    }
    
    setIsPending(true);
    const payload: ProposalCreatePayload = { name };

    try {
      const result = await createProposalAction(payload);
      if (result.error) {
        let errorMessage = "An unknown error occurred.";
        if (typeof result.error === 'string') {
            errorMessage = result.error;
        } else if (result.error && Array.isArray(result.error) && result.error.length > 0 && typeof result.error[0] === 'string') {
            // Handle specific Zod-like error array format from API if necessary
            errorMessage = result.error.join(', ');
        } else if (typeof result.error === 'object' && result.error.detail) { // Common for FastAPI validation
             errorMessage = String(result.error.detail);
        } else if (result.error && typeof result.error === 'object' && result.error.name && Array.isArray(result.error.name)) { // Original handling
            errorMessage = result.error.name.join(', ');
        }

        toast({ title: "Error Creating Proposal", description: errorMessage, variant: "destructive" });
      } else if (result.proposal) {
        toast({ title: "Success", description: `Proposal "${result.proposal.name}" created.` });
        setIsOpen(false);
        setName('');
        onProposalCreated(); 
        router.push(`/proposals/${result.proposal.id}`);
      }
    } catch (e: any) {
        toast({ title: "Error", description: "An unexpected error occurred: " + e.message, variant: "destructive" });
    } finally {
        setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Proposal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Proposal</DialogTitle>
          <DialogDescription>
            Enter a name for your new proposal. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
                minLength={3}
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending || name.length < 3}>
              {isPending ? "Saving..." : "Save Proposal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
