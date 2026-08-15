// Memory cache for mock additions
const mockCommentsCache: Record<string, any[]> = {};
const mockAttachmentsCache: Record<string, any[]> = {};
const mockAttachmentContentCache: Record<string, { data: Buffer; contentType: string; fileName: string }> = {};

export function addMockComment(objectId: string, text: string, author: string = 'Current User') {
    const cleanId = objectId ? String(objectId).replace(/^0+/, '') : '';
    const paddedId = /^\d+$/.test(cleanId) ? cleanId.padStart(10, '0') : cleanId;

    const commentObj = {
        author,
        text,
        postedOn: new Date().toISOString().split('T')[0],
        postedTime: new Date().toISOString().split('T')[1].split('.')[0]
    };

    const keys = new Set([objectId, cleanId, paddedId]);
    for (const key of keys) {
        if (!key) continue;
        if (!mockCommentsCache[key]) {
            mockCommentsCache[key] = [];
        }
        mockCommentsCache[key].push(commentObj);
    }
}

export function addMockAttachment(objectId: string, fileName: string, mimeType: string, buffer: Buffer, createdBy: string = 'Current User') {
    const cleanId = objectId ? String(objectId).replace(/^0+/, '') : '';
    const paddedId = /^\d+$/.test(cleanId) ? cleanId.padStart(10, '0') : cleanId;
    const attachId = `attach-${Date.now()}`;

    const attachObj = {
        id: attachId,
        fileName,
        mimeType,
        fileSize: buffer.byteLength,
        createdBy,
        createdAt: new Date().toISOString()
    };

    const keys = new Set([objectId, cleanId, paddedId]);
    for (const key of keys) {
        if (!key) continue;
        if (!mockAttachmentsCache[key]) {
            mockAttachmentsCache[key] = [];
        }
        mockAttachmentsCache[key].push(attachObj);
    }

    mockAttachmentContentCache[`${paddedId}-${attachId}`] = {
        data: buffer,
        contentType: mimeType,
        fileName
    };
    mockAttachmentContentCache[`${cleanId}-${attachId}`] = {
        data: buffer,
        contentType: mimeType,
        fileName
    };
    mockAttachmentContentCache[`${objectId}-${attachId}`] = {
        data: buffer,
        contentType: mimeType,
        fileName
    };
}

export function getMockAttachmentContent(objectId: string, attachId: string) {
    const cleanId = objectId ? String(objectId).replace(/^0+/, '') : '';
    const paddedId = /^\d+$/.test(cleanId) ? cleanId.padStart(10, '0') : cleanId;
    return mockAttachmentContentCache[`${paddedId}-${attachId}`] || mockAttachmentContentCache[`${cleanId}-${attachId}`] || mockAttachmentContentCache[`${objectId}-${attachId}`] || null;
}

export function getMockAttachmentContentById(attachId: string) {
    const suffix = `-${attachId}`;
    const key = Object.keys(mockAttachmentContentCache).find(k => k.endsWith(suffix));
    if (key) {
        return mockAttachmentContentCache[key];
    }
    return mockAttachmentContentCache[attachId] || null;
}

export function getMockComments(objectId: string) {
    const cleanId = objectId ? String(objectId).replace(/^0+/, '') : '';
    const paddedId = /^\d+$/.test(cleanId) ? cleanId.padStart(10, '0') : cleanId;
    return mockCommentsCache[objectId] || mockCommentsCache[cleanId] || mockCommentsCache[paddedId] || [];
}

export function getMockAttachments(objectId: string) {
    const cleanId = objectId ? String(objectId).replace(/^0+/, '') : '';
    const paddedId = /^\d+$/.test(cleanId) ? cleanId.padStart(10, '0') : cleanId;
    return mockAttachmentsCache[objectId] || mockAttachmentsCache[cleanId] || mockAttachmentsCache[paddedId] || [];
}

export function getMockInstances(status?: string | string[]) {
    const all = [
        // PR Subtypes
        {
            instanceID: 'task-pr-zass',
            status: 'IN PROCESSING',
            typeid: 'BUS2105',
            instid: '10000001',
            credate: '2026-06-25',
            cretime: '08:00:00',
            doctyp: 'ZASS',
            doctyp_desc: 'Asset PR',
            total: 150000000,
            curr_vnd: 'VND',
            total_doc_curr: 150000000,
            doc_curr: 'VND'
        },
        {
            instanceID: 'task-pr-zexp',
            status: 'IN PROCESSING',
            typeid: 'BUS2105',
            instid: '10000002',
            credate: '2026-06-25',
            cretime: '08:30:00',
            doctyp: 'ZEXP',
            doctyp_desc: 'Expense PR',
            total: 25000000,
            curr_vnd: 'VND',
            total_doc_curr: 25000000,
            doc_curr: 'VND'
        },
        {
            instanceID: 'task-pr-zmak',
            status: 'IN PROCESSING',
            typeid: 'BUS2105',
            instid: '10000003',
            credate: '2026-06-25',
            cretime: '09:00:00',
            doctyp: 'ZMAK',
            doctyp_desc: 'Marketing PR',
            total: 80000000,
            curr_vnd: 'VND',
            total_doc_curr: 80000000,
            doc_curr: 'VND'
        },
        {
            instanceID: 'task-pr-znb1',
            status: 'IN PROCESSING',
            typeid: 'BUS2105',
            instid: '10000004',
            credate: '2026-06-25',
            cretime: '10:00:00',
            doctyp: 'ZNB1',
            doctyp_desc: 'Trading PR',
            total: 500000000,
            curr_vnd: 'VND',
            total_doc_curr: 20000,
            doc_curr: 'USD'
        },
        {
            instanceID: 'task-pr-znb2',
            status: 'IN PROCESSING',
            typeid: 'BUS2105',
            instid: '10000005',
            credate: '2026-06-25',
            cretime: '11:00:00',
            doctyp: 'ZNB2',
            doctyp_desc: 'Non-Trade PR (Stock)',
            total: 45000000,
            curr_vnd: 'VND',
            total_doc_curr: 45000000,
            doc_curr: 'VND'
        },
        {
            instanceID: 'task-pr-ztol',
            status: 'IN PROCESSING',
            typeid: 'BUS2105',
            instid: '10000006',
            credate: '2026-06-25',
            cretime: '11:30:00',
            doctyp: 'ZTOL',
            doctyp_desc: 'Tools PR',
            total: 12000000,
            curr_vnd: 'VND',
            total_doc_curr: 12000000,
            doc_curr: 'VND'
        },
        // PO Subtypes
        {
            instanceID: 'task-po-zass',
            status: 'IN PROCESSING',
            typeid: 'BUS2012',
            instid: '4500000001',
            credate: '2026-06-26',
            cretime: '09:00:00',
            doctyp: 'ZASS',
            doctyp_desc: 'Asset PO',
            total: 350000000,
            curr_vnd: 'VND',
            total_doc_curr: 350000000,
            doc_curr: 'VND'
        },
        {
            instanceID: 'task-po-zcon',
            status: 'IN PROCESSING',
            typeid: 'BUS2012',
            instid: '4500000002',
            credate: '2026-06-26',
            cretime: '10:00:00',
            doctyp: 'ZCON',
            doctyp_desc: 'Consignment PO',
            total: 180000000,
            curr_vnd: 'VND',
            total_doc_curr: 180000000,
            doc_curr: 'VND'
        },
        {
            instanceID: 'task-po-zcor',
            status: 'IN PROCESSING',
            typeid: 'BUS2012',
            instid: '4500000003',
            credate: '2026-06-26',
            cretime: '10:30:00',
            doctyp: 'ZCOR',
            doctyp_desc: 'Consignment Return PO',
            total: 30000000,
            curr_vnd: 'VND',
            total_doc_curr: 30000000,
            doc_curr: 'VND'
        },
        {
            instanceID: 'task-po-zexp',
            status: 'IN PROCESSING',
            typeid: 'BUS2012',
            instid: '4500000004',
            credate: '2026-06-26',
            cretime: '11:00:00',
            doctyp: 'ZEXP',
            doctyp_desc: 'Expense PO',
            total: 40000000,
            curr_vnd: 'VND',
            total_doc_curr: 40000000,
            doc_curr: 'VND'
        },
        {
            instanceID: 'task-po-zmak',
            status: 'IN PROCESSING',
            typeid: 'BUS2012',
            instid: '4500000005',
            credate: '2026-06-26',
            cretime: '12:00:00',
            doctyp: 'ZMAK',
            doctyp_desc: 'Marketing PO',
            total: 95000000,
            curr_vnd: 'VND',
            total_doc_curr: 95000000,
            doc_curr: 'VND'
        },
        {
            instanceID: 'task-po-znb1',
            status: 'IN PROCESSING',
            typeid: 'BUS2012',
            instid: '4500000006',
            credate: '2026-06-26',
            cretime: '14:00:00',
            doctyp: 'ZNB1',
            doctyp_desc: 'Trading PO',
            total: 600000000,
            curr_vnd: 'VND',
            total_doc_curr: 24000,
            doc_curr: 'USD'
        },
        {
            instanceID: 'task-po-znb2',
            status: 'IN PROCESSING',
            typeid: 'BUS2012',
            instid: '4500000007',
            credate: '2026-06-26',
            cretime: '15:00:00',
            doctyp: 'ZNB2',
            doctyp_desc: 'Non-Trade PO (Stock)',
            total: 55000000,
            curr_vnd: 'VND',
            total_doc_curr: 55000000,
            doc_curr: 'VND'
        },
        {
            instanceID: 'task-po-znbr',
            status: 'IN PROCESSING',
            typeid: 'BUS2012',
            instid: '4500000008',
            credate: '2026-06-26',
            cretime: '15:30:00',
            doctyp: 'ZNBR',
            doctyp_desc: 'Trading Return PO',
            total: 50000000,
            curr_vnd: 'VND',
            total_doc_curr: 2000,
            doc_curr: 'USD'
        },
        {
            instanceID: 'task-po-ztol',
            status: 'IN PROCESSING',
            typeid: 'BUS2012',
            instid: '4500000009',
            credate: '2026-06-26',
            cretime: '16:00:00',
            doctyp: 'ZTOL',
            doctyp_desc: 'Tools PO',
            total: 15000000,
            curr_vnd: 'VND',
            total_doc_curr: 15000000,
            doc_curr: 'VND'
        },
        {
            instanceID: 'task-po-zub',
            status: 'IN PROCESSING',
            typeid: 'BUS2012',
            instid: '4500000010',
            credate: '2026-06-26',
            cretime: '17:00:00',
            doctyp: 'ZUB',
            doctyp_desc: 'Stock Transport Order',
            total: 0,
            curr_vnd: '',
            total_doc_curr: 0,
            doc_curr: ''
        },
        // Reservation
        {
            instanceID: 'task-re-01',
            status: 'IN PROCESSING',
            typeid: 'BUS2093',
            instid: '0000000888',
            documentNumber: '0000000888',
            credate: '2026-06-24',
            cretime: '14:20:00',
            doctyp: 'RESV',
            doctyp_desc: 'Reservation',
            total: 2270982,
            curr_vnd: 'VND',
            total_doc_curr: 2270982,
            doc_curr: 'VND',
            normalTask: false
        },
        // Claim
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
    const list = getMockInstances();
    return list.map((inst: any) => {
        const isCompleted = inst.status === 'COMPLETED';
        const actionPrefix = isCompleted ? 'Approved' : 'Approve';
        const docDesc = inst.doctyp_desc || inst.doctyp || inst.typeid;
        return {
            InstanceID: inst.instanceID,
            Status: inst.status === 'COMPLETED' ? 'COMPLETED' : 'READY',
            TaskDefinitionID: inst.typeid,
            TaskTitle: inst.TaskTitle || `${actionPrefix} ${docDesc} ${inst.instid}`,
            CreatedOn: new Date(inst.credate + 'T' + inst.cretime + 'Z').toISOString(),
            CreatedByName: inst.typeid === 'BUS2105' ? 'Nguyen Van A' : inst.typeid === 'BUS2012' ? 'Tran Thi B' : inst.typeid === 'BUS2093' ? 'Le Van C' : 'Pham Van D',
            Priority: inst.total > 100000000 ? 'HIGH' : 'MEDIUM'
        };
    });
}

export function getMockTaskRuntime(instanceId: string) {
    const inst = getMockInstances().find(i => i.instanceID === instanceId) as any;
    if (!inst) {
        return {
            InstanceID: instanceId,
            Status: 'READY',
            TaskTitle: `Approve Request ${instanceId}`,
            CreatedOn: new Date().toISOString(),
            CreatedByName: 'System Admin',
            decisions: [
                { DecisionKey: '0001', DecisionText: 'Approve' },
                { DecisionKey: '0002', DecisionText: 'Reject' }
            ]
        };
    }

    const isCompleted = inst.status === 'COMPLETED';
    const actionPrefix = isCompleted ? 'Approved' : 'Approve';
    const docDesc = inst.doctyp_desc || inst.doctyp || inst.typeid;

    return {
        InstanceID: instanceId,
        Status: inst.status === 'COMPLETED' ? 'COMPLETED' : 'READY',
        TaskTitle: inst.TaskTitle || `${actionPrefix} ${docDesc} ${inst.instid}`,
        CreatedOn: new Date(inst.credate + 'T' + inst.cretime + 'Z').toISOString(),
        CreatedByName: inst.typeid === 'BUS2105' ? 'Nguyen Van A' : inst.typeid === 'BUS2012' ? 'Tran Thi B' : inst.typeid === 'BUS2093' ? 'Le Van C' : 'Pham Van D',
        decisions: inst.status === 'COMPLETED' ? [] : [
            { DecisionKey: '0001', DecisionText: 'Approve' },
            { DecisionKey: '0002', DecisionText: 'Reject' }
        ]
    };
}

export function getMockDetail(objectType: string, objectId: string) {
    const inst = getMockInstances().find(i => i.instid === objectId || i.instanceID === objectId);
    const documentType = inst?.doctyp || (objectType === 'PR' ? 'ZASS' : 'DEFAULT');

    if (objectType === 'RE') {
        return {
            objectType: 'RE',
            documentType: 'DEFAULT',
            objectId,
            header: {
                reservationNumber: objectId,
                goodsRecipient: 'Le Van C',
                movementType: '201 - Goods issue for cost center',
                costCenter: 'CC1001 - Administration CC',
                requirementDate: '2026-06-24T00:00:00Z',
                assetNumber: 'AST-RE-99001',
                internalOrder: 'IO-RE-2200 - Safety Auditing'
            },
            items: [
                {
                    reservationItem: '00010',
                    material: 'Safety Goggles (MAT-SF-01)',
                    quantity: 10,
                    unit: 'PC',
                    storageLocation: 'SL01 - General Store'
                },
                {
                    reservationItem: '00020',
                    material: 'Nitrile Gloves Pack (MAT-SF-02)',
                    quantity: 50,
                    unit: 'SET',
                    storageLocation: 'SL01 - General Store'
                }
            ],
            accountAssignments: [
                { id: '1', reservationItem: '00010', costCenter: 'CC1001 - Administration CC', glAccount: '610500 - Safety Supplies Opex', percentage: '100%', value: '1500000' },
                { id: '2', reservationItem: '00020', costCenter: 'CC1001 - Administration CC', glAccount: '610500 - Safety Supplies Opex', percentage: '100%', value: '3500000' }
            ],
            comments: [
                { author: 'Le Van C', text: 'Safety gear needed for factory floor inspection.' }
            ],
            attachments: []
        };
    }

    if (objectType === 'CLAIM') {
        return {
            objectType: 'CLAIM',
            documentType: 'DEFAULT',
            objectId,
            header: {
                claimNumber: objectId,
                claimant: 'Pham Van D',
                department: 'Sales Department',
                claimDate: '2026-06-27T00:00:00Z',
                totalAmount: '5000000',
                currency: 'VND',
                justification: 'Quarterly sales review workshop and customer relationship building in Da Nang office.',
                projectRef: 'PRJ-2026-APAC-SALES'
            },
            items: [
                {
                    itemNo: '1',
                    receiptDate: '2026-06-20T00:00:00Z',
                    expenseType: 'Taxi Fare',
                    amount: '350000',
                    description: 'Client visit transportation'
                },
                {
                    itemNo: '2',
                    receiptDate: '2026-06-21T00:00:00Z',
                    expenseType: 'Business Lunch',
                    amount: '1500000',
                    description: 'Lunch meeting with client representatives'
                },
                {
                    itemNo: '3',
                    receiptDate: '2026-06-22T00:00:00Z',
                    expenseType: 'Hotel Accommodation',
                    amount: '3150000',
                    description: 'Lodging in Da Nang office support'
                }
            ],
            projectDistributions: [
                { id: '1', projectCode: 'PRJ-2026-APAC-SALES', projectName: 'APAC Regional Sales Expansion', allocatedAmount: '3500000', approvedBy: 'Nguyen Van A - Regional Director' },
                { id: '2', projectCode: 'PRJ-2026-WORKSHOP', projectName: 'Internal Training & Workshops', allocatedAmount: '1500000', approvedBy: 'Tran Thi B - Training Manager' }
            ],
            comments: [
                { author: 'Pham Van D', text: 'Expense claim for Da Nang business travel.' }
            ],
            attachments: [
                { id: 'receipt-01', fileName: 'Hotel_Receipt.pdf', mimeType: 'application/pdf', fileSize: 1548576, createdBy: 'Pham Van D', createdAt: '2026-06-27T11:00:00Z' }
            ]
        };
    }

    if (objectType === 'PR') {
        let text = 'IT Department Laptop Purchase';
        let items: any[] = [
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
        ];

        if (documentType === 'ZEXP') {
            text = 'Office Software Subscription Licenses';
            items = [
                {
                    purchaseRequisition: objectId,
                    purchaseRequisitionItem: '00010',
                    purchaseRequisitionItemText: 'Microsoft 365 Enterprise E5 Annual Subscription',
                    material: 'SW-LIC-MS-365',
                    materialGroup: '003',
                    materialGroupText: 'Software Subscriptions',
                    requestedQuantity: '10',
                    baseUnit: 'PC',
                    purchaseRequisitionPrice: '1200000',
                    purReqnItemCurrency: 'VND',
                    purReqnItemTotalAmount: '12000000',
                    purReqnReleaseStatus: '02',
                    purReqnReleaseStatusText: 'In release',
                    deliveryDate: '2026-07-15T00:00:00Z',
                    Plant: '1000',
                    costCenter: '1001201000 - IT department'
                },
                {
                    purchaseRequisition: objectId,
                    purchaseRequisitionItem: '00020',
                    purchaseRequisitionItemText: 'Adobe Creative Cloud Team License',
                    material: 'SW-LIC-ADOBE-CC',
                    materialGroup: '003',
                    materialGroupText: 'Software Subscriptions',
                    requestedQuantity: '2',
                    baseUnit: 'PC',
                    purchaseRequisitionPrice: '6500000',
                    purReqnItemCurrency: 'VND',
                    purReqnItemTotalAmount: '13000000',
                    purReqnReleaseStatus: '02',
                    purReqnReleaseStatusText: 'In release',
                    deliveryDate: '2026-07-15T00:00:00Z',
                    Plant: '1000',
                    costCenter: '1001201000 - IT department'
                }
            ];
        } else if (documentType === 'ZMAK') {
            text = 'Summer Event Advertising Campaign';
            items = [
                {
                    purchaseRequisition: objectId,
                    purchaseRequisitionItem: '00010',
                    purchaseRequisitionItemText: 'Social Media Placement (Facebook/Google Ads)',
                    material: 'SRV-ADV-01',
                    materialGroup: '004',
                    materialGroupText: 'Advertising Services',
                    requestedQuantity: '1',
                    baseUnit: 'JOB',
                    purchaseRequisitionPrice: '50000000',
                    purReqnItemCurrency: 'VND',
                    purReqnItemTotalAmount: '50000000',
                    purReqnReleaseStatus: '02',
                    purReqnReleaseStatusText: 'In release',
                    deliveryDate: '2026-08-01T00:00:00Z',
                    Plant: '1000',
                    marketingCampaign: 'CAMP-2026-Q3 - Summer Launch',
                    OrderInternalID: '200000106',
                    OrderInternalName: 'A',
                    orderInternalId: '200000106',
                    orderInternalName: 'A'
                },
                {
                    purchaseRequisition: objectId,
                    purchaseRequisitionItem: '00020',
                    purchaseRequisitionItemText: 'Brochure Printing & Event Booth Design',
                    material: 'SRV-PRNT-02',
                    materialGroup: '004',
                    materialGroupText: 'Advertising Services',
                    requestedQuantity: '1',
                    baseUnit: 'JOB',
                    purchaseRequisitionPrice: '30000000',
                    purReqnItemCurrency: 'VND',
                    purReqnItemTotalAmount: '30000000',
                    purReqnReleaseStatus: '02',
                    purReqnReleaseStatusText: 'In release',
                    deliveryDate: '2026-08-01T00:00:00Z',
                    Plant: '1000',
                    marketingCampaign: 'CAMP-2026-Q3 - Summer Launch',
                    OrderInternalID: '200000106',
                    OrderInternalName: 'A',
                    orderInternalId: '200000106',
                    orderInternalName: 'A'
                }
            ];
        } else if (documentType === 'ZNB1') {
            text = 'Duty-Free Merchandise Import - Q3';
            items = [
                {
                    purchaseRequisition: objectId,
                    purchaseRequisitionItem: '00010',
                    purchaseRequisitionItemText: 'Chanel Coco Mademoiselle Eau de Parfum 100ml',
                    material: 'TRD-PERF-CH01',
                    materialGroup: '005',
                    materialGroupText: 'In-flight Merchandise',
                    requestedQuantity: '100',
                    baseUnit: 'PC',
                    purchaseRequisitionPrice: '3500000',
                    purReqnItemCurrency: 'VND',
                    purReqnItemTotalAmount: '350000000',
                    purReqnReleaseStatus: '02',
                    purReqnReleaseStatusText: 'In release',
                    deliveryDate: '2026-09-01T00:00:00Z',
                    Plant: '2000',
                    salesChannel: 'Aviation In-Flight Duty Free'
                },
                {
                    purchaseRequisition: objectId,
                    purchaseRequisitionItem: '00020',
                    purchaseRequisitionItemText: 'Boeing 787-9 Dreamliner 1:200 Scale Model',
                    material: 'TRD-TOY-B787',
                    materialGroup: '005',
                    materialGroupText: 'In-flight Merchandise',
                    requestedQuantity: '50',
                    baseUnit: 'PC',
                    purchaseRequisitionPrice: '3000000',
                    purReqnItemCurrency: 'VND',
                    purReqnItemTotalAmount: '150000000',
                    purReqnReleaseStatus: '02',
                    purReqnReleaseStatusText: 'In release',
                    deliveryDate: '2026-09-01T00:00:00Z',
                    Plant: '2000',
                    salesChannel: 'Aviation In-Flight Duty Free'
                }
            ];
        } else if (documentType === 'ZNB2') {
            text = 'Office Stationery and Pantry Supplies';
            items = [
                {
                    purchaseRequisition: objectId,
                    purchaseRequisitionItem: '00010',
                    purchaseRequisitionItemText: 'Double A Printer Paper A4 80gsm (Box of 5 reams)',
                    material: 'STN-PAP-A4',
                    materialGroup: '006',
                    materialGroupText: 'Office Supplies',
                    requestedQuantity: '20',
                    baseUnit: 'BOX',
                    purchaseRequisitionPrice: '450000',
                    purReqnItemCurrency: 'VND',
                    purReqnItemTotalAmount: '9000000',
                    purReqnReleaseStatus: '02',
                    purReqnReleaseStatusText: 'In release',
                    deliveryDate: '2026-07-10T00:00:00Z',
                    Plant: '1000',
                    storageLocation: 'SL01 - Main Warehouse'
                },
                {
                    purchaseRequisition: objectId,
                    purchaseRequisitionItem: '00020',
                    purchaseRequisitionItemText: 'Arabica Coffee Beans Roasted (1kg bag)',
                    material: 'PAN-COF-ARA',
                    materialGroup: '007',
                    materialGroupText: 'Pantry Supplies',
                    requestedQuantity: '40',
                    baseUnit: 'BAG',
                    purchaseRequisitionPrice: '900000',
                    purReqnItemCurrency: 'VND',
                    purReqnItemTotalAmount: '36000000',
                    purReqnReleaseStatus: '02',
                    purReqnReleaseStatusText: 'In release',
                    deliveryDate: '2026-07-10T00:00:00Z',
                    Plant: '1000',
                    storageLocation: 'SL01 - Main Warehouse'
                }
            ];
        } else if (documentType === 'ZTOL') {
            text = 'Maintenance Toolset and Safety Gear';
            items = [
                {
                    purchaseRequisition: objectId,
                    purchaseRequisitionItem: '00010',
                    purchaseRequisitionItemText: 'Industrial Protective Safety Helmets',
                    material: 'MNT-SF-HELMET',
                    materialGroup: '008',
                    materialGroupText: 'Maintenance Equipment',
                    requestedQuantity: '30',
                    baseUnit: 'PC',
                    purchaseRequisitionPrice: '250000',
                    purReqnItemCurrency: 'VND',
                    purReqnItemTotalAmount: '7500000',
                    purReqnReleaseStatus: '02',
                    purReqnReleaseStatusText: 'In release',
                    deliveryDate: '2026-08-15T00:00:00Z',
                    Plant: '3000',
                    toolCategory: 'Safety Equipment'
                },
                {
                    purchaseRequisition: objectId,
                    purchaseRequisitionItem: '00020',
                    purchaseRequisitionItemText: 'Heavy-Duty Torque Screwdriver Set',
                    material: 'MNT-TL-TORQ',
                    materialGroup: '008',
                    materialGroupText: 'Maintenance Equipment',
                    requestedQuantity: '5',
                    baseUnit: 'SET',
                    purchaseRequisitionPrice: '900000',
                    purReqnItemCurrency: 'VND',
                    purReqnItemTotalAmount: '4500000',
                    purReqnReleaseStatus: '02',
                    purReqnReleaseStatusText: 'In release',
                    deliveryDate: '2026-08-15T00:00:00Z',
                    Plant: '3000',
                    toolCategory: 'Safety Equipment'
                }
            ];
        }

        const detail: any = {
            objectType,
            documentType,
            objectId,
            header: {
                purchaseRequisition: objectId,
                purchaseRequisitionText: text,
                purReqnRequestor: 'NGUYENVANA',
                userFullName: 'Nguyen Van A',
                purReqCreationDate: '2026-06-25T08:00:00Z',
                numberOfItems: String(items.length),
                purchaseRequisitionType: documentType,
                totalNetAmount: inst ? String(inst.total) : '150000000',
                displayCurrency: 'VND',
                workflowScenarioDefinition: 'WS00800173',
                isPurReqnOvrlRel: 'X',
                createdByUser: 'MINHDT',
                CreationDate: '2026-08-04',
                CreationTime: '10:24:18',
                creationDate: '2026-08-04',
                creationTime: '10:24:18',
                FundsCenter: '1001201000',
                FundsCenterName: 'Phòng CNTT',
                fundsCenter: '1001201000',
                fundsCenterName: 'Phòng CNTT',
                releaseStrategyName: 'IT Release'
            },
            items: items,
            budget: {
                status: (documentType === 'ZASS' || documentType === 'ZEXP') ? 'WARNING' : 'NONE'
            },
            approvalTree: [
                { step: 1, approver: 'Line Manager', status: 'APPROVED' },
                { step: 2, approver: 'Department Head', status: 'PENDING' }
            ],
            comments: [
                { author: 'Nguyen Van A', text: `Please approve this ${documentType} PR for local requirements.` },
                ...getMockComments(objectId)
            ],
            attachments: [
                { id: 'quotation-01', fileName: 'Quotation_MacBook.pdf', mimeType: 'application/pdf', fileSize: 1048576, createdBy: 'Nguyen Van A', createdAt: '2026-06-25T08:00:00Z' },
                ...getMockAttachments(objectId)
            ]
        };

        // Enrich specific PR subtype properties
        if (documentType === 'ZASS') {
            detail.header.assetClass = 'IT-EQUIP - Computer Hardware';
            detail.header.assetNumber = 'AST-98765-A';
            detail.header.assetSubnumber = '0001';
            detail.header.wbsElement = 'WBS-2026-IT-09 - Client Hardware Refresh';
            detail.header.capDate = '2026-07-20T00:00:00Z';
            detail.accountAssignments = [
                { id: '1', item: '00010', costCenter: '1001201000 - IT department', glAccount: '6105 - IT Equipment & Software Cost', percentage: '60%', value: '90000000' },
                { id: '2', item: '00010', costCenter: '1001202000 - Finance Department', glAccount: '6105 - IT Equipment & Software Cost', percentage: '40%', value: '60000000' },
                { id: '3', item: '00020', costCenter: '1001201000 - IT department', glAccount: '6105 - IT Equipment & Software Cost', percentage: '100%', value: '10000000' }
            ];
        } else if (documentType === 'ZEXP') {
            detail.header.costCenter = '1001201000';
            detail.header.costCenterName = 'IT department';
            detail.header.glAccount = '6105';
            detail.header.glAccountName = 'IT Equipment & Software Cost';
            detail.header.internalOrder = 'IO-998877 - Subscription Licensing';
            detail.header.budgetPeriod = '2026_Q3 - Q3 Operating Budget';
            detail.header.fund = 'FD-IT-OPEX - IT Operational Fund';
            detail.accountAssignments = [
                { id: '1', item: '00010', costCenter: '1001201000 - IT department', glAccount: '6105 - IT Equipment & Software Cost', percentage: '100%', value: '12000000' },
                { id: '2', item: '00020', costCenter: '1001201000 - IT department', glAccount: '6105 - IT Equipment & Software Cost', percentage: '100%', value: '13000000' }
            ];
        } else if (documentType === 'ZMAK') {
            detail.header.marketingCampaign = 'CAMP-2026-Q3';
            detail.header.campaignName = 'Summer Event Advertising Campaign';
            detail.header.campaignBudget = '500000000';
            detail.header.targetAudience = 'Young Travelers (Gen Z) and Corporate Clients';
            detail.header.campaignManager = 'Elena Rostova - Marketing Director';
            detail.channelBreakdown = [
                { id: '1', channel: 'Social Media Placement (Facebook/Google Ads)', targetImpressions: '2,500,000', budgetShare: '62.5%', startDate: '2026-08-01T00:00:00Z' },
                { id: '2', channel: 'Event Booth Design & Flyers', targetImpressions: '50,000', budgetShare: '37.5%', startDate: '2026-08-01T00:00:00Z' }
            ];
        } else if (documentType === 'ZNB1') {
            detail.header.salesChannel = 'Aviation In-Flight Duty Free';
            detail.header.targetCustomer = 'International First/Business Class Passengers';
            detail.header.tariffCode = '3303.00.00 - Perfumes and toilet waters';
            detail.header.originCountry = 'FR - France';
            detail.header.dutyRate = '10.0%';
            detail.tariffsBreakdown = [
                { id: '1', item: '00010', hsCode: '3303.00.00', description: 'Chanel Coco Mademoiselle 100ml', customsDutyRate: '10.0%', estimatedDuty: '35000000' },
                { id: '2', item: '00020', hsCode: '9503.00.00', description: 'Scale Models (Aviation Toys)', customsDutyRate: '5.0%', estimatedDuty: '7500000' }
            ];
        } else if (documentType === 'ZNB2') {
            detail.header.storageLocation = 'SL01 - Main Warehouse';
            detail.header.receivingPlant = 'PL01 - Hanoi HQ';
            detail.header.storageBin = 'BIN-A4-R12 - Rack 12 Section A';
            detail.header.minStock = '50 units';
            detail.header.reorderPoint = '100 units';
            detail.header.stockController = 'Tran Van B - Inventory Head';
        } else if (documentType === 'ZTOL') {
            detail.header.toolCategory = 'Safety Equipment';
            detail.header.safetyLevel = 'Level 3 - Mandatory Inspection';
            detail.header.safetyCert = 'ISO-45001 - Occupational Health & Safety';
            detail.header.custodianDept = 'MNT-OPS - Maintenance Operations';
            detail.header.calibrationDue = '2026-12-31T00:00:00Z';
        }

        return detail;
    }

    // Default to PO structure
    let text = 'Standard Hardware Supplies PO';
    let supplierName = 'FPT Computer Center';
    let items: any[] = [
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
    ];

    if (documentType === 'ZASS') {
        text = 'Enterprise Servers Hardware Supply';
        supplierName = 'Dell Tech Vietnam';
        items = [
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00010',
                purchaseOrderItemText: 'Dell PowerEdge R760 Rack Server',
                materialGroup: '001',
                materialGroupText: 'IT Server Hardware',
                firstDeliveryDate: '2026-07-20T00:00:00Z',
                orderQuantity: '2',
                purchaseOrderQuantityUnit: 'PC',
                netPriceAmount: '150000000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '300000000',
                assetClass: 'IT-EQUIP'
            },
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00020',
                purchaseOrderItemText: 'Uninterruptible Power Supply (UPS) 5kVA',
                materialGroup: '001',
                materialGroupText: 'IT Server Hardware',
                firstDeliveryDate: '2026-07-20T00:00:00Z',
                orderQuantity: '2',
                purchaseOrderQuantityUnit: 'PC',
                netPriceAmount: '25000000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '50000000',
                assetClass: 'IT-EQUIP'
            }
        ];
    } else if (documentType === 'ZCON') {
        text = 'In-flight Snack Packs Consignment Agreement';
        supplierName = 'Aviation Food JSC';
        items = [
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00010',
                purchaseOrderItemText: 'Premium Roasted Cashew Nuts (Pack of 50)',
                materialGroup: '005',
                materialGroupText: 'In-flight Catering',
                firstDeliveryDate: '2026-07-15T00:00:00Z',
                orderQuantity: '200',
                purchaseOrderQuantityUnit: 'PACK',
                netPriceAmount: '600000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '120000000',
                consignmentAgreement: 'CON-AGR-443'
            },
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00020',
                purchaseOrderItemText: 'Organic Fruit Juice Cans (Case of 24)',
                materialGroup: '005',
                materialGroupText: 'In-flight Catering',
                firstDeliveryDate: '2026-07-15T00:00:00Z',
                orderQuantity: '100',
                purchaseOrderQuantityUnit: 'CASE',
                netPriceAmount: '600000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '60000000',
                consignmentAgreement: 'CON-AGR-443'
            }
        ];
    } else if (documentType === 'ZCOR') {
        text = 'Returned Expired Consignment Snacks';
        supplierName = 'Aviation Food JSC';
        items = [
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00010',
                purchaseOrderItemText: 'Premium Roasted Cashew Nuts (Expired)',
                materialGroup: '005',
                materialGroupText: 'In-flight Catering',
                firstDeliveryDate: '2026-07-15T00:00:00Z',
                orderQuantity: '-50',
                purchaseOrderQuantityUnit: 'PACK',
                netPriceAmount: '600000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '-30000000',
                originalPO: '4500000002'
            }
        ];
    } else if (documentType === 'ZEXP') {
        text = 'Janitorial Services Contract - H2';
        supplierName = 'Hanoi Cleaning Services Ltd';
        items = [
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00010',
                purchaseOrderItemText: 'Office Deep Cleaning & Disinfection Services',
                materialGroup: '009',
                materialGroupText: 'Facility Services',
                firstDeliveryDate: '2026-08-01T00:00:00Z',
                orderQuantity: '6',
                purchaseOrderQuantityUnit: 'MTH',
                netPriceAmount: '5000000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '30000000',
                costCenter: 'CC-ADMIN'
            },
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00020',
                purchaseOrderItemText: 'Pest Control Quarterly Treatment',
                materialGroup: '009',
                materialGroupText: 'Facility Services',
                firstDeliveryDate: '2026-09-01T00:00:00Z',
                orderQuantity: '2',
                purchaseOrderQuantityUnit: 'JOB',
                netPriceAmount: '5000000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '10000000',
                costCenter: 'CC-ADMIN'
            }
        ];
    } else if (documentType === 'ZMAK') {
        text = 'Social Media Advertising Placement';
        supplierName = 'Golden Communication Agency';
        items = [
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00010',
                purchaseOrderItemText: 'Google Ads Search Campaigns',
                materialGroup: '004',
                materialGroupText: 'Marketing & PR Services',
                firstDeliveryDate: '2026-08-01T00:00:00Z',
                orderQuantity: '1',
                purchaseOrderQuantityUnit: 'JOB',
                netPriceAmount: '60000000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '60000000',
                marketingCampaign: 'CAMP-SUMMER'
            },
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00020',
                purchaseOrderItemText: 'Facebook Sponsored Video Ads',
                materialGroup: '004',
                materialGroupText: 'Marketing & PR Services',
                firstDeliveryDate: '2026-08-01T00:00:00Z',
                orderQuantity: '1',
                purchaseOrderQuantityUnit: 'JOB',
                netPriceAmount: '35000000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '35000000',
                marketingCampaign: 'CAMP-SUMMER'
            }
        ];
    } else if (documentType === 'ZNB1') {
        text = 'Trading Duty-Free Goods Supply';
        supplierName = 'DFS Group Luxury Trade';
        items = [
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00010',
                purchaseOrderItemText: 'Swiss Luxury Wristwatches',
                materialGroup: '005',
                materialGroupText: 'Retail In-flight Merch',
                firstDeliveryDate: '2026-08-15T00:00:00Z',
                orderQuantity: '10',
                purchaseOrderQuantityUnit: 'PC',
                netPriceAmount: '40000000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '400000000',
                importLicense: 'LIC-IM-2026-88'
            },
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00020',
                purchaseOrderItemText: 'Designer Leather Handbags',
                materialGroup: '005',
                materialGroupText: 'Retail In-flight Merch',
                firstDeliveryDate: '2026-08-15T00:00:00Z',
                orderQuantity: '10',
                purchaseOrderQuantityUnit: 'PC',
                netPriceAmount: '20000000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '200000000',
                importLicense: 'LIC-IM-2026-88'
            }
        ];
    } else if (documentType === 'ZNB2') {
        text = 'Pantry Beverages Supply';
        supplierName = 'Metro Cash & Carry Vietnam';
        items = [
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00010',
                purchaseOrderItemText: 'Premium Tea Bags Box (100 bags)',
                materialGroup: '007',
                materialGroupText: 'Pantry Supplies',
                firstDeliveryDate: '2026-07-15T00:00:00Z',
                orderQuantity: '100',
                purchaseOrderQuantityUnit: 'BOX',
                netPriceAmount: '250000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '25000000',
                storageLocation: 'ST-02'
            },
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00020',
                purchaseOrderItemText: 'UHT Fresh Milk 1L Box',
                materialGroup: '007',
                materialGroupText: 'Pantry Supplies',
                firstDeliveryDate: '2026-07-15T00:00:00Z',
                orderQuantity: '300',
                purchaseOrderQuantityUnit: 'BOX',
                netPriceAmount: '100000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '30000000',
                storageLocation: 'ST-02'
            }
        ];
    } else if (documentType === 'ZNBR') {
        text = 'Defective Designer Goods Return';
        supplierName = 'DFS Group Luxury Trade';
        items = [
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00010',
                purchaseOrderItemText: 'Designer Leather Handbags (Scratched)',
                materialGroup: '005',
                materialGroupText: 'Retail In-flight Merch',
                firstDeliveryDate: '2026-08-30T00:00:00Z',
                orderQuantity: '-2',
                purchaseOrderQuantityUnit: 'PC',
                netPriceAmount: '25000000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '-50000000',
                defectCategory: 'Packaging Damaged'
            }
        ];
    } else if (documentType === 'ZTOL') {
        text = 'Maintenance Tools and Drill Sets';
        supplierName = 'Bosch Vietnam Distributor';
        items = [
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00010',
                purchaseOrderItemText: 'Rotary Hammer Drill Kit 800W',
                materialGroup: '008',
                materialGroupText: 'Maintenance Equipment & Tools',
                firstDeliveryDate: '2026-07-20T00:00:00Z',
                orderQuantity: '5',
                purchaseOrderQuantityUnit: 'SET',
                netPriceAmount: '2000000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '10000000',
                toolSetCode: 'TOOL-CAT-09'
            },
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00020',
                purchaseOrderItemText: 'Mechanic Hand Tool Socket Set',
                materialGroup: '008',
                materialGroupText: 'Maintenance Equipment & Tools',
                firstDeliveryDate: '2026-07-20T00:00:00Z',
                orderQuantity: '5',
                purchaseOrderQuantityUnit: 'SET',
                netPriceAmount: '1000000',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '5000000',
                toolSetCode: 'TOOL-CAT-09'
            }
        ];
    } else if (documentType === 'ZUB') {
        text = 'Inter-Warehouse Stock Transfer STO';
        supplierName = 'Internal Supply Store';
        items = [
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00010',
                purchaseOrderItemText: 'Engine Spare Parts (Box)',
                materialGroup: '008',
                materialGroupText: 'Maintenance Equipment & Tools',
                firstDeliveryDate: '2026-07-25T00:00:00Z',
                orderQuantity: '5',
                purchaseOrderQuantityUnit: 'BOX',
                netPriceAmount: '0',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '0',
                supplyingPlant: 'PL-02 - Danang Factory'
            },
            {
                purchaseOrder: objectId,
                purchaseOrderItem: '00020',
                purchaseOrderItemText: 'Aircraft Maintenance Lubricants',
                materialGroup: '008',
                materialGroupText: 'Maintenance Equipment & Tools',
                firstDeliveryDate: '2026-07-25T00:00:00Z',
                orderQuantity: '10',
                purchaseOrderQuantityUnit: 'CAN',
                netPriceAmount: '0',
                purchaseOrderPriceUnit: 'VND',
                documentCurrency: 'VND',
                netAmount: '0',
                supplyingPlant: 'PL-02 - Danang Factory'
            }
        ];
    }

    const detail: any = {
        objectType,
        documentType,
        objectId,
        header: {
            purchaseOrder: objectId,
            purchaseOrderText: text,
            purchaseOrderType: documentType,
            purchaseOrderTypeText: documentType + ' PO',
            supplier: '1000001',
            supplierName: supplierName,
            userFullName: 'Tran Thi B',
            createdByUser: 'TRANTHIB',
            CreationDate: '2026-08-04',
            CreationTime: '10:24:18',
            creationDate: '2026-08-04',
            creationTime: '10:24:18',
            FundsCenter: '1001201000',
            FundsCenterName: 'Phòng CNTT',
            fundsCenter: '1001201000',
            fundsCenterName: 'Phòng CNTT',
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
            purchaseOrderNetAmount: inst ? String(inst.total) : '5512500',
            TotalNetValueBeforeTax: 5000000,
            totalNetValueBeforeTax: 5000000,
            TotalFreightAmount: 250000,
            totalFreightAmount: 250000,
            TotalVatAmount: 262500,
            totalVatAmount: 262500,
            TotalOrderValue: 5512500,
            totalOrderValue: 5512500,
            purchasingDocumentStatusName: 'In Approval'
        },
        items: items,
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
            { author: 'Tran Thi B', text: `This PO of type ${documentType} includes bulk purchase items.` },
            ...getMockComments(objectId)
        ],
        attachments: [
            { id: 'quotation-01', fileName: 'Quotation_MacBook.pdf', mimeType: 'application/pdf', fileSize: 1048576, createdBy: 'Tran Thi B', createdAt: '2026-06-26T09:30:00Z' },
            ...getMockAttachments(objectId)
        ]
    };

    // Enrich specific PO subtype properties
    if (documentType === 'ZASS') {
        detail.header.assetClass = 'IT-EQUIP - Computer Hardware';
        detail.header.assetNumber = 'AST-98765-A';
        detail.header.assetSubnumber = '0001';
        detail.header.wbsElement = 'WBS-2026-IT-09 - Client Hardware Refresh';
        detail.header.capDate = '2026-07-20T00:00:00Z';
        detail.accountAssignments = [
            { id: '1', item: '00010', costCenter: '1001201000 - IT department', glAccount: '6105 - IT Equipment & Software Cost', percentage: '60%', value: '90000000' },
            { id: '2', item: '00010', costCenter: '1001202000 - Finance Department', glAccount: '6105 - IT Equipment & Software Cost', percentage: '40%', value: '60000000' }
        ];
        detail.deprSchedule = [
            { id: '1', year: '2026', deprMethod: 'SL - Straight Line', deprRate: '20%', carryingValue: '80000000' },
            { id: '2', year: '2027', deprMethod: 'SL - Straight Line', deprRate: '20%', carryingValue: '60000000' }
        ];
    } else if (documentType === 'ZCON') {
        detail.header.consignmentAgreement = 'CON-AGR-443';
        detail.header.agreementExpiry = '2027-12-31T00:00:00Z';
        detail.header.priceRule = 'Settle by Monthly Consumption Invoice';
    } else if (documentType === 'ZCOR') {
        detail.header.originalPO = '4500001122';
        detail.header.returnReason = 'Defective consignment items received (expired or damaged packaging)';
        detail.header.disposalAction = 'Scrap locally at Danang plant warehouse under supervision';
    } else if (documentType === 'ZEXP') {
        detail.header.costCenter = '1001201000';
        detail.header.costCenterName = 'IT department';
        detail.header.glAccount = '6105';
        detail.header.glAccountName = 'IT Equipment & Software Cost';
        detail.header.internalOrder = 'IO-998877 - Subscription Licensing';
        detail.header.budgetPeriod = '2026_Q3 - Q3 Operating Budget';
        detail.header.fund = 'FD-IT-OPEX - IT Operational Fund';
        detail.accountAssignments = [
            { id: '1', item: '00010', costCenter: '1001201000 - IT department', glAccount: '6105 - IT Equipment & Software Cost', percentage: '100%', value: '12000000' }
        ];
    } else if (documentType === 'ZMAK') {
        detail.header.marketingCampaign = 'CAMP-2026-Q3';
        detail.header.campaignName = 'Summer Event Advertising Campaign';
        detail.header.campaignBudget = '500000000';
        detail.header.targetAudience = 'Young Travelers (Gen Z) and Corporate Clients';
        detail.header.campaignManager = 'Elena Rostova - Marketing Director';
        detail.channelBreakdown = [
            { id: '1', channel: 'Social Media Placement (Facebook/Google Ads)', targetImpressions: '2,500,000', budgetShare: '62.5%', startDate: '2026-08-01T00:00:00Z' }
        ];
    } else if (documentType === 'ZNB1') {
        detail.header.importLicense = 'LIC-IM-2026-88 - Customs Clearance License';
        detail.header.customsDuty = '5000000';
        detail.header.tariffCode = '3303.00.00 - Perfumes and toilet waters';
        detail.header.originCountry = 'FR - France';
        detail.header.dutyRate = '10.0%';
        detail.tariffsBreakdown = [
            { id: '1', item: '00010', hsCode: '3303.00.00', description: 'Chanel Coco Mademoiselle 100ml', customsDutyRate: '10.0%', estimatedDuty: '35000000' }
        ];
    } else if (documentType === 'ZNB2') {
        detail.header.receivingPlant = 'PL-01 - Hanoi HQ';
        detail.header.storageLocation = 'ST-02 - Technical Spares Store';
        detail.header.storageBin = 'BIN-A4-R12 - Rack 12 Section A';
        detail.header.minStock = '50 units';
        detail.header.reorderPoint = '100 units';
        detail.header.stockController = 'Tran Van B - Inventory Head';
    } else if (documentType === 'ZNBR') {
        detail.header.returnCustomsRef = 'EXP-RET-55 - Export Customs Declaration';
        detail.header.defectCategory = 'Packaging Damaged / Crushed during shipping';
        detail.header.creditMemoInd = 'Credit Memo Requested from Supplier';
    } else if (documentType === 'ZTOL') {
        detail.header.toolSetCode = 'TOOL-CAT-09 - Calibration Tools Package';
        detail.header.assignedCustodian = 'John Doe - Maintenance Lead';
        detail.header.safetyCert = 'ISO-45001 - Occupational Health & Safety';
        detail.header.custodianDept = 'MNT-OPS - Maintenance Operations';
        detail.header.calibrationDue = '2026-12-31T00:00:00Z';
    } else if (documentType === 'ZUB') {
        detail.header.supplyingPlant = '1000';
        detail.header.supplyingPlantName = 'Kho tổng VJC Hà Nội';
        detail.header.receivingPlant = '1001';
        detail.header.receivingPlantName = 'Kho văn phòng VJC Hồ Chí Minh';
        detail.header.shippingMethod = 'Express Overland Freight';
        detail.header.transitDays = '3 days';
        detail.transitMilestones = [
            { id: '1', milestone: 'Dispatched from Source Plant', location: 'Danang Factory Gate', plannedDate: '2026-07-22T08:00:00Z', carrier: 'D&T Logistics' },
            { id: '2', milestone: 'Mid-transit checkpoint', location: 'Hue Hub Terminal', plannedDate: '2026-07-23T14:00:00Z', carrier: 'D&T Logistics' },
            { id: '3', milestone: 'Delivered to Destination', location: 'Hanoi HQ Warehouse', plannedDate: '2026-07-25T17:00:00Z', carrier: 'D&T Logistics' }
        ];
    }

    return detail;
}

export function getMockDocTypeCounts() {
    return [
        {
            DocumentType: 'RESV',
            DocCategory: 'ZBUS2093',
            MovementType: '',
            DocumentTypeText: 'Reservation',
            MovementTypeName: '',
            RequestCount: 3,
            SumNetAmountLocalCrcy: 0,
            LocalCurrency: ''
        },
        {
            DocumentType: 'ZASS',
            DocCategory: 'BUS2012',
            MovementType: '',
            DocumentTypeText: 'Asset PO',
            MovementTypeName: '',
            RequestCount: 1,
            SumNetAmountLocalCrcy: 5000,
            LocalCurrency: 'VND'
        },
        {
            DocumentType: 'ZASS',
            DocCategory: 'BUS2105',
            MovementType: '',
            DocumentTypeText: 'Asset PR',
            MovementTypeName: '',
            RequestCount: 9,
            SumNetAmountLocalCrcy: 18916350.94,
            LocalCurrency: 'VND'
        },
        {
            DocumentType: 'ZEXP',
            DocCategory: 'BUS2012',
            MovementType: '',
            DocumentTypeText: 'Expense PO',
            MovementTypeName: '',
            RequestCount: 1,
            SumNetAmountLocalCrcy: 50000,
            LocalCurrency: 'VND'
        },
        {
            DocumentType: 'ZEXP',
            DocCategory: 'BUS2105',
            MovementType: '',
            DocumentTypeText: 'Expense PR',
            MovementTypeName: '',
            RequestCount: 6,
            SumNetAmountLocalCrcy: 6873024,
            LocalCurrency: 'VND'
        },
        {
            DocumentType: 'ZMAK',
            DocCategory: 'BUS2012',
            MovementType: '',
            DocumentTypeText: 'Marketing PO',
            MovementTypeName: '',
            RequestCount: 1,
            SumNetAmountLocalCrcy: 300,
            LocalCurrency: 'VND'
        },
        {
            DocumentType: 'ZMAK',
            DocCategory: 'BUS2105',
            MovementType: '',
            DocumentTypeText: 'Marketing PR',
            MovementTypeName: '',
            RequestCount: 6,
            SumNetAmountLocalCrcy: 312568.91,
            LocalCurrency: 'VND'
        },
        {
            DocumentType: 'ZNB1',
            DocCategory: 'BUS2012',
            MovementType: '',
            DocumentTypeText: 'Trading PO',
            MovementTypeName: '',
            RequestCount: 1,
            SumNetAmountLocalCrcy: 100,
            LocalCurrency: 'VND'
        },
        {
            DocumentType: 'ZNB1',
            DocCategory: 'BUS2105',
            MovementType: '',
            DocumentTypeText: 'Trading PR',
            MovementTypeName: '',
            RequestCount: 3,
            SumNetAmountLocalCrcy: 18722,
            LocalCurrency: 'VND'
        },
        {
            DocumentType: 'ZNB2',
            DocCategory: 'BUS2012',
            MovementType: '',
            DocumentTypeText: 'Non-Trade PO (Stock',
            MovementTypeName: '',
            RequestCount: 1,
            SumNetAmountLocalCrcy: 14,
            LocalCurrency: 'VND'
        },
        {
            DocumentType: 'ZNB2',
            DocCategory: 'BUS2105',
            MovementType: '',
            DocumentTypeText: 'Non-Trade PR (Stock)',
            MovementTypeName: '',
            RequestCount: 2,
            SumNetAmountLocalCrcy: 444,
            LocalCurrency: 'VND'
        },
        {
            DocumentType: 'ZTOL',
            DocCategory: 'BUS2012',
            MovementType: '',
            DocumentTypeText: 'Tools PO',
            MovementTypeName: '',
            RequestCount: 1,
            SumNetAmountLocalCrcy: 10000,
            LocalCurrency: 'VND'
        },
        {
            DocumentType: 'ZTOL',
            DocCategory: 'BUS2105',
            MovementType: '',
            DocumentTypeText: 'Tools PR',
            MovementTypeName: '',
            RequestCount: 1,
            SumNetAmountLocalCrcy: 100000,
            LocalCurrency: 'VND'
        }
    ];
}

export function getMockStatusCounts() {
    return [
        {
            WorkflowTaskStatus: 'COMPLETED',
            RequestCount: 21
        },
        {
            WorkflowTaskStatus: 'IN PROCESSING',
            RequestCount: 15
        }
    ];
}

export function getMockRawDetail(objectType: string, objectId: string): Record<string, any> {
    const rawPadded = /^\d+$/.test(objectId) ? objectId.padStart(10, '0') : objectId;
    const inst = getMockInstances().find(i => i.instid === objectId || i.instanceID === objectId || i.instid === rawPadded);
    const docType = inst?.doctyp || (objectType === 'PR' ? 'ZASS' : objectType === 'PO' ? 'ZASS' : 'DEFAULT');
    const docTypeDesc = inst?.doctyp_desc || docType;

    const mockComments = getMockComments(objectId).map(c => ({
        UserComment: c.author || 'Current User',
        NoteText: c.text || '',
        PostedOn: c.postedOn || '2026-06-25',
        PostedTime: c.postedTime || '09:00:00'
    }));

    const mockAttachments = getMockAttachments(objectId).map(a => ({
        DocId: a.id,
        FileName: a.fileName,
        MimeType: a.mimeType,
        Length: String(a.fileSize || 0),
        CreatedBy: a.createdBy || 'Current User',
        CreatedOnDate: a.createdAt ? a.createdAt.split('T')[0] : '2026-06-25',
        CreatedOnTime: a.createdAt ? a.createdAt.split('T')[1].split('.')[0] : '09:00:00'
    }));

    if (objectType === 'RE') {
        return {
            DocCategory: 'ZBUS2093',
            DocumentNumber: rawPadded,
            DocumentId: rawPadded,
            DocumentType: 'RESV',
            DocumentTypeText: 'Reservation',
            UserName: 'Le Van C',
            CreatedByUser: 'Le Van C',
            CreationDate: '2026-06-24',
            CreationTime: '14:20:00',
            TotalNetAmountLocalCrcy: '5000000.00',
            Total: '5000000.00',
            LocalCurrency: 'VND',
            Currency: 'VND',
            Plant: '1000',
            PlantName: 'Main Factory',
            MovementType: '201',
            MovementTypeName: 'Goods issue for cost center',
            CostCenter: 'CC1001',
            CostCenterName: 'Administration CC',
            ReleaseStrategyText: 'RE Standard Release',
            ReleaseStrategyName: 'RE Standard Release',
            _Item: [
                {
                    Material: 'MAT-SF-01',
                    MaterialText: 'Safety Goggles',
                    shortText: 'Safety Goggles',
                    ItemText: 'For inspection team floor visit',
                    Quantity: '10',
                    BaseUnit: 'PC',
                    MovingAveragePrice: '150000.00',
                    Price: '1500000.00',
                    Plant: '1000',
                    PlantName: 'Main Factory',
                    StorageLocation: 'SL01',
                    StorageLocationName: 'General Store',
                    RequirementDate: '2026-06-30',
                    GLAccount: '610500',
                    GLAccountText: 'Safety Supplies Opex'
                },
                {
                    Material: 'MAT-SF-02',
                    MaterialText: 'Nitrile Gloves Pack',
                    shortText: 'Nitrile Gloves Pack',
                    ItemText: 'Protective gloves for lab',
                    Quantity: '50',
                    BaseUnit: 'SET',
                    MovingAveragePrice: '70000.00',
                    Price: '3500000.00',
                    Plant: '1000',
                    PlantName: 'Main Factory',
                    StorageLocation: 'SL01',
                    StorageLocationName: 'General Store',
                    RequirementDate: '2026-06-30',
                    GLAccount: '610500',
                    GLAccountText: 'Safety Supplies Opex'
                }
            ],
            _ApprovalStep: [
                {
                    ApprovalLevel: '1',
                    ReleaseCode: 'R1',
                    ReleaseText: 'Department Head Approval',
                    ApproverName: 'Nguyen Van Manager',
                    ApprovalStatus: 'APPROVED',
                    CommentText: 'Approved for safety department',
                    CommentDate: '2026-06-24',
                    CommentTime: '15:00:00'
                }
            ],
            _Comment: mockComments.length > 0 ? mockComments : [
                { UserComment: 'Le Van C', NoteText: 'Safety gear needed for factory floor inspection.', PostedOn: '2026-06-24', PostedTime: '14:25:00' }
            ],
            _Attachment: mockAttachments
        };
    }

    if (objectType === 'CLAIM') {
        return {
            DocCategory: 'ZCLAIM',
            DocumentNumber: rawPadded,
            ClaimNumber: rawPadded,
            DocumentType: 'EXP_CLAIM',
            DocumentTypeText: 'Expense Claim',
            UserName: 'Pham Van D',
            Claimant: 'Pham Van D',
            CreatedByUser: 'Pham Van D',
            CreationDate: '2026-06-27',
            CreationTime: '11:00:00',
            TotalAmount: '5000000.00',
            Currency: 'VND',
            CompanyCode: '1000',
            CompanyCodeName: 'CNMA Corporation',
            Purpose: 'Quarterly sales review workshop and customer relationship building in Da Nang office.',
            HeaderNote: 'Quarterly sales review workshop and customer relationship building in Da Nang office.',
            PaidBy: 'CNMA Finance Dept',
            BankDetails: 'Techcombank - 987654321',
            _Item: [
                { ItemNo: '1', ReceiptDate: '2026-06-20', ExpenseType: 'Taxi Fare', Amount: '350000.00', Description: 'Client visit transportation' },
                { ItemNo: '2', ReceiptDate: '2026-06-21', ExpenseType: 'Business Lunch', Amount: '1500000.00', Description: 'Lunch meeting with client representatives' },
                { ItemNo: '3', ReceiptDate: '2026-06-22', ExpenseType: 'Hotel Accommodation', Amount: '3150000.00', Description: 'Lodging in Da Nang office support' }
            ],
            _ApprovalStep: [
                { ApprovalLevel: '1', ReleaseCode: 'R1', ReleaseText: 'Manager Approval', ApproverName: 'Nguyen Van Manager', ApprovalStatus: 'APPROVED', CommentText: 'Approved travel expense', CommentDate: '2026-06-27', CommentTime: '12:00:00' }
            ],
            _Comment: mockComments.length > 0 ? mockComments : [
                { UserComment: 'Pham Van D', NoteText: 'Expense claim for Da Nang business travel.', PostedOn: '2026-06-27', PostedTime: '11:05:00' }
            ],
            _Attachment: mockAttachments.length > 0 ? mockAttachments : [
                { DocId: 'receipt-01', FileName: 'Hotel_Receipt.pdf', MimeType: 'application/pdf', Length: '1548576', CreatedBy: 'Pham Van D', CreatedOnDate: '2026-06-27', CreatedOnTime: '11:00:00' }
            ]
        };
    }

    if (objectType === 'PO') {
        const isZub = docType === 'ZUB';
        return {
            DocCategory: 'BUS2012',
            DocumentNumber: rawPadded,
            PurchaseOrder: rawPadded,
            DocumentType: docType,
            DocumentTypeText: docTypeDesc,
            CreatedByUser: 'Tran Thi B',
            Supplier: isZub ? '' : 'VEN-1001',
            SupplierName: isZub ? '' : 'Dell Vietnam Ltd',
            VendorDisplay: isZub ? '' : 'VEN-1001 - Dell Vietnam Ltd',
            ReleaseStrategyName: 'PO Release Strategy Level 2',
            CompanyCode: '1000',
            CompanyCodeName: 'CNMA Corporation',
            CreationDate: '2026-06-26',
            CreationTime: '10:00:00',
            PaymentTerms: isZub ? '' : 'NT30',
            PaymentTermsDescription: isZub ? '' : 'Net 30 days',
            TotalNetValueBeforeTax: isZub ? '0.00' : '100000000.00',
            TotalFreightAmount: isZub ? '0.00' : '5000000.00',
            TotalVatAmount: isZub ? '0.00' : '10000000.00',
            TotalOrderValue: '115000000.00',
            TotalAmount: '115000000.00',
            HeaderNote: isZub ? 'Internal stock transfer for branch expansion' : 'Purchase order for IT hardware accessories',
            PurchaseOrderText: isZub ? 'Internal stock transfer for branch expansion' : 'Purchase order for IT hardware accessories',
            ...(isZub ? {
                ReceivingPlant: '2000',
                ReceivingPlantName: 'Branch Plant',
                SupplyingPlant: '1000',
                SupplyingPlantName: 'Main Plant'
            } : {}),
            _Item: [
                {
                    PurchaseOrder: rawPadded,
                    PurchaseOrderItem: '00010',
                    Plant: '1000',
                    PlantName: 'Main Plant',
                    StorageLocation: 'SL01',
                    StorageLocationName: 'General Store',
                    Material: 'MAT-LAP-001',
                    PurchaseOrderItemText: 'Dell Latitude 5540',
                    MaterialGroup: '001',
                    MaterialGroupText: 'IT Hardware',
                    OrderQuantity: '5',
                    PurchaseOrderQuantityUnit: 'PC',
                    DeliveryDate: '2026-07-20',
                    NetPriceAmount: '20000000.00',
                    NetAmount: '100000000.00',
                    ReferenceDocumentNumber: '10000001',
                    PurchaseRequisition: '10000001',
                    GLAccount: '610100',
                    GLAccountText: 'IT Equipment Expense',
                    FundsCenter: 'FC01',
                    FundsCenterName: 'IT Funds Center',
                    CommitmentItem: 'CI-001',
                    CommitmentItemText: 'Hardware CI'
                }
            ],
            _ApprovalStep: [
                { ApprovalLevel: '1', ReleaseCode: 'R1', ReleaseText: 'Purchasing Manager', ApproverName: 'Tran Thi Director', ApprovalStatus: 'APPROVED', CommentText: 'Approved PO', CommentDate: '2026-06-26', CommentTime: '11:00:00' }
            ],
            _HeaderText: [
                { DocCategory: 'BUS2012', DocNumber: rawPadded, LineId: 1, LongText: isZub ? 'Internal stock transfer for branch expansion' : 'Purchase order for IT hardware accessories' }
            ],
            _HeaderNote: [
                { DocCategory: 'BUS2012', DocNumber: rawPadded, LineId: 1, LongText: 'Special header note instructions for PO processing' }
            ],
            _Comment: mockComments,
            _Attachment: mockAttachments
        };
    }

    // Default: PR
    return {
        DocCategory: 'BUS2105',
        DocumentNumber: rawPadded,
        PurchaseRequisition: rawPadded,
        DocumentType: docType,
        DocumentTypeText: docTypeDesc,
        CreatedByUser: 'Nguyen Van A',
        UserName: 'Nguyen Van A',
        UserFullName: 'Nguyen Van A',
        FundsCenter: 'FC01',
        FundsCenterName: 'IT Funds Center',
        CreationDate: '2026-06-25',
        CreationTime: '08:00:00',
        ReleaseStrategyName: 'PR Release Strategy Level 1',
        ReleaseStrategyText: 'PR Level 1 Approval',
        TotalNetAmountLocalCrcy: '150000000.00',
        Total: '150000000.00',
        LocalCurrency: 'VND',
        Currency: 'VND',
        CompanyCode: '1000',
        CompanyCodeName: 'CNMA Corporation',
        HeaderNote: 'IT Department Laptop Purchase',
        PurchaseRequisitionText: 'IT Department Laptop Purchase',
        Purpose: 'Equipment for new software engineers',
        PaidBy: 'CNMA Headquarters',
        BankDetails: 'Vietcombank - 1234567890',
        _Item: [
            {
                PurchaseRequisition: rawPadded,
                PurchaseRequisitionItem: '00010',
                Plant: '1000',
                PlantName: 'Main Factory',
                StorageLocation: 'SL01',
                StorageLocationName: 'General Store',
                Material: 'MAT-LAP-001',
                PurchaseRequisitionItemText: 'MacBook Pro M3 Max 16"',
                MaterialGroup: '001',
                MaterialGroupText: 'IT Hardware',
                RequestedQuantity: '2',
                BaseUnit: 'PC',
                DeliveryDate: '2026-07-15',
                PurchaseRequisitionPrice: '75000000.00',
                PurReqnItemTotalAmount: '150000000.00',
                GLAccount: '610100',
                GLAccountText: 'IT Equipment Expense',
                CommitmentItem: 'CI-001',
                CommitmentItemText: 'Hardware CI',
                ...(docType === 'ZMAK' ? { OrderInternalID: '200000106', OrderInternalName: 'Summer Launch Campaign' } : {})
            }
        ],
        _ApprovalStep: [
            { ApprovalLevel: '1', ReleaseCode: 'R1', ReleaseText: 'Department Head Approval', ApproverName: 'Nguyen Van Manager', ApprovalStatus: 'APPROVED', CommentText: 'Approved for budget', CommentDate: '2026-06-25', CommentTime: '09:00:00' }
        ],
        _Comment: mockComments,
        _Attachment: mockAttachments
    };
}

export function getMockUsers(searchPattern: string): any[] {
    const mockUsers = [
        {
            SAP__Origin: '',
            UniqueName: 'CONARUM1',
            DisplayName: 'Approver CONARUM1',
            FirstName: 'Approver',
            LastName: 'CONARUM1',
            Company: 'Conarum Vietnam Ltd',
            Department: 'IT Consulting',
            Email: 'hieu.lam@conarum.com',
            WorkPhone: '',
            MobilePhone: '',
            HomePhone: ''
        },
        {
            SAP__Origin: '',
            UniqueName: 'CONARUM2',
            DisplayName: 'Approver CONARUM2',
            FirstName: 'Approver',
            LastName: 'CONARUM2',
            Company: 'Conarum Vietnam Ltd',
            Department: 'Finance & Accounting',
            Email: 'duyen.tran@conarum.com',
            WorkPhone: '',
            MobilePhone: '',
            HomePhone: ''
        },
        {
            SAP__Origin: '',
            UniqueName: 'CONARUM',
            DisplayName: 'prorequest CONARUM',
            FirstName: 'prorequest',
            LastName: 'CONARUM',
            Company: 'Conarum Vietnam Ltd',
            Department: 'Operations',
            Email: 'giang.pham@conarum.com',
            WorkPhone: '',
            MobilePhone: '',
            HomePhone: ''
        }
    ];

    if (!searchPattern || !searchPattern.trim()) {
        return mockUsers;
    }

    const term = searchPattern.trim().toLowerCase();
    return mockUsers.filter(u =>
        u.UniqueName.toLowerCase().includes(term) ||
        u.DisplayName.toLowerCase().includes(term) ||
        u.FirstName.toLowerCase().includes(term) ||
        u.LastName.toLowerCase().includes(term) ||
        u.Email.toLowerCase().includes(term)
    );
}

export interface MockBusUser {
    SAPUserName: string;
    FirstName: string;
    LastName: string;
    FullName: string;
    EmailAddress: string;
}

export function getMockBusUsers(searchPattern: string): MockBusUser[] {
    const mockBusUsers: MockBusUser[] = [
        {
            SAPUserName: 'CONARUM1',
            FirstName: 'Approver',
            LastName: 'CONARUM1',
            FullName: 'Approver CONARUM1',
            EmailAddress: 'hieu.lam@conarum.com'
        },
        {
            SAPUserName: 'CONARUM2',
            FirstName: 'Approver',
            LastName: 'CONARUM2',
            FullName: 'Approver CONARUM2',
            EmailAddress: 'duyen.tran@conarum.com'
        },
        {
            SAPUserName: 'CONARUM3',
            FirstName: 'prorequest',
            LastName: 'CONARUM',
            FullName: 'prorequest CONARUM',
            EmailAddress: 'giang.pham@conarum.com'
        },
        {
            SAPUserName: 'MINHDT',
            FirstName: 'Minh',
            LastName: 'Doan',
            FullName: 'Minh Doan',
            EmailAddress: 'minh.doan@conarum.com'
        }
    ];

    if (!searchPattern || !searchPattern.trim()) {
        return mockBusUsers;
    }

    const term = searchPattern.trim().toLowerCase();
    return mockBusUsers.filter(u =>
        u.SAPUserName.toLowerCase().includes(term) ||
        u.FirstName.toLowerCase().includes(term) ||
        u.LastName.toLowerCase().includes(term) ||
        u.FullName.toLowerCase().includes(term) ||
        u.EmailAddress.toLowerCase().includes(term)
    );
}





