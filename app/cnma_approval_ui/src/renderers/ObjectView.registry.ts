/**
 * Master registry of business object types: which module renders which SAP category.
 * To onboard a new type, create `objects/<type>/<type>.fields.ts` + `<type>.views.ts`
 * exporting an ObjectTypeModule, then add it to OBJECT_TYPE_MODULES.
 */
import type { RawODataEntity } from '@/services/inbox/inbox.contracts';
import type { ObjectTypeModule, ObjectViewDefinition } from './core/types';
import { prModule } from './objects/pr/pr.views';
import { poModule } from './objects/po/po.views';
import { reservationModule } from './objects/reservation/reservation.views';
import { claimModule } from './objects/claim/claim.views';
import { GENERIC_VIEW } from './objects/generic/generic.views';

export const OBJECT_TYPE_MODULES: readonly ObjectTypeModule[] = [prModule, poModule, reservationModule, claimModule];

const moduleByAlias = new Map<string, ObjectTypeModule>(
    OBJECT_TYPE_MODULES.flatMap((module) => module.aliases.map((alias) => [alias, module] as const))
);

/** Finds the module for a category code (`'BUS2012'`, `'po'`, …); case-insensitive. */
export function findObjectTypeModule(category: unknown): ObjectTypeModule | undefined {
    return moduleByAlias.get(String(category ?? '').toUpperCase());
}

/** SAP category of a record (BOR object type or short code), from the fields the BFF may use. */
export function readDocCategory(record: RawODataEntity): string {
    return String(record?.DocCategory || record?._meta?.objectType || record?.objectType || record?.type || '');
}

/** Document subtype (e.g. `ZUB`), `DEFAULT` when absent. */
export function readDocumentType(record: RawODataEntity): string {
    return String(record?.DocumentType || record?.documentType || record?.doctyp || 'DEFAULT').toUpperCase();
}

/** The view for a record: its module's subtype layout, or the generic fallback. */
export function resolveObjectViewDefinition(record: RawODataEntity, module = findObjectTypeModule(readDocCategory(record))): ObjectViewDefinition {
    return module ? module.resolveView(readDocumentType(record)) : GENERIC_VIEW;
}
