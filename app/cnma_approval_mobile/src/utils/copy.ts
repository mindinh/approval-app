/** Longest value quoted in the "Copied" toast. */
const PREVIEW_LENGTH = 48;

/** Toast text after a copy: names the field and quotes the value, so the user knows what was taken. */
export function copiedMessage(value: string, label?: string): string {
    const oneLine = value.replace(/\s+/g, ' ').trim();
    const preview = oneLine.length > PREVIEW_LENGTH ? `${oneLine.slice(0, PREVIEW_LENGTH - 1)}…` : oneLine;
    return label ? `Copied ${label}: ${preview}` : `Copied “${preview}”`;
}
