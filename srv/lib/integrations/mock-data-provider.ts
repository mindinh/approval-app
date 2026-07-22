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
    return list.map(inst => {
        let prefix = 'Approve';
        if (inst.typeid === 'BUS2093') {
            prefix = 'Approve Reservation';
        } else if (inst.typeid === 'ZCLAIM') {
            prefix = 'Approve Expense Claim';
        } else if (inst.typeid === 'BUS2105') {
            prefix = 'Approve Purchase Requisition';
        } else if (inst.typeid === 'BUS2012') {
            prefix = 'Approve Purchase Order';
        }
        return {
            InstanceID: inst.instanceID,
            Status: inst.status === 'COMPLETED' ? 'COMPLETED' : 'READY',
            TaskDefinitionID: inst.typeid,
            TaskTitle: `${prefix} ${inst.instid}`,
            CreatedOn: new Date(inst.credate + 'T' + inst.cretime + 'Z').toISOString(),
            CreatedByName: inst.typeid === 'BUS2105' ? 'Nguyen Van A' : inst.typeid === 'BUS2012' ? 'Tran Thi B' : inst.typeid === 'BUS2093' ? 'Le Van C' : 'Pham Van D',
            Priority: inst.total > 100000000 ? 'HIGH' : 'MEDIUM'
        };
    });
}

export function getMockTaskRuntime(instanceId: string) {
    const inst = getMockInstances().find(i => i.instanceID === instanceId);
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

    let prefix = 'Approve';
    if (inst.typeid === 'BUS2093') {
        prefix = 'Approve Reservation';
    } else if (inst.typeid === 'ZCLAIM') {
        prefix = 'Approve Expense Claim';
    } else if (inst.typeid === 'BUS2105') {
        prefix = 'Approve Purchase Requisition';
    } else if (inst.typeid === 'BUS2012') {
        prefix = 'Approve Purchase Order';
    }

    return {
        InstanceID: instanceId,
        Status: inst.status === 'COMPLETED' ? 'COMPLETED' : 'READY',
        TaskTitle: `${prefix} ${inst.instid}`,
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
                    marketingCampaign: 'CAMP-2026-Q3 - Summer Launch'
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
                    marketingCampaign: 'CAMP-2026-Q3 - Summer Launch'
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
            purchaseOrderNetAmount: inst ? String(inst.total) : '120000000',
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
        detail.header.supplyingPlant = 'PL-02 - Danang Factory';
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
