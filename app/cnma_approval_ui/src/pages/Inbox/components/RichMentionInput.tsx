import { cn } from '@/lib/utils';
import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { BusUser } from '@/services/inbox/inbox.types';

export interface RichMentionInputRef {
    insertMention: (user: BusUser, queryText: string) => void;
    clear: () => void;
    focus: () => void;
    getFormattedText: () => string;
    getActiveUserNames: () => string[];
}

interface RichMentionInputProps {
    className?: string;
    value: string;
    onChange: (text: string) => void;
    onMentionQuery: (query: string, index: number, isOpen: boolean) => void;
    onSubmit: () => void;
    placeholder?: string;
    invalid?: boolean;
    describedBy?: string;
    disabled?: boolean;
}

export const RichMentionInput = forwardRef<RichMentionInputRef, RichMentionInputProps>(
    ({ value, onChange, onMentionQuery, onSubmit, placeholder, disabled, invalid, describedBy, className }, ref) => {
        const editorRef = useRef<HTMLDivElement>(null);
        const isInternalChange = useRef(false);

        const getFormattedText = (): string => {
            if (!editorRef.current) return '';
            let result = '';
            const walk = (node: Node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node as HTMLElement;
                    if (el.tagName === 'SPAN' && (el.getAttribute('contenteditable') === 'false' || el.hasAttribute('data-sap-user'))) {
                        const mentionText = el.innerText.trim();
                        result += `<tag>${mentionText}</tag>`;
                    } else if (el.tagName === 'BR') {
                        result += '\n';
                    } else {
                        // Browsers create block elements on Enter and multiline paste.
                        // Keep their line boundaries while ignoring the empty-line placeholder BR.
                        const isBlock = ['DIV', 'P', 'LI'].includes(el.tagName);
                        if (isBlock && el.previousSibling && !result.endsWith('\n')) result += '\n';
                        const isPlaceholder = isBlock && el.childNodes.length === 1 && el.firstChild?.nodeName === 'BR';
                        for (let i = 0; i < el.childNodes.length; i++) {
                            if (!isPlaceholder) walk(el.childNodes[i]);
                        }
                        if (isBlock && el.nextSibling) result += '\n';
                    }
                } else if (node.nodeType === Node.TEXT_NODE) {
                    const rawText = node.nodeValue || '';
                    // Escape raw user-entered <tag> and </tag> so they don't spoof system mention tags
                    result += rawText.replace(/<tag>/g, '&lt;tag&gt;').replace(/<\/tag>/g, '&lt;/tag&gt;');
                }
            };

            for (let i = 0; i < editorRef.current.childNodes.length; i++) {
                walk(editorRef.current.childNodes[i]);
            }

            return result.replace(/\u00A0/g, ' ');
        };

        useImperativeHandle(ref, () => ({
            insertMention: (user: BusUser, queryText: string) => {
                if (!editorRef.current) return;
                const fullName = user.FullName || `${user.FirstName || ''} ${user.LastName || ''}`.trim() || user.SAPUserName;

                // Focus editor
                editorRef.current.focus();

                const sel = window.getSelection();
                if (!sel || sel.rangeCount === 0) return;

                const range = sel.getRangeAt(0);

                // Find and delete the current @query text node content
                let textNode = range.startContainer;
                if (textNode.nodeType !== Node.TEXT_NODE && textNode.childNodes.length > 0) {
                    textNode = textNode.childNodes[Math.max(0, range.startOffset - 1)] || textNode;
                }

                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                    const content = textNode.nodeValue || '';
                    const lastAt = content.lastIndexOf('@');
                    if (lastAt !== -1) {
                        range.setStart(textNode, lastAt);
                        range.setEnd(textNode, content.length);
                        range.deleteContents();
                    }
                }

                // Create inline badge element
                const badge = document.createElement('span');
                badge.className =
                    'inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-md mx-0.5 align-baseline select-none';
                badge.setAttribute('contenteditable', 'false');
                badge.setAttribute('data-sap-user', user.SAPUserName);
                badge.innerText = `@${fullName}`;

                const space = document.createTextNode('\u00A0'); // Non-breaking space

                range.insertNode(space);
                range.insertNode(badge);

                // Position selection cursor after space
                range.setStartAfter(space);
                range.setEndAfter(space);
                sel.removeAllRanges();
                sel.addRange(range);

                // Update text content state with <tag></tag> formatted text
                isInternalChange.current = true;
                onChange(getFormattedText());
            },
            clear: () => {
                if (editorRef.current) {
                    editorRef.current.innerHTML = '';
                    isInternalChange.current = true;
                    onChange('');
                }
            },
            focus: () => {
                editorRef.current?.focus();
            },
            getFormattedText,
            getActiveUserNames: (): string[] => {
                if (!editorRef.current) return [];
                const badges = editorRef.current.querySelectorAll('span[data-sap-user]');
                const usernames: string[] = [];
                badges.forEach((b) => {
                    const u = b.getAttribute('data-sap-user');
                    if (u) usernames.push(u);
                });
                return usernames;
            },
        }));

        // Reset innerHTML if value is cleared from outside
        useEffect(() => {
            if (value === '' && editorRef.current && editorRef.current.innerHTML !== '') {
                editorRef.current.innerHTML = '';
            }
        }, [value]);

        const checkMentionQuery = () => {
            if (disabled || !editorRef.current) return;
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) {
                onMentionQuery('', -1, false);
                return;
            }

            const range = sel.getRangeAt(0);
            const textNode = range.startContainer;
            if (textNode.nodeType === Node.TEXT_NODE) {
                const textBeforeCursor = (textNode.nodeValue || '').slice(0, range.startOffset);
                const lastAt = textBeforeCursor.lastIndexOf('@');
                if (lastAt !== -1) {
                    const query = textBeforeCursor.slice(lastAt + 1);
                    if (!query.includes(' ') && !query.includes('\n') && !query.includes('\u00A0')) {
                        onMentionQuery(query, lastAt, true);
                        return;
                    }
                }
            }

            onMentionQuery('', -1, false);
        };

        const handleInput = () => {
            if (disabled || !editorRef.current) return;
            isInternalChange.current = true;
            onChange(getFormattedText());
            checkMentionQuery();
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (disabled) return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                onSubmit();
            }
        };

        return (
            <div
                ref={editorRef}
                role="textbox"
                aria-label={placeholder}
                aria-multiline="true"
                aria-disabled={disabled}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                contentEditable={!disabled}
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyUp={checkMentionQuery}
                onKeyDown={handleKeyDown}
                data-placeholder={placeholder}
                className={cn("min-h-22 max-h-40 p-3 rounded-lg border border-border/60 bg-card text-foreground focus:outline-none focus-visible:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors font-sans text-base sm:text-sm overflow-y-auto whitespace-pre-wrap break-words relative empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none", className)}
            />
        );
    }
);

RichMentionInput.displayName = 'RichMentionInput';
