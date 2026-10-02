import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResumeViewer } from './ResumeViewer';

// pdf.js needs a real canvas + worker; the component contract is what matters here.
vi.mock('./PdfCanvas', () => ({ default: () => <div data-testid="pdf-canvas" /> }));

function setPdfViewer(value: boolean | undefined) {
  Object.defineProperty(navigator, 'pdfViewerEnabled', { configurable: true, get: () => value });
}

describe('ResumeViewer', () => {
  afterEach(() => setPdfViewer(undefined));

  it('uses the browser PDF viewer when available', () => {
    setPdfViewer(true);
    render(<ResumeViewer />);
    expect(screen.getByTitle(/resume \(pdf\)/i).tagName).toBe('IFRAME');
  });

  it('falls back to pdf.js rendering when there is no inline viewer (most phones)', async () => {
    setPdfViewer(false);
    render(<ResumeViewer />);
    expect(await screen.findByTestId('pdf-canvas')).toBeInTheDocument();
    expect(screen.queryByTitle(/resume \(pdf\)/i)).not.toBeInTheDocument();
  });
});
