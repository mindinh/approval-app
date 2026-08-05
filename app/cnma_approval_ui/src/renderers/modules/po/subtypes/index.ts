import type { DetailTableModel } from '../../../TaskDetailSections.types';
import { buildPoZexpItemsTable } from './po.zexp';
import { buildPoZmakItemsTable } from './po.zmak';
import { buildPoZassItemsTable } from './po.zass';
import { buildPoZconItemsTable } from './po.zcon';
import { buildPoZcorItemsTable } from './po.zcor';
import { buildPoZnb1ItemsTable } from './po.znb1';
import { buildPoZnb2ItemsTable } from './po.znb2';
import { buildPoZnbrItemsTable } from './po.znbr';
import { buildPoZtolItemsTable } from './po.ztol';
import { buildPoZubItemsTable } from './po.zub';

export interface PoSubtypeConfig {
    code: string;
    description: string;
    buildItemsTable: (rawItems?: any[], parentCurrency?: string) => DetailTableModel | null;
}

export const PO_SUBTYPE_CONFIGS: Record<string, PoSubtypeConfig> = {
    ZASS: {
        code: 'ZASS',
        description: 'Asset PO',
        buildItemsTable: buildPoZassItemsTable,
    },
    ZCON: {
        code: 'ZCON',
        description: 'Consignment PO',
        buildItemsTable: buildPoZconItemsTable,
    },
    ZCOR: {
        code: 'ZCOR',
        description: 'Consignment PO Return',
        buildItemsTable: buildPoZcorItemsTable,
    },
    ZEXP: {
        code: 'ZEXP',
        description: 'Expense PO',
        buildItemsTable: buildPoZexpItemsTable,
    },
    ZMAK: {
        code: 'ZMAK',
        description: 'Marketing PO',
        buildItemsTable: buildPoZmakItemsTable,
    },
    ZNB1: {
        code: 'ZNB1',
        description: 'Trading PO',
        buildItemsTable: buildPoZnb1ItemsTable,
    },
    ZNB2: {
        code: 'ZNB2',
        description: 'Non-Trade PO (Stock)',
        buildItemsTable: buildPoZnb2ItemsTable,
    },
    ZNBR: {
        code: 'ZNBR',
        description: 'Trading PO Return',
        buildItemsTable: buildPoZnbrItemsTable,
    },
    ZTOL: {
        code: 'ZTOL',
        description: 'Tools PO',
        buildItemsTable: buildPoZtolItemsTable,
    },
    ZUB: {
        code: 'ZUB',
        description: 'Stock Transport Order',
        buildItemsTable: buildPoZubItemsTable,
    },
};

export {
    buildPoZexpItemsTable,
    buildPoZmakItemsTable,
    buildPoZassItemsTable,
    buildPoZconItemsTable,
    buildPoZcorItemsTable,
    buildPoZnb1ItemsTable,
    buildPoZnb2ItemsTable,
    buildPoZnbrItemsTable,
    buildPoZtolItemsTable,
    buildPoZubItemsTable,
};
