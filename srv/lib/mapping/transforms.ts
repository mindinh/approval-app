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
