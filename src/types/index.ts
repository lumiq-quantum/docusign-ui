export interface Proposal {
  id: string;
  applicationNumber: string;
  name: string;
  createdAt: string; // ISO date string
  documents: Document[];
  signatureAnalysisStatus?: 'Not Started' | 'In Progress' | 'Completed' | 'Failed';
  signatureAnalysisSummary?: string;
  signatureAnalysisReportHtml?: string;
}

export interface Document {
  id: string;
  name: string;
  uploadedAt: string; // ISO date string
  totalPages: number;
  type: 'pdf'; // Assuming only PDFs for now
  size: number; // in bytes
  extractedHtml?: Record<number, string>; // pageNumber: htmlContent
}

export interface Signature {
  id: string; // signature_instance_id
  documentId: string;
  pageNumber: number;
  // Placeholder for coordinates, actual structure might depend on Textract output
  coordinates: { x: number; y: number; width: number; height: number }; 
  imageUrl?: string; // URL to the cropped signature image
  confidence?: number;
}

// Represents a page of a document, could be PDF or HTML view
export interface DocumentPage {
  proposalId: string;
  documentId: string;
  pageNumber: number;
  type: 'pdf' | 'html';
  contentUrl?: string; // URL for PDF page image
  htmlContent?: string; // Direct HTML content
}
