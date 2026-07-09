/* checksum : d0ddde0d9a8a0150ce18af8ff58fc5be */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported : 'true'
@sap.supported.formats : 'atom json xlsx pdf'
service C_PURREQ {
  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Company Code Value Help'
  @sap.value.list : 'true'
  entity C_MM_CompanyCodeValueHelp {
    @sap.display.format : 'UpperCase'
    @sap.text : 'CompanyCodeName'
    @sap.label : 'Company Code'
    key CompanyCode : String(4) not null;
    @sap.label : 'Company Name'
    @sap.quickinfo : 'Name of Company Code or Company'
    CompanyCodeName : String(25);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Connected system changes for PR'
  entity C_ProcmtHubPurReqnItmChgs {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchase Requisition'
    @sap.quickinfo : 'Purchase Requisition Number'
    key PurchaseRequisition : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Requisn. item'
    @sap.quickinfo : 'Item number of purchase requisition'
    key PurchaseRequisitionItem : String(5) not null;
    @sap.label : 'System'
    key PurReqnItemDetailOrigin : String(40) not null;
    @sap.unit : 'BaseUnit'
    @sap.label : 'Quantity'
    @sap.quickinfo : 'Purchase requisition quantity'
    RequestedQuantity : Decimal(13, 3);
    @sap.display.format : 'Date'
    @sap.label : 'Delivery Date'
    @sap.quickinfo : 'Item Delivery Date'
    DeliveryDate : Date;
    @sap.unit : 'PurReqnItemCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Price'
    @sap.quickinfo : 'Price in Purchase Requisition'
    PurchaseRequisitionPrice : Decimal(11, 3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Item Deletion Indicator'
    @sap.quickinfo : 'Deletion Indicator in Purchasing Document'
    IsDeleted : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material'
    @sap.quickinfo : 'Material of External System'
    Material : String(40);
    @sap.label : 'Unit of Measure'
    @sap.quickinfo : 'Purchase requisition unit of measure'
    @sap.semantics : 'unit-of-measure'
    BaseUnit : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Currency'
    @sap.quickinfo : 'Currency Key'
    @sap.semantics : 'currency-code'
    PurReqnItemCurrency : String(5);
    @sap.label : 'PR Change Indicator'
    @sap.quickinfo : 'Change Indicator for PR in Central Procurement'
    ProcmtHubPurReqnItmIsChanged : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Type'
    @sap.quickinfo : 'Purchase Requisition Document Type'
    PurchaseRequisitionType : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Plant'
    Plant : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purch. Organization'
    @sap.quickinfo : 'Purchasing Organization'
    PurchasingOrganization : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchasing Group'
    PurchasingGroup : String(3);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Purchase Requisition Header Note Types'
  entity C_PurchaseReqnHeaderNoteTypes {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Text object'
    @sap.quickinfo : 'Texts: application object'
    key TechnicalObjectType : String(10) not null;
    @sap.label : 'Language Key'
    key Language : String(2) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Text ID'
    key DocumentText : String(4) not null;
    @sap.label : 'Description'
    @sap.quickinfo : 'Short text'
    Note : String(30);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Purchase Reqn Item Category Value Help'
  entity C_PurchaseReqnItemCategoryVH {
    @sap.display.format : 'UpperCase'
    @sap.text : 'PurgDocItemCategoryName'
    @sap.label : 'Item Category'
    @sap.quickinfo : 'Item category in purchasing document'
    key PurchasingDocumentItemCategory : String(1) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchasing Doc. Type'
    @sap.quickinfo : 'Purchasing Document Type'
    key PurchaseRequisitionType : String(4) not null;
    @sap.label : 'Text for Item Cat.'
    @sap.quickinfo : 'Text for Item Category'
    PurgDocItemCategoryName : String(20);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Purchase Requisition Item Note Types'
  entity C_PurchaseReqnItemNoteTypes {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Text object'
    @sap.quickinfo : 'Texts: application object'
    key TechnicalObjectType : String(10) not null;
    @sap.label : 'Language Key'
    key Language : String(2) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Text ID'
    key DocumentText : String(4) not null;
    @sap.label : 'Description'
    @sap.quickinfo : 'Short text'
    Note : String(30);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Purchase Requisition Account Assignment'
  entity C_PurReqnAccountAssignment {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchase Requisition'
    @sap.quickinfo : 'Purchase Requisition Number'
    key PurchaseRequisition : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Purchase Requisition Item'
    @sap.quickinfo : 'Item number of purchase requisition'
    key PurchaseRequisitionItem : String(5) not null;
    @sap.display.format : 'NonNegative'
    @sap.field.control : 'PurchaseReqnAcctAssgmtNumber_fc'
    @sap.label : 'Serial Number'
    @sap.quickinfo : 'Serial number for PReq account assignment segment'
    key PurchaseReqnAcctAssgmtNumber : String(2) not null;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    AssignedWBSElementExternalID_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    BusinessArea_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ControllingArea_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    CostCenter_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    CostCtrActivityType_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    CostObject_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    CreationDate_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    EarmarkedFundsDocument_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    EarmarkedFundsDocumentItem_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ExtNetworkActivityForPurg_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    FixedAsset_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    FunctionalArea_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Fund_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    FundsCenter_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    GLAccount_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    GoodsRecipientName_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    GrantID_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    JointVentureRecoveryCode_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    MasterFixedAsset_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    NetworkActivity_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    NetworkActivityInternalID_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    OrderID_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    OrderIntBillOfOperationsItem_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    OrderInternalID_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PartnerAccountNumber_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PrmtHbProfitabilitySegment_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ProfitCenter_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ProjectNetwork_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ProjectNetworkInternalID_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurchaseReqnAcctAssgmtNumber_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnAcctAssgmtDistrPct_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Quantity_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    SalesOrder_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    SalesOrderItem_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    SalesOrderScheduleLine_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ServiceDocID_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ServiceDocItemID_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ServiceDocumentType_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    SettlementReferenceDate_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    UnloadingPointName_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ValidityDate_fc : Integer;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Dyn. Field Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    WBSElementExternalID_fc : Integer;
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'CostCenter_fc'
    @sap.text : 'to_CostCenter/CostCenter_Text'
    @sap.label : 'Cost Center'
    @sap.value.list : 'standard'
    CostCenter : String(10);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'MasterFixedAsset_fc'
    @sap.text : 'MasterFixedAsset_Text'
    @sap.label : 'Asset'
    @sap.quickinfo : 'Main Asset Number'
    @sap.value.list : 'standard'
    MasterFixedAsset : String(12);
    @sap.label : 'Asset Main No. Text'
    @sap.quickinfo : 'Asset Main Number Text'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    MasterFixedAsset_Text : String(50);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Company Code'
    CompanyCode : String(4);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'GLAccount_fc'
    @sap.text : 'to_GLAccount/GLAccount_Text'
    @sap.label : 'G/L Account'
    @sap.quickinfo : 'G/L Account Number'
    @sap.value.list : 'standard'
    GLAccount : String(10);
    @sap.field.control : 'PurReqnAcctAssgmtDistrPct_fc'
    @sap.label : 'Distribution (%)'
    @sap.quickinfo : 'Distribution percentage in the case of multiple acct assgt'
    PurReqnAcctAssgmtDistrPct : Decimal(3, 1);
    @sap.label : 'Unit of Measure'
    @sap.quickinfo : 'Purchase requisition unit of measure'
    @sap.semantics : 'unit-of-measure'
    BaseUnit : String(3);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'ProjectNetwork_fc'
    @sap.text : 'to_ProjectNetwork/ProjectNetworkDescription'
    @sap.label : 'Network'
    @sap.quickinfo : 'Network Number for Account Assignment'
    @sap.value.list : 'standard'
    ProjectNetwork : String(12);
    @sap.field.control : 'Quantity_fc'
    @sap.unit : 'UnitOfMeasure'
    @sap.label : 'Quantity requested'
    @sap.quickinfo : 'Purchase requisition quantity'
    Quantity : Decimal(13, 3);
    @sap.label : 'Unit of Measure'
    @sap.quickinfo : 'Purchase requisition unit of measure'
    @sap.semantics : 'unit-of-measure'
    UnitOfMeasure : String(3);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'ControllingArea_fc'
    @sap.text : 'to_ControllingArea/ControllingAreaName'
    @sap.label : 'Controlling Area'
    @sap.value.list : 'standard'
    ControllingArea : String(4);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'BusinessArea_fc'
    @sap.text : 'BusinessArea_Text'
    @sap.label : 'Business Area'
    @sap.value.list : 'standard'
    BusinessArea : String(4);
    @sap.label : 'Business Area Name'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    BusinessArea_Text : String(30);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'SalesOrder_fc'
    @sap.label : 'Sales Order'
    @sap.quickinfo : 'Sales and Distribution Document Number'
    @sap.value.list : 'standard'
    SalesOrder : String(10);
    @sap.display.format : 'NonNegative'
    @sap.field.control : 'SalesOrderItem_fc'
    @sap.text : 'to_SalesOrderItem/SalesOrderItemText'
    @sap.label : 'Sales Order Item'
    @sap.quickinfo : 'Sales Document Item'
    @sap.value.list : 'standard'
    SalesOrderItem : String(6);
    @sap.display.format : 'NonNegative'
    @sap.field.control : 'SalesOrderScheduleLine_fc'
    @sap.label : 'Sales Order Schedule Line Number'
    @sap.quickinfo : 'Schedule Line Number'
    @sap.value.list : 'standard'
    SalesOrderScheduleLine : String(4);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'FixedAsset_fc'
    @sap.text : 'to_FixedAsset/FixedAssetDescription'
    @sap.label : 'Sub-number'
    @sap.quickinfo : 'Asset Subnumber'
    @sap.value.list : 'standard'
    FixedAsset : String(4);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'OrderID_fc'
    @sap.text : 'to_Order/OrderDescription'
    @sap.label : 'Order'
    @sap.quickinfo : 'Order Number'
    @sap.value.list : 'standard'
    OrderID : String(12);
    @sap.field.control : 'UnloadingPointName_fc'
    @sap.label : 'Unloading Point'
    UnloadingPointName : String(25);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'CostObject_fc'
    @sap.label : 'Cost Object'
    CostObject : String(12);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'PrmtHbProfitabilitySegment_fc'
    @sap.label : 'Profitab. Segmt No.'
    @sap.quickinfo : 'Profitability Segment Number (CO-PA)'
    PrmtHbProfitabilitySegment : String(10);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'ProfitCenter_fc'
    @sap.text : 'to_ProfitCenter/ProfitCenter_Text'
    @sap.label : 'Profit Center'
    @sap.value.list : 'standard'
    ProfitCenter : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'WBS Internal ID'
    @sap.quickinfo : 'WBS Element'
    WBSElementInternalID : String(8);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'WBSElementExternalID_fc'
    @sap.text : 'WBSDescription'
    @sap.label : 'WBS Element'
    @sap.quickinfo : 'Work Breakdown Structure Element (WBS Element) Edited'
    WBSElementExternalID : String(24);
    @sap.label : 'WBS Element Name'
    @sap.quickinfo : 'Work Breakdown Structure Element Name'
    WBSDescription : String(40);
    @sap.display.format : 'NonNegative'
    @sap.field.control : 'ProjectNetworkInternalID_fc'
    @sap.label : 'Opertn task list no.'
    @sap.quickinfo : 'Routing number of operations in the order'
    ProjectNetworkInternalID : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Commitment Item'
    @sap.quickinfo : 'Commitment Item Short ID'
    CommitmentItemShortID : String(14);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'FundsCenter_fc'
    @sap.label : 'Funds Center'
    FundsCenter : String(16);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'Fund_fc'
    @sap.label : 'Fund'
    Fund : String(10);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'FunctionalArea_fc'
    @sap.text : 'to_FndsMgmtFuncnlAreaStdVH/FunctionalArea_Text'
    @sap.label : 'Functional Area'
    @sap.value.list : 'standard'
    FunctionalArea : String(16);
    @sap.display.format : 'Date'
    @sap.field.control : 'CreationDate_fc'
    @sap.label : 'Created On'
    @sap.quickinfo : 'Record Creation Date'
    CreationDate : Date;
    @sap.field.control : 'GoodsRecipientName_fc'
    @sap.label : 'Goods Recipient'
    GoodsRecipientName : String(12);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Real Estate Key'
    @sap.quickinfo : 'Complete Object Identification, for Example BE 1000/123'
    REIdentification : String(50);
    @sap.display.format : 'NonNegative'
    @sap.field.control : 'NetworkActivityInternalID_fc'
    @sap.label : 'Counter'
    @sap.quickinfo : 'Internal counter'
    NetworkActivityInternalID : String(8);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'NetworkActivity_fc'
    @sap.label : 'Activity'
    @sap.quickinfo : 'Operation/Activity Number'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    NetworkActivity : String(4);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'PartnerAccountNumber_fc'
    @sap.label : 'Partner'
    @sap.quickinfo : 'Partner account number'
    PartnerAccountNumber : String(10);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'JointVentureRecoveryCode_fc'
    @sap.label : 'Recovery Indicator'
    JointVentureRecoveryCode : String(2);
    @sap.display.format : 'Date'
    @sap.field.control : 'SettlementReferenceDate_fc'
    @sap.label : 'Reference date'
    @sap.quickinfo : 'Reference date for settlement'
    SettlementReferenceDate : Date;
    @sap.display.format : 'NonNegative'
    @sap.field.control : 'OrderInternalID_fc'
    @sap.label : 'Opertn task list no.'
    @sap.quickinfo : 'Routing number of operations in the order'
    OrderInternalID : String(10);
    @sap.display.format : 'NonNegative'
    @sap.field.control : 'OrderIntBillOfOperationsItem_fc'
    @sap.label : 'Counter'
    @sap.quickinfo : 'General counter for order'
    OrderIntBillOfOperationsItem : String(8);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'EarmarkedFundsDocument_fc'
    @sap.label : 'Earmarked Funds'
    @sap.quickinfo : 'Document Number for Earmarked Funds'
    @sap.value.list : 'standard'
    EarmarkedFundsDocument : String(10);
    @sap.display.format : 'NonNegative'
    @sap.field.control : 'EarmarkedFundsDocumentItem_fc'
    @sap.label : 'Document Item'
    @sap.quickinfo : 'Earmarked Funds: Document Item'
    @sap.value.list : 'standard'
    EarmarkedFundsDocumentItem : String(3);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'CostCtrActivityType_fc'
    @sap.text : 'to_CostCenterActivityType/CostCtrActivityType_Text'
    @sap.label : 'Activity Type'
    @sap.value.list : 'standard'
    CostCtrActivityType : String(6);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'GrantID_fc'
    @sap.text : 'GrantName'
    @sap.label : 'Grant'
    GrantID : String(20);
    @sap.display.format : 'Date'
    @sap.field.control : 'ValidityDate_fc'
    ValidityDate : Date;
    @sap.label : 'Name'
    @sap.quickinfo : 'Short Description of the Grant'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    GrantName : String(20);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Chart of Accounts'
    @sap.value.list : 'standard'
    ChartOfAccounts : String(4);
    @sap.display.format : 'UpperCase'
    @sap.text : 'to_BudgetPeriodStdVH/BudgetPeriodName'
    @sap.label : 'Budget Period'
    @sap.value.list : 'standard'
    BudgetPeriod : String(10);
    @sap.label : 'Funded Program'
    FundedProgram : String(24);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'ServiceDocID_fc'
    @sap.label : 'Service Document'
    @sap.quickinfo : 'Service Document ID'
    ServiceDocID : String(10);
    @sap.display.format : 'NonNegative'
    @sap.field.control : 'ServiceDocItemID_fc'
    @sap.label : 'Service Doc. Item'
    @sap.quickinfo : 'Service Document Item ID'
    ServiceDocItemID : String(6);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'ServiceDocumentType_fc'
    @sap.label : 'Service Doc. Type'
    @sap.quickinfo : 'Service Document Type'
    ServiceDocumentType : String(4);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'AssignedWBSElementExternalID_fc'
    @sap.label : 'WBS Element (Hub)'
    @sap.quickinfo : 'Work Breakdown Structure Element For External System'
    AssignedWBSElementExternalID : String(24);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'ExtNetworkActivityForPurg_fc'
    @sap.label : 'Network Activity'
    ExtNetworkActivityForPurg : String(4);
    to_BudgetPeriodStdVH : Association to I_BudgetPeriodStdVH {  };
    to_ControllingArea : Association to I_ControllingArea {  };
    to_CostCenter : Association to I_MM_CostCenterValueHelp {  };
    to_CostCenterActivityType : Association to I_CostCenterActivityType {  };
    to_FixedAsset : Association to I_MM_FixedAssetValueHelp {  };
    to_FndsMgmtFuncnlAreaStdVH : Association to I_FndsMgmtFuncnlAreaStdVH {  };
    to_GLAccount : Association to I_MM_GLAccountVH {  };
    to_GrantStdVH : Association to I_GrantStdVH {  };
    to_MasterFixedAsset : Association to I_MasterFixedAsset {  };
    to_Order : Association to I_MM_LogisticsOrderVH {  };
    to_ProfitCenter : Association to I_MM_ProfitCenterValueHelp {  };
    to_ProjectNetwork : Association to I_ProjectNetwork {  };
    to_Purchaserequisitionitem : Association to I_Purchaserequisitionitem {  };
    to_SalesDocumentScheduleLine : Association to I_SalesDocumentScheduleLine {  };
    to_SalesOrder : Association to I_MM_SalesOrderValueHelp {  };
    to_SalesOrderItem : Association to I_MM_SalesOrderItemVH {  };
    to_WBSElement : Association to I_WBSElementBasicData {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Purchase Requisition Header Note - Text'
  entity C_PurReqnFactSheetHeaderText {
    @sap.label : 'Language Key'
    key Language : String(2) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Text ID'
    key DocumentText : String(4) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Texts: Application Object'
    @sap.quickinfo : 'Texts: application object'
    key TechnicalObjectType : String(10) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Name'
    key ArchObjectNumber : String(70) not null;
    @sap.label : 'UUID'
    @sap.quickinfo : 'UUID in X form (binary)'
    key DraftUUID : UUID not null;
    @sap.label : 'Boolean Variable (X = True, - = False, Space = Unknown)'
    @sap.heading : ''
    key IsActiveEntity : Boolean not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchase Requisition'
    @sap.quickinfo : 'Purchase Requisition Number'
    PurchaseRequisition : String(10);
    @sap.label : 'Long Text'
    NoteDescription : String;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Item Notes for FactSheet'
  entity C_PurReqnFactSheetItemNotes {
    @sap.label : 'Language Key'
    key Language : String(2) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Text ID'
    key DocumentText : String(4) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Texts: Application Object'
    @sap.quickinfo : 'Texts: application object'
    key TechnicalObjectType : String(10) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Name'
    key ArchObjectNumber : String(70) not null;
    @sap.label : 'UUID'
    @sap.quickinfo : 'UUID in X form (binary)'
    key DraftUUID : UUID not null;
    @sap.label : 'Boolean Variable (X = True, - = False, Space = Unknown)'
    @sap.heading : ''
    key IsActiveEntity : Boolean not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchase Requisition'
    @sap.quickinfo : 'Purchase Requisition Number'
    PurchaseRequisition : String(10);
    @sap.label : 'Long Text'
    NoteDescription : String;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Purchase Requisition Item'
  entity C_PurReqnItemHierFactSheet {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchase Requisition'
    @sap.quickinfo : 'Purchase Requisition Number'
    @sap.sortable : 'false'
    key PurchaseRequisition : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.hierarchy.node.external.key.for : 'HierarchyNode'
    @sap.label : 'Purchase Requisition Item'
    @sap.quickinfo : 'Item number of purchase requisition'
    @sap.sortable : 'false'
    key PurchaseRequisitionItem : String(5) not null;
    @sap.display.format : 'NonNegative'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Parent Item No'
    @sap.sortable : 'false'
    PurchasingParentItem : String(5);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Hierarchy Number'
    @sap.sortable : 'false'
    PurgConfigurableItemNumber : String(40);
    @sap.label : 'Short Text'
    @sap.sortable : 'false'
    PurchaseRequisitionItemText : String(40);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Material Description'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    MaterialName : String(40);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.text : 'MaterialName'
    @sap.label : 'Material'
    @sap.quickinfo : 'Material Number'
    @sap.sortable : 'false'
    Material : String(40);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.text : 'MaterialGroupName'
    @sap.label : 'Material Group'
    @sap.sortable : 'false'
    MaterialGroup : String(9);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Product Group Desc.'
    @sap.quickinfo : 'Product Group Description'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    MaterialGroupName : String(20);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.text : 'PurchasingDocumentTypeName'
    @sap.label : 'Document Type'
    @sap.quickinfo : 'Purchase Requisition Document Type'
    @sap.sortable : 'false'
    PurchaseRequisitionType : String(4);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Doc. Type Descript.'
    @sap.quickinfo : 'Short Description of Purchasing Document Type'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurchasingDocumentTypeName : String(20);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.text : 'PurgDocItemCategoryName'
    @sap.label : 'Item Category'
    @sap.quickinfo : 'Item category in purchasing document'
    @sap.sortable : 'false'
    PurchasingDocumentItemCategory : String(1);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Text for Item Cat.'
    @sap.quickinfo : 'Text for Item Category'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurgDocItemCategoryName : String(20);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.unit : 'PurReqnItemCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Valuation Price'
    @sap.quickinfo : 'Price in Purchase Requisition'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurchaseRequisitionPrice : Decimal(11, 3);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.unit : 'PurReqnItemCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Value'
    @sap.quickinfo : 'Purchase Requisition Item Total Amount'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ItemNetAmount : Decimal(15, 3);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.unit : 'BaseUnit'
    @sap.label : 'Price Unit'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnPriceQuantity : Decimal(5, 0);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Currency'
    @sap.quickinfo : 'Currency Key'
    @sap.sortable : 'false'
    @sap.semantics : 'currency-code'
    PurReqnItemCurrency : String(5);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.text : 'PurReqnReleaseStatusName'
    @sap.label : 'Release Status'
    @sap.quickinfo : 'Requisition Processing State'
    @sap.sortable : 'false'
    PurReqnReleaseStatus : String(2);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.text : 'ExternalApprovalStatusText'
    @sap.label : 'External Approval Status'
    @sap.quickinfo : 'External Processing Status'
    @sap.sortable : 'false'
    ExternalApprovalStatus : String(1);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'External Approval Status Text'
    @sap.quickinfo : 'Short Text for Fixed Values'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ExternalApprovalStatusText : String(60);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Short Description'
    @sap.quickinfo : 'Short Text for Fixed Values'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnReleaseStatusName : String(60);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.text : 'ProcessingStatusName'
    @sap.label : 'Processing Status'
    @sap.quickinfo : 'Processing status of purchase requisition'
    @sap.sortable : 'false'
    ProcessingStatus : String(1);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Processing Status Name'
    @sap.quickinfo : 'Short Text for Fixed Values'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ProcessingStatusName : String(60);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.unit : 'BaseUnit'
    @sap.label : 'Quantity Requested'
    @sap.quickinfo : 'Purchase requisition quantity'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    RequestedQuantity : Decimal(13, 3);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Unit of Measure'
    @sap.quickinfo : 'Purchase requisition unit of measure'
    @sap.sortable : 'false'
    @sap.semantics : 'unit-of-measure'
    BaseUnit : String(3);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Requisition/Item ID'
    @sap.quickinfo : 'Formatted Purchase Requisition Item'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    FormattedPurRequisitionItem : String(30);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Purchasing Group'
    @sap.sortable : 'false'
    PurchasingGroup : String(3);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Purch. Organization'
    @sap.quickinfo : 'Purchasing Organization'
    @sap.sortable : 'false'
    PurchasingOrganization : String(4);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Delivery Address'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PlainLongText : String(1024);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Address'
    @sap.quickinfo : 'Number of delivery address'
    @sap.sortable : 'false'
    DeliveryAddressID : String(10);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Fixed Supplier'
    @sap.quickinfo : 'Fixed Vendor'
    @sap.sortable : 'false'
    FixedSupplier : String(10);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Plant'
    @sap.sortable : 'false'
    Plant : String(4);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Storage Location'
    @sap.sortable : 'false'
    StorageLocation : String(4);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Purchase order'
    @sap.quickinfo : 'Purchase order number'
    @sap.sortable : 'false'
    PurchasingDocument : String(10);
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Desired Vendor'
    @sap.sortable : 'false'
    Supplier : String(10);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Deletion Indicator'
    @sap.quickinfo : 'Deletion Indicator in Purchasing Document'
    @sap.sortable : 'false'
    IsDeleted : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Created by (ID)'
    @sap.quickinfo : 'Name of Person Responsible for Creating the Object'
    @sap.sortable : 'false'
    CreatedByUser : String(12);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Requested By'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnSSPRequestor : String(60);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Requestor Full Name'
    @sap.quickinfo : 'Requestor Fullname'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnRequestorFullName : String(80);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Requestor'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnRequestor : String(60);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Requisitioner'
    @sap.quickinfo : 'Name of requisitioner/requester'
    @sap.sortable : 'false'
    RequisitionerName : String(12);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Created by (Name)'
    @sap.quickinfo : 'Full Name of Person'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    UserFullName : String(80);
    @sap.display.format : 'Date'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Delivery Date'
    @sap.quickinfo : 'Item Delivery Date'
    @sap.sortable : 'false'
    DeliveryDate : Date;
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Overall req. rel.'
    @sap.quickinfo : 'Overall release of purchase requisitions'
    @sap.sortable : 'false'
    IsPurReqnOvrlRel : Boolean;
    @sap.display.format : 'Date'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Requisition Date'
    @sap.quickinfo : 'Requisition (request) date'
    @sap.sortable : 'false'
    PurReqCreationDate : Date;
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Full Name'
    @sap.quickinfo : 'Creator Fullname'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    CreatedByUserFullName : String(80);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.unit : 'PurReqnItemCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Expected Value'
    @sap.quickinfo : 'Expected Value of Overall Limit'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ExpectedOverallLimitAmount : Decimal(13, 3);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.unit : 'PurReqnItemCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Overall Limit'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    OverallLimitAmount : Decimal(13, 3);
    @sap.display.format : 'Date'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Release Date'
    @sap.quickinfo : 'Purchase Requisition Release Date'
    @sap.sortable : 'false'
    PurchaseRequisitionReleaseDate : Date;
    @sap.display.format : 'Date'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Start Date'
    @sap.quickinfo : 'Start Date for Period of Performance'
    @sap.sortable : 'false'
    PerformancePeriodStartDate : Date;
    @sap.display.format : 'Date'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'End Date'
    @sap.quickinfo : 'End Date for Period of Performance'
    @sap.sortable : 'false'
    PerformancePeriodEndDate : Date;
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Shop On Behalf Ind.'
    @sap.quickinfo : 'Shop on behalf indicator'
    @sap.sortable : 'false'
    IsOnBehalfCart : Boolean;
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.sortable : 'false'
    WorkflowScenarioDefinition : String(10);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Checkbox'
    @sap.heading : ''
    @sap.sortable : 'false'
    PurgHasFlxblWorkflowApproval : Boolean;
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Is Outline'
    @sap.sortable : 'false'
    IsOutline : Boolean;
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.hierarchy.node.for : 'PurchaseRequisitionItem'
    @sap.label : 'Hierarchy node'
    @sap.sortable : 'false'
    HierarchyNode : String(1333);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.hierarchy.parent.node.for : 'HierarchyNode'
    @sap.label : 'Hierarchy node'
    @sap.sortable : 'false'
    HierarchyParentNode : String(1333);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.hierarchy.level.for : 'HierarchyNode'
    HierarchyLevel : Integer;
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.hierarchy.node.descendant.count.for : 'HierarchyNode'
    HierarchyNodeSubTreeSize : Integer;
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.hierarchy.drill.state.for : 'HierarchyNode'
    HierarchyDrillState : String(22);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.hierarchy.preorder.rank.for : 'HierarchyNode'
    HierarchyNodeOrdinalNumber : Integer64;
    @odata.Type : 'Edm.Byte'
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.sortable : 'false'
    HasRestrictedVisibility : Integer;
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'PurReq Ext. approval'
    @sap.quickinfo : 'Purchase Requisition in external approval'
    PurReqnHasDelegateApproval : Boolean;
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Transaction Data Footprint'
    PFMTransDataFootprintUUID : UUID;
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.unit : 'PFMFootprintUnit'
    @sap.label : 'CO2e Footprint'
    @sap.quickinfo : 'Footprint Quantity'
    PFMFootprintQuantity : Decimal(31, 14);
    @sap.field.control : 'HasRestrictedVisibility'
    @sap.label : 'Unit'
    @sap.quickinfo : 'Footprint Unit'
    @sap.semantics : 'unit-of-measure'
    PFMFootprintUnit : String(3);
    to_PurReqnAccountAssignment : Association to many C_PurReqnAccountAssignment {  };
    to_PurReqnItemSourceOfSupply : Association to C_PurReqnItemSourceOfSupply {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Source Of Supply'
  entity C_PurReqnItemSourceOfSupply {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchase Requisition'
    @sap.quickinfo : 'Purchase Requisition Number'
    key PurchaseRequisition : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Requisn. item'
    @sap.quickinfo : 'Item number of purchase requisition'
    key PurchaseRequisitionItem : String(5) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Type'
    @sap.quickinfo : 'Purchase Requisition Document Type'
    PurchaseRequisitionType : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Plant'
    Plant : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchasing Group'
    PurchasingGroup : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purch. Organization'
    @sap.quickinfo : 'Purchasing Organization'
    PurchasingOrganization : String(4);
    @sap.display.format : 'UpperCase'
    @sap.text : 'PreferredSupplierName'
    @sap.label : 'Desired Vendor'
    PreferredSupplier : String(10);
    @sap.display.format : 'UpperCase'
    @sap.text : 'ExternalPreferredSupplierName'
    @sap.label : 'Connected Desired Supplier'
    @sap.quickinfo : 'Desired Supplier of External System'
    ExtDesiredSupplierForPurg : String(10);
    @sap.label : 'Name of Supplier'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ExternalPreferredSupplierName : String(80);
    @sap.label : 'Name of Supplier'
    PreferredSupplierName : String(80);
    @sap.label : 'Name of Supplier'
    SupplierName : String(80);
    @sap.display.format : 'UpperCase'
    @sap.text : 'SupplierName'
    @sap.label : 'Fixed Supplier'
    @sap.quickinfo : 'Fixed Vendor'
    FixedSupplier : String(10);
    @sap.display.format : 'UpperCase'
    @sap.text : 'ExternalSupplierName'
    @sap.label : 'Connected Fixed Supplier'
    @sap.quickinfo : 'Fixed Supplier of External System'
    ExtFixedSupplierForPurg : String(10);
    @sap.label : 'Name of Supplier'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ExternalSupplierName : String(80);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Agreement'
    @sap.quickinfo : 'Purchase Requisition Agreement'
    PurchaseOutlineAgreement : String(20);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Info Record'
    @sap.quickinfo : 'Info Record of External System'
    PurchasingInfoRecord : String(10);
    @sap.label : 'Connected System ID'
    ProcurementHubSourceSystem : String(10);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Purchase Requisition Limit Item Factsheet'
  entity C_PurReqnLimitItemFactSheet {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchase Requisition'
    @sap.quickinfo : 'Purchase Requisition Number'
    key PurchaseRequisition : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Purchase Requisition Limit Item'
    @sap.quickinfo : 'Item number of purchase requisition'
    key PurchaseRequisitionItem : String(5) not null;
    @sap.label : 'Item Modified'
    @sap.quickinfo : 'Change Indicator for PR in Central Procurement'
    ProcmtHubPurReqnItmIsChanged : Boolean;
    @sap.label : 'Short Text'
    PurchaseRequisitionItemText : String(40);
    @sap.display.format : 'UpperCase'
    @sap.text : 'Material_Text'
    @sap.label : 'Material'
    @sap.quickinfo : 'Material Number'
    Material : String(40);
    @sap.label : 'Material Description'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    Material_Text : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Connected Material'
    @sap.quickinfo : 'Material of External System'
    ExtMaterialForPurg : String(40);
    @sap.display.format : 'UpperCase'
    @sap.text : 'MaterialGroup_Text'
    @sap.label : 'Material Group'
    MaterialGroup : String(9);
    @sap.label : 'Product Group Desc.'
    @sap.quickinfo : 'Product Group Description'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    MaterialGroup_Text : String(20);
    @sap.display.format : 'UpperCase'
    @sap.text : 'PurchaseRequisitionType_Text'
    @sap.label : 'Document Type'
    @sap.quickinfo : 'Purchase Requisition Document Type'
    PurchaseRequisitionType : String(4);
    @sap.label : 'Doc. Type Descript.'
    @sap.quickinfo : 'Short Description of Purchasing Document Type'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    PurchaseRequisitionType_Text : String(20);
    @sap.display.format : 'UpperCase'
    @sap.text : 'PurgDocItemCategoryName'
    @sap.label : 'Item Category'
    @sap.quickinfo : 'Item category in purchasing document'
    PurchasingDocumentItemCategory : String(1);
    @sap.label : 'Text for Item Cat.'
    @sap.quickinfo : 'Text for Item Category'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    PurgDocItemCategoryName : String(20);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Currency'
    @sap.quickinfo : 'Currency Key'
    @sap.semantics : 'currency-code'
    PurReqnItemCurrency : String(5);
    @sap.display.format : 'UpperCase'
    @sap.text : 'PurReqnReleaseStatus_Text'
    @sap.label : 'Release Status'
    @sap.quickinfo : 'Requisition Processing State'
    PurReqnReleaseStatus : String(2);
    @sap.label : 'Short Description'
    @sap.quickinfo : 'Short Text for Fixed Values'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    PurReqnReleaseStatus_Text : String(60);
    @sap.display.format : 'UpperCase'
    @sap.text : 'ExternalApprovalStatus_Text'
    @sap.label : 'External Approval Status'
    @sap.quickinfo : 'External Processing Status'
    ExternalApprovalStatus : String(1);
    @sap.label : 'Short Description'
    @sap.quickinfo : 'Short Text for Fixed Values'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ExternalApprovalStatus_Text : String(60);
    @sap.display.format : 'UpperCase'
    @sap.text : 'ProcessingStatus_Text'
    @sap.label : 'Processing Status'
    @sap.quickinfo : 'Processing status of purchase requisition'
    ProcessingStatus : String(1);
    @sap.label : 'Short Description'
    @sap.quickinfo : 'Short Text for Fixed Values'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ProcessingStatus_Text : String(60);
    @sap.label : 'Processing Status'
    @sap.quickinfo : 'Short Text for Fixed Values'
    ProcessingStatusName : String(60);
    @sap.label : 'Requisition/Item ID'
    @sap.quickinfo : 'Formatted Purchase Requisition Item'
    FormattedPurRequisitionItem : String(30);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchasing Group'
    PurchasingGroup : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purch. Organization'
    @sap.quickinfo : 'Purchasing Organization'
    PurchasingOrganization : String(4);
    @sap.label : 'Delivery Address'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PlainLongText : String(1024);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Address'
    @sap.quickinfo : 'Number of delivery address'
    AddressID : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Fixed Vendor'
    FixedSupplier : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Connected Fixed Supplier'
    @sap.quickinfo : 'Fixed Supplier of External System'
    ExtFixedSupplierForPurg : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Plant'
    Plant : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Storage Location'
    StorageLocation : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchase order'
    @sap.quickinfo : 'Purchase order number'
    PurchasingDocument : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Desired Vendor'
    Supplier : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Connected Desired Supplier'
    @sap.quickinfo : 'Desired Supplier of External System'
    ExtDesiredSupplierForPurg : String(10);
    @sap.label : 'Deletion Indicator'
    @sap.quickinfo : 'Deletion Indicator in Purchasing Document'
    IsDeleted : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Created by (ID)'
    @sap.quickinfo : 'Name of Person Responsible for Creating the Object'
    CreatedByUser : String(12);
    @sap.label : 'Requested By'
    @sap.quickinfo : 'Full Name of Person'
    PurReqnSSPRequestor : String(80);
    @sap.label : 'Requestor Full Name'
    @sap.quickinfo : 'Full Name of Person'
    PurReqnRequestorFullName : String(80);
    @sap.label : 'Requestor'
    PurReqnRequestor : String(60);
    @sap.label : 'Requisitioner'
    @sap.quickinfo : 'Name of requisitioner/requester'
    RequisitionerName : String(12);
    @sap.label : 'Created by (Name)'
    @sap.quickinfo : 'Full Name of Person'
    UserFullName : String(80);
    ContactCardNavLinkSemanticObj : String(4);
    ContactCardNavLinkQueryPart : String(17);
    @sap.display.format : 'Date'
    @sap.label : 'Delivery Date'
    @sap.quickinfo : 'Item Delivery Date'
    DeliveryDate : Date;
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnItmConfidenceLevelDesc : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Data Element Length 11'
    @sap.heading : ''
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    UtilsMchnLrngRelConfidenceVal : String(11);
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank1FeatureDesc : String(80);
    @sap.label : 'Attribute 1'
    @sap.quickinfo : 'Intelligent Approval Attribute 1'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank1Feature : String(73);
    @sap.label : 'Value for Attr. 1'
    @sap.quickinfo : 'Value for Intelligent Approval Attribute 1'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank1FeatureValue : String(73);
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank2FeatureDesc : String(80);
    @sap.label : 'Attribute 2'
    @sap.quickinfo : 'Intelligent Approval Attribute 2'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank2Feature : String(73);
    @sap.label : 'Value for Attr. 2'
    @sap.quickinfo : 'Value for Intelligent Approval Attribute 2'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank2FeatureValue : String(73);
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank3FeatureDesc : String(80);
    @sap.label : 'Attribute 3'
    @sap.quickinfo : 'Intelligent Approval Attribute 3'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank3Feature : String(73);
    @sap.label : 'Value for Attr. 3'
    @sap.quickinfo : 'Value for Intelligent Approval Attribute 3'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank3FeatureValue : String(73);
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank4FeatureDesc : String(80);
    @sap.label : 'Attribute 4'
    @sap.quickinfo : 'Intelligent Approval Attribute 4'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank4Feature : String(73);
    @sap.label : 'Value for Attr. 4'
    @sap.quickinfo : 'Value for Intelligent Approval Attribute 4'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank4FeatureValue : String(73);
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank5FeatureDesc : String(80);
    @sap.label : 'Attribute 5'
    @sap.quickinfo : 'Intelligent Approval Attribute 5'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank5Feature : String(73);
    @sap.label : 'Value for Attr. 5'
    @sap.quickinfo : 'Value for Intelligent Approval Attribute 5'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank5FeatureValue : String(73);
    @sap.label : 'Overall req. rel.'
    @sap.quickinfo : 'Overall release of purchase requisitions'
    IsPurReqnOvrlRel : Boolean;
    @sap.label : 'Connected System ID'
    ProcurementHubSourceSystem : String(10);
    @sap.display.format : 'Date'
    @sap.label : 'Requisition Date'
    @sap.quickinfo : 'Requisition (request) date'
    PurReqCreationDate : Date;
    @sap.label : 'Creator Full Name'
    @sap.quickinfo : 'Full Name of Person'
    CreatedByUserFullName : String(80);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Work Item ID'
    @sap.quickinfo : 'Work item ID'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    WorkflowTaskInternalID : String(12);
    @sap.unit : 'PurReqnItemCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Expected Value'
    @sap.quickinfo : 'Expected Value of Overall Limit'
    ExpectedOverallLimitAmount : Decimal(13, 3);
    @sap.display.format : 'Date'
    @sap.label : 'Start Date'
    @sap.quickinfo : 'Start Date for Period of Performance'
    PerformancePeriodStartDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'End Date'
    @sap.quickinfo : 'End Date for Period of Performance'
    PerformancePeriodEndDate : Date;
    @sap.unit : 'PurReqnItemCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Overall Limit'
    OverallLimitAmount : Decimal(13, 3);
    @sap.display.format : 'Date'
    @sap.label : 'Release Date'
    @sap.quickinfo : 'Purchase Requisition Release Date'
    PurchaseRequisitionReleaseDate : Date;
    @sap.label : 'Shop On Behalf Ind.'
    @sap.quickinfo : 'Shop on behalf indicator'
    IsOnBehalfCart : Boolean;
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    WorkflowScenarioDefinition : String(10);
    @sap.label : 'Checkbox'
    @sap.heading : ''
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurgHasFlxblWorkflowApproval : Boolean;
    @sap.label : 'PurReq Ext. approval'
    @sap.quickinfo : 'Purchase Requisition in external approval'
    PurReqnHasDelegateApproval : Boolean;
    to_ProcmtHubPurReqnItmChgs : Association to many C_ProcmtHubPurReqnItmChgs {  };
    to_PurReqnAccountAssignment : Association to many C_PurReqnAccountAssignment {  };
    to_PurReqnItemSourceOfSupply : Association to C_PurReqnItemSourceOfSupply {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Purchase Requisition'
  entity C_PurRequisitionFs {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchase Requisition'
    @sap.quickinfo : 'Purchase Requisition Number'
    key PurchaseRequisition : String(10) not null;
    @sap.visible : 'false'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurchaseRequisitionText : String(100);
    @sap.label : 'Requested By'
    PurReqnRequestor : String(80);
    @sap.label : 'Created By'
    @sap.quickinfo : 'Full Name of Person'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    UserFullName : String(80);
    @sap.display.format : 'UpperCase'
    @sap.visible : 'false'
    @sap.label : 'User'
    @sap.quickinfo : 'User Name in User Master Record'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ContactCardNavLinkQueryPart : String(12);
    @sap.display.format : 'Date'
    @sap.label : 'Requisition Date'
    @sap.quickinfo : 'Requisition (request) date'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqCreationDate : Date;
    @sap.label : 'Number of Items'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    NumberOfItems : Integer;
    @sap.display.format : 'UpperCase'
    @sap.visible : 'false'
    @sap.label : 'Document Type'
    @sap.quickinfo : 'Purchase Requisition Document Type'
    PurchaseRequisitionType : String(4);
    @sap.unit : 'DisplayCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Total Net Value'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    TotalNetAmount : Decimal(16, 3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Currency'
    @sap.quickinfo : 'Currency Key'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    @sap.semantics : 'currency-code'
    DisplayCurrency : String(5);
    @sap.label : 'Short text'
    @sap.quickinfo : 'Explanatory Short Text'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnHdrCurrencySourceDesc : String(60);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Work Item ID'
    @sap.quickinfo : 'Work item ID'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    WorkflowTaskInternalID : String(12);
    @sap.label : 'Overall req. rel.'
    @sap.quickinfo : 'Overall release of purchase requisitions'
    IsPurReqnOvrlRel : Boolean;
    @sap.label : 'Shop On Behalf Ind.'
    @sap.quickinfo : 'Shop on behalf indicator'
    IsOnBehalfCart : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Author'
    @sap.quickinfo : 'Author of Requisition'
    CreatedByUser : String(12);
    @sap.label : 'Connected System ID'
    ProcurementHubSourceSystem : String(10);
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    WorkflowScenarioDefinition : String(10);
    @sap.label : 'Checkbox'
    @sap.heading : ''
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurgHasFlxblWorkflowApproval : Boolean;
    @sap.label : 'Truth Value'
    @sap.quickinfo : 'Truth Value: True/False'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurchasingItemHasHierarchy : Boolean;
    @sap.label : 'Boolean Variable (X = True, - = False, Space = Unknown)'
    @sap.heading : ''
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnIsLimitItemSupported : Boolean;
    @sap.label : 'Boolean Variable (X = True, - = False, Space = Unknown)'
    @sap.heading : ''
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnIsStandardItemSupported : Boolean;
    @sap.label : 'PurReq Ext. approval'
    @sap.quickinfo : 'Purchase Requisition in external approval'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnHasDelegateApproval : Boolean;
    @sap.label : 'Is Rplctn Bfr Apprvl'
    @sap.quickinfo : 'Is Replication Before Approval'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    CntrlReqnIsRpldBfrApprvl : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Approval Sts. in Hub'
    @sap.quickinfo : 'Approval Status of Purchase Requisition in Hub'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    CntrlReqnApprvlStsInRpldReqn : String(2);
    to_PurRequisitionItemFs : Association to many C_PurRequisitionItemFs {  };
    to_PurRequisitionItemHierFs : Association to many C_PurReqnItemHierFactSheet {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Purchase Requisition Item'
  entity C_PurRequisitionItemFs {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchase Requisition'
    @sap.quickinfo : 'Purchase Requisition Number'
    key PurchaseRequisition : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Purchase Requisition Item'
    @sap.quickinfo : 'Item number of purchase requisition'
    key PurchaseRequisitionItem : String(5) not null;
    @sap.label : 'Item Modified'
    @sap.quickinfo : 'Change Indicator for PR in Central Procurement'
    ProcmtHubPurReqnItmIsChanged : Boolean;
    @sap.label : 'Short Text'
    PurchaseRequisitionItemText : String(40);
    @sap.display.format : 'UpperCase'
    @sap.text : 'Material_Text'
    @sap.label : 'Material'
    @sap.quickinfo : 'Material Number'
    Material : String(40);
    @sap.label : 'Material Description'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    Material_Text : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Connected Material'
    @sap.quickinfo : 'Material of External System'
    ExtMaterialForPurg : String(40);
    @sap.display.format : 'UpperCase'
    @sap.text : 'MaterialGroup_Text'
    @sap.label : 'Material Group'
    MaterialGroup : String(9);
    @sap.label : 'Product Group Desc.'
    @sap.quickinfo : 'Product Group Description'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    MaterialGroup_Text : String(20);
    @sap.display.format : 'UpperCase'
    @sap.text : 'PurchaseRequisitionType_Text'
    @sap.label : 'Document Type'
    @sap.quickinfo : 'Purchase Requisition Document Type'
    PurchaseRequisitionType : String(4);
    @sap.label : 'Doc. Type Descript.'
    @sap.quickinfo : 'Short Description of Purchasing Document Type'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    PurchaseRequisitionType_Text : String(20);
    @sap.display.format : 'UpperCase'
    @sap.text : 'PurgDocItemCategoryName'
    @sap.label : 'Item Category'
    @sap.quickinfo : 'Item category in purchasing document'
    PurchasingDocumentItemCategory : String(1);
    @sap.label : 'Text for Item Cat.'
    @sap.quickinfo : 'Text for Item Category'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    PurgDocItemCategoryName : String(20);
    @sap.unit : 'PurReqnItemCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Valuation Price'
    @sap.quickinfo : 'Price in Purchase Requisition'
    PurchaseRequisitionPrice : Decimal(11, 3);
    @sap.unit : 'PurReqnItemCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Net Value'
    @sap.quickinfo : 'Purchase Requisition Item Total Amount'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnItemTotalAmount : Decimal(15, 3);
    @sap.unit : 'BaseUnit'
    @sap.label : 'Price Unit'
    PurReqnPriceQuantity : Decimal(5, 0);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Currency'
    @sap.quickinfo : 'Currency Key'
    @sap.semantics : 'currency-code'
    PurReqnItemCurrency : String(5);
    @sap.display.format : 'UpperCase'
    @sap.text : 'PurReqnReleaseStatus_Text'
    @sap.label : 'Release Status'
    @sap.quickinfo : 'Requisition Processing State'
    PurReqnReleaseStatus : String(2);
    @sap.label : 'Short Description'
    @sap.quickinfo : 'Short Text for Fixed Values'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    PurReqnReleaseStatus_Text : String(60);
    @sap.display.format : 'UpperCase'
    @sap.text : 'ExternalApprovalStatus_Text'
    @sap.label : 'External Approval Status'
    @sap.quickinfo : 'External Processing Status'
    ExternalApprovalStatus : String(1);
    @sap.label : 'Short Description'
    @sap.quickinfo : 'Short Text for Fixed Values'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ExternalApprovalStatus_Text : String(60);
    @sap.display.format : 'UpperCase'
    @sap.label : 'PR Item'
    @sap.quickinfo : 'Key to identify purchase requisition item'
    PurchaseReqnItemUniqueID : String(15);
    @sap.display.format : 'UpperCase'
    @sap.text : 'ProcessingStatus_Text'
    @sap.label : 'Processing Status'
    @sap.quickinfo : 'Processing status of purchase requisition'
    ProcessingStatus : String(1);
    @sap.label : 'Short Description'
    @sap.quickinfo : 'Short Text for Fixed Values'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ProcessingStatus_Text : String(60);
    @sap.label : 'Processing Status'
    @sap.quickinfo : 'Short Text for Fixed Values'
    ProcessingStatusName : String(60);
    @sap.label : 'Transaction Data Footprint'
    PFMTransDataFootprintUUID : UUID;
    @sap.unit : 'PFMFootprintUnit'
    @sap.label : 'CO2e Footprint'
    @sap.quickinfo : 'Footprint Quantity'
    PFMFootprintQuantity : Decimal(31, 14);
    @sap.label : 'Unit'
    @sap.quickinfo : 'Footprint Unit'
    @sap.semantics : 'unit-of-measure'
    PFMFootprintUnit : String(3);
    @sap.unit : 'BaseUnit'
    @sap.label : 'Quantity Requested'
    @sap.quickinfo : 'Purchase requisition quantity'
    RequestedQuantity : Decimal(13, 3);
    @sap.label : 'Unit of Measure'
    @sap.quickinfo : 'Purchase requisition unit of measure'
    @sap.semantics : 'unit-of-measure'
    BaseUnit : String(3);
    @sap.label : 'Requisition/Item ID'
    @sap.quickinfo : 'Formatted Purchase Requisition Item'
    FormattedPurRequisitionItem : String(30);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchasing Group'
    PurchasingGroup : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purch. Organization'
    @sap.quickinfo : 'Purchasing Organization'
    PurchasingOrganization : String(4);
    @sap.label : 'Delivery Address'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PlainLongText : String(1024);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Address'
    @sap.quickinfo : 'Number of delivery address'
    AddressID : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Fixed Supplier'
    @sap.quickinfo : 'Fixed Vendor'
    FixedSupplier : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Connected Fixed Supplier'
    @sap.quickinfo : 'Fixed Supplier of External System'
    ExtFixedSupplierForPurg : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Plant'
    Plant : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Storage Location'
    StorageLocation : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchase order'
    @sap.quickinfo : 'Purchase order number'
    PurchasingDocument : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Desired Vendor'
    Supplier : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Connected Desired Supplier'
    @sap.quickinfo : 'Desired Supplier of External System'
    ExtDesiredSupplierForPurg : String(10);
    @sap.label : 'Deletion Indicator'
    @sap.quickinfo : 'Deletion Indicator in Purchasing Document'
    IsDeleted : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Created by (ID)'
    @sap.quickinfo : 'Name of Person Responsible for Creating the Object'
    CreatedByUser : String(12);
    @sap.label : 'Requested By'
    @sap.quickinfo : 'Full Name of Person'
    PurReqnSSPRequestor : String(80);
    @sap.label : 'Requestor Full Name'
    @sap.quickinfo : 'Requestor Fullname'
    PurReqnRequestorFullName : String(80);
    @sap.label : 'Requestor'
    PurReqnRequestor : String(60);
    @sap.label : 'Requisitioner'
    @sap.quickinfo : 'Name of requisitioner/requester'
    RequisitionerName : String(12);
    @sap.label : 'Created by (Name)'
    @sap.quickinfo : 'Full Name of Person'
    UserFullName : String(80);
    @sap.display.format : 'Date'
    @sap.label : 'Delivery Date'
    @sap.quickinfo : 'Item Delivery Date'
    DeliveryDate : Date;
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnItmConfidenceLevelDesc : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Data Element Length 11'
    @sap.heading : ''
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    UtilsMchnLrngRelConfidenceVal : String(11);
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank1FeatureDesc : String(80);
    @sap.label : 'Attribute 1'
    @sap.quickinfo : 'Intelligent Approval Attribute 1'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank1Feature : String(73);
    @sap.label : 'Value for Attr. 1'
    @sap.quickinfo : 'Value for Intelligent Approval Attribute 1'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank1FeatureValue : String(73);
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank2FeatureDesc : String(80);
    @sap.label : 'Attribute 2'
    @sap.quickinfo : 'Intelligent Approval Attribute 2'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank2Feature : String(73);
    @sap.label : 'Value for Attr. 2'
    @sap.quickinfo : 'Value for Intelligent Approval Attribute 2'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank2FeatureValue : String(73);
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank3FeatureDesc : String(80);
    @sap.label : 'Attribute 3'
    @sap.quickinfo : 'Intelligent Approval Attribute 3'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank3Feature : String(73);
    @sap.label : 'Value for Attr. 3'
    @sap.quickinfo : 'Value for Intelligent Approval Attribute 3'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank3FeatureValue : String(73);
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank4FeatureDesc : String(80);
    @sap.label : 'Attribute 4'
    @sap.quickinfo : 'Intelligent Approval Attribute 4'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank4Feature : String(73);
    @sap.label : 'Value for Attr. 4'
    @sap.quickinfo : 'Value for Intelligent Approval Attribute 4'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank4FeatureValue : String(73);
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank5FeatureDesc : String(80);
    @sap.label : 'Attribute 5'
    @sap.quickinfo : 'Intelligent Approval Attribute 5'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank5Feature : String(73);
    @sap.label : 'Value for Attr. 5'
    @sap.quickinfo : 'Value for Intelligent Approval Attribute 5'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurReqnApprvlRank5FeatureValue : String(73);
    @sap.label : 'Overall req. rel.'
    @sap.quickinfo : 'Overall release of purchase requisitions'
    IsPurReqnOvrlRel : Boolean;
    @sap.label : 'Connected System ID'
    ProcurementHubSourceSystem : String(10);
    @sap.display.format : 'Date'
    @sap.label : 'Requisition Date'
    @sap.quickinfo : 'Requisition (request) date'
    PurReqCreationDate : Date;
    @sap.label : 'Creator Full Name'
    @sap.quickinfo : 'Creator Fullname'
    CreatedByUserFullName : String(80);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Work Item ID'
    @sap.quickinfo : 'Work item ID'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    WorkflowTaskInternalID : String(12);
    @sap.unit : 'PurReqnItemCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Expected Value'
    @sap.quickinfo : 'Expected Value of Overall Limit'
    ExpectedOverallLimitAmount : Decimal(13, 3);
    @sap.unit : 'PurReqnItemCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Overall Limit'
    OverallLimitAmount : Decimal(13, 3);
    @sap.display.format : 'Date'
    @sap.label : 'Release Date'
    @sap.quickinfo : 'Purchase Requisition Release Date'
    PurchaseRequisitionReleaseDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Start Date'
    @sap.quickinfo : 'Start Date for Period of Performance'
    PerformancePeriodStartDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'End Date'
    @sap.quickinfo : 'End Date for Period of Performance'
    PerformancePeriodEndDate : Date;
    @sap.label : 'Shop On Behalf Ind.'
    @sap.quickinfo : 'Shop on behalf indicator'
    IsOnBehalfCart : Boolean;
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    WorkflowScenarioDefinition : String(10);
    @sap.label : 'Checkbox'
    @sap.heading : ''
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PurgHasFlxblWorkflowApproval : Boolean;
    @sap.label : 'Is Outline'
    IsOutline : Boolean;
    @odata.Type : 'Edm.Byte'
    HasRestrictedVisibility : Integer;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Hierarchy Number'
    PurgConfigurableItemNumber : String(40);
    @sap.label : 'PurReq Ext. approval'
    @sap.quickinfo : 'Purchase Requisition in external approval'
    PurReqnHasDelegateApproval : Boolean;
    @sap.label : 'Is Rplctn Bfr Apprvl'
    @sap.quickinfo : 'Is Replication Before Approval'
    CntrlReqnIsRpldBfrApprvl : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Approval Sts. in Hub'
    @sap.quickinfo : 'Approval Status of Purchase Requisition in Hub'
    CntrlReqnApprvlStsInRpldReqn : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Stock Segment'
    StockSegment : String(40);
    to_ProcmtHubPurReqnItmChgs : Association to many C_ProcmtHubPurReqnItmChgs {  };
    to_PurReqnAccountAssignment : Association to many C_PurReqnAccountAssignment {  };
    to_PurReqnItemSourceOfSupply : Association to C_PurReqnItemSourceOfSupply {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Budget Period'
  entity I_BudgetPeriodStdVH {
    @sap.display.format : 'UpperCase'
    @sap.text : 'BudgetPeriodName'
    @sap.label : 'Budget Period'
    key BudgetPeriod : String(10) not null;
    @sap.label : 'Budget Period Name'
    BudgetPeriodName : String(35);
    @sap.display.format : 'Date'
    @sap.filter.restriction : 'single-value'
    @sap.label : 'Valid From'
    @sap.quickinfo : 'Budget Period Valid From'
    ValidityStartDate : Date;
    @sap.display.format : 'Date'
    @sap.filter.restriction : 'single-value'
    @sap.label : 'Valid To'
    @sap.quickinfo : 'Budget Period Valid To'
    ValidityEndDate : Date;
    @sap.display.format : 'Date'
    @sap.filter.restriction : 'single-value'
    @sap.label : 'Expiration Date'
    @sap.quickinfo : 'Budget Period Expiration Date'
    BudgetPeriodExpirationDate : Date;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Business Area'
  entity I_BusinessArea {
    @sap.display.format : 'UpperCase'
    @sap.text : 'BusinessArea_Text'
    @sap.label : 'Business Area'
    key BusinessArea : String(4) not null;
    @sap.label : 'Business Area Name'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    BusinessArea_Text : String(30);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Business Area'
  @sap.value.list : 'true'
  entity I_BusinessAreaStdVH {
    @sap.display.format : 'UpperCase'
    @sap.text : 'BusinessArea_Text'
    @sap.label : 'Business Area'
    key BusinessArea : String(4) not null;
    @sap.label : 'Business Area Name'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    BusinessArea_Text : String(30);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Chart Of Accounts'
  @sap.value.list : 'true'
  entity I_ChartOfAccountsStdVH {
    @sap.display.format : 'UpperCase'
    @sap.text : 'ChartOfAccounts_Text'
    @sap.label : 'Chart of Accounts'
    key ChartOfAccounts : String(4) not null;
    @sap.label : 'Chart of Accounts Description'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ChartOfAccounts_Text : String(50);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Company Code'
  @sap.value.list : 'true'
  entity I_CompanyCodeStdVH {
    @sap.display.format : 'UpperCase'
    @sap.text : 'CompanyCodeName'
    @sap.label : 'Company Code'
    key CompanyCode : String(4) not null;
    @sap.label : 'Company Name'
    @sap.quickinfo : 'Name of Company Code or Company'
    CompanyCodeName : String(25);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Controlling Area'
  entity I_ControllingArea {
    @sap.display.format : 'UpperCase'
    @sap.text : 'ControllingAreaName'
    @sap.label : 'Controlling Area'
    key ControllingArea : String(4) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Fiscal Year Variant'
    FiscalYearVariant : String(2);
    @sap.label : 'Controlling Area Name'
    ControllingAreaName : String(25);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Controlling Area Currency'
    @sap.semantics : 'currency-code'
    ControllingAreaCurrency : String(5);
    @sap.display.format : 'UpperCase'
    @sap.text : 'ChartOfAccounts_Text'
    @sap.label : 'Chart of Accounts'
    @sap.value.list : 'standard'
    ChartOfAccounts : String(4);
    @sap.label : 'Chart of Accounts Description'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ChartOfAccounts_Text : String(50);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Cost Center Standard Hierarchy'
    CostCenterStandardHierarchy : String(12);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Operating concern'
    OperatingConcern : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Profit Center Standard Hierarchy'
    ProfitCenterStandardHierarchy : String(12);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Business Process Standard Hierarchy Area'
    BusinessProcessStandardHier : String(12);
    @sap.display.format : 'UpperCase'
    @sap.label : 'G/L Account for Supplier Down Payments'
    @sap.quickinfo : 'Default General Ledger Account for Supplier Down Payments'
    CreditDownPaymentDefaultGLAcct : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'G/L Account for Customer Down Payments'
    @sap.quickinfo : 'Default General Ledger Account for Customer Down Payments'
    DebitDownPaymentDefaultGLAcct : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Currency Type for Controlling Area'
    ControllingAreaCurrencyRole : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'FM Area'
    @sap.quickinfo : 'Financial Management Area'
    FinancialManagementArea : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Responsible User of Controlling Area'
    ControllingAreaResponsibleUser : String(12);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Default Profit Center'
    @sap.quickinfo : 'Default Profit Center for Nonassigned Processes'
    DefaultProfitCenter : String(10);
    @sap.display.format : 'UpperCase'
    @sap.text : 'CtrlgStdFinStatementVersion_Text'
    @sap.label : 'Leading Ctrlg Financial Stmnt Version'
    @sap.quickinfo : 'Leading Controlling Financial Statement Version'
    CtrlgStdFinStatementVersion : String(42);
    @sap.label : 'Financial Statement Description'
    @sap.quickinfo : 'Hierarchy description'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    CtrlgStdFinStatementVersion_Text : String(50);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Profit Center Local Currency'
    @sap.quickinfo : 'Local Currency for Profit Center Accounting'
    @sap.semantics : 'currency-code'
    ProfitCenterAccountingCurrency : String(5);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Controlling Area'
  @sap.value.list : 'true'
  entity I_ControllingAreaStdVH {
    @sap.display.format : 'UpperCase'
    @sap.text : 'ControllingAreaName'
    @sap.label : 'Controlling Area'
    key ControllingArea : String(4) not null;
    @sap.label : 'Controlling Area Name'
    ControllingAreaName : String(25);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.semantics : 'aggregate'
  @sap.label : 'Cost Center Activity Type'
  entity I_CostCenterActivityType {
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key ID : String not null;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.text : 'ControllingArea_Text'
    @sap.label : 'Controlling Area'
    @sap.value.list : 'standard'
    ControllingArea : String(4);
    @sap.label : 'Controlling Area Name'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ControllingArea_Text : String(25);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.text : 'CostCtrActivityType_Text'
    @sap.label : 'Activity Type'
    CostCtrActivityType : String(6);
    @sap.label : 'Cost Center Activity Type Description'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    CostCtrActivityType_Text : String(40);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Valid To'
    @sap.quickinfo : 'Valid To Date'
    ValidityEndDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Valid From'
    @sap.quickinfo : 'Valid-From Date'
    ValidityStartDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Activity Unit'
    @sap.semantics : 'unit-of-measure'
    CostCtrActivityTypeQtyUnit : String(3);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'ATyp category'
    @sap.quickinfo : 'Activity Type Category'
    CostCtrActivityTypeCategory : String(1);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Allocation cost elem'
    @sap.quickinfo : 'Allocation Cost Element'
    AllocationCostElement : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Output Unit'
    @sap.semantics : 'unit-of-measure'
    CostCtrActivityTypeOutpQtyUnit : String(3);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Entered On'
    CreationDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Created By'
    @sap.quickinfo : 'Entered By'
    EnteredByUser : String(12);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Origin Group'
    @sap.quickinfo : 'Origin Group as Subdivision of Cost Element'
    CostOriginGroup : String(4);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Actl Acty Type Cat.'
    @sap.quickinfo : 'Variant Activity Type Category for Actual Postings'
    ActlPostgCostCenterActyTypeCat : String(1);
    @sap.aggregation.role : 'measure'
    @sap.label : 'Output factor'
    @sap.filterable : 'false'
    OutputQuantityFactor : Decimal(5, 2);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Lock indicator'
    @sap.quickinfo : 'Lock Indicator'
    ActivityTypeIsBlocked : String(1);
    @sap.aggregation.role : 'dimension'
    @sap.label : 'PreDistFixCosts'
    @sap.quickinfo : 'Predistribution of fixed costs for acty type/bus. process'
    FixedCostIsPredistributed : Boolean;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Price indicator'
    @sap.quickinfo : 'Price Indicator: Calculate Allocation Price'
    PriceAllocationMethod : String(3);
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Average price'
    @sap.quickinfo : 'Price Calculation with Period-Based Average Prices'
    PeriodPriceIsAverage : Boolean;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Act. price indicator'
    @sap.quickinfo : 'Indicator: Actual Allocation Price'
    ActualPriceAllocationMethod : String(3);
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Actual qty set'
    @sap.quickinfo : 'Indicator: Confirm quantity manually in actual'
    ActualQuantityIsSetManually : Boolean;
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Plan qty set'
    @sap.quickinfo : 'Indicator: Plan quantity manually set.'
    PlanQuantityIsSetManually : Boolean;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'CCtr Categories'
    @sap.quickinfo : 'Valid Cost Center Categories'
    CostCtrActivityTypeValidCat : String(8);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Comp.RelevanceCO'
    @sap.quickinfo : 'Indicator for component relevancy CO'
    CostCtrActyTypeIsCtrlgRlvtComp : String(1);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Comp. relevance, HR'
    @sap.quickinfo : 'Indicator: Component Relevance, HR'
    CostCtrActyTypeIsHumRsceRlvt : String(1);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Cost Center Activity Type - Text'
  entity I_CostCenterActivityTypeText {
    @sap.display.format : 'UpperCase'
    @sap.text : 'ControllingArea_Text'
    @sap.label : 'Controlling Area'
    @sap.value.list : 'standard'
    key ControllingArea : String(4) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Activity Type'
    key CostCtrActivityType : String(6) not null;
    @sap.label : 'Language Key'
    key Language : String(2) not null;
    @sap.display.format : 'Date'
    @sap.label : 'Valid To'
    @sap.quickinfo : 'Valid To Date'
    ValidityEndDate : Date;
    @sap.label : 'Controlling Area Name'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ControllingArea_Text : String(25);
    @sap.label : 'Cost Center Activity Type Name'
    CostCtrActivityTypeName : String(20);
    @sap.label : 'Cost Center Activity Type Description'
    CostCtrActivityTypeDesc : String(40);
    @sap.display.format : 'Date'
    @sap.label : 'Valid From'
    @sap.quickinfo : 'Valid-From Date'
    ValidityStartDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Act. Type Short Text'
    @sap.quickinfo : 'Search Term for Matchcode Use'
    CostCtrActyTypeTxtSearchTerm : String(20);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Cost Center'
  @sap.value.list : 'true'
  entity I_CostCenterStdVH {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Controlling Area'
    key ControllingArea : String(4) not null;
    @sap.display.format : 'UpperCase'
    @sap.text : 'CostCenter_Text'
    @sap.label : 'Cost Center'
    key CostCenter : String(10) not null;
    @sap.display.format : 'Date'
    @sap.label : 'Valid To'
    @sap.quickinfo : 'Valid To Date'
    key ValidityEndDate : Date not null;
    @sap.label : 'Cost Center Name'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    CostCenter_Text : String(20);
    @sap.display.format : 'Date'
    @sap.label : 'Valid From'
    @sap.quickinfo : 'Valid-From Date'
    ValidityStartDate : Date;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.semantics : 'aggregate'
  @sap.label : 'Earmarked Funds Doc. Item MM Value Help'
  @sap.value.list : 'true'
  entity I_EmrkdFndsDocumentItemMMVH {
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key ID : String not null;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Earmarked Funds Document'
    @sap.quickinfo : 'Document Number for Earmarked Funds'
    EarmarkedFundsDocument : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'NonNegative'
    @sap.label : 'Earmarked Funds Document Item'
    @sap.quickinfo : 'Document Item for Earmarked Funds'
    EarmarkedFundsDocumentItem : String(3);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Type'
    @sap.quickinfo : 'Earmarked Fund Document Type'
    EarmarkedFundsDocumentType : String(2);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Company Code'
    @sap.value.list : 'standard'
    CompanyCode : String(4);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Transaction Currency'
    @sap.semantics : 'currency-code'
    TransactionCurrency : String(5);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Posting Date'
    @sap.quickinfo : 'Posting Date in the Document'
    PostingDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Text'
    @sap.quickinfo : 'Item Text'
    DocumentItemText : String(50);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Controlling Area'
    ControllingArea : String(4);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'G/L Account'
    @sap.quickinfo : 'G/L Account Number'
    GLAccount : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Cost Center'
    CostCenter : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'WBS Element'
    @sap.quickinfo : 'Work Breakdown Structure Element (WBS Element) Edited'
    WBSElementExternalID : String(24);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Network'
    @sap.quickinfo : 'Network Number for Account Assignment'
    ProjectNetwork : String(12);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'FM Area'
    @sap.quickinfo : 'Financial Management Area'
    FinancialManagementArea : String(4);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Fund'
    Fund : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Budget Period'
    @sap.value.list : 'standard'
    BudgetPeriod : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Functional Area'
    @sap.value.list : 'standard'
    FunctionalArea : String(16);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Grant'
    @sap.value.list : 'standard'
    GrantID : String(20);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Business Area'
    @sap.value.list : 'standard'
    BusinessArea : String(4);
    @sap.aggregation.role : 'measure'
    @sap.unit : 'TransactionCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Open Amount'
    @sap.quickinfo : 'Open Amount in Transaction Currency'
    @sap.filterable : 'false'
    EmrkdFndsOpenAmtInTransCrcy : Decimal(15, 3);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.semantics : 'aggregate'
  @sap.label : 'Earmarked Funds Doc. Item Std Value Help'
  @sap.value.list : 'true'
  entity I_EmrkdFndsDocumentItemStdVH {
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key ID : String not null;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Earmarked Funds Document'
    @sap.quickinfo : 'Document Number for Earmarked Funds'
    EarmarkedFundsDocument : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'NonNegative'
    @sap.label : 'Earmarked Funds Document Item'
    @sap.quickinfo : 'Document Item for Earmarked Funds'
    EarmarkedFundsDocumentItem : String(3);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'NonNegative'
    @sap.label : 'Document Category'
    @sap.quickinfo : 'Document Category of an Earmarked Funds Document'
    EarmarkedFundsDocumentCategory : String(3);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Type'
    @sap.quickinfo : 'Earmarked Fund Document Type'
    EarmarkedFundsDocumentType : String(2);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Company Code'
    @sap.value.list : 'standard'
    CompanyCode : String(4);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Transaction Currency'
    @sap.semantics : 'currency-code'
    TransactionCurrency : String(5);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Entry Status'
    @sap.quickinfo : 'Document Entry Status (Posted, Parked)'
    EarmarkedFundsDocEntryStatus : String(1);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Posting Date'
    @sap.quickinfo : 'Posting Date in the Document'
    PostingDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Entered By'
    EmrkdFndsDocItmCreatedByUser : String(12);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Entered On'
    EmrkdFndsDocItmCreationDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Last Changed By'
    EmrkdFndsDocItmLastChgdByUsr : String(12);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Changed On'
    @sap.quickinfo : 'Date of Last Change'
    EmrkdFndsDocItmLastChangeDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Text'
    @sap.quickinfo : 'Item Text'
    DocumentItemText : String(50);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Due On'
    @sap.quickinfo : 'Costs Due On'
    DueDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Controlling Area'
    @sap.value.list : 'standard'
    ControllingArea : String(4);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'G/L Account'
    @sap.quickinfo : 'G/L Account Number'
    GLAccount : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Cost Center'
    CostCenter : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'WBS Element'
    @sap.quickinfo : 'Work Breakdown Structure Element (WBS Element) Edited'
    WBSElementExternalID : String(24);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Network'
    @sap.quickinfo : 'Network Number for Account Assignment'
    ProjectNetwork : String(12);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'FM Area'
    @sap.quickinfo : 'Financial Management Area'
    FinancialManagementArea : String(4);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Fund'
    Fund : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Budget Period'
    @sap.value.list : 'standard'
    BudgetPeriod : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Functional Area'
    @sap.value.list : 'standard'
    FunctionalArea : String(16);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Grant'
    @sap.value.list : 'standard'
    GrantID : String(20);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Business Area'
    @sap.value.list : 'standard'
    BusinessArea : String(4);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Supplier'
    @sap.quickinfo : 'Account Number of Supplier'
    Supplier : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Customer'
    @sap.quickinfo : 'Customer Number'
    @sap.value.list : 'standard'
    Customer : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Item Completed'
    @sap.quickinfo : 'Completion Indicator for Earmarked Funds Document Item'
    EmrkdFndsItmIsCompleted : Boolean;
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Item Blocked'
    @sap.quickinfo : 'Blocking Indicator (Item)'
    EmrkdFndsItmIsBlkdAgainstUsage : Boolean;
    @sap.aggregation.role : 'measure'
    @sap.unit : 'TransactionCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Open Amount'
    @sap.quickinfo : 'Open Amount in Transaction Currency'
    @sap.filterable : 'false'
    EmrkdFndsOpenAmtInTransCrcy : Decimal(15, 3);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Funds Management Functional Area'
  entity I_FndsMgmtFuncnlAreaStdVH {
    @sap.display.format : 'UpperCase'
    @sap.text : 'FunctionalArea_Text'
    @sap.label : 'Functional Area'
    key FunctionalArea : String(16) not null;
    @sap.label : 'Functional Area Name'
    @sap.quickinfo : 'Name of the Functional Area'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    FunctionalArea_Text : String(25);
    @sap.label : 'Functional Area Name'
    @sap.quickinfo : 'Name of the Functional Area'
    FunctionalAreaName : String(25);
    @sap.display.format : 'Date'
    @sap.filter.restriction : 'single-value'
    @sap.label : 'Validity End Date'
    @sap.quickinfo : 'Functional Area Validity End Date'
    ValidityEndDate : Date;
    @sap.display.format : 'Date'
    @sap.filter.restriction : 'single-value'
    @sap.label : 'Validity Start Date'
    @sap.quickinfo : 'Functional Area Validity Start Date'
    ValidityStartDate : Date;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Grant'
  entity I_GrantStdVH {
    @sap.display.format : 'UpperCase'
    @sap.text : 'GrantName'
    @sap.label : 'Grant'
    key GrantID : String(20) not null;
    @sap.label : 'Name'
    @sap.quickinfo : 'Short Description of the Grant'
    GrantName : String(20);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sponsor'
    @sap.quickinfo : 'Grant Sponsor'
    GranteeMgmtSponsor : String(10);
    @sap.label : 'Sponsor Name'
    BusinessPartnerName : String(81);
    @sap.display.format : 'Date'
    @sap.filter.restriction : 'single-value'
    @sap.label : 'Validity Start Date'
    @sap.quickinfo : 'Valid-from Date'
    ValidityStartDate : Date;
    @sap.display.format : 'Date'
    @sap.filter.restriction : 'single-value'
    @sap.label : 'Validity End Date'
    @sap.quickinfo : 'Valid-to Date'
    ValidityEndDate : Date;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Master Fixed Asset'
  entity I_MasterFixedAsset {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Company Code'
    @sap.value.list : 'standard'
    key CompanyCode : String(4) not null;
    @sap.display.format : 'UpperCase'
    @sap.text : 'MasterFixedAssetDescription'
    @sap.label : 'Asset'
    @sap.quickinfo : 'Main Asset Number'
    key MasterFixedAsset : String(12) not null;
    @sap.label : 'Asset Main No. Text'
    @sap.quickinfo : 'Asset Main Number Text'
    MasterFixedAssetDescription : String(50);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Material Group Text'
  entity I_MaterialGroupText {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Product Group'
    key MaterialGroup : String(9) not null;
    @sap.label : 'Language Key'
    key Language : String(2) not null;
    @sap.label : 'Product Group Desc.'
    @sap.quickinfo : 'Product Group Description'
    MaterialGroupName : String(20);
    @sap.label : 'Mat.Grp Desc. 2'
    @sap.quickinfo : 'Description of the Material Group'
    MaterialGroupText : String(60);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Material'
  @sap.value.list : 'true'
  entity I_MaterialStdVH {
    @sap.display.format : 'UpperCase'
    @sap.text : 'Material_Text'
    @sap.label : 'Material'
    @sap.quickinfo : 'Material Number'
    key Material : String(40) not null;
    @sap.label : 'Material Description'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    Material_Text : String(40);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Purchasing Cost Center Value Help'
  entity I_MM_CostCenterValueHelp {
    @sap.display.format : 'UpperCase'
    @sap.text : 'CostCenter_Text'
    @sap.label : 'Cost Center'
    key CostCenter : String(10) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Controlling Area'
    key ControllingArea : String(4) not null;
    @sap.display.format : 'Date'
    @sap.filter.restriction : 'interval'
    @sap.label : 'Valid To'
    @sap.quickinfo : 'Valid To Date'
    key ValidityEndDate : Date not null;
    @sap.label : 'Cost Center Name'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    CostCenter_Text : String(20);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Company Code'
    @sap.value.list : 'standard'
    CompanyCode : String(4);
    @sap.label : 'Person Responsible'
    CostCtrResponsiblePersonName : String(20);
    @sap.display.format : 'Date'
    @sap.filter.restriction : 'interval'
    @sap.label : 'Valid From'
    @sap.quickinfo : 'Valid-From Date'
    ValidityStartDate : Date;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Purchasing Fixed Asset Value Help'
  entity I_MM_FixedAssetValueHelp {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Company Code'
    key CompanyCode : String(4) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Asset'
    @sap.quickinfo : 'Main Asset Number'
    key MasterFixedAsset : String(12) not null;
    @sap.display.format : 'UpperCase'
    @sap.text : 'FixedAssetDescription'
    @sap.label : 'Sub-number'
    @sap.quickinfo : 'Asset Subnumber'
    key FixedAsset : String(4) not null;
    @sap.label : 'Description'
    @sap.quickinfo : 'Asset Description'
    FixedAssetDescription : String(50);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Asset Class'
    AssetClass : String(8);
    @sap.display.format : 'Date'
    @sap.label : 'Capitalized On'
    @sap.quickinfo : 'Asset Capitalization Date'
    AssetCapitalizationDate : Date;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Purchasing GL Account Value Help'
  entity I_MM_GLAccountVH {
    @sap.display.format : 'UpperCase'
    @sap.text : 'GLAccount_Text'
    @sap.label : 'G/L Account'
    @sap.quickinfo : 'G/L Account Number'
    key GLAccount : String(10) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Company Code'
    key CompanyCode : String(4) not null;
    @sap.label : 'G/L Account Name'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    GLAccount_Text : String(20);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Chart of Accounts'
    ChartOfAccounts : String(4);
    @sap.label : 'G/L Account Long Name'
    GLAccountLongName : String(50);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'MM Purchasing Logistics Order Value Help'
  entity I_MM_LogisticsOrderVH {
    @sap.display.format : 'UpperCase'
    @sap.text : 'OrderDescription'
    @sap.label : 'Order'
    @sap.quickinfo : 'Order Number'
    key OrderID : String(12) not null;
    @sap.label : 'Order Description'
    OrderDescription : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Order Type'
    OrderType : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Controlling Area'
    ControllingArea : String(4);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Purchasing Profit Center Value Help'
  entity I_MM_ProfitCenterValueHelp {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Controlling Area'
    @sap.value.list : 'standard'
    key ControllingArea : String(4) not null;
    @sap.display.format : 'UpperCase'
    @sap.text : 'ProfitCenter_Text'
    @sap.label : 'Profit Center'
    key ProfitCenter : String(10) not null;
    @sap.display.format : 'Date'
    @sap.label : 'Valid To'
    @sap.quickinfo : 'Valid To Date'
    key ValidityEndDate : Date not null;
    @sap.label : 'Profit Center Name'
    @sap.quickinfo : 'Description of Profit Center'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ProfitCenter_Text : String(20);
    @sap.label : 'Person Resp. for PC'
    @sap.quickinfo : 'Person Responsible for Profit Center'
    ProfitCtrResponsiblePersonName : String(20);
    @sap.display.format : 'UpperCase'
    @sap.label : 'User Responsible'
    @sap.quickinfo : 'User Responsible for the Profit Center'
    ProfitCtrResponsibleUser : String(12);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Purchasing Sales Order Item Value Help'
  entity I_MM_SalesOrderItemVH {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales Order'
    key SalesOrder : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.text : 'SalesOrderItemText'
    @sap.label : 'Item'
    @sap.quickinfo : 'Sales Order Item'
    key SalesOrderItem : String(6) not null;
    @sap.label : 'Item Description'
    @sap.quickinfo : 'Short text for sales order item'
    SalesOrderItemText : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material'
    @sap.quickinfo : 'Material Number'
    @sap.value.list : 'standard'
    Material : String(40);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Sales Order Value Help'
  entity I_MM_SalesOrderValueHelp {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales Document'
    key SalesOrder : String(10) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Created By'
    @sap.quickinfo : 'Name of Person Responsible for Creating the Object'
    CreatedByUser : String(12);
    @sap.display.format : 'Date'
    @sap.label : 'Valid-From Date'
    @sap.quickinfo : 'Valid-From Date (Outline Agreements, Product Proposals)'
    ValidityStartDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Valid-To Date'
    @sap.quickinfo : 'Valid-To Date (Outline Agreements, Product Proposals)'
    ValidityEndDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales Organization'
    SalesOrganization : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales Document Type'
    SalesDocumentType : String(4);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Purchasing WBS Element by Internal ID'
  entity I_MM_WBSElementByIntKeyVH {
    @sap.display.format : 'NonNegative'
    @sap.label : 'WBS Internal ID'
    @sap.quickinfo : 'WBS Element'
    key WBSElementInternalID : String(8) not null;
    @sap.display.format : 'UpperCase'
    @sap.text : 'WBSDescription'
    @sap.label : 'WBS Element'
    @sap.quickinfo : 'Work Breakdown Structure Element (WBS Element) Edited'
    WBSElement : String(24);
    @sap.label : 'WBS Element Name'
    @sap.quickinfo : 'Work Breakdown Structure Element Name'
    WBSDescription : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Project Definition'
    @sap.quickinfo : 'Project Number (External) Edited'
    ProjectExternalID : String(24);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Project definition'
    Project : String(24);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Profit Center'
  @sap.value.list : 'true'
  entity I_ProfitCenterStdVH {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Controlling Area'
    key ControllingArea : String(4) not null;
    @sap.display.format : 'UpperCase'
    @sap.text : 'ProfitCenter_Text'
    @sap.label : 'Profit Center'
    key ProfitCenter : String(10) not null;
    @sap.display.format : 'Date'
    @sap.label : 'Valid To'
    @sap.quickinfo : 'Valid To Date'
    key ValidityEndDate : Date not null;
    @sap.label : 'Profit Center Name'
    @sap.quickinfo : 'Description of Profit Center'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ProfitCenter_Text : String(20);
    @sap.display.format : 'Date'
    @sap.label : 'Valid From'
    @sap.quickinfo : 'Valid-From Date'
    ValidityStartDate : Date;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.searchable : 'true'
  @sap.content.version : '1'
  @sap.label : 'Profit Center - Text'
  entity I_ProfitCenterText {
    @sap.label : 'Language Key'
    key Language : String(2) not null;
    @sap.display.format : 'UpperCase'
    @sap.text : 'ControllingArea_Text'
    @sap.label : 'Controlling Area'
    @sap.value.list : 'standard'
    key ControllingArea : String(4) not null;
    @sap.display.format : 'UpperCase'
    @sap.text : 'ProfitCenterLongName'
    @sap.label : 'Profit Center'
    key ProfitCenter : String(10) not null;
    @sap.label : 'Controlling Area Name'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ControllingArea_Text : String(25);
    @sap.display.format : 'Date'
    @sap.label : 'Valid To'
    @sap.quickinfo : 'Valid To Date'
    ValidityEndDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Valid From'
    @sap.quickinfo : 'Valid-From Date'
    ValidityStartDate : Date;
    @sap.attribute.for : 'ProfitCenter'
    @sap.label : 'Profit Center Name'
    @sap.quickinfo : 'Description of Profit Center'
    ProfitCenterName : String(20);
    @sap.label : 'Profit Center Description'
    @sap.quickinfo : 'Description of Profit Center'
    ProfitCenterLongName : String(40);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Project Network Details'
  entity I_ProjectNetwork {
    @sap.display.format : 'UpperCase'
    @sap.text : 'ProjectNetworkDescription'
    @sap.label : 'Network'
    @sap.quickinfo : 'Order Number'
    key ProjectNetwork : String(12) not null;
    @sap.label : 'Network Name'
    @sap.quickinfo : 'Description'
    ProjectNetworkDescription : String(40);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Project def.'
    @sap.quickinfo : 'Project definition'
    ProjectInternalID : String(24);
    @sap.display.format : 'NonNegative'
    @sap.label : 'WBS Element'
    @sap.quickinfo : 'Work Breakdown Structure Element (WBS Element)'
    WBSElementInternalID : String(24);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Opertn task list no.'
    @sap.quickinfo : 'Routing number of operations in the order'
    ProjectNetworkInternalID : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Business Area'
    BusinessArea : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Company Code'
    CompanyCode : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Controlling Area'
    ControllingArea : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Profit Center'
    ProfitCenter : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Responsible Cost Center'
    CostCenter : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Plant'
    Plant : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales Order'
    @sap.quickinfo : 'Sales Order Number'
    SalesOrder : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Sales Order Item'
    @sap.quickinfo : 'Item Number in Sales Order'
    SalesOrderItem : String(6);
    @sap.display.format : 'UpperCase'
    @sap.label : 'MRP controller'
    @sap.quickinfo : 'MRP controller for the order'
    MRPController : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Planner Group'
    @sap.quickinfo : 'Responsible Planner Group/Department'
    ResponsiblePlannerGroup : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Change Number'
    ChangeNumber : String(12);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Priority'
    @sap.quickinfo : 'Order priority'
    PriorityCode : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Subnetwork of'
    @sap.quickinfo : 'Number of superior network'
    SuperiorProjectNetwork : String(12);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Internal object no.'
    @sap.quickinfo : 'Configuration (internal object number)'
    ProductConfiguration : String(18);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Network Profile'
    NetworkProfile : String(7);
    @sap.display.format : 'Date'
    @sap.label : 'Scheduled on'
    @sap.quickinfo : 'Date of the Last Scheduling'
    LastScheduledDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Actual Finish Date'
    @sap.quickinfo : 'Confirmed Order Finish Date'
    ConfirmedEndDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Sched. release date'
    @sap.quickinfo : 'Scheduled release date'
    ScheduledReleaseDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Actual Release Date'
    ActualReleasedDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Actual Start Date'
    ActualStartDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Actual Finish Date'
    ActualEndDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Basic Start Date'
    PlannedStartDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Basic finish date'
    PlannedEndDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Start date'
    @sap.quickinfo : 'Forecast start date'
    ForecastedStartDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Finish date'
    @sap.quickinfo : 'Finish date (forecast)'
    ForecastedEndDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Scheduled start'
    @sap.quickinfo : 'Scheduled forecast start'
    ScheduledForecastedStartDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Scheduled finish'
    @sap.quickinfo : 'Scheduled forecast finish'
    ScheduledForecastedEndDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Sched. release date'
    @sap.quickinfo : 'Scheduled release date (forecast)'
    ScheduledFcstdReleaseDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Scheduled start'
    ScheduledBasicStartDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Scheduled finish'
    ScheduledBasicEndDate : Date;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Reservation'
    @sap.quickinfo : 'Number of reservation/dependent requirements'
    Reservation : String(10);
    @sap.display.format : 'Date'
    @sap.label : 'Created On'
    CreationDate : Date;
    @sap.label : 'Time created'
    CreationTime : Time;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Created By'
    @sap.quickinfo : 'Payment Cards: Created By'
    CreatedByUser : String(12);
    @sap.display.format : 'Date'
    @sap.label : 'Changed On'
    @sap.quickinfo : 'Date of the Last Change to the Info Object'
    LastChangeDate : Date;
    @sap.label : 'Changed At'
    LastChangeTime : Time;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Last Changed By'
    LastChangedByUser : String(12);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Network Type'
    @sap.quickinfo : 'Order Type'
    ProjectNetworkType : String(4);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Order Category'
    OrderCategory : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Orig. Cost Object'
    @sap.quickinfo : 'JV original cost object'
    JointVentureOriginalCostObject : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'JV Object Type'
    @sap.quickinfo : 'Joint Venture Object Type'
    JointVentureObjectType : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Joint venture'
    JointVenture : String(6);
    @sap.display.format : 'UpperCase'
    @sap.label : 'JIB/JIBE Class'
    JointVentureClass : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'JIB/JIBE Subclass A'
    JointVentureSubClass : String(5);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Tax Jur. Code'
    @sap.quickinfo : 'Tax Jurisdiction Code in BV Document'
    TaxJurisdiction : String(15);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Costing Sheet'
    CostingSheet : String(6);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Cost Element'
    @sap.quickinfo : 'Settlement Cost Element'
    CostElement : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Object number'
    ProjectNetworkObject : String(22);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Currency'
    @sap.quickinfo : 'Order Currency'
    @sap.semantics : 'currency-code'
    Currency : String(5);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Overhead key'
    OverheadCode : String(6);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Interest Profile'
    @sap.quickinfo : 'Interest Profile for Project/Order Interest Calculation'
    ProjNtwkInterestCalcProfile : String(7);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Confirmation'
    @sap.quickinfo : 'Completion confirmation number for the operation'
    NetworkActivityConfirmation : String(10);
    @sap.label : 'Deletion Flag'
    IsMarkedForDeletion : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Act. Costing Variant'
    @sap.quickinfo : 'Costing Variant For Actual Costs'
    ActualCostsCostingVariant : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Plnd Costing Variant'
    @sap.quickinfo : 'Costing Variant for Planned Costs'
    PlannedCostsCostingVariant : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sched. type forecast'
    @sap.quickinfo : 'Scheduling type (forecast)'
    ForecastSchedulingType : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Scheduling type'
    BasicSchedulingType : String(1);
    @sap.label : 'Base Unit of Measure'
    @sap.semantics : 'unit-of-measure'
    BaseUnit : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Functional Area'
    FunctionalArea : String(16);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Calculate Capacity Requirements'
    @sap.quickinfo : 'ID of the Capacity Requirements Record'
    CapacityRequirement : String(12);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Order'
    @sap.quickinfo : 'Order Number'
    OrderID : String(12);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Controlling Object Class'
    ControllingObjectClass : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'No automatic costing'
    @sap.quickinfo : 'Indicator: Do not cost automatically'
    OrderIsNotCostedAutomatically : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'No auto. scheduling'
    @sap.quickinfo : 'Indicator: Do not schedule automatically'
    OrdIsNotSchedldAutomatically : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Account assignment'
    @sap.quickinfo : 'Indicator for the account assignment of a network(hdr/act.)'
    NetworkIsAccountAssigned : String(1);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Purchase Requisition Item'
  entity I_Purchaserequisitionitem {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchase Requisition'
    @sap.quickinfo : 'Purchase Requisition Number'
    key PurchaseRequisition : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Requisn. item'
    @sap.quickinfo : 'Item number of purchase requisition'
    key PurchaseRequisitionItem : String(5) not null;
    @sap.label : 'PurReqn Description'
    @sap.quickinfo : 'Purchase Requisition Description'
    PurReqnDescription : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchase order'
    @sap.quickinfo : 'Purchase order number'
    PurchasingDocument : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Purchase Order Item'
    @sap.quickinfo : 'Purchase order item number'
    PurchasingDocumentItem : String(5);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Proc.state'
    @sap.quickinfo : 'Requisition Processing State'
    PurReqnReleaseStatus : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Type'
    @sap.quickinfo : 'Purchase Requisition Document Type'
    PurchaseRequisitionType : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Control indicator'
    @sap.quickinfo : 'Control indicator for purchasing document type'
    PurchasingDocumentSubtype : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Item Category'
    @sap.quickinfo : 'Item category in purchasing document'
    PurchasingDocumentItemCategory : String(1);
    @sap.label : 'Short Text'
    PurchaseRequisitionItemText : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Acct Assignment Cat.'
    @sap.quickinfo : 'Account Assignment Category'
    AccountAssignmentCategory : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purch. Doc. Category'
    @sap.quickinfo : 'Purchasing Document Category'
    PurchasingDocumentCategory : String(1);
    @sap.label : 'Is Outline'
    IsOutline : Boolean;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Parent Item No'
    PurchasingParentItem : String(5);
    @sap.label : 'Outline Type'
    PurReqnItemOutlineType : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Hierarchy Number'
    PurgConfigurableItemNumber : String(40);
    @sap.display.format : 'NonNegative'
    @sap.label : 'External Sort No.'
    @sap.quickinfo : 'External Sort Number'
    PurgExternalSortNumber : String(5);
    @sap.unit : 'BaseUnit'
    @sap.label : 'Quantity requested'
    @sap.quickinfo : 'Purchase requisition quantity'
    RequestedQuantity : Decimal(13, 3);
    @sap.label : 'Unit of Measure'
    @sap.quickinfo : 'Purchase requisition unit of measure'
    @sap.semantics : 'unit-of-measure'
    BaseUnit : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Currency'
    @sap.quickinfo : 'Currency Key'
    @sap.semantics : 'currency-code'
    PurReqnItemCurrency : String(5);
    @sap.unit : 'PurReqnItemCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Valuation Price'
    @sap.quickinfo : 'Price in Purchase Requisition'
    PurchaseRequisitionPrice : Decimal(11, 3);
    @sap.unit : 'BaseUnit'
    @sap.label : 'Price Unit'
    PurReqnPriceQuantity : Decimal(5, 0);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Release indicator'
    @sap.quickinfo : 'Release Indicator'
    ReleaseCode : String(1);
    @sap.display.format : 'Date'
    @sap.label : 'Release Date'
    @sap.quickinfo : 'Purchase Requisition Release Date'
    PurchaseRequisitionReleaseDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purch. Organization'
    @sap.quickinfo : 'Purchasing Organization'
    PurchasingOrganization : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchasing Group'
    PurchasingGroup : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Plant'
    Plant : String(4);
    @sap.label : 'Assigned'
    @sap.quickinfo : 'Assigned Source of Supply'
    SourceOfSupplyIsAssigned : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Supplying Plant'
    @sap.quickinfo : 'Supplying (issuing) plant in case of stock transport order'
    SupplyingPlant : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Procuring Plant'
    ProcuringPlant : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material'
    @sap.quickinfo : 'Material Number'
    Material : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'MPN: Material'
    @sap.quickinfo : 'Material Number Corresponding to Manufacturer Part Number'
    ManufacturerMaterial : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Mfr Part Profile'
    ManufacturerPartProfile : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Mfr Part Number'
    @sap.quickinfo : 'Manufacturer Part Number'
    ManufacturerPartNmbr : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material Group'
    MaterialGroup : String(9);
    @sap.label : 'GR processing time'
    @sap.quickinfo : 'Goods receipt processing time in days'
    MaterialGoodsReceiptDuration : Decimal(3, 0);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Supplier Mat. No.'
    @sap.quickinfo : 'Material Number Used by Supplier'
    SupplierMaterialNumber : String(35);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Revision Level'
    MaterialRevisionLevel : String(2);
    @sap.unit : 'BaseUnit'
    @sap.label : 'Quantity ordered'
    @sap.quickinfo : 'Quantity ordered against this purchase requisition'
    OrderedQuantity : Decimal(13, 3);
    @sap.unit : 'PurReqnItemCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Consumption Value'
    @sap.quickinfo : 'Consumption Value for Limit Items'
    PurReqnLimitConsumptionAmt : Decimal(13, 3);
    @sap.display.format : 'Date'
    @sap.label : 'Delivery Date'
    @sap.quickinfo : 'Item Delivery Date'
    DeliveryDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Requisition date'
    @sap.quickinfo : 'Requisition (request) date'
    CreationDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Changed On'
    @sap.quickinfo : 'Last Changed On'
    LastChangedDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Processing status'
    @sap.quickinfo : 'Processing status of purchase requisition'
    ProcessingStatus : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchasing Info Rec.'
    @sap.quickinfo : 'Purchasing Info Record Number'
    PurchasingInfoRecord : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Desired Vendor'
    Supplier : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Fixed Vendor'
    FixedSupplier : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Deletion Indicator'
    @sap.quickinfo : 'Deletion Indicator in Purchasing Document'
    IsDeleted : String(1);
    @sap.label : 'Requisitioner'
    @sap.quickinfo : 'Name of requisitioner/requester'
    RequisitionerName : String(12);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Created By'
    @sap.quickinfo : 'Name of Person Responsible for Creating the Object'
    CreatedByUser : String(12);
    @sap.display.format : 'Date'
    @sap.label : 'Requisition date'
    @sap.quickinfo : 'Requisition (request) date'
    PurReqCreationDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Address'
    @sap.quickinfo : 'Manual address number in purchasing document item'
    AddressID : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Address'
    DeliveryAddressID : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Address'
    @sap.quickinfo : 'Manual address number in purchasing document item'
    ManualDeliveryAddressID : String(10);
    @sap.label : 'Planned Deliv. Time'
    @sap.quickinfo : 'Planned Delivery Time in Days'
    MaterialPlannedDeliveryDurn : Decimal(3, 0);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Deliv. date category'
    @sap.quickinfo : 'Category of delivery date'
    DelivDateCategory : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Distrib. Indicator'
    @sap.quickinfo : 'Distribution Indicator for Multiple Account Assignment'
    MultipleAcctAssgmtDistribution : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Address'
    @sap.quickinfo : 'Number of delivery address'
    ItemDeliveryAddressID : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Partial invoice'
    @sap.quickinfo : 'Partial invoice indicator'
    PartialInvoiceDistribution : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Storage Location'
    StorageLocation : String(4);
    @sap.label : 'Requestor'
    PurReqnSSPRequestor : String(60);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Author'
    @sap.quickinfo : 'Author of Requisition'
    PurReqnSSPAuthor : String(12);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Outline agreement'
    @sap.quickinfo : 'Number of principal purchase agreement'
    PurchaseContract : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purch. Doc. Category'
    @sap.quickinfo : 'Purchasing Document Category'
    PurReqnSourceOfSupplyType : String(1);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Agreement Item'
    @sap.quickinfo : 'Item Number of Principal Purchase Agreement'
    PurchaseContractItem : String(5);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Consumption'
    @sap.quickinfo : 'Consumption posting'
    ConsumptionPosting : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Creation indicator'
    @sap.quickinfo : 'Creation indicator (purchase requisition/schedule lines)'
    PurReqnOrigin : String(1);
    @sap.label : 'Web Service ID'
    @sap.quickinfo : 'Technical Key of a Web Service (for Example - a Catalog)'
    PurReqnSSPCatalog : String(20);
    @sap.label : 'Catalog Item'
    @sap.quickinfo : 'Catalog Item Id'
    PurReqnSSPCatalogItem : String(40);
    @sap.label : 'Catalog Item Key'
    PurReqnSSPCrossCatalogItem : Integer;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Blocking Indicator'
    @sap.quickinfo : 'Purchase Requisition Blocked'
    IsPurReqnBlocked : String(1);
    @sap.label : 'Blocking Text'
    @sap.quickinfo : 'Reason for Item Block'
    PurReqnItemBlockingReasonText : String(60);
    @sap.label : 'Language Key'
    Language : String(2);
    @sap.label : 'Closed'
    @sap.quickinfo : 'Purchase requisition closed'
    IsClosed : Boolean;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Reservation'
    @sap.quickinfo : 'Number of reservation/dependent requirements'
    Reservation : String(10);
    @sap.label : 'Subject to Release'
    @sap.quickinfo : 'Release Not Yet Completely Effected'
    ReleaseIsNotCompleted : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Service Performer'
    ServicePerformer : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Product Type Group'
    ProductType : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Release State'
    PurchaseRequisitionStatus : String(8);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Release strategy'
    @sap.quickinfo : 'Release strategy in the purchase requisition'
    ReleaseStrategy : String(2);
    @sap.display.format : 'Date'
    @sap.label : 'Start Date'
    @sap.quickinfo : 'Start Date for Period of Performance'
    PerformancePeriodStartDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'End Date'
    @sap.quickinfo : 'End Date for Period of Performance'
    PerformancePeriodEndDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Company Code'
    CompanyCode : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Valuation Area'
    ValuationArea : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Batch'
    @sap.quickinfo : 'Batch Number'
    Batch : String(10);
    @sap.label : 'Min. Rem. Shelf Life'
    @sap.quickinfo : 'Minimum Remaining Shelf Life'
    MinRemainingShelfLife : Decimal(4, 0);
    @sap.unit : 'PurReqnItemCurrency'
    @sap.variable.scale : 'true'
    ItemNetAmount : Decimal(15, 3);
    @sap.label : 'Goods Receipt'
    @sap.quickinfo : 'Goods Receipt Indicator'
    GoodsReceiptIsExpected : Boolean;
    @sap.label : 'Invoice Receipt'
    @sap.quickinfo : 'Invoice Receipt Indicator'
    InvoiceIsExpected : Boolean;
    @sap.label : 'GR Non-Valuated'
    @sap.quickinfo : 'Goods Receipt, Non-Valuated'
    GoodsReceiptIsNonValuated : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Req. Tracking Number'
    @sap.quickinfo : 'Requirement Tracking Number'
    RequirementTracking : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'MRP Area'
    MRPArea : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'MRP Controller'
    MRPController : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Tax Code'
    @sap.quickinfo : 'Tax on sales/purchases code'
    TaxCode : String(2);
    @sap.label : '&quot;Fixed&quot; indicator'
    @sap.quickinfo : 'Purchase requisition is fixed'
    PurchaseRequisitionIsFixed : Boolean;
    @odata.Type : 'Edm.DateTimeOffset'
    @odata.Precision : 7
    @sap.label : 'Time Stamp'
    @sap.quickinfo : 'UTC Time Stamp in Long Form (YYYYMMDDhhmmssmmmuuun)'
    LastChangeDateTime : Timestamp;
    @sap.label : 'Incomplete'
    @sap.quickinfo : 'Purchase Requisition not yet Complete'
    IsPurReqnCmplt : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Incompleteness'
    @sap.quickinfo : 'Category of Incompleteness'
    PurReqnCmpltnsCat : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material'
    @sap.quickinfo : 'Material of External System'
    ExtMaterialForPurg : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Fixed Supplier'
    @sap.quickinfo : 'Fixed Supplier of External System'
    ExtFixedSupplierForPurg : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Desired Supplier'
    @sap.quickinfo : 'Desired Supplier of External System'
    ExtDesiredSupplierForPurg : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Contract'
    @sap.quickinfo : 'Contract of External System'
    ExtContractForPurg : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Contract Item'
    @sap.quickinfo : 'Contract Item of External System'
    ExtContractItemForPurg : String(5);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Info Record'
    @sap.quickinfo : 'Info Record of External System'
    ExtInfoRecordForPurg : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Plant'
    @sap.quickinfo : 'Plant of External System'
    ExtPlantForPurg : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Storage Location'
    @sap.quickinfo : 'Storage Location of External System'
    ProcmtHubStorageLocation : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Company Code'
    @sap.quickinfo : 'Company Code of External System'
    ExtCompanyCodeForPurg : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purch. Organization'
    @sap.quickinfo : 'Purchasing Organization'
    ExtPurgOrgForPurg : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Logical System'
    ExtSourceSystem : String(10);
    @sap.label : 'Connected System ID'
    ProcurementHubSourceSystem : String(10);
    @sap.label : 'Overall req. rel.'
    @sap.quickinfo : 'Overall release of purchase requisitions'
    IsPurReqnOvrlRel : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Release group'
    ReleaseGroup : String(2);
    @sap.unit : 'PurReqnItemCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Expected Value'
    @sap.quickinfo : 'Expected Value of Overall Limit'
    ExpectedOverallLimitAmount : Decimal(13, 3);
    @sap.unit : 'PurReqnItemCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Overall Limit'
    OverallLimitAmount : Decimal(13, 3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Contract For Limit'
    @sap.quickinfo : 'Purchase Contract for Enhanced Limit'
    PurContractForOverallLimit : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Busin. Purp. Cmpltd.'
    @sap.quickinfo : 'Business Purpose Completed'
    IsEndOfPurposeBlocked : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'PR Item'
    @sap.quickinfo : 'Key to identify purchase requisition item'
    PurchaseReqnItemUniqueID : String(15);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Supplier'
    @sap.quickinfo : 'Supplier to be Supplied/Who is to Receive Delivery'
    Subcontractor : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Customer'
    PurReqnReceivingCustomer : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchase order price'
    @sap.quickinfo : 'Use Requisition Price in Purchase Order'
    PurchaseOrderPriceType : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Shop On Behalf Ind.'
    @sap.quickinfo : 'Shop on behalf indicator'
    IsOnBehalfCart : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'PR DocTyp of ConnSys'
    @sap.quickinfo : 'PR Document Type of Connected System'
    ExtPurchaseRequisitionType : String(4);
    @sap.label : 'PR in Expert Mode'
    @sap.quickinfo : 'PR Created in Expert Mode'
    PurReqnIsCreatedInExpertMode : Boolean;
    @sap.label : 'Shortage quantity'
    @sap.quickinfo : 'Shortage (stock undercoverage) quantity'
    MaterialShortageQuantity : Decimal(13, 3);
    @sap.display.format : 'Date'
    @sap.label : 'Purchase Order Date'
    PurchaseOrderDate : Date;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Internal object no.'
    @sap.quickinfo : 'Configuration (internal object number)'
    PurReqnIntObjNmbr : String(18);
    @sap.label : 'Transaction Data Footprint'
    PFMTransDataFootprintUUID : UUID;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Procurement profile'
    @sap.quickinfo : 'External Procurement Profile'
    ExternalProcurementProfile : String(2);
    @sap.label : 'Requestor'
    PurReqnRequestor : String(60);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Ext Prcsng. Status'
    @sap.quickinfo : 'External Processing Status'
    ExternalApprovalStatus : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Commitment Item Short ID'
    CommitmentItemShortID : String(14);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Funds Center'
    FundsCenter : String(16);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Fund'
    Fund : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Grant'
    GrantID : String(20);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Functional Area'
    FunctionalArea : String(16);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Earmarked Funds'
    @sap.quickinfo : 'Document Number for Earmarked Funds'
    EarmarkedFundsDocument : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Document Item'
    @sap.quickinfo : 'Earmarked Funds: Document Item'
    EarmarkedFundsDocumentItem : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Budget Period'
    BudgetPeriod : String(10);
    @sap.label : 'Funded Program'
    FundedProgram : String(24);
    @sap.label : 'Order Unit'
    @sap.quickinfo : 'Purchase Order Unit of Measure'
    @sap.semantics : 'unit-of-measure'
    MaterialOrderUnit : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Cost Center'
    CostCenter : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'G/L Account'
    @sap.quickinfo : 'G/L Account Number'
    GLAccount : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'External Document'
    @sap.quickinfo : 'Document Number of External Document'
    PurReqnExternalReference : String(35);
    @sap.display.format : 'UpperCase'
    @sap.label : 'External Item'
    @sap.quickinfo : 'Item Number of External Document'
    PurReqnItemExternalReference : String(10);
    @sap.label : 'External System ID'
    PurReqnExternalSystemId : String(60);
    @sap.display.format : 'UpperCase'
    @sap.label : 'External System Type'
    @sap.quickinfo : 'Type of External System'
    PurReqnExternalSystemType : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Ext. Document Type'
    @sap.quickinfo : 'External Document Type'
    PurReqnTypeExternalReference : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Processing State'
    PurReqnProcessingType : String(1);
    @odata.Type : 'Edm.DateTimeOffset'
    @sap.label : 'Timestamp'
    @sap.heading : ''
    PurReqnProcessingDateTime : DateTime;
    @sap.label : 'Connected System'
    ProcmtHubBackendBusSyst : String(60);
    @sap.label : 'PR Change Indicator'
    @sap.quickinfo : 'Change Indicator for PR in Central Procurement'
    ProcmtHubPurReqnItmIsChanged : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Special Stock'
    @sap.quickinfo : 'Special Stock Indicator'
    InventorySpecialStockType : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'BP ID of Author'
    SSPAuthorExternalBPIdnNumber : String(60);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Requestor UserID'
    @sap.quickinfo : 'Requestor User ID'
    SSPReqrUserId : String(12);
    @sap.label : 'Is Central PR Procg.'
    @sap.quickinfo : 'Is PR relevant for Central PR Processing'
    PurReqnIsValdInCntrlReqnProcg : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Delivery Addr Type'
    @sap.quickinfo : 'Purchasing Delivery Address Type'
    PurchasingDeliveryAddressType : String(1);
    @sap.label : 'PurReq Ext. approval'
    @sap.quickinfo : 'Purchase Requisition in external approval'
    PurReqnHasDelegateApproval : Boolean;
    @sap.label : 'Is Rplctn Bfr Apprvl'
    @sap.quickinfo : 'Is Replication Before Approval'
    CntrlReqnIsRpldBfrApprvl : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Approval Sts. in Hub'
    @sap.quickinfo : 'Approval Status of Purchase Requisition in Hub'
    CntrlReqnApprvlStsInRpldReqn : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Stock Segment'
    StockSegment : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Requirement Segment'
    RequirementSegment : String(40);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.semantics : 'aggregate'
  @sap.label : 'Sales Document Schedule Line'
  entity I_SalesDocumentScheduleLine {
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key ID : String not null;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales Document'
    SalesDocument : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'NonNegative'
    @sap.label : 'Sales Document Item'
    SalesDocumentItem : String(6);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'NonNegative'
    @sap.label : 'Schedule Line Number'
    ScheduleLine : String(4);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sched. Line Category'
    @sap.quickinfo : 'Schedule Line Category'
    ScheduleLineCategory : String(2);
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Sales Unit'
    @sap.semantics : 'unit-of-measure'
    OrderQuantityUnit : String(3);
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Denominator'
    @sap.quickinfo : 'Denominator (divisor) for conversion of sales Qty into SKU'
    OrderToBaseQuantityDnmntr : Decimal(5, 0);
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Numerator'
    @sap.quickinfo : 'Numerator (factor) for conversion of sales quantity into SKU'
    OrderToBaseQuantityNmrtr : Decimal(5, 0);
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Base Unit of Measure'
    @sap.semantics : 'unit-of-measure'
    BaseUnit : String(3);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Delivery Date'
    @sap.quickinfo : 'Schedule Line Date'
    DeliveryDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Date type'
    @sap.quickinfo : 'Date type (day, week, month, interval)'
    DelivDateCategory : String(1);
    @sap.aggregation.role : 'dimension'
    IsRequestedDelivSchedLine : String(1);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Delivery Date'
    @sap.quickinfo : 'Schedule Line Date'
    RequestedDeliveryDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Arrival time'
    RequestedDeliveryTime : Time;
    @sap.aggregation.role : 'measure'
    @sap.unit : 'OrderQuantityUnit'
    @sap.label : 'Order Quantity'
    @sap.quickinfo : 'Order Quantity in Sales Units'
    @sap.filterable : 'false'
    ScheduleLineOrderQuantity : Decimal(13, 3);
    @sap.aggregation.role : 'measure'
    @sap.unit : 'OrderQuantityUnit'
    @sap.label : 'Corr.qty'
    @sap.quickinfo : 'Corrected quantity in sales unit'
    @sap.filterable : 'false'
    CorrectedQtyInOrderQtyUnit : Decimal(13, 3);
    @sap.aggregation.role : 'dimension'
    IsConfirmedDelivSchedLine : String(1);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Delivery Date'
    @sap.quickinfo : 'Schedule Line Date'
    ConfirmedDeliveryDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Arrival time'
    ConfirmedDeliveryTime : Time;
    @sap.aggregation.role : 'measure'
    @sap.unit : 'OrderQuantityUnit'
    @sap.label : 'Confirmed Quantity'
    @sap.filterable : 'false'
    ConfdOrderQtyByMatlAvailCheck : Decimal(13, 3);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Delivery Date'
    @sap.quickinfo : 'Schedule Line Date'
    ConfdSchedLineReqdDelivDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Material Avail. Date'
    @sap.quickinfo : 'Material Staging/Availability Date'
    ProductAvailabilityDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Matl Staging Time'
    @sap.quickinfo : 'Material Staging Time (Local, Relating to a Plant)'
    ProductAvailabilityTime : Time;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Requirement date'
    @sap.quickinfo : 'Requirement date (deadline for procurement)'
    ProductAvailCheckRqmtDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Requirement type'
    ProdAvailabilityCheckRqmtType : String(2);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Planning type'
    ProdAvailyCheckPlanningType : String(1);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Confirmation status'
    @sap.quickinfo : 'Confirmation status of schedule line (incl.ALE)'
    ScheduleLineConfirmationStatus : String(1);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Requirements Class'
    RequirementsClass : String(3);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Planned Order'
    PlannedOrder : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Order'
    @sap.quickinfo : 'Order Number'
    OrderID : String(12);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Release type'
    SchedulingAgreementReleaseType : String(1);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'NonNegative'
    @sap.label : 'Forecast dlv. sched.'
    @sap.quickinfo : 'Forecast Delivery schedule number'
    ScheduleLineByForecastDelivery : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'NonNegative'
    @sap.label : 'Order Sch. Gr. ID'
    @sap.quickinfo : 'Order Scheduling Group ID'
    OrderSchedulingGroup : String(4);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Engineering Change'
    @sap.quickinfo : 'Customer Engineering Change Status'
    CustEngineeringChgStatus : String(17);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purchase Requisition'
    @sap.quickinfo : 'Purchase Requisition Number'
    PurchaseRequisition : String(10);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'NonNegative'
    @sap.label : 'Purchase Requisition Item'
    PurchaseRequisitionItem : String(5);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Order Type'
    @sap.quickinfo : 'Order Type (Purchasing)'
    PurchasingOrderType : String(4);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Purch. Doc. Category'
    @sap.quickinfo : 'Purchasing Document Category'
    PurchasingDocumentCategory : String(1);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Deliv. Creation Date'
    @sap.quickinfo : 'Delivery Creation Date'
    DeliveryCreationDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Transptn Plang Date'
    @sap.quickinfo : 'Transportation Planning Date'
    TransportationPlanningDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Transp. Plan. Time'
    @sap.quickinfo : 'Transp. Planning Time (Local, Relating to a Shipping Point)'
    TransportationPlanningTime : Time;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Goods Issue Date'
    GoodsIssueDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'Date'
    @sap.label : 'Loading Date'
    LoadingDate : Date;
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Goods Issue Time'
    @sap.quickinfo : 'Time of Goods Issue (Local, Relating to a Plant)'
    GoodsIssueTime : Time;
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Loading Time'
    @sap.quickinfo : 'Loading Time (Local Time Relating to a Shipping Point)'
    LoadingTime : Time;
    @sap.aggregation.role : 'dimension'
    @sap.label : 'Itm relev.for deliv.'
    @sap.quickinfo : 'Item is relevant for delivery'
    ItemIsDeliveryRelevant : Boolean;
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Delivery Block'
    @sap.quickinfo : 'Schedule Line Blocked for Delivery'
    DelivBlockReasonForSchedLine : String(2);
    @sap.aggregation.role : 'measure'
    @sap.unit : 'OrderQuantityUnit'
    @sap.label : 'Open Dlv Quantity'
    @sap.quickinfo : 'Open requested Delivery Quantity'
    @sap.filterable : 'false'
    OpenReqdDelivQtyInOrdQtyUnit : Decimal(13, 3);
    @sap.aggregation.role : 'measure'
    @sap.unit : 'BaseUnit'
    @sap.label : 'Open Dlv Quantity'
    @sap.quickinfo : 'Open requested Delivery Quantity'
    @sap.filterable : 'false'
    OpenReqdDelivQtyInBaseUnit : Decimal(13, 3);
    @sap.aggregation.role : 'measure'
    @sap.unit : 'OrderQuantityUnit'
    @sap.label : 'Open Quantity'
    @sap.quickinfo : 'Open Confirmed Delivery Quantity'
    @sap.filterable : 'false'
    OpenConfdDelivQtyInOrdQtyUnit : Decimal(13, 3);
    @sap.aggregation.role : 'measure'
    @sap.unit : 'BaseUnit'
    @sap.label : 'Open Quantity'
    @sap.quickinfo : 'Open Confirmed Delivery Quantity'
    @sap.filterable : 'false'
    OpenConfdDelivQtyInBaseUnit : Decimal(13, 3);
    @sap.aggregation.role : 'measure'
    @sap.unit : 'OrderQuantityUnit'
    @sap.label : 'Delivered Quantity'
    @sap.filterable : 'false'
    DeliveredQtyInOrderQtyUnit : Decimal(13, 3);
    @sap.aggregation.role : 'measure'
    @sap.unit : 'BaseUnit'
    @sap.label : 'Delivered Quantity'
    @sap.filterable : 'false'
    DeliveredQuantityInBaseUnit : Decimal(13, 3);
    @sap.aggregation.role : 'measure'
    @sap.unit : 'BaseUnit'
    @sap.label : 'Reqd Rqmt Qty'
    @sap.quickinfo : 'Requested Requirement Quantity in Base Unit'
    @sap.filterable : 'false'
    RequestedRqmtQtyInBaseUnit : Decimal(15, 3);
    @sap.aggregation.role : 'measure'
    @sap.unit : 'BaseUnit'
    @sap.label : 'Confd Rqmt Qty'
    @sap.quickinfo : 'Confirmed Requirement Quantity in Base Unit'
    @sap.filterable : 'false'
    ConfirmedRqmtQtyInBaseUnit : Decimal(15, 3);
    @sap.aggregation.role : 'measure'
    @sap.unit : 'BaseUnit'
    @sap.label : 'Required Quantity'
    @sap.quickinfo : 'Required quantity for mat.management in stockkeeping units'
    @sap.filterable : 'false'
    MRPRequiredQuantityInBaseUnit : Decimal(13, 3);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Movement Type'
    @sap.quickinfo : 'Movement Type (Inventory Management)'
    GoodsMovementType : String(3);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Route Schedule'
    RouteSchedule : String(10);
    @sap.aggregation.role : 'measure'
    @sap.unit : 'TransactionCurrency'
    @sap.variable.scale : 'true'
    @sap.label : 'Open Delivery Amount'
    @sap.quickinfo : 'Open Delivery Net Amount (in Sales Document Currency)'
    @sap.filterable : 'false'
    OpenDeliveryNetAmount : Decimal(15, 3);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Currency'
    @sap.quickinfo : 'SD Document Currency'
    @sap.semantics : 'currency-code'
    TransactionCurrency : String(5);
    @sap.aggregation.role : 'dimension'
    @sap.display.format : 'UpperCase'
    @sap.label : 'Legal Status'
    @sap.quickinfo : 'Legal Control Status'
    TradeCmplncLegalCtrlChkSts : String(1);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'WBS Element Basic Data'
  entity I_WBSElementBasicData {
    @sap.display.format : 'NonNegative'
    @sap.label : 'WBS Internal ID'
    @sap.quickinfo : 'WBS Element'
    key WBSElementInternalID : String(8) not null;
    @sap.display.format : 'UpperCase'
    @sap.text : 'WBSDescription'
    @sap.label : 'WBS Element'
    @sap.quickinfo : 'Work Breakdown Structure Element (WBS Element) Edited'
    WBSElementExternalID : String(24);
    @sap.display.format : 'UpperCase'
    @sap.text : 'WBSDescription'
    @sap.label : 'WBS Element'
    @sap.quickinfo : 'Work Breakdown Structure Element (WBS Element)'
    WBSElement : String(24);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Short ID (WBS elem)'
    @sap.quickinfo : 'WBS element short identification'
    WBSElementShortID : String(16);
    @sap.label : 'WBS Element Name'
    @sap.quickinfo : 'Work Breakdown Structure Element Name'
    WBSDescription : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Company Code'
    @sap.value.list : 'standard'
    CompanyCode : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Controlling Area'
    @sap.value.list : 'standard'
    ControllingArea : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Functional Area'
    FunctionalArea : String(16);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Profit Center'
    @sap.value.list : 'standard'
    ProfitCenter : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Responsible Cost Center'
    @sap.value.list : 'standard'
    ResponsibleCostCenter : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Plant'
    Plant : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Calendar'
    FactoryCalendar : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Costing Sheet'
    CostingSheet : String(6);
    @sap.display.format : 'UpperCase'
    @sap.label : 'CCtr posted actual'
    @sap.quickinfo : 'Cost center to which costs are actually posted'
    @sap.value.list : 'standard'
    CostCenter : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Current proj no'
    @sap.quickinfo : 'Current number of the appropriate project'
    ProjectInternalID : String(24);
    @sap.label : 'Billing Element'
    @sap.quickinfo : 'Indicator: Billing element'
    WBSElementIsBillingElement : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Object number'
    WBSElementObject : String(22);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Investment Profile'
    @sap.quickinfo : 'Investment Measure Profile'
    InvestmentProfile : String(6);
    @sap.label : 'Statistical'
    @sap.quickinfo : 'Statistical WBS element'
    WBSIsStatisticalWBSElement : Boolean;
    @sap.label : 'Account Assignment Element'
    @sap.quickinfo : 'Indicator: Account assignment element'
    WBSIsAccountAssignmentElement : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.text : 'ProjectType_Text'
    @sap.label : 'Project Type'
    ProjectType : String(2);
    @sap.label : 'Description'
    @sap.quickinfo : 'Name of Project Type'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ProjectType_Text : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Joint venture'
    JointVenture : String(6);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Recovery Indicator'
    JointVentureCostRecoveryCode : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Equity Type'
    JointVentureEquityType : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'JV Object Type'
    @sap.quickinfo : 'Joint Venture Object Type'
    JntVntrProjectType : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'JIB/JIBE Class'
    JntIntrstBillgClass : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'JIB/JIBE Subclass A'
    JntIntrstBillgSubClass : String(5);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Location'
    Location : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Results analysis key'
    @sap.quickinfo : 'Results Analysis Key'
    ResultAnalysisInternalID : String(6);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Fund'
    Fund : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Grant'
    GrantID : String(20);
    @sap.label : 'Fund Fixed Assignment'
    @sap.quickinfo : 'Indicator for Fund with Fixed Assignment'
    FundIsFixAssigned : Boolean;
    @sap.label : 'Functional Area Fixed Assignment'
    @sap.quickinfo : 'Indicator for Functional Area with Fixed Assignment'
    FunctionalAreaIsFixAssigned : Boolean;
    @sap.label : 'Grant Fixed Assignment'
    @sap.quickinfo : 'Indicator for Grant with Fixed Assignment'
    GrantIsFixAssigned : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sponsored Program'
    SponsoredProgram : String(20);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Tax Jurisdiction'
    TaxJurisdiction : String(15);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Functional Location'
    FunctionalLocation : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Created By'
    @sap.quickinfo : 'Name of Person Responsible for Creating the Object'
    CreatedByUser : String(12);
    @sap.display.format : 'Date'
    @sap.label : 'Created On'
    @sap.quickinfo : 'Record Creation Date'
    CreationDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Changed By'
    @sap.quickinfo : 'Name of Person Who Changed Object'
    LastChangedByUser : String(12);
    @sap.display.format : 'Date'
    @sap.label : 'Changed on'
    @sap.quickinfo : 'Date on which object was last changed'
    LastChangeDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'CA resp. cost center'
    @sap.quickinfo : 'Responsible Cost Center Controlling Area'
    RespCostCenterControllingArea : String(4);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Sales Document Item'
    LeadingSalesOrderItem : String(6);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales Document'
    LeadingSalesOrder : String(10);
    @sap.label : 'settlementElement'
    @sap.quickinfo : 'Enterprise Project Settlement Element'
    EntProjectSettlementElement : Boolean;
    @sap.label : 'Sttle Rule Inherited'
    @sap.quickinfo : 'Enterprise Project Settlement Rule Inherited'
    EntProjIsSettlmtRuleInherited : Boolean;
    @sap.label : 'RA Description'
    @sap.quickinfo : 'Result Analysis Description'
    ResultAnalysisDescription : String(60);
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.content.version : '1'
  entity SAP__Currencies {
    @sap.label : 'Currency'
    @sap.semantics : 'currency-code'
    key CurrencyCode : String(5) not null;
    @sap.label : 'ISO code'
    ISOCode : String(3) not null;
    @sap.label : 'Short text'
    Text : String(15) not null;
    @odata.Type : 'Edm.Byte'
    @sap.label : 'Decimals'
    DecimalPlaces : Integer not null;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.content.version : '1'
  entity SAP__UnitsOfMeasure {
    @sap.label : 'Internal UoM'
    @sap.semantics : 'unit-of-measure'
    key UnitCode : String(3) not null;
    @sap.label : 'ISO Code'
    ISOCode : String(3) not null;
    @sap.label : 'Commercial'
    ExternalCode : String(3) not null;
    @sap.label : 'Meas. Unit Text'
    Text : String(30) not null;
    @sap.label : 'Decimal Places'
    DecimalPlaces : Integer;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.content.version : '1'
  entity SAP__MyDocumentDescriptions {
    @sap.label : 'UUID'
    key Id : UUID not null;
    CreatedBy : String(12) not null;
    @odata.Type : 'Edm.DateTime'
    @sap.label : 'Time Stamp'
    CreatedAt : DateTime not null;
    FileName : String(256) not null;
    Title : String(256) not null;
    Format : Association to SAP__FormatSet {  };
    TableColumns : Association to many SAP__TableColumnsSet {  };
    CoverPage : Association to many SAP__CoverPageSet {  };
    Signature : Association to SAP__SignatureSet {  };
    PDFStandard : Association to SAP__PDFStandardSet {  };
    Hierarchy : Association to SAP__HierarchySet {  };
    Header : Association to SAP__PDFHeaderSet {  };
    Footer : Association to SAP__PDFFooterSet {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.pageable : 'false'
  @sap.addressable : 'false'
  @sap.content.version : '1'
  entity SAP__FormatSet {
    @sap.label : 'UUID'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key Id : UUID not null;
    FitToPage : SAP__FitToPage not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    FontSize : Integer not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Orientation : String(10) not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    PaperSize : String(10) not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    BorderSize : Integer not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    MarginSize : Integer not null;
    @sap.label : 'Font Name'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    FontName : String(255) not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Padding : Integer not null;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.pageable : 'false'
  @sap.addressable : 'false'
  @sap.content.version : '1'
  entity SAP__PDFStandardSet {
    @sap.label : 'UUID'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key Id : UUID not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    UsePDFAConformance : Boolean not null;
    @sap.label : 'Indicator'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    DoEnableAccessibility : Boolean not null;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.pageable : 'false'
  @sap.addressable : 'false'
  @sap.content.version : '1'
  entity SAP__TableColumnsSet {
    @sap.label : 'UUID'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key Id : UUID not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key Name : String(256) not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key Header : String(256) not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    HorizontalAlignment : String(10) not null;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.pageable : 'false'
  @sap.addressable : 'false'
  @sap.content.version : '1'
  entity SAP__CoverPageSet {
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key Title : String(256) not null;
    @sap.label : 'UUID'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key Id : UUID not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key Name : String(256) not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Value : String(256) not null;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.pageable : 'false'
  @sap.addressable : 'false'
  @sap.content.version : '1'
  entity SAP__SignatureSet {
    @sap.label : 'UUID'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key Id : UUID not null;
    @sap.label : 'Indicator'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    DoSign : Boolean not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Reason : String(256) not null;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.pageable : 'false'
  @sap.addressable : 'false'
  @sap.content.version : '1'
  entity SAP__HierarchySet {
    @sap.label : 'UUID'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key Id : UUID not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    DistanceFromRootElement : String(256) not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    DrillStateElement : String(256) not null;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.pageable : 'false'
  @sap.addressable : 'false'
  @sap.content.version : '1'
  entity SAP__PDFHeaderSet {
    @sap.label : 'UUID'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key Id : UUID not null;
    Right : SAP__HeaderFooterField not null;
    Left : SAP__HeaderFooterField not null;
    Center : SAP__HeaderFooterField not null;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.pageable : 'false'
  @sap.addressable : 'false'
  @sap.content.version : '1'
  entity SAP__PDFFooterSet {
    @sap.label : 'UUID'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    key Id : UUID not null;
    Right : SAP__HeaderFooterField not null;
    Left : SAP__HeaderFooterField not null;
    Center : SAP__HeaderFooterField not null;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.content.version : '1'
  entity SAP__ValueHelpSet {
    key VALUEHELP : String not null;
    FIELD_VALUE : String(10) not null;
    DESCRIPTION : String;
  };

  @cds.external : true
  type SAP__FitToPage {
    @sap.label : 'Error behavior'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    ErrorRecoveryBehavior : String(8) not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    IsEnabled : Boolean not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    MinimumFontSize : Integer not null;
  };

  @cds.external : true
  type SAP__HeaderFooterField {
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Type : String(256) not null;
  };
};

