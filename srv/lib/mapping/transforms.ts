export type TransformFunction = (value: any, dependencies?: Record<string, any>) => any;

export const transforms: Record<string, TransformFunction> = {
  identity: (val) => val,

  sapDateToIso: (val) => {
    if (!val) return undefined;
    if (val instanceof Date) {
      return val.toISOString();
    }
    const valStr = typeof val === 'string' ? val : String(val);
    const msMatch = valStr.match(/\/Date\((\d+)\)\//);
    if (msMatch) {
      return new Date(parseInt(msMatch[1], 10)).toISOString();
    }
    try {
      const d = new Date(valStr);
      if (isNaN(d.getTime())) return valStr;
      return d.toISOString();
    } catch {
      return valStr;
    }
  },

  sapTimeToIso: (val) => {
    if (!val) return undefined;
    if (val instanceof Date) {
      return val.toISOString().split('T')[1]?.split('.')[0] || '';
    }
    const valStr = typeof val === 'string' ? val : String(val);
    // Handle OData duration format like PT15H13M17S
    if (valStr.startsWith('PT')) {
      const hours = valStr.match(/(\d+)H/)?.[1] || '00';
      const minutes = valStr.match(/(\d+)M/)?.[1] || '00';
      const seconds = valStr.match(/(\d+)S/)?.[1] || '00';
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    }
    return valStr;
  },

  number: (val) => {
    if (val === null || val === undefined || val === '') return undefined;
    const num = Number(val);
    return isNaN(num) ? val : num;
  },

  boolean: (val) => {
    if (val === null || val === undefined) return false;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      return val.toLowerCase() === 'true' || val === '1' || val.toLowerCase() === 'x';
    }
    return Boolean(val);
  },

  combineName: (val, deps) => {
    const firstName = val || '';
    const lastName = deps?.lastName || '';
    return `${firstName} ${lastName}`.trim();
  },

  combineCodeAndText: (val, deps) => {
    const code = String(val || '').trim();
    if (!code) return undefined;
    if (!deps) return code;
    const textValues = Object.values(deps)
      .filter((v) => v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '-')
      .map((v) => String(v).trim());
    if (textValues.length === 0) return code;
    const uniqueTexts = Array.from(new Set(textValues)).filter((t) => t !== code);
    if (uniqueTexts.length === 0) return code;
    const textCombined = uniqueTexts.join(' ');
    if (
      textCombined.startsWith(`${code} -`) ||
      textCombined.startsWith(`${code}-`) ||
      textCombined.startsWith(`${code} `)
    ) {
      return textCombined;
    }
    return `${code} - ${textCombined}`;
  },

  combineVendorNames: (val, deps) => {
    const slot1Raw = deps?.vendor ?? deps?.Vendor ?? deps?.supplier ?? deps?.Supplier ?? val;
    let slot2Raw = deps?.vendorName1 ?? deps?.VendorName1 ?? deps?.vendorName ?? deps?.VendorName ?? deps?.supplierName1 ?? deps?.SupplierName1 ?? deps?.supplierName ?? deps?.SupplierName;
    const slot3Raw = deps?.vendorName2 ?? deps?.VendorName2 ?? deps?.supplierName2 ?? deps?.SupplierName2;
    const slot4Raw = deps?.vendorName3 ?? deps?.VendorName3 ?? deps?.supplierName3 ?? deps?.SupplierName3;
    const slot5Raw = deps?.vendorName4 ?? deps?.VendorName4 ?? deps?.supplierName4 ?? deps?.SupplierName4;

    // If slot 2 is identical to slot 1 (e.g. both are code "17300001"), clear slot 2 to avoid duplicating the code line
    if (slot1Raw && slot2Raw && String(slot1Raw).trim() === String(slot2Raw).trim()) {
      slot2Raw = undefined;
    }

    const slots = [slot1Raw, slot2Raw, slot3Raw, slot4Raw, slot5Raw];
    const hasAnySlot = slots.some((s) => s !== undefined && s !== null);
    if (!hasAnySlot) return undefined;

    const formattedSlots = slots.map((s) => {
      if (s === undefined || s === null) return '-';
      const str = String(s).trim();
      return str !== '' ? str : '-';
    });

    return formattedSlots.join('\n');
  }
};

export function getTransform(name: string): TransformFunction {
  const trans = transforms[name];
  if (!trans) {
    // Fallback to identity if not found
    return transforms.identity;
  }
  return trans;
}
