

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
  chatSessionId?: string | null; // Assuming this can be provided by the API
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
  // textract_response_json not directly used in UI for now.
  isConsistentWithStakeholderGroup?: boolean | null;
  isUniqueAmongStakeholders?: boolean | null;
  analysisNotes?: string | null;
  // imageUrl will be client-managed or fetched via its own action
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
  chat_session_id?: string | null; // Assuming API provides this
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
  document_id: number; // Part of API response for SignatureInstance
  stakeholder_id?: number | null;
  ai_signature_id?: string | null;
  ai_confidence?: string | null; // API sends as string
  bounding_box_json?: { x: number; y: number; width: number; height: number; } | Record<string, any> | null; // Flexible for now
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
