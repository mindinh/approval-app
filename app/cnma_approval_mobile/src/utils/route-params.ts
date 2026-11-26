/** A route param as one trimmed string: repeated params (`?id=1&id=2`) arrive as arrays; missing is ''. */
export function firstParam(value: string | string[] | undefined): string {
    const first = Array.isArray(value) ? value[0] : value;
    return (first ?? '').trim();
}
