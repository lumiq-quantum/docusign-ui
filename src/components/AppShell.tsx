
"use client";

import * as React from "react";
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppLogo } from "@/components/AppLogo";
import { UserNav } from "@/components/UserNav";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, FileText, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Proposal } from "@/types"; // Assuming recent proposals could be listed

interface AppShellProps {
  children: React.ReactNode;
  recentProposals?: Proposal[]; // Optional: for quick access in sidebar
}

export function AppShell({ children, recentProposals = [] }: AppShellProps) {
  const pathname = usePathname();
  const [isRecentProposalsOpen, setIsRecentProposalsOpen] = React.useState(true);

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <div className="hidden md:block">
              <AppLogo />
            </div>
          </div>
          <div className="md:hidden">
             <AppLogo />
          </div>
          <UserNav />
        </header>
        <div className="flex flex-1 w-full"> {/* Ensure this flex container itself takes full width */}
          <Sidebar className="border-r" collapsible="icon" side="left">
            <SidebarContent asChild>
              <ScrollArea className="h-full">
                <SidebarMenu className="p-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/"}
                      tooltip="Dashboard"
                    >
                      <Link href="/">
                        <Home />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {recentProposals.length > 0 && (
                     <Collapsible open={isRecentProposalsOpen} onOpenChange={setIsRecentProposalsOpen} className="w-full">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="justify-between group-data-[collapsible=icon]:hidden">
                            <div className="flex items-center gap-2"> <FileText /> Recent Proposals </div>
                            {isRecentProposalsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                       <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                        <SidebarMenu className="pl-6 py-1 border-l ml-[15px] border-dashed">
                          {recentProposals.slice(0,3).map((proposal) => (
                            <SidebarMenuItem key={proposal.id}>
                              <SidebarMenuButton
                                asChild
                                isActive={pathname === `/proposals/${proposal.id}`}
                                variant="ghost"
                                size="sm"
                                className="justify-start"
                              >
                                <Link href={`/proposals/${proposal.id}`}>
                                  <span>{proposal.name}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </SidebarMenu>
              </ScrollArea>
            </SidebarContent>
            <SidebarFooter className="p-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/settings"} tooltip="Settings">
                    <Link href="#"> {/* Replace # with actual settings path if needed */}
                      <Settings />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset className="flex-1 overflow-y-auto">
            <main className="p-4 md:p-6 lg:p-8 w-full"> {/* Ensure main content within inset takes full width */}
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
