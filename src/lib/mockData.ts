import type { Proposal, Document } from '@/types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const MOCK_DOCUMENTS_P1: Document[] = [
  {
    id: 'doc_001',
    name: 'Initial Agreement Q1.pdf',
    uploadedAt: new Date(2023, 0, 15).toISOString(),
    totalPages: 5,
    type: 'pdf',
    size: 1024 * 500, // 500KB
    extractedHtml: {},
  },
  {
    id: 'doc_002',
    name: 'Scope of Work Final.pdf',
    uploadedAt: new Date(2023, 0, 20).toISOString(),
    totalPages: 12,
    type: 'pdf',
    size: 1024 * 1200, // 1.2MB
    extractedHtml: {},
  },
];

export const MOCK_DOCUMENTS_P2: Document[] = [
  {
    id: 'doc_003',
    name: 'Project Alpha NDA.pdf',
    uploadedAt: new Date(2023, 1, 10).toISOString(),
    totalPages: 3,
    type: 'pdf',
    size: 1024 * 300, // 300KB
    extractedHtml: {},
  },
];

export const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'prop_001',
    applicationNumber: `APP-${generateId().toUpperCase()}`,
    name: 'Quarterly Business Review Documents',
    createdAt: new Date(2023, 0, 10).toISOString(),
    documents: MOCK_DOCUMENTS_P1,
    signatureAnalysisStatus: 'Not Started',
  },
  {
    id: 'prop_002',
    applicationNumber: `APP-${generateId().toUpperCase()}`,
    name: 'New Client Onboarding Pack',
    createdAt: new Date(2023, 1, 5).toISOString(),
    documents: MOCK_DOCUMENTS_P2,
    signatureAnalysisStatus: 'Completed',
    signatureAnalysisSummary: 'All 3 signatures verified with high confidence. No anomalies detected.',
    signatureAnalysisReportHtml: '<div><h1>Signature Report</h1><p>Details for New Client Onboarding Pack...</p><p><b>Signature 1:</b> John Doe - Page 2 - Verified</p></div>',
  },
  {
    id: 'prop_003',
    applicationNumber: `APP-${generateId().toUpperCase()}`,
    name: 'Investment Round A Pitch Deck',
    createdAt: new Date(2023, 2, 1).toISOString(),
    documents: [],
    signatureAnalysisStatus: 'Not Started',
  },
];

// In-memory store for proposals, simulating a database
let proposalsStore: Proposal[] = [...MOCK_PROPOSALS];

export const getProposals = async (): Promise<Proposal[]> => {
  return JSON.parse(JSON.stringify(proposalsStore));
};

export const getProposalById = async (id: string): Promise<Proposal | undefined> => {
  return JSON.parse(JSON.stringify(proposalsStore.find(p => p.id === id)));
};

export const createProposal = async (name: string): Promise<Proposal> => {
  const newProposal: Proposal = {
    id: `prop_${generateId()}`,
    applicationNumber: `APP-${generateId().toUpperCase()}`,
    name,
    createdAt: new Date().toISOString(),
    documents: [],
    signatureAnalysisStatus: 'Not Started',
  };
  proposalsStore.push(newProposal);
  return JSON.parse(JSON.stringify(newProposal));
};

export const addDocumentToProposal = async (proposalId: string, file: File): Promise<Document | null> => {
  const proposal = proposalsStore.find(p => p.id === proposalId);
  if (!proposal) return null;

  const newDocument: Document = {
    id: `doc_${generateId()}`,
    name: file.name,
    uploadedAt: new Date().toISOString(),
    // Mock totalPages, actual PDF processing would be needed
    totalPages: Math.floor(Math.random() * 20) + 1, 
    type: 'pdf',
    size: file.size,
    extractedHtml: {},
  };
  proposal.documents.push(newDocument);
  return JSON.parse(JSON.stringify(newDocument));
};

export const updateProposal = async (updatedProposal: Proposal): Promise<Proposal | undefined> => {
  const index = proposalsStore.findIndex(p => p.id === updatedProposal.id);
  if (index !== -1) {
    proposalsStore[index] = JSON.parse(JSON.stringify(updatedProposal));
    return proposalsStore[index];
  }
  return undefined;
};

export const getDocumentById = async (proposalId: string, documentId: string): Promise<Document | undefined> => {
  const proposal = await getProposalById(proposalId);
  return proposal?.documents.find(doc => doc.id === documentId);
};

export const setDocumentExtractedHtml = async (proposalId: string, documentId: string, pageNumber: number, html: string): Promise<void> => {
  const proposal = proposalsStore.find(p => p.id === proposalId);
  if (proposal) {
    const doc = proposal.documents.find(d => d.id === documentId);
    if (doc) {
      if(!doc.extractedHtml) doc.extractedHtml = {};
      doc.extractedHtml[pageNumber] = html;
    }
  }
};
