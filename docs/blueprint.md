# **App Name**: DocumentWise

## Core Features:

- Proposal Management: User-friendly dashboard to create and manage proposals. Each proposal is assigned a unique application number.
- Document Upload: Upload single or multiple documents (PDFs) to a proposal. Provides visual feedback on upload progress and document list.
- PDF Viewer: Display each document page as a PDF. Provides navigation to move between pages. Implements  GET `/proposals/{proposal_id}/documents/{document_id}/pages/{page_number}/pdf` to retrieve document pages.
- HTML Preview: Display the AI-generated HTML of a selected document page. Implements POST `/proposals/{proposal_id}/documents/{document_id}/extract-html` and GET `/proposals/{proposal_id}/documents/{document_id}/pages/{page_number}/html`.
- Signature Analysis Trigger: Initiate signature analysis on uploaded documents. Provides a status indicator for the analysis progress and calls the POST `/proposals/{proposal_id}/signature-analysis/start` API.
- Signature Analysis Report: Display a signature analysis report in HTML format. Provides insights into the signature analysis performed on the proposal documents, based on data from Amazon Textract and Gemini LLM. Calls the API endpoint  GET `/proposals/{proposal_id}/signature-analysis/report`
- Signature Image Viewer: Display a cropped image of the signature for verification, extracted from the document. The tool relies on coordinates obtained from Amazon Textract to display the signature in the page and show the corresponding signature with a call to  GET `/proposals/{proposal_id}/signatures/{signature_instance_id}/image`.

## Style Guidelines:

- Saturated blue (#4285F4) to convey trust and professionalism, essential for document management.
- Light gray (#F5F5F5), almost white, to ensure a clean and focused working environment.
- A vibrant purple (#A020F0) for highlighting key interactive elements and CTAs.
- Space Grotesk' sans-serif for a modern, tech-forward appearance, used for titles and headings.
- Inter' sans-serif to ensure optimal readability and a clean, neutral appearance, used for text in the application.
- Crisp and professional icon set, using simple, clear icons to represent actions, document types, and status indicators.
- Clean, grid-based layout with ample whitespace. Prioritize a clear visual hierarchy.