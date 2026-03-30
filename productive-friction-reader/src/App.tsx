import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './App.css';

import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs';

// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/build/pdf.worker.min.mjs',
//   import.meta.url,
// ).toString();

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

//pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.js`; 
type Condition = 'baseline' | 'frictionless' | 'friction';
interface Props { paperId: string; condition: Condition; participantId: string; }
interface EIPrompt { index: number; question: string; expertAnswer: string; triggerPage: number; }

const EI_PROMPTS: Record<string, EIPrompt[]> = {
  mack_et_al_chi2021: [
    { index: 0, triggerPage: 3, question: 'Why do BLV users receive 43.5% of accessibility research attention despite not being the most prevalent disability?', expertAnswer: 'BLV research dominates because screen readers produce measurable binary outcomes easier to evaluate than cognitive or motor challenges. Early AT work created a self-reinforcing citation ecosystem, and BLV users are often digitally literate and available for lab studies. This is a structural feature of the field, not a reflection of population need.' },
    { index: 1, triggerPage: 6, question: 'Dataset contributions are only 1.4% of the corpus. Why, and what would a valuable accessibility dataset look like?', expertAnswer: 'Accessibility datasets are expensive: recruiting disabled participants at scale, obtaining consent, and annotating disability-specific phenomena all require significant resources. A valuable dataset might include screen reader interaction logs with task labels, annotated videos of AT users encountering barriers, or web content rated for WCAG compliance by disabled users.' },
    { index: 2, triggerPage: 9, question: '23% of papers used nondisabled people as comparison baselines. Why is this methodologically and ethically problematic?', expertAnswer: 'Using nondisabled performance as a baseline frames disability as a deficit against a norm, reinforcing the medical model. A better comparison is within-group: compare the same disabled users across different interface designs, measuring whether design choices remove barriers rather than whether disabled users approach nondisabled benchmarks.' },
  ]
};

export default function App({ paperId, condition, participantId }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activePrompt, setActivePrompt] = useState<EIPrompt | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [showExpert, setShowExpert] = useState<boolean>(false);
  const [firedPrompts, setFiredPrompts] = useState<Set<number>>(new Set());

  const pdfUrl = `http://localhost:5001/paper/${paperId}/pdf`;
  const prompts = EI_PROMPTS[paperId] || [];

  const log = useCallback((event: string, data: object) => {
    console.log('[SESSION LOG]', { event, participantId, paperId, condition, timestamp: Date.now(), ...data });
  }, [participantId, paperId, condition]);

  useEffect(() => {
    if (condition !== 'friction') return;
    const prompt = prompts.find((p) => p.triggerPage === currentPage && !firedPrompts.has(p.index));
    if (prompt) { setActivePrompt(prompt); setAnswer(''); setShowExpert(false); log('ei_prompt_shown', { promptIndex: prompt.index, page: currentPage }); }
  }, [currentPage, condition, firedPrompts, prompts, log]);

  const handleDocumentLoad = ({ numPages }: { numPages: number }) => { setNumPages(numPages); log('document_loaded', { numPages }); };
  const handlePageChange = (page: number) => { log('page_change', { from: currentPage, to: page }); setCurrentPage(page); };
  const handleSubmitAnswer = () => {
    if (!activePrompt) return;
    if (answer.trim().length < 50) { alert('Please write at least 50 characters.'); return; }
    log('ei_answer_submitted', { promptIndex: activePrompt.index, answerLength: answer.length, answer });
    setShowExpert(true);
  };
  const handleDismiss = () => {
    if (!activePrompt) return;
    log('ei_expert_dismissed', { promptIndex: activePrompt.index });
    setFiredPrompts((prev) => new Set([...prev, activePrompt.index]));
    setActivePrompt(null); setAnswer(''); setShowExpert(false);
  };
  const handleSkip = () => {
    if (!activePrompt) return;
    log('ei_prompt_skipped', { promptIndex: activePrompt.index });
    setFiredPrompts((prev) => new Set([...prev, activePrompt.index]));
    setActivePrompt(null);
  };

  return (
    <div className="reader-container">
      <div className={`condition-badge condition-badge--${condition}`}>{condition.toUpperCase()} · {paperId} · {participantId}</div>
      <div className="page-nav">
        <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>← Prev</button>
        <span>Page {currentPage} of {numPages}</span>
        <button onClick={() => handlePageChange(Math.min(numPages, currentPage + 1))} disabled={currentPage >= numPages}>Next →</button>
      </div>
      <div className="pdf-wrapper">
        <Document file={pdfUrl} onLoadSuccess={handleDocumentLoad} onLoadError={(e: Error) => console.error('PDF error:', e)}>
          <Page pageNumber={currentPage} width={800} renderTextLayer={true} renderAnnotationLayer={false} />
        </Document>
        {condition === 'frictionless' && prompts.map((p) => p.triggerPage).includes(currentPage) && (
          <div className="frictionless-banner">💡 This page contains a key claim highlighted by the reading assistant.</div>
        )}
      </div>
      {activePrompt && condition === 'friction' && (
        <div className="ei-overlay">
          <div className="ei-modal">
            <div className="ei-modal-header">
              <span className="ei-label">Pause and reflect</span>
              <button className="ei-skip" onClick={handleSkip}>Skip →</button>
            </div>
            <p className="ei-question">{activePrompt.question}</p>
            {!showExpert ? (
              <div className="ei-input-section">
                <textarea className="ei-textarea" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write your explanation here..." rows={5} />
                <div className="ei-footer">
                  <span className={`char-count ${answer.length >= 50 ? 'char-count--ok' : ''}`}>{answer.length} / 50 minimum</span>
                  <button className="ei-submit" onClick={handleSubmitAnswer} disabled={answer.trim().length < 50}>Submit →</button>
                </div>
              </div>
            ) : (
              <div className="ei-expert-section">
                <div className="ei-expert-label">Expert explanation</div>
                <p className="ei-expert-text">{activePrompt.expertAnswer}</p>
                <button className="ei-continue" onClick={handleDismiss}>Continue reading →</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
