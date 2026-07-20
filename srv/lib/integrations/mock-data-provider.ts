// Memory cache for mock additions
const mockCommentsCache: Record<string, any[]> = {};
const mockAttachmentsCache: Record<string, any[]> = {};
const mockAttachmentContentCache: Record<string, { data: Buffer; contentType: string; fileName: string }> = {};

export function addMockComment(objectId: string, text: string, author: string = 'Current User') {
    const paddedId = objectId.padStart(10, '0');
    if (!mockCommentsCache[paddedId]) {
        mockCommentsCache[paddedId] = [];
    }
    mockCommentsCache[paddedId].push({
        author,
        text,
        postedOn: new Date().toISOString().split('T')[0],
        postedTime: new Date().toISOString().split('T')[1].split('.')[0]
    });
}

export function addMockAttachment(objectId: string, fileName: string, mimeType: string, buffer: Buffer, createdBy: string = 'Current User') {
    const paddedId = objectId.padStart(10, '0');
    if (!mockAttachmentsCache[paddedId]) {
        mockAttachmentsCache[paddedId] = [];
    }
    const attachId = `attach-${Date.now()}`;
    mockAttachmentsCache[paddedId].push({
        id: attachId,
        fileName,
        mimeType,
        fileSize: buffer.byteLength,
        createdBy,
        createdAt: new Date().toISOString()
    });
    mockAttachmentContentCache[`${paddedId}-${attachId}`] = {
        data: buffer,
        contentType: mimeType,
        fileName
    };
}

export function getMockAttachmentContent(objectId: string, attachId: string) {
    const paddedId = objectId.padStart(10, '0');
    return mockAttachmentContentCache[`${paddedId}-${attachId}`] || null;
}

export function getMockComments(objectId: string) {
    const paddedId = objectId.padStart(10, '0');
    return mockCommentsCache[paddedId] || [];
}

export function getMockAttachments(objectId: string) {
    const paddedId = objectId.padStart(10, '0');
    return mockAttachmentsCache[paddedId] || [];
}

export function getMockInstances(status?: string | string[]) {
    const all = [
        {
            instanceID: 'task-pr-01',
            status: 'IN PROCESSING',
            typeid: 'BUS2105',
            instid: '10001234',
            credate: '2026-06-25',
            cretime: '08:00:00',
            doctyp: 'ZEXP',
            doctyp_desc: 'Expense PR',
            total: 150000000,
            curr_vnd: 'VND',
            total_doc_curr: 150000000,
            doc_curr: 'VND'
        },
        {
            instanceID: 'task-po-01',
            status: 'IN PROCESSING',
            typeid: 'BUS2012',
            instid: '4500009876',
            credate: '2026-06-26',
            cretime: '09:30:00',
            doctyp: 'NB',
            doctyp_desc: 'Standard Purchase Order',
            total: 120000000,
            curr_vnd: 'VND',
            total_doc_curr: 120000000,
            doc_curr: 'VND'
        },
        {
            instanceID: 'task-re-01',
            status: 'IN PROCESSING',
            typeid: 'BUS2093',
            instid: '0010023456',
            credate: '2026-06-24',
            cretime: '14:20:00',
            doctyp: 'RE',
            doctyp_desc: 'Standard Reservation',
            total: 0,
            curr_vnd: '',
            total_doc_curr: 0,
            doc_curr: '',
            normalTask: false
        },
        {
            instanceID: 'task-claim-01',
            status: 'IN PROCESSING',
            typeid: 'ZCLAIM',
            instid: '90008812',
            credate: '2026-06-27',
            cretime: '11:00:00',
            doctyp: 'CLAIM',
            doctyp_desc: 'Travel Expense Claim',
            total: 5000000,
            curr_vnd: 'VND',
            total_doc_curr: 200,
            doc_curr: 'USD'
        },
        {
            instanceID: 'task-pr-completed-01',
            status: 'COMPLETED',
            typeid: 'BUS2105',
            instid: '10005555',
            credate: '2026-06-24',
            cretime: '17:00:00',
            doctyp: 'ZEXP',
            doctyp_desc: 'Expense PR',
            total: 150000000,
            curr_vnd: 'VND',
            total_doc_curr: 150000000,
            doc_curr: 'VND'
        },
        {
            instanceID: 'task-po-completed-01',
            status: 'COMPLETED',
            typeid: 'BUS2012',
            instid: '4500005555',
            credate: '2026-06-23',
            cretime: '10:00:00',
            doctyp: 'NB',
            doctyp_desc: 'Standard Purchase Order',
            total: 120000000,
            curr_vnd: 'VND',
            total_doc_curr: 120000000,
            doc_curr: 'VND'
        }
    ];
    if (status) {
        if (Array.isArray(status)) {
            return all.filter(i => status.includes(i.status));
        }
        return all.filter(i => i.status === status);
    }
    return all;
}

export function getMockTasks() {
    return [
        {
            InstanceID: 'task-pr-01',
            Status: 'READY',
            TaskDefinitionID: 'BUS2105',
            TaskTitle: 'Approve Purchase Requisition 10001234',
            CreatedOn: new Date().toISOString(),
            CreatedByName: 'Nguyen Van A',
            Priority: 'MEDIUM'
        },
        {
            InstanceID: 'task-po-01',
            Status: 'READY',
            TaskDefinitionID: 'BUS2012',
            TaskTitle: 'Approve Purchase Order 4500009876',
            CreatedOn: new Date().toISOString(),
            CreatedByName: 'Tran Thi B',
            Priority: 'HIGH'
        },
        {
            InstanceID: 'task-re-01',
            Status: 'READY',
            TaskDefinitionID: 'BUS2093',
            TaskTitle: 'Approve Reservation 0010023456',
            CreatedOn: new Date().toISOString(),
            CreatedByName: 'Le Van C',
            Priority: 'LOW'
        },
        {
            InstanceID: 'task-claim-01',
            Status: 'READY',
            TaskDefinitionID: 'ZCLAIM',
            TaskTitle: 'Approve Expense Claim 90008812',
            CreatedOn: new Date().toISOString(),
            CreatedByName: 'Pham Van D',
            Priority: 'HIGH'
        },
        {
            InstanceID: 'task-pr-completed-01',
            Status: 'COMPLETED',
            TaskDefinitionID: 'BUS2105',
            TaskTitle: 'Approve Purchase Requisition 10005555',
            CreatedOn: new Date(Date.now() - 86400000).toISOString(),
            CreatedByName: 'Nguyen Van A',
            Priority: 'MEDIUM'
        },
        {
            InstanceID: 'task-po-completed-01',
            Status: 'COMPLETED',
            TaskDefinitionID: 'BUS2012',
            TaskTitle: 'Approve Purchase Order 4500005555',
            CreatedOn: new Date(Date.now() - 172800000).toISOString(),
            CreatedByName: 'Tran Thi B',
            Priority: 'HIGH'
        }
    ];
}

export function getMockTaskRuntime(instanceId: string) {
    const isCompleted = instanceId.includes('completed');
    const prNum = instanceId.includes('completed') ? '10005555' : '10001234';
    const poNum = instanceId.includes('completed') ? '4500005555' : '4500009876';

    return {
        InstanceID: instanceId,
        Status: isCompleted ? 'COMPLETED' : 'READY',
        TaskTitle: instanceId.includes('pr') ? `Approve Purchase Requisition ${prNum}`
            : instanceId.includes('po') ? `Approve Purchase Order ${poNum}`
                : instanceId.includes('re') ? 'Approve Reservation 0010023456'
                    : 'Approve Expense Claim 90008812',
        CreatedOn: new Date().toISOString(),
        CreatedByName: instanceId.includes('pr') ? 'Nguyen Van A' : 'Tran Thi B',
        decisions: isCompleted ? [] : [
            { DecisionKey: '0001', DecisionText: 'Approve' },
            { DecisionKey: '0002', DecisionText: 'Reject' }
        ]
    };
}

export function getMockDetail(objectType: string, objectId: string) {
    if (objectType === 'PR') {
        return {
            objectType,
            documentType: 'ZASS',
            objectId,
            header: {
                purchaseRequisition: objectId,
                purchaseRequisitionText: 'IT Department Laptop Purchase',
                purReqnRequestor: 'NGUYENVANA',
                userFullName: 'Nguyen Van A',
                purReqCreationDate: '2026-06-25T08:00:00Z',
                numberOfItems: '2',
                purchaseRequisitionType: 'NB',
                totalNetAmount: '15000000',
                displayCurrency: 'VND',
                purReqnHdrCurrencySourceDesc: 'VND',
                workflowScenarioDefinition: 'WS00800173',
                isPurReqnOvrlRel: 'X',
                createdByUser: 'MINHDT',
                releaseStrategyName: 'IT Release'
            },
            items: [
                {
                    purchaseRequisition: objectId,
                    purchaseRequisitionItem: '00010',
                    purchaseRequisitionItemText: 'MacBook Pro M3 Max 16"',
                    material: 'MAT-LAP-001',
                    materialGroup: '001',
                    materialGroupText: 'IT Hardware',
                    requestedQuantity: '2',
                    baseUnit: 'PC',
                    purchaseRequisitionPrice: '75000000',
                    purReqnItemCurrency: 'VND',
                    purReqnItemTotalAmount: '150000000',
                    purReqnReleaseStatus: '02',
                    purReqnReleaseStatusText: 'In release',
                    deliveryDate: '2026-07-15T00:00:00Z',
                    Plant: '1000'
                },
                {
                    purchaseRequisition: objectId,
                    purchaseRequisitionItem: '00020',
                    purchaseRequisitionItemText: 'Magic Mouse & Keyboard Combo',
                    material: 'MAT-ACC-002',
                    materialGroup: '002',
                    materialGroupText: 'IT Accessories',
                    requestedQuantity: '2',
                    baseUnit: 'SET',
                    purchaseRequisitionPrice: '5000000',
                    purReqnItemCurrency: 'VND',
                    purReqnItemTotalAmount: '10000000',
                    purReqnReleaseStatus: '02',
                    purReqnReleaseStatusText: 'In release',
                    deliveryDate: '2026-07-15T00:00:00Z',
                    Plant: '1000'
                }
            ],
            budget: {
                status: 'WARNING'
            },
            asset: {
                assetClass: 'IT Equipment'
            },
            approvalTree: [
                { step: 1, approver: 'Line Manager', status: 'APPROVED' },
                { step: 2, approver: 'Department Head', status: 'PENDING' }
            ],
            comments: [
                { author: 'Nguyen Van A', text: 'Please approve this MacBook Pro for the new developer joining in July.' },
                ...getMockComments(objectId)
            ],
            attachments: [
                { id: 'quotation-01', fileName: 'Quotation_MacBook.pdf', mimeType: 'application/pdf', fileSize: 1048576, createdBy: 'Nguyen Van A', createdAt: '2026-06-25T08:00:00Z' },
                ...getMockAttachments(objectId)
            ]
        };
    }

    // Default to PO structure
    return {
        objectType,
        documentType: 'DEFAULT',
        objectId,
        header: {
            purchaseOrder: objectId,
            purchaseOrderText: 'Standard Hardware Supplies PO',
            purchaseOrderType: 'NB',
            purchaseOrderTypeText: 'Standard PO',
            supplier: '1000001',
            supplierName: 'FPT Computer Center',
            userFullName: 'Tran Thi B',
            createdByUser: 'TRANTHIB',
            createdOn: '2026-06-20T09:30:00Z',
            purchaseOrderDate: '2026-06-20T00:00:00Z',
            companyCode: '1000',
            companyCodeName: 'AIS Vietnam Corp',
            purchasingOrganization: '1000',
            purchasingOrganizationName: 'Vietnam Purchasing Org',
            purchasingGroup: '001',
            purchasingGroupName: 'Local Purchase',
            paymentTerms: 'NT30',
            paymentTermsText: 'Net 30 days',
            incotermsClassification: 'EXW',
            documentCurrency: 'VND',
            purchaseOrderNetAmount: '120000000',
            purchasingDocumentStatusName: 'In Approval'
        },
        items: [
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00010',
                purchaseOrderItemText: 'Office Monitors Dell 27"',
                materialGroup: '001',
                materialGroupText: 'IT Hardware',
                firstDeliveryDate: '2026-07-10T00:00:00Z',
                orderQuantity: '20',
                purchaseOrderQuantityUnit: 'PC',
                netPriceAmount: '5000000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '100000000'
            },
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00020',
                purchaseOrderItemText: 'HDMI Display Cables 3m',
                materialGroup: '002',
                materialGroupText: 'IT Accessories',
                firstDeliveryDate: '2026-07-10T00:00:00Z',
                orderQuantity: '100',
                purchaseOrderQuantityUnit: 'PC',
                netPriceAmount: '200000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '20000000'
            }
        ],
        accountAssignments: [
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00010',
                accountAssignmentNumber: '01',
                distributionPercentage: '100.0',
                glAccount: '610500',
                glAccountText: 'IT Equipment Expense',
                costCenter: 'CC1001',
                costCenterText: 'Administration CC',
                profitCenter: 'PC100',
                profitCenterText: 'Admin Center',
                controllingArea: 'COVN',
                controllingAreaText: 'Vietnam Controller Area'
            }
        ],
        scheduleLines: [
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00010',
                scheduleLine: '0001',
                scheduleLineDeliveryDate: '2026-07-10T00:00:00Z',
                scheduleLineOrderQuantity: '20',
                purchaseOrderQuantityUnit: 'PC'
            }
        ],
        comments: [
            { author: 'Tran Thi B', text: 'This PO includes bulk purchase discount.' },
            ...getMockComments(objectId)
        ],
        attachments: [
            { id: 'quotation-01', fileName: 'Quotation_MacBook.pdf', mimeType: 'application/pdf', fileSize: 1048576, createdBy: 'Tran Thi B', createdAt: '2026-06-26T09:30:00Z' },
            ...getMockAttachments(objectId)
        ]
    };
}
