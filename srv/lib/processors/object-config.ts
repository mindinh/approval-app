import { ConfigRegistry, ObjectConfig } from '../mapping/config-registry';

export type ObjectTypeCode = "PR" | "PO" | "RE" | "CLAIM";

export interface FieldDefinition {
  key: string;
  label: string;
  dataPath: string;
  dataType: string;
  formatter?: string;
  fallbackValue?: string;
  currencyPath?: string;
}

export interface UiSection {
  id: string;
  type: string;
  title: string;
  fields?: string[];
  dataPath?: string;
  columns?: string[];
}

export interface UiSchema {
  title: string;
  subtitle: string;
  sections: UiSection[];
}

export interface ActionDefinition {
  key: string;
  label: string;
  variant: string;
  requiresComment?: boolean;
  confirmRequired?: boolean;
  confirmMessage?: string;
  sapDecisionKey?: string;
}

export interface CardChipDefinition {
  label: string;
  dataPath: string;
  dataType: string;
  formatter?: string;
  isPrimary?: boolean;
}

export interface ObjectTypeConfiguration {
  objectType: ObjectTypeCode;
  documentType?: string;
  fieldSchema: Record<string, FieldDefinition>;
  uiSchema: UiSchema;
  actions: ActionDefinition[];
  cardChips?: CardChipDefinition[];
  documentTypes?: Record<string, any>;
}

export function getObjectConfig(objectType: string, documentType?: string): any {
  const config = ConfigRegistry.getInstance().get(objectType);
  if (!config) return undefined;
  
  if (documentType && config.documentTypes?.[documentType]) {
    const sub = config.documentTypes[documentType];
    return {
      ...config,
      uiSchema: sub.uiSchema || config.uiSchema,
      cardChips: sub.cardChips || config.cardChips
    };
  }

  return config;
}

export function resolveJsonPath(obj: any, path: string): any {
  if (!path || obj === null || obj === undefined) return undefined;
  if (path === '$') return obj;
  const cleanPath = path.startsWith('$.') ? path.substring(2) : path.startsWith('$') ? path.substring(1) : path;
  if (!cleanPath) return obj;

  const parts = cleanPath.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object') {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

export function mapCardChips(config: any, businessObject: any): any[] {
  if (!config || !config.cardChips || !businessObject) return [];
  const chips: any[] = [];

  for (const def of config.cardChips) {
    const rawVal = resolveJsonPath(businessObject, def.dataPath);
    if (rawVal === null || rawVal === undefined || rawVal === '') continue;

    const chip: any = {
      label: def.label,
      value: rawVal,
      dataType: def.dataType,
      isPrimary: def.isPrimary
    };

    if (def.dataType === 'AMOUNT') {
      chip.currency = businessObject.header?.displayCurrency || businessObject.header?.documentCurrency || '';
    }

    chips.push(chip);
  }

  return chips;
}
