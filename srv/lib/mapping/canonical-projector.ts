export class CanonicalProjector {
  private static instance: CanonicalProjector | null = null;

  private constructor() {}

  public static getInstance(): CanonicalProjector {
    if (!CanonicalProjector.instance) {
      CanonicalProjector.instance = new CanonicalProjector();
    }
    return CanonicalProjector.instance;
  }

  /**
   * Recursively prunes properties from a canonical object that are not present in the requiredPaths list.
   */
  public project(canonical: any, requiredPaths: string[]): any {
    if (!requiredPaths || requiredPaths.length === 0) return canonical;

    const result: any = {
      objectType: canonical.objectType,
      objectId: canonical.objectId,
      header: {},
      items: [],
      workflow: canonical.workflow || { steps: [], comments: [] },
      attachments: canonical.attachments || []
    };

    const hasPath = (p: string) => requiredPaths.some(rp => rp === p || rp.startsWith(p + '.'));

    // Project header
    if (canonical.header) {
      for (const key of Object.keys(canonical.header)) {
        if (hasPath(`header.${key}`)) {
          result.header[key] = canonical.header[key];
        }
      }
    }

    // Project items
    if (Array.isArray(canonical.items)) {
      result.items = canonical.items.map((item: any) => {
        const projectedItem: any = {};
        for (const key of Object.keys(item)) {
          if (hasPath(`items.${key}`)) {
            projectedItem[key] = item[key];
          }
        }
        return projectedItem;
      });
    }

    // Project other collections
    for (const key of Object.keys(canonical)) {
      if (['objectType', 'objectId', 'header', 'items', 'workflow', 'attachments'].includes(key)) continue;
      if (Array.isArray(canonical[key])) {
        if (hasPath(key)) {
          result[key] = canonical[key].map((item: any) => {
            const projectedItem: any = {};
            for (const subKey of Object.keys(item)) {
              if (hasPath(`${key}.${subKey}`)) {
                projectedItem[subKey] = item[subKey];
              }
            }
            return projectedItem;
          });
        }
      }
    }

    return result;
  }
}
