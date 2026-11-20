import { useEffect, useRef, useState } from 'react';
import { PaddleOCR } from '@paddleocr/paddleocr-js';

type PaddleEngine = Awaited<ReturnType<typeof PaddleOCR.create>>;

export default function PaddleOCRTest() {
  const engineRef = useRef<PaddleEngine | null>(null);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<Awaited<
    ReturnType<NonNullable<PaddleEngine>['predict']>
  > | null>(null);

  const [initializationTime, setInitializationTime] = useState<number | null>(null);
  const [initialization, setInitialization] = useState<unknown>(null);

  useEffect(() => {
    return () => {
      const engine = engineRef.current;
      engineRef.current = null;

      if (engine) {
        void engine.dispose();
      }
    };
  }, []);

  async function handleFile(file?: File) {
    if (!file) return;

    setBusy(true);
    setError('');
    setResult(null);
    setProgress('Initializing PaddleOCR...');

    try {
      if (!engineRef.current) {
        const start = performance.now();

        const engine = await PaddleOCR.create({
          lang: 'en',
          ocrVersion: 'PP-OCRv5',
          worker: true,
          ortOptions: {
            backend: 'auto',
            numThreads: 2,
            simd: true,
          },
        });

        engineRef.current = engine;
        setInitializationTime(Math.round(performance.now() - start));
        setInitialization(engine.getInitializationSummary());
      }

      setProgress('Recognizing timetable text...');

      const output = await engineRef.current.predict(file);

      setResult(output);
      setProgress('OCR completed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setProgress('');
    } finally {
      setBusy(false);
    }
  }

  const firstResult = result?.[0];

  return (
    <main style={{ maxWidth: 1000, margin: '30px auto', padding: 20 }}>
      <h1>PaddleOCR Browser Test</h1>

      <p>
        Runs PaddleOCR PP-OCRv5 English locally in your browser using
        ONNX Runtime Web and a Web Worker. No Gemini API or OCR server.
      </p>

      <p>
        First use downloads the OCR models. Later scans reuse the
        initialized engine.
      </p>

      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/bmp"
        disabled={busy}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      <p>{progress}</p>

      {busy && <p>Please wait. Model loading or OCR may take some time.</p>}

      {error && (
        <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{error}</pre>
      )}

      {initializationTime !== null && (
        <>
          <h2>Initialization</h2>
          <p>Initialization time: {initializationTime} ms</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
            {JSON.stringify(initialization, null, 2)}
          </pre>
        </>
      )}

      {firstResult && (
        <>
          <h2>OCR Results</h2>

          <p>Image dimensions: {firstResult.image.width} × {firstResult.image.height}</p>
          <p>Detected text regions: {firstResult.metrics.detectedBoxes}</p>
          <p>Recognized regions: {firstResult.metrics.recognizedCount}</p>
          <p>Detection time: {firstResult.metrics.detMs.toFixed(1)} ms</p>
          <p>Recognition time: {firstResult.metrics.recMs.toFixed(1)} ms</p>
          <p>Total OCR time: {firstResult.metrics.totalMs.toFixed(1)} ms</p>

          <h3>Runtime</h3>
          <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
            {JSON.stringify(firstResult.runtime, null, 2)}
          </pre>

          <h3>Recognized text</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {firstResult.items.map((item) => item.text).join('\n')}
          </pre>

          <h3>Detected regions and confidence</h3>
          <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
            {JSON.stringify(firstResult.items, null, 2)}
          </pre>
        </>
      )}
    </main>
  );
}
