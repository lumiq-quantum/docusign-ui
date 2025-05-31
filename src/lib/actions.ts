
'use server';

import { z } from 'zod';
import type { Proposal, Document, Signature, Page, ProposalCreatePayload, ApiProposal, ApiDocument, ApiPage, ApiSignature } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
        htmlContent: apiPage.generated_form_html,
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
    documentId: documentId, // apiSig.document_id is available in SignatureInstanceResponse from API
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
  try {
    const response = await fetch(`${API_BASE_URL}/proposals/`);
    if (!response.ok) {
      return { error: `Failed to fetch proposals: ${response.statusText}` };
    }
    const apiProposals: ApiProposal[] = await response.json();
    return { proposals: apiProposals.map(transformApiProposal) };
  } catch (error) {
    console.error("getProposalsAction error:", error);
    return { error: "An unexpected error occurred while fetching proposals." };
  }
}

export async function getProposalByIdAction(proposalId: number): Promise<{ proposal?: Proposal; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/`);
    if (!response.ok) {
      if (response.status === 404) return { error: "Proposal not found." };
      return { error: `Failed to fetch proposal: ${response.statusText}` };
    }
    const apiProposal: ApiProposal = await response.json();
    return { proposal: transformApiProposal(apiProposal) };
  } catch (error) {
    console.error("getProposalByIdAction error:", error);
    return { error: "An unexpected error occurred while fetching the proposal." };
  }
}


// Schema for creating a proposal
const CreateProposalFormSchema = z.object({
  name: z.string().min(3, { message: "Proposal name must be at least 3 characters." }),
});

export async function createProposalAction(formData: FormData) {
  const validatedFields = CreateProposalFormSchema.safeParse({
    name: formData.get('name'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const payload: ProposalCreatePayload = { name: validatedFields.data.name };

  try {
    const response = await fetch(`${API_BASE_URL}/proposals/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
       const errorData = await response.json().catch(() => ({ detail: response.statusText }));
       return { error: errorData.detail || `Failed to create proposal: HTTP ${response.status}` };
    }
    const newApiProposal: ApiProposal = await response.json();
    return { proposal: transformApiProposal(newApiProposal) };
  } catch (error) {
    console.error("createProposalAction error:", error);
    return { error: "Failed to create proposal due to a network or unexpected error." };
  }
}

export async function addDocumentToProposalAction(proposalId: number, file: File): Promise<{ document?: Document; error?: string }> {
  if (!proposalId) return { error: "Proposal ID is required." };
  if (!file) return { error: "File is required." };

  const formData = new FormData();
  formData.append('files', file);

  try {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/documents/`, {
      method: 'POST',
      body: formData, // Content-Type will be set automatically by browser for FormData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      return { error: errorData.detail || `Failed to upload document: HTTP ${response.status}` };
    }
    // API returns an array of DocumentResponse, we assume one file upload at a time here.
    const apiDocuments: ApiDocument[] = await response.json();
    if (apiDocuments.length > 0) {
      return { document: transformApiDocument(apiDocuments[0]) };
    }
    return { error: "No document data returned from API." };
  } catch (error) {
    console.error("addDocumentToProposalAction error:", error);
    return { error: "An unexpected error occurred while adding the document." };
  }
}


export async function startSignatureAnalysisAction(proposalId: number): Promise<{ message?: string; error?: string }> {
  if (!proposalId) return { error: "Proposal ID is required." };

  try {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/signature-analysis/start`, {
      method: 'POST',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      return { error: errorData.detail || `Failed to start signature analysis: HTTP ${response.status}` };
    }
    // The API returns {"additionalProperties": {"type": "string"}}, let's assume a message.
    const result: { message?: string, detail?: any } = await response.json();
    return { message: result.message || "Signature analysis started." };
  } catch (e) {
    console.error("startSignatureAnalysisAction error:", e);
    return { error: "Signature analysis failed to start due to an unexpected error." };
  }
}

export async function extractHtmlAction(proposalId: number, documentId: number, pageNumber: number): Promise<{ message?: string; error?: string }> {
  if (!proposalId || !documentId || pageNumber === undefined) return { error: "Missing parameters." };
  
  try {
    // The API spec for POST /extract-html does not take a page_number.
    // Assuming it's for the whole document, or the backend handles page context if needed.
    // If page_number is crucial for this POST, the API spec/backend needs to support it in the body.
    // For now, sending it in the body:
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/documents/${documentId}/extract-html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The API spec has no requestBody. This is an assumption:
      body: JSON.stringify({ page_number: pageNumber }) 
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      return { error: errorData.detail || `Failed to trigger HTML extraction: HTTP ${response.status}` };
    }
    const result: { message?: string, detail?: any } = await response.json(); // API returns generic object
    return { message: result.message || "HTML extraction process started." };
  } catch (e) {
    console.error("extractHtmlAction error:", e);
    return { error: "Failed to extract HTML due to an unexpected error." };
  }
}

export async function getSignatureImageUrlAction(proposalId: number, signatureInstanceId: number): Promise<{ imageUrl?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/signatures/${signatureInstanceId}/image`);
    if (!response.ok) {
      return { error: `Failed to fetch signature image: ${response.statusText}` };
    }
    // Assuming API returns JSON with an image URL, e.g. { "url": "..." }
    // If API returns blob: const blob = await response.blob(); return { imageUrl: URL.createObjectURL(blob) };
    // Given the OpenAPI spec returns empty JSON {}, it's safer to assume the URL is the endpoint itself.
    // This means the component <Image src={urlFromAction}> will point directly to the API.
    // Or the API provides a pre-signed URL. For now, let's return the API endpoint itself as the URL.
    // This assumes the API endpoint /image directly serves the image with correct content-type.
    return { imageUrl: `${API_BASE_URL}/proposals/${proposalId}/signatures/${signatureInstanceId}/image` };
  } catch (error) {
    console.error("getSignatureImageUrlAction error:", error);
    return { error: "An unexpected error occurred fetching signature image." };
  }
}

export async function getDocumentPagePdfUrlAction(proposalId: number, documentId: number, pageNumber: number): Promise<{ url?: string; error?: string }> {
   try {
    // Similar to getSignatureImageUrlAction, assume this endpoint directly serves the PDF page image,
    // or returns JSON with a URL. The spec says empty JSON.
    // Returning direct API endpoint URL.
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/documents/${documentId}/pages/${pageNumber}/pdf`);
    if (!response.ok) {
        if (response.status === 404) return { error: "PDF page not found."};
        return { error: `Failed to load PDF page: ${response.statusText}` };
    }
    // Assuming the API returns a URL in a JSON structure e.g. { "url": "..." }
    // If API returns the image/pdf directly, then this action should return the API path and client constructs full URL or uses blob.
    // Let's assume the endpoint itself is the URL for the image/pdf data.
    return { url: `${API_BASE_URL}/proposals/${proposalId}/documents/${documentId}/pages/${pageNumber}/pdf` };
  } catch (error) {
    console.error("getDocumentPagePdfUrlAction error:", error);
    return { error: "An unexpected error occurred while fetching PDF page." };
  }
}

export async function getDocumentPageHtmlAction(proposalId: number, documentId: number, pageNumber: number): Promise<{ html?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/documents/${documentId}/pages/${pageNumber}/html`);
    if (!response.ok) {
       if (response.status === 404) return { html: "<p>HTML content not available for this page.</p>" }; // Or error
       return { error: `Failed to fetch HTML content: ${response.statusText}` };
    }
    const data = await response.json(); // API schema: GeneratedHtmlResponse { html_content: string }
    return { html: data.html_content || "<p>No HTML content available for this page.</p>" };
  } catch (error) {
    console.error("getDocumentPageHtmlAction error:", error);
    return { error: "An unexpected error occurred fetching HTML content." };
  }
}


export async function getSignatureAnalysisReportAction(proposalId: number): Promise<{ reportHtml?: string; error?: string }> {
 try {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/signature-analysis/report`);
    if (!response.ok) {
      if (response.status === 404) return { error: "Report not found or analysis not complete."};
      return { error: `Failed to fetch signature analysis report: ${response.statusText}` };
    }
    // API returns text/html
    const reportHtml = await response.text();
    return { reportHtml: reportHtml || "<p>Report content is not available.</p>" };
  } catch (error) {
    console.error("getSignatureAnalysisReportAction error:", error);
    return { error: "An unexpected error occurred fetching the signature analysis report." };
  }
}
