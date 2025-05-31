"use client";

import { useState, useTransition } from 'react';
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
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from 'lucide-react';

export function CreateProposalDialog({ onProposalCreated }: { onProposalCreated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('name', name);

    startTransition(async () => {
      const result = await createProposalAction(formData);
      if (result.error) {
        // Handle Zod errors specifically if they are structured that way
        if (typeof result.error === 'object' && result.error.name) {
             toast({ title: "Error", description: result.error.name.join(', '), variant: "destructive" });
        } else if (typeof result.error === 'string') {
             toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Error", description: "An unknown error occurred.", variant: "destructive" });
        }
      } else if (result.proposal) {
        toast({ title: "Success", description: `Proposal "${result.proposal.name}" created.` });
        setIsOpen(false);
        setName('');
        onProposalCreated(); // Callback to refresh list or navigate
        router.push(`/proposals/${result.proposal.id}`);
      }
    });
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Proposal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
