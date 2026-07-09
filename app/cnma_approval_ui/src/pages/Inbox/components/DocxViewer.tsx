import { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { Loader2 } from 'lucide-react';

interface DocxViewerProps {
    url: string;
}

export function DocxViewer({ url }: DocxViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);

        async function loadDocx() {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                
                if (isMounted && containerRef.current) {
                    containerRef.current.innerHTML = '';
                    await renderAsync(arrayBuffer, containerRef.current, undefined, {
                        inWrapper: false,
                        ignoreWidth: false,
                        ignoreHeight: false,
                    });
                    setLoading(false);
                }
            } catch (err: any) {
                console.error('[DocxViewer] Error rendering docx:', err);
                if (isMounted) {
                    setError('Failed to render Word document.');
                    setLoading(false);
                }
            }
        }

        loadDocx();

        return () => {
            isMounted = false;
        };
    }, [url]);

    return (
        <div className="w-full h-full flex flex-col relative bg-white overflow-auto p-6 md:p-8">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="size-6 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground">Rendering Word document...</p>
                    </div>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-destructive">
                    {error}
                </div>
            )}
            <div 
                ref={containerRef} 
                className="docx-container w-full max-w-3xl mx-auto shadow-sm border border-border/40 p-6 bg-white min-h-full" 
            />
        </div>
    );
}
