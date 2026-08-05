import type { DetailTableModel } from '../../../TaskDetailSections.types';
import { buildPrZexpItemsTable } from './pr.zexp';
import { buildPrZmakItemsTable } from './pr.zmak';
import { buildPrZassItemsTable } from './pr.zass';
import { buildPrZnb1ItemsTable } from './pr.znb1';
import { buildPrZnb2ItemsTable } from './pr.znb2';
import { buildPrZtolItemsTable } from './pr.ztol';

export interface PrSubtypeConfig {
    code: string;
    description: string;
    budgetMode?: 'Warning' | 'Strict' | 'None';
    buildItemsTable: (rawItems?: any[], parentCurrency?: string) => DetailTableModel | null;
}

export const PR_SUBTYPE_CONFIGS: Record<string, PrSubtypeConfig> = {
    ZASS: {
        code: 'ZASS',
        description: 'Asset PR',
        budgetMode: 'Warning',
        buildItemsTable: buildPrZassItemsTable,
    },
    ZEXP: {
        code: 'ZEXP',
        description: 'Expense PR',
        budgetMode: 'Warning',
        buildItemsTable: buildPrZexpItemsTable,
    },
    ZMAK: {
        code: 'ZMAK',
        description: 'Marketing PR',
        buildItemsTable: buildPrZmakItemsTable,
    },
    ZNB1: {
        code: 'ZNB1',
        description: 'Trading PR',
        buildItemsTable: buildPrZnb1ItemsTable,
    },
    ZNB2: {
        code: 'ZNB2',
        description: 'Non-Trade PR (Stock)',
        buildItemsTable: buildPrZnb2ItemsTable,
    },
    ZTOL: {
        code: 'ZTOL',
        description: 'Tools PR',
        buildItemsTable: buildPrZtolItemsTable,
    },
};

export {
    buildPrZexpItemsTable,
    buildPrZmakItemsTable,
    buildPrZassItemsTable,
    buildPrZnb1ItemsTable,
    buildPrZnb2ItemsTable,
    buildPrZtolItemsTable,
};
