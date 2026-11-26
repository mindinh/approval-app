/**
 * Synthetic SAP OData records used to lock the renderer output (golden tests).
 * They cover every field source referenced by the object views, the `A|B` fallbacks,
 * case-insensitive keys, SAP `/Date(...)/` values, deleted items and sparse records.
 */

export const PR_HEADER = {
    DocCategory: 'BUS2105',
    DocumentNumber: '0010001234',
    DocumentTypeText: 'Asset Purchase Requisition',
    UserName: 'Nguyen Van A',
    FundsCenter: 'FC100',
    FundsCenterName: 'Finance Center',
    CreationDate: '2026-10-28',
    CreationTime: '10:24:18',
    TotalNetAmountLocalCrcy: '125000000',
    LocalCurrency: 'VND',
    CompanyCode: '1000',
    CompanyCodeName: 'CNMA Vietnam',
    HeaderNote: ' line one \r\n line two ',
    _PurposeText: [{ TextLine: 'Purpose line 1' }, { TextLine: 'Purpose line 2' }],
    PaidBy: '',
    _PaidByText: ['Paid by company'],
    BankDetails: 'Bank: ACB\nAccount: 123',
};

export const PR_ITEMS = [
    {
        PurchaseRequisitionItem: '00010',
        Plant: '1000',
        PlantName: 'Hanoi Plant',
        StorageLocation: 'SL01',
        StorageLocationName: 'Main Store',
        Material: 'MAT-001',
        PurchaseRequisitionItemText: 'Laptop 14 inch',
        MaterialGroup: 'IT',
        MaterialGroupText: 'IT Equipment',
        RequestedQuantity: '2.5',
        BaseUnit: 'EA',
        DeliveryDate: '2026-11-15',
        PurchaseRequisitionPrice: '25000000',
        PurReqnItemCurrency: 'VND',
        PurReqnItemTotalAmount: '62500000',
        GLAccount: '640000',
        GLAccountText: 'IT Expense',
        OrderInternalID: 'IO-77',
        OrderInternalName: 'Marketing Campaign',
        CommitmentItem: 'CI-01',
        CommitmentItemText: 'Equipment',
    },
    {
        ItemNumber: '00020',
        plant: '2000', // lower-case key → case-insensitive lookup
        PlantName: 'Danang Plant',
        MaterialText: 'Mouse',
        Quantity: 10,
        Unit: 'PC',
        DeliveryDate: '/Date(1793836800000)/',
        ValuationPrice: '150000.456',
        DocumentCurrency: 'USD',
        TotalNetAmountDocCrcy: 1500004.56,
        Deleted: 'X',
    },
];

export const PO_HEADER = {
    DocCategory: 'BUS2012',
    DocumentNumber: '4500001234',
    DocumentTypeText: 'Standard PO',
    UserName: 'Tran Thi B',
    Vendor: '100050',
    VendorName: 'Công ty TNHH ABC',
    Name2: 'Chi nhánh Hà Nội',
    CompanyCode: '1000',
    CompanyCodeName: 'CNMA Vietnam',
    CreationDate: '2026-10-28T00:00:00',
    CreationTime: '08:05:00',
    PaymentTerms: 'Z030',
    PaymentTermsDescription: 'Net 30 days',
    TotalNetValueBeforeTax: '1000.5',
    TotalFreightAmount: '20',
    TotalVatAmount: '100.05',
    TotalOrderValue: '1120.55',
    LocalCurrency: 'USD',
    _HeaderText: [{ LongText: 'Header text A' }, { LongText: '' }],
    HeaderNote: 'Note for PO',
    // ZUB-specific
    CreatedByUser: 'TTB',
    SupplyingPlant: '3000',
    SupplyingPlantName: 'HCM Plant',
    TotalNetAmountLocalCrcy: '5000000',
};

export const PO_ITEMS = [
    {
        ItemNumber: '00010',
        Plant: '1000',
        PlantName: 'Hanoi Plant',
        StorageLocation: 'SL01',
        StorageLocationName: 'Main Store',
        Material: 'MAT-100',
        MaterialText: 'Printer',
        MaterialGroup: 'IT',
        MaterialGroupName: 'IT Equipment',
        Quantity: '3',
        Unit: 'EA',
        DeliveryDate: '2026-12-01',
        ValuationPrice: '300.333',
        DocumentCurrency: 'USD',
        TotalNetAmountDocCrcy: '900.999',
        ReferenceDocumentNumber: '0010001234',
        GLAccount: '640000',
        GLAccountText: 'IT Expense',
        OrderInternalID: 'IO-88',
        OrderInternalName: 'Brand Event',
        FundsCenter: 'FC100',
        FundsCenterName: 'Finance Center',
        CommitmentItem: 'CI-02',
        CommitmentItemDescription: 'Office',
        ValuationPricePRCD: '1500000',
        LocalCurrency: 'VND',
    },
    {
        ItemNumber: '00020',
        MaterialText: 'Paper',
        Quantity: 1234.5678,
        Unit: 'KG',
        TotalNetAmountLocalCrcyPRCD: '2500000',
        LOEKZ: 'L',
    },
];

export const CLAIM_RECORD = {
    DocCategory: 'ZCLAIM',
    DocumentNumber: 'CL-0001',
    ClaimType: 'ZC01',
    ClaimTypeText: 'Travel Claim',
    CreatedByUser: 'NVA',
    CreationDate: '2026-10-01',
    CreationTime: '00:00:00',
    CompanyCode: '1000',
    CompanyCodeName: 'CNMA Vietnam',
    ClaimStatus: 'Submitted',
    VeriStatus: 'V',
    VeriStatusDesc: 'Verified',
    VeriBy: 'Checker',
    VeriDate: '2026-10-02',
    VeriTime: '14:30:00',
    VeriComment: 'OK',
    Supplier: '200010',
    SupplierName: 'Travel Agency',
    PaymentAmount: 243563.97,
    DocumentCurrency: 'USD',
    TotalNetAmountLocalCrcy: 6347277058,
    LocalCurrency: 'VND',
    Notes: '[U1 10:00] first \n[U2 11:00] second ',
    _Item: [
        {
            ItemNumber: '1',
            DocNum: '5100000001',
            FiscalYear: '2026',
            Reference: 'INV-01',
            DocumentDate: '2026-09-30',
            NetDueDate: '2026-10-30',
            Text: 'Hotel',
            Vendor: '200010',
            InvoiceAmount: 243563.97,
            PaymentAmount: 243563.97,
            TotalNetAmountLocalCrcy: 6347277058,
            DocumentCurrency: 'USD',
        },
        {
            ItemNumber: '2',
            Text: 'Taxi',
            PaymentAmount: '500000',
            TotalNetAmountLocalCrcy: '500000',
        },
    ],
};

export const RESERVATION_RECORD = {
    DocCategory: 'ZBUS2093',
    DocumentId: 'RS-0009',
    DocumentType: 'ZRS',
    DocumentTypeText: 'Reservation',
    UserName: 'Le Van C',
    CreationDate: '2026-10-20',
    CreationTime: '09:00:00',
    Total: '7500000',
    Currency: 'VND',
    Plant: '1000',
    PlantName: 'Hanoi Plant',
    MovementType: '201',
    MovementTypeName: 'GI for cost center',
    CostCenter: 'CC10',
    CostCenterName: 'Ops',
    _Item: [
        {
            Material: 'MAT-9',
            MaterialText: 'Gloves',
            ItemText: 'Safety',
            Quantity: '100',
            BaseUnit: 'PR',
            CostPrice: '75000',
            Price: '7500000',
            Currency: 'VND',
            Plant: '1000',
            PlantName: 'Hanoi Plant',
            StorageLocation: 'SL02',
            StorageLocationName: 'Safety Store',
            RequirementDate: '2026-10-25',
            GLAccount: '500100',
            GLAccountText: 'Consumables',
        },
    ],
};

export const UNKNOWN_RECORD = {
    DocCategory: 'ZINVOICE',
    DocumentNumber: 'INV-1',
    SomeAmount: 10,
    nested: { a: 1 },
    _Hidden: 'x',
};

export const PR_SUBTYPES = ['ZASS', 'ZEXP', 'ZMAK', 'ZNB1', 'ZNB2', 'ZTOL', 'DEFAULT', 'UNLISTED'] as const;
export const PO_SUBTYPES = ['ZASS', 'ZCON', 'ZCOR', 'ZEXP', 'ZMAK', 'ZNB1', 'ZNB2', 'ZNBR', 'ZTOL', 'ZUB', 'DEFAULT', 'UNLISTED'] as const;

export function prRecord(documentType: string) {
    return { ...PR_HEADER, DocumentType: documentType, _Item: PR_ITEMS };
}

export function poRecord(documentType: string) {
    return { ...PO_HEADER, DocumentType: documentType, _Item: PO_ITEMS };
}

const baseTask = {
    instanceId: 'inst-1',
    taskDefinitionId: 'def-1',
    title: 'Approve',
    status: 'READY',
    priority: 'MEDIUM',
    createdOn: '2026-10-28T10:00:00Z',
    createdByName: 'Tester',
    sapOrigin: 'origin',
    supports: { forward: true, comments: true },
};

/** Task shapes seen in the worklist: raw fields, legacy businessContext, backend chips, cached detail. */
export const TASK_CASES: Array<{ name: string; task: Record<string, unknown>; cachedDetail?: unknown }> = [
    { name: 'no context', task: baseTask },
    { name: 'pr raw fields', task: { ...baseTask, objectType: 'PR', documentType: 'ZASS', TotalNetAmountLocalCrcy: '125000000', LocalCurrency: 'VND', DocumentTypeText: 'Asset PR' } },
    { name: 'po legacy header', task: { ...baseTask, businessContext: { type: 'PO', po: { header: { TotalOrderValue: '1234.56', LocalCurrency: 'USD', doctyp_desc: 'Standard PO' } } } } },
    { name: 'po zub', task: { ...baseTask, objectType: 'BUS2012', documentType: 'ZUB', TotalNetAmountLocalCrcy: '5000000', LocalCurrency: 'VND', DocumentTypeText: 'Stock Transfer' } },
    { name: 'reservation', task: { ...baseTask, objectType: 'ZBUS2093', TotalAmount: '7500000', DocumentCurrency: 'VND', DocumentTypeText: 'Reservation' } },
    { name: 'claim', task: { ...baseTask, objectType: 'CLAIM', PaymentAmount: '243563.97', DocumentCurrency: 'USD', ClaimTypeText: 'Travel' } },
    {
        name: 'backend chips',
        task: {
            ...baseTask,
            objectType: 'CLAIM',
            curr_vnd: 'VND',
            businessChips: [
                { label: 'Total Amount', value: '2270982', dataType: 'AMOUNT', isPrimary: true },
                { label: 'Due', value: '2026-10-30', dataType: 'DATE' },
                { label: 'Qty', value: '1234.5', dataType: 'QUANTITY', unit: 'EA' },
                { label: 'Urgent', value: true, dataType: 'BOOLEAN' },
                { label: 'Note', value: ' hello ' },
            ],
        },
    },
    { name: 'cached detail', task: { ...baseTask, objectType: 'PO' }, cachedDetail: { businessObject: { ...PO_HEADER, DocumentType: 'ZNB1' } } },
    { name: 'unknown category', task: { ...baseTask, objectType: 'ZINVOICE', total: '10' } },
];
