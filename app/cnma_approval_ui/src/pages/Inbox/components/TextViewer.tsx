import { useEffect, useState } from 'react';
import { Loader2, Copy, Check, FileText } from 'lucide-react';
import { Button, toast } from '@cnma/react-ui';

interface TextViewerProps {
    url: string;
    fileName?: string;
}

export function TextViewer({ url, fileName }: TextViewerProps) {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);

        async function loadTextContent() {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const text = await response.text();

                if (isMounted) {
                    setContent(text);
                    setLoading(false);
                }
            } catch (err: any) {
                console.error('[TextViewer] Error rendering text file:', err);
                if (isMounted) {
                    setError('Failed to load text file content.');
                    setLoading(false);
                }
            }
        }

        loadTextContent();

        return () => {
            isMounted = false;
        };
    }, [url]);

    const handleCopy = () => {
        if (!content) return;
        navigator.clipboard.writeText(content);
        setCopied(true);
        toast.success('Text content copied to clipboard.');
        setTimeout(() => setCopied(false), 2000);
    };

    const lines = content.split('\n');

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 font-mono text-xs overflow-hidden relative rounded-xl border border-slate-800 shadow-md">
            {/* Header Toolbar — pr-14 prevents overlap with absolute close button */}
            <div className="flex items-center justify-between pl-4 pr-14 py-2 bg-slate-950/90 border-b border-slate-800 shrink-0 text-slate-400 min-h-[40px]">
                <div className="flex items-center gap-2 min-w-0">
                    <FileText className="size-4 text-emerald-400 shrink-0" />
                    <span className="truncate font-medium text-slate-200 text-xs">
                        {fileName || 'Text Document'}
                    </span>
                    {!loading && !error && (
                        <span className="text-[11px] text-slate-400/80 shrink-0 tabular-nums">
                            ({lines.length} lines, {content.length} chars)
                        </span>
                    )}
                </div>
                {!loading && !error && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className="h-7 px-2.5 text-xs text-slate-200 bg-slate-800/90 hover:bg-slate-700 hover:text-white border-slate-700 gap-1.5 shrink-0 shadow-none"
                    >
                        {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                    </Button>
                )}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-auto p-3 leading-relaxed bg-slate-900">
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                        <Loader2 className="size-6 animate-spin text-emerald-400" />
                        <p className="text-xs">Loading text file...</p>
                    </div>
                )}

                {error && (
                    <div className="flex items-center justify-center h-full text-red-400 text-xs">
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <table className="w-full border-collapse">
                        <tbody>
                            {lines.map((line, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/60 group transition-colors">
                                    <td className="w-10 pr-3 text-right text-slate-500/70 select-none text-[11px] group-hover:text-slate-300 font-mono border-r border-slate-800/80 bg-slate-950/30">
                                        {idx + 1}
                                    </td>
                                    <td className="pl-3 whitespace-pre-wrap break-all text-slate-200 font-mono">
                                        {line || ' '}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
