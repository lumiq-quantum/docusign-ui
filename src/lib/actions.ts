
import { z } from 'zod';
import type { Proposal, Document, Signature, Page, ProposalCreatePayload, ApiProposal, ApiDocument, ApiPage, ApiSignature } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Log the detected API_BASE_URL when the module is loaded
if (typeof window !== 'undefined') { // Client-side
  console.log(`[actions.ts] CLIENT_SIDE: NEXT_PUBLIC_API_BASE_URL detected as: "${API_BASE_URL}"`);
} else { // Server-side (though these actions are now intended for client)
  console.log(`[actions.ts] SERVER_SIDE: NEXT_PUBLIC_API_BASE_URL detected as: "${API_BASE_URL}"`);
}


const API_NOT_CONFIGURED_ERROR = `API endpoint (NEXT_PUBLIC_API_BASE_URL) is not configured or is an empty string. Detected value: "${API_BASE_URL}". Please ensure your .env file is at the root of your project with NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 (or your actual API URL) and restart the Next.js development server. Then clear your browser cache.`;

// Helper to transform API proposal to client-side Proposal
function transformApiProposal(apiProposal: ApiProposal): Proposal {
  return {
    ...apiProposal,
    applicationNumber: apiProposal.application_number,
    createdAt: apiProposal.created_at,
    signatureAnalysisStatus: apiProposal.signature_analysis_status,
    signatureAnalysisReportHtml: apiProposal.signature_analysis_report_html,
    documents: apiProposal.documents.map(transformApiDocument),
  };
}

// Helper to transform API document to client-side Document
function transformApiDocument(apiDoc: ApiDocument): Document {
  return {
    id: apiDoc.id,
    name: apiDoc.file_name,
    uploadedAt: apiDoc.created_at,
    totalPages: apiDoc.total_pages,
    projectId: apiDoc.project_id,
    pages: (apiDoc.pages || []).map(apiPage => transformApiPage(apiPage, apiDoc.id)),
  };
}

// Helper to transform API page to client-side Page
function transformApiPage(apiPage: ApiPage, documentId: number): Page {
    return {
        id: apiPage.id,
        pageNumber: apiPage.page_number,
        htmlContent: apiPage.generated_form_html, // This is for data, not direct view
        textContent: apiPage.text_content,
        signatures: (apiPage.signatures || []).map(apiSig => transformApiSignature(apiSig, documentId)),
        documentId: apiPage.document_id,
    };
}


// Helper to transform API signature to client-side Signature
function transformApiSignature(apiSig: ApiSignature, documentId: number): Signature {
  let parsedConfidence: number | null = null;
  if (apiSig.ai_confidence !== null && apiSig.ai_confidence !== undefined) {
    const conf = parseFloat(apiSig.ai_confidence);
    if (!isNaN(conf)) {
      parsedConfidence = conf;
    }
  }
  return {
    id: apiSig.id,
    pageId: apiSig.page_id,
    documentId: documentId, 
    stakeholderId: apiSig.stakeholder_id,
    aiSignatureId: apiSig.ai_signature_id,
    confidence: parsedConfidence,
    coordinates: apiSig.bounding_box_json as { x: number; y: number; width: number; height: number; } | null,
    isConsistentWithStakeholderGroup: apiSig.is_consistent_with_stakeholder_group,
    isUniqueAmongStakeholders: apiSig.is_unique_among_stakeholders,
    analysisNotes: apiSig.analysis_notes,
  };
}


export async function getProposalsAction(): Promise<{ proposals?: Proposal[]; error?: string }> {
  if (!API_BASE_URL) {
    console.error(`getProposalsAction: API_BASE_URL not configured. Current value: "${API_BASE_URL}"`);
    return { error: API_NOT_CONFIGURED_ERROR };
  }
  try {
    const response = await fetch(`${API_BASE_URL}/proposals/`);
    if (!response.ok) {
      return { error: `Failed to fetch proposals: ${response.statusText} (Status: ${response.status}) from ${API_BASE_URL}/proposals/` };
    }
    const apiProposals: ApiProposal[] = await response.json();
    return { proposals: apiProposals.map(transformApiProposal) };
  } catch (error) {
    console.error("getProposalsAction error:", error);
    return { error: `An unexpected error occurred while fetching proposals from ${API_BASE_URL}. Is the API server running? Details: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function getProposalByIdAction(proposalId: number): Promise<{ proposal?: Proposal; error?: string }> {
  if (!API_BASE_URL) {
    console.error(`getProposalByIdAction: API_BASE_URL not configured. Current value: "${API_BASE_URL}"`);
    return { error: API_NOT_CONFIGURED_ERROR };
  }
  try {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/`);
    if (!response.ok) {
      if (response.status === 404) return { error: "Proposal not found." };
      return { error: `Failed to fetch proposal: ${response.statusText} (Status: ${response.status}) from ${API_BASE_URL}/proposals/${proposalId}/` };
    }
    const apiProposal: ApiProposal = await response.json();
    return { proposal: transformApiProposal(apiProposal) };
  } catch (error) {
    console.error("getProposalByIdAction error:", error);
    return { error: `An unexpected error occurred while fetching the proposal from ${API_BASE_URL}. Is the API server running? Details: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function createProposalAction(payload: ProposalCreatePayload): Promise<{ proposal?: Proposal; error?: any }> {
  if (!API_BASE_URL) {
    console.error(`createProposalAction: API_BASE_URL not configured. Current value: "${API_BASE_URL}"`);
    return { error: API_NOT_CONFIGURED_ERROR };
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/proposals/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
       const errorData = await response.json().catch(() => ({ detail: response.statusText }));
       return { error: errorData.detail || errorData.name || `Failed to create proposal: HTTP ${response.status} from ${API_BASE_URL}/proposals/` };
    }
    const newApiProposal: ApiProposal = await response.json();
    return { proposal: transformApiProposal(newApiProposal) };
  } catch (error) {
    console.error("createProposalAction error:", error);
    return { error: `Failed to create proposal due to a network or unexpected error from ${API_BASE_URL}. Is the API server running? Details: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function addDocumentToProposalAction(proposalId: number, file: File): Promise<{ document?: Document; error?: string }> {
  if (!API_BASE_URL) {
    console.error(`addDocumentToProposalAction: API_BASE_URL not configured. Current value: "${API_BASE_URL}"`);
    return { error: API_NOT_CONFIGURED_ERROR };
  }
  if (!proposalId) return { error: "Proposal ID is required." };
  if (!file) return { error: "File is required." };

  const formData = new FormData();
  formData.append('files', file);

  try {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/documents/`, {
      method: 'POST',
      body: formData, 
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      return { error: errorData.detail || `Failed to upload document: HTTP ${response.status} from ${API_BASE_URL}/proposals/${proposalId}/documents/` };
    }
    
    const apiDocuments: ApiDocument[] = await response.json();
    if (apiDocuments.length > 0) {
      return { document: transformApiDocument(apiDocuments[0]) };
    }
    return { error: "No document data returned from API." };
  } catch (error) {
    console.error("addDocumentToProposalAction error:", error);
    return { error: `An unexpected error occurred while adding the document via ${API_BASE_URL}. Is the API server running? Details: ${error instanceof Error ? error.message : String(error)}` };
  }
}


export async function startSignatureAnalysisAction(proposalId: number): Promise<{ message?: string; error?: string }> {
  if (!API_BASE_URL) {
    console.error(`startSignatureAnalysisAction: API_BASE_URL not configured. Current value: "${API_BASE_URL}"`);
    return { error: API_NOT_CONFIGURED_ERROR };
  }
  if (!proposalId) return { error: "Proposal ID is required." };

  try {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/signature-analysis/start`, {
      method: 'POST',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      return { error: errorData.detail || `Failed to start signature analysis: HTTP ${response.status} from ${API_BASE_URL}/proposals/${proposalId}/signature-analysis/start` };
    }
    
    const result: { message?: string, detail?: any } = await response.json();
    return { message: result.message || "Signature analysis started." };
  } catch (e) {
    console.error("startSignatureAnalysisAction error:", e);
    return { error: `Signature analysis failed to start due to an unexpected error from ${API_BASE_URL}. Is the API server running? Details: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function extractHtmlAction(proposalId: number, documentId: number, pageNumber: number): Promise<{ message?: string; error?: string }> {
  if (!API_BASE_URL) {
    console.error(`extractHtmlAction: API_BASE_URL not configured. Current value: "${API_BASE_URL}"`);
    return { error: API_NOT_CONFIGURED_ERROR };
  }
  if (!proposalId || !documentId || pageNumber === undefined) return { error: "Missing parameters for HTML extraction." };
  
  try {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/documents/${documentId}/extract-html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      return { error: errorData.detail || `Failed to trigger HTML extraction: HTTP ${response.status} from ${API_BASE_URL}/proposals/${proposalId}/documents/${documentId}/extract-html` };
    }
    const result: { message?: string, detail?: any } = await response.json(); 
    return { message: result.message || "HTML extraction process started." };
  } catch (e) {
    console.error("extractHtmlAction error:", e);
    return { error: `Failed to extract HTML due to an unexpected error from ${API_BASE_URL}. Is the API server running? Details: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export function getSignatureImageUrlAction(proposalId: number, signatureInstanceId: number): { imageUrl?: string; error?: string } {
  if (!API_BASE_URL) {
    console.error(`getSignatureImageUrlAction: API_BASE_URL not configured. Current value: "${API_BASE_URL}"`);
    return { error: API_NOT_CONFIGURED_ERROR };
  }
  try {
    const imageUrl = `${API_BASE_URL}/proposals/${proposalId}/signatures/${signatureInstanceId}/image`;
    return { imageUrl };
  } catch (error) {
    console.error("getSignatureImageUrlAction error:", error);
    return { error: `An unexpected error occurred constructing signature image URL. Details: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export function getDocumentPagePdfUrlAction(proposalId: number, documentId: number, pageNumber: number): { url?: string; error?: string } {
  if (!API_BASE_URL) {
    console.error(`getDocumentPagePdfUrlAction: API_BASE_URL not configured. Current value: "${API_BASE_URL}"`);
    return { error: API_NOT_CONFIGURED_ERROR };
  }
   try {
    const pdfUrl = `${API_BASE_URL}/proposals/${proposalId}/documents/${documentId}/pages/${pageNumber}/pdf`;
    return { url: pdfUrl };
  } catch (error) {
    console.error("getDocumentPagePdfUrlAction error:", error);
    return { error: `An unexpected error occurred while constructing PDF page URL. Details: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// Returns the URL for direct HTML view via iframe
export function getDocumentPageHtmlViewUrlAction(proposalId: number, documentId: number, pageNumber: number): { url?: string; error?: string } {
  if (!API_BASE_URL) {
    console.error(`getDocumentPageHtmlViewUrlAction: API_BASE_URL not configured. Current value: "${API_BASE_URL}"`);
    return { error: API_NOT_CONFIGURED_ERROR };
  }
  try {
    const htmlViewUrl = `${API_BASE_URL}/proposals/${proposalId}/documents/${documentId}/pages/${pageNumber}/html_view`;
    return { url: htmlViewUrl };
  } catch (error) {
    console.error("getDocumentPageHtmlViewUrlAction error:", error);
    return { error: `An unexpected error occurred constructing HTML view URL. Details: ${error instanceof Error ? error.message : String(error)}` };
  }
}


// Action to delete a proposal
export async function deleteProposalAction(proposalId: number): Promise<{ success?: boolean; error?: string }> {
  if (!API_BASE_URL) {
    console.error(`deleteProposalAction: API_BASE_URL not configured. Current value: "${API_BASE_URL}"`);
    return { error: API_NOT_CONFIGURED_ERROR };
  }
  try {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/`, {
      method: 'DELETE',
    });
    if (response.status === 204) { 
      return { success: true };
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      return { error: errorData.detail || `Failed to delete proposal: HTTP ${response.status} from ${API_BASE_URL}/proposals/${proposalId}/` };
    }
    return { success: true }; 
  } catch (error) {
    console.error("deleteProposalAction error:", error);
    return { error: `An unexpected error occurred while deleting the proposal from ${API_BASE_URL}. Is the API server running? Details: ${error instanceof Error ? error.message : String(error)}` };
  }
}
