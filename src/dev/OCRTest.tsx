import { useState } from 'react';
import { performOCR, type OCRResult } from '@/utils/ocrService';

export default function OCRTest() {
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;

    setBusy(true);
    setError('');
    setResult(null);
    setProgress('Starting OCR...');

    try {
      const output = await performOCR(file, (percent, status) => {
        setProgress(`${percent}% — ${status}`);
      });

      setResult(output);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '30px auto', padding: 20 }}>
      <h1>Local Timetable OCR Test</h1>

      <p>
        This test runs Tesseract.js locally in the browser.
        It does not call the Gemini vision proxy.
      </p>

      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/bmp"
        disabled={busy}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      <p>{progress}</p>

      {error && <pre style={{ color: 'red' }}>{error}</pre>}

      {result && (
        <>
          <h2>OCR Results</h2>

          <p>Overall confidence: {result.confidence.toFixed(1)}%</p>
          <p>Recognized words: {result.words.length}</p>
          <p>Recognized lines: {result.lines.length}</p>
          <p>Processing time: {result.processingTimeMs} ms</p>

          <h3>Recognized text</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{result.text}</pre>

          <h3>First 100 words and coordinates</h3>
          <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
            {JSON.stringify(result.words.slice(0, 100), null, 2)}
          </pre>
        </>
      )}
    </main>
  );
}