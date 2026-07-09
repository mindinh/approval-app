import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cnma/react-ui';

interface ExcelViewerProps {
    url: string;
}

export function ExcelViewer({ url }: ExcelViewerProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sheets, setSheets] = useState<{ name: string; html: string }[]>([]);
    const [activeSheet, setActiveSheet] = useState<string>('');

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);

        async function loadExcel() {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const parsedSheets = workbook.SheetNames.map((name) => {
                    const worksheet = workbook.Sheets[name];
                    // Convert worksheet to HTML table with nice classes
                    const html = XLSX.utils.sheet_to_html(worksheet, {
                        header: '',
                        footer: '',
                    });
                    return { name, html };
                });

                if (isMounted) {
                    setSheets(parsedSheets);
                    if (parsedSheets.length > 0) {
                        setActiveSheet(parsedSheets[0].name);
                    }
                    setLoading(false);
                }
            } catch (err: any) {
                console.error('[ExcelViewer] Error rendering excel:', err);
                if (isMounted) {
                    setError('Failed to render Excel spreadsheet.');
                    setLoading(false);
                }
            }
        }

        loadExcel();

        return () => {
            isMounted = false;
        };
    }, [url]);

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden relative">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="size-6 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground">Rendering Excel spreadsheet...</p>
                    </div>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-destructive">
                    {error}
                </div>
            )}
            
            {!loading && !error && sheets.length > 0 && (
                <Tabs value={activeSheet} onValueChange={setActiveSheet} className="flex-1 flex flex-col min-h-0">
                    <TabsList className="shrink-0 bg-muted/20 border-b p-1 flex justify-start gap-1 h-auto overflow-x-auto no-scrollbar">
                        {sheets.map((sheet) => (
                            <TabsTrigger
                                key={sheet.name}
                                value={sheet.name}
                                className="px-3 py-1.5 text-xs rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            >
                                {sheet.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <div className="flex-1 overflow-auto p-4">
                        {sheets.map((sheet) => (
                            <TabsContent key={sheet.name} value={sheet.name} className="mt-0">
                                <div 
                                    className="excel-table-container prose max-w-none text-xs text-foreground/80 overflow-x-auto"
                                    dangerouslySetInnerHTML={{ __html: sheet.html }}
                                />
                            </TabsContent>
                        ))}
                    </div>
                </Tabs>
            )}
        </div>
    );
}
