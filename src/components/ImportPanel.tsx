import { useCallback, useState } from 'react';
import { parseListInput } from '../parsers';
import type { ParsedArmy } from '../parsers/types';

interface ImportPanelProps {
  onImport: (army: ParsedArmy) => void;
}

export function ImportPanel({ onImport }: ImportPanelProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleParse = useCallback(() => {
    setError(null);
    setLoading(true);
    try {
      const army = parseListInput(text);
      onImport(army);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse list.');
    } finally {
      setLoading(false);
    }
  }, [text, onImport]);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setLoading(true);
      try {
        const content = await file.text();
        setText(content);
        const army = parseListInput(content);
        onImport(army);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to read file.');
      } finally {
        setLoading(false);
      }
    },
    [onImport],
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Import army list</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Paste a **GW app text export** (v2.4+ format or legacy `++++` header) or upload a **NewRecruit JSON** file.
        </p>
      </div>

      <textarea
        className="h-48 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
        placeholder="Paste army list here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleParse}
          disabled={!text.trim() || loading}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-40"
        >
          {loading ? 'Parsing…' : 'Parse list'}
        </button>

        <label className="cursor-pointer rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800">
          Upload JSON
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
