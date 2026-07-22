import { getTransform } from './transforms';
import { ObjectConfig } from './config-registry';

export class MappingEngine {
  private static instance: MappingEngine | null = null;

  private constructor() {}

  public static getInstance(): MappingEngine {
    if (!MappingEngine.instance) {
      MappingEngine.instance = new MappingEngine();
    }
    return MappingEngine.instance;
  }

  /**
   * Sets a value in a nested object based on a dot-separated path (e.g. "header.documentNumber").
   */
  private setNestedValue(obj: any, path: string, value: any) {
    if (value === undefined) return;
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }

  /**
   * Resolves a value from a nested object based on a dot-separated path or direct key.
   * Performs exact property lookup first, then fallback case-insensitive key lookup.
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current === 'object' && part in current) {
        current = current[part];
      } else if (typeof current === 'object') {
        const lowerPart = part.toLowerCase();
        const foundKey = Object.keys(current).find(k => k.toLowerCase() === lowerPart);
        current = foundKey ? current[foundKey] : undefined;
      } else {
        return undefined;
      }
    }
    return current;
  }

  /**
   * Maps a raw business object structure into the canonical model using the configuration mappings.
   */
  public map(raw: any, config: ObjectConfig, context?: any): any {
    const result: any = {
      objectType: config.object.objectType,
      objectId: raw.objectId || context?.documentId || '',
      header: {},
      items: [],
      workflow: {
        strategyName: raw.header?.releaseStrategyName || raw.header?.releaseStrategyText || undefined,
        steps: [],
        comments: []
      },
      attachments: []
    };

    // 1. Map Root Header fields
    const rootMappings = config.mappings.root;
    const rawHeader = raw.header || {};
    
    // We also search dependencies across rawHeader to resolve values.
    for (const mapping of rootMappings) {
      // 1. Primary lookup by mapping.sourcePath
      let rawVal = this.getNestedValue(rawHeader, mapping.sourcePath);
      if (rawVal === undefined) {
        rawVal = this.getNestedValue(raw, mapping.sourcePath);
      }

      // 2. Secondary lookup by targetPath field key
      if (rawVal === undefined) {
        const targetKey = mapping.targetPath.split('.').pop() || '';
        rawVal = this.getNestedValue(rawHeader, targetKey) ?? this.getNestedValue(raw, targetKey);
      }

      // 3. Fallbacks for total amount and document type display
      if (rawVal === undefined) {
        if (mapping.targetPath.endsWith('NetAmount') || mapping.targetPath.endsWith('totalNetAmount')) {
          rawVal = rawHeader.totalNetAmountDocCrcy ?? rawHeader.totalNetAmountLocalCrcy ?? rawHeader.netAmount ?? rawHeader.total ?? raw.total;
        } else if (mapping.targetPath.endsWith('TypeDisplay') || mapping.targetPath.endsWith('Type')) {
          rawVal = rawHeader.purchaseRequisitionType ?? rawHeader.purchaseOrderType ?? rawHeader.documentType ?? rawHeader.doctyp ?? raw.doctyp;
        }
      }

      if (rawVal !== undefined) {
        let finalVal = rawVal;
        if (mapping.transform) {
          const transformFn = getTransform(mapping.transform);
          // Resolve dependencies if any
          const dependencies: Record<string, any> = {};
          if (mapping.dependencies) {
            for (const dep of mapping.dependencies) {
              dependencies[dep] = this.getNestedValue(rawHeader, dep);
            }
          }
          finalVal = transformFn(rawVal, dependencies);
        }
        this.setNestedValue(result, mapping.targetPath, finalVal);
      } else if (mapping.required) {
        console.warn(`[MappingEngine] Warning: Missing required field ${mapping.sourcePath} in raw header payload`);
      }
    }

    // 2. Map Collections
    const collections = config.mappings.collections;
    for (const key of Object.keys(collections)) {
      const colConfig = collections[key];
      // Resolve source navigation data array (e.g. raw.items, raw.comments, raw.attachments, raw.approvalTree)
      const rawCollection = raw[colConfig.navigationKey] || raw[key] || [];
      if (!Array.isArray(rawCollection)) continue;

      const mappedCollection: any[] = [];

      for (const item of rawCollection) {
        const mappedItem: any = {};
        for (const field of colConfig.fields) {
          const rawVal = this.getNestedValue(item, field.sourcePath);

          if (rawVal !== undefined) {
            let finalVal = rawVal;
            if (field.transform) {
              const transformFn = getTransform(field.transform);
              const dependencies: Record<string, any> = {};
              if (field.dependencies) {
                for (const dep of field.dependencies) {
                  dependencies[dep] = this.getNestedValue(item, dep);
                }
              }
              finalVal = transformFn(rawVal, dependencies);
            }
            this.setNestedValue(mappedItem, field.targetPath, finalVal);
          } else if (field.required) {
            console.warn(`[MappingEngine] Warning: Missing required field ${field.sourcePath} in collection ${key}`);
          }
        }
        mappedCollection.push(mappedItem);
      }

      // Assign mapped collection to target path
      this.setNestedValue(result, colConfig.targetPath, mappedCollection);
    }

    // 3. Fallback compatibility checks
    // If workflow comments were mapped under workflow.comments but rawcomments are also expected under result.comments:
    if (result.workflow?.comments && (!result.comments || result.comments.length === 0)) {
      result.comments = result.workflow.comments;
    }
    // If workflow steps were mapped under workflow.steps but raw steps are also expected:
    if (result.workflow?.steps && (!result.approvalTree || result.approvalTree.length === 0)) {
      result.approvalTree = result.workflow.steps;
    }

    return result;
  }
}
