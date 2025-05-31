
// Maps to ProjectResponse in OpenAPI
export interface Proposal {
  id: number;
  applicationNumber: string | null;
  name: string;
  createdAt: string; // ISO date string from created_at
  documents: Document[]; // from documents in ProjectResponse
  signatureAnalysisStatus: string | null; // from signature_analysis_status
  signatureAnalysisReportHtml?: string | null; // from signature_analysis_report_html
  chatSessionId?: string | null; // from chat_session_id
}

// Maps to DocumentResponse in OpenAPI
export interface Document {
  id: number;
  name: string; // from file_name
  uploadedAt: string; // ISO date string from created_at
  totalPages: number; // from total_pages
  projectId: number; // from project_id
  pages: Page[]; // from pages in DocumentResponse
  chatSessionId?: string | null;
}

// Maps to PageResponse in OpenAPI
export interface Page {
  id: number;
  pageNumber: number; // from page_number
  htmlContent?: string | null; // from generated_form_html
  textContent?: string | null; // from text_content
  signatures: Signature[]; // from signatures in PageResponse
  documentId: number; // from document_id
}

// Maps to SignatureInstanceResponse in OpenAPI
export interface Signature {
  id: number;
  pageId: number;
  documentId: number; // Not directly on SignatureInstanceResponse, but useful context. Can be inferred.
  stakeholderId?: number | null;
  aiSignatureId?: string | null;
  confidence?: number | null; // Parsed from ai_confidence (string|null)
  // Assuming bounding_box_json is { x: number, y: number, width: number, height: number }
  coordinates?: { x: number; y: number; width: number; height: number; } | null; // from bounding_box_json
  isConsistentWithStakeholderGroup?: boolean | null;
  isUniqueAmongStakeholders?: boolean | null;
  analysisNotes?: string | null;
  imageUrl?: string;
}

// For API responses that might not be full Proposal/Document objects initially
export interface ApiProposal extends Omit<Proposal, 'documents' | 'chatSessionId'> {
  application_number: string | null;
  created_at: string;
  signature_analysis_status: string | null;
  signature_analysis_report_html?: string | null;
  chat_session_id?: string | null;
  documents: ApiDocument[];
}

export interface ApiDocument extends Omit<Document, 'pages' | 'chatSessionId'> {
  file_name: string;
  project_id: number;
  created_at: string;
  total_pages: number;
  chat_session_id?: string | null;
  pages: ApiPage[];
}

export interface ApiPage extends Omit<Page, 'signatures' | 'htmlContent'> {
  page_number: number;
  document_id: number;
  generated_form_html: string | null;
  text_content: string | null;
  signatures: ApiSignature[];
}

export interface ApiSignature {
  id: number;
  page_id: number;
  document_id: number; 
  stakeholder_id?: number | null;
  ai_signature_id?: string | null;
  ai_confidence?: string | null; 
  bounding_box_json?: { x: number; y: number; width: number; height: number; } | Record<string, any> | null; 
  textract_response_json?: Record<string, any> | null;
  is_consistent_with_stakeholder_group?: boolean | null;
  is_unique_among_stakeholders?: boolean | null;
  analysis_notes?: string | null;
}

// For creating a proposal, maps to ProjectCreate
export interface ProposalCreatePayload {
  name: string;
  chat_session_id?: string | null;
}

// Chat specific types
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string; // ISO date string
  file_uri?: string | null;
  file_mime_type?: string | null;
}

export interface ChatSessionInfo {
  id: string;
  title: string;
  created_at: string; // ISO date string
}

export interface ChatHistoryResponse {
  session: ChatSessionInfo;
  messages: ChatMessage[];
}

// Signature Analysis Report Data Types
export type ReportStatus = 'Verified' | 'Warnings Found' | 'Mismatch Detected' | 'In Progress' | 'Not Started' | 'Error' | 'N/A' | 'Match' | 'Mismatch' | 'Unique' | 'Potential Match' | 'Requires Review' | 'Not Processed';

export interface ReportOverallSummary {
  documentsAnalyzed: {
    count: number;
    names: string[];
  };
  stakeholdersIdentified: {
    count: number;
    names: string[];
  };
  overallStatus: {
    status: ReportStatus;
    description: string;
  };
}

export interface SignatureInstanceDetail {
  signatureInstanceId: number;
  documentName: string;
  documentId: number;
  pageNumber: number;
  role: string;
}

export interface StakeholderAnalysis {
  stakeholderId: string;
  stakeholderName: string;
  roles: string;
  status: ReportStatus;
  signatureInstances: SignatureInstanceDetail[];
  analysisResults: {
    intraStakeholderConsistency: {
      result: ReportStatus;
      confidence?: number | null;
      notes?: string;
    };
    interStakeholderUniqueness: {
      result: ReportStatus;
      notes?: string;
    };
  };
}

export interface CrossStakeholderUniquenessVerification {
  stakeholderPair: string;
  comparisonResultDescription: string;
  status: ReportStatus;
}

export interface SignatureAnalysisReportData {
  proposalId: number;
  proposalName: string;
  proposalApplicationNumber: string | null;
  generatedAt: string; // ISO Date string
  overallSummary: ReportOverallSummary;
  stakeholderAnalyses: StakeholderAnalysis[];
  crossStakeholderUniqueness: CrossStakeholderUniquenessVerification[];
}

// Zod Schemas for validation (optional, but good practice if data comes from API)
import { z } from 'zod';

export const ReportStatusSchema = z.enum(['Verified', 'Warnings Found', 'Mismatch Detected', 'In Progress', 'Not Started', 'Error', 'N/A', 'Match', 'Mismatch', 'Unique', 'Potential Match', 'Requires Review', 'Not Processed']);

export const ReportOverallSummarySchema = z.object({
  documentsAnalyzed: z.object({
    count: z.number(),
    names: z.array(z.string()),
  }),
  stakeholdersIdentified: z.object({
    count: z.number(),
    names: z.array(z.string()),
  }),
  overallStatus: z.object({
    status: ReportStatusSchema,
    description: z.string(),
  }),
});

export const SignatureInstanceDetailSchema = z.object({
  signatureInstanceId: z.number(),
  documentName: z.string(),
  documentId: z.number(),
  pageNumber: z.number(),
  role: z.string(),
});

export const StakeholderAnalysisSchema = z.object({
  stakeholderId: z.string(),
  stakeholderName: z.string(),
  roles: z.string(),
  status: ReportStatusSchema,
  signatureInstances: z.array(SignatureInstanceDetailSchema),
  analysisResults: z.object({
    intraStakeholderConsistency: z.object({
      result: ReportStatusSchema,
      confidence: z.number().nullable().optional(),
      notes: z.string().optional(),
    }),
    interStakeholderUniqueness: z.object({
      result: ReportStatusSchema,
      notes: z.string().optional(),
    }),
  }),
});

export const CrossStakeholderUniquenessVerificationSchema = z.object({
  stakeholderPair: z.string(),
  comparisonResultDescription: z.string(),
  status: ReportStatusSchema,
});

export const SignatureAnalysisReportDataSchema = z.object({
  proposalId: z.number(),
  proposalName: z.string(),
  proposalApplicationNumber: z.string().nullable(),
  generatedAt: z.string().datetime(),
  overallSummary: ReportOverallSummarySchema,
  stakeholderAnalyses: z.array(StakeholderAnalysisSchema),
  crossStakeholderUniqueness: z.array(CrossStakeholderUniquenessVerificationSchema),
});
