// This is an automatically generated file. Please do not change its contents manually!
import * as __ from './../_';

export default class {
}

// entity 'C_MM_CompanyCodeValueHelp'
export declare function _C_MM_CompanyCodeValueHelpAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    CompanyCode?: __.Key<string>
    CompanyCodeName?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<C_MM_CompanyCodeValueHelp>;
    readonly elements: __.ElementsOf<C_MM_CompanyCodeValueHelp>;
    readonly actions: globalThis.Record<never, never>;
};
export class C_MM_CompanyCodeValueHelp extends _C_MM_CompanyCodeValueHelpAspect(__.Entity) {
}
export class C_MM_CompanyCodeValueHelp_ extends Array<C_MM_CompanyCodeValueHelp> {
  $count?: number
}

// entity 'C_ProcmtHubPurReqnItmChg'
export declare function _C_ProcmtHubPurReqnItmChgAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    PurchaseRequisition?: __.Key<string>
    PurchaseRequisitionItem?: __.Key<string>
    PurReqnItemDetailOrigin?: __.Key<string>
    RequestedQuantity?: number | null
    DeliveryDate?: __.CdsDate | null
    PurchaseRequisitionPrice?: number | null
    IsDeleted?: string | null
    Material?: string | null
    BaseUnit?: string | null
    PurReqnItemCurrency?: string | null
    ProcmtHubPurReqnItmIsChanged?: boolean | null
    PurchaseRequisitionType?: string | null
    Plant?: string | null
    PurchasingOrganization?: string | null
    PurchasingGroup?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<C_ProcmtHubPurReqnItmChg>;
    readonly elements: __.ElementsOf<C_ProcmtHubPurReqnItmChg>;
    readonly actions: globalThis.Record<never, never>;
};
export class C_ProcmtHubPurReqnItmChg extends _C_ProcmtHubPurReqnItmChgAspect(__.Entity) {
}
export class C_ProcmtHubPurReqnItmChgs extends Array<C_ProcmtHubPurReqnItmChg> {
  $count?: number
}

// entity 'C_PurchaseReqnHeaderNoteType'
export declare function _C_PurchaseReqnHeaderNoteTypeAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    TechnicalObjectType?: __.Key<string>
    Language?: __.Key<string>
    DocumentText?: __.Key<string>
    Note?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<C_PurchaseReqnHeaderNoteType>;
    readonly elements: __.ElementsOf<C_PurchaseReqnHeaderNoteType>;
    readonly actions: globalThis.Record<never, never>;
};
export class C_PurchaseReqnHeaderNoteType extends _C_PurchaseReqnHeaderNoteTypeAspect(__.Entity) {
}
export class C_PurchaseReqnHeaderNoteTypes extends Array<C_PurchaseReqnHeaderNoteType> {
  $count?: number
}

// entity 'C_PurchaseReqnItemCategoryVH'
export declare function _C_PurchaseReqnItemCategoryVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    PurchasingDocumentItemCategory?: __.Key<string>
    PurchaseRequisitionType?: __.Key<string>
    PurgDocItemCategoryName?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<C_PurchaseReqnItemCategoryVH>;
    readonly elements: __.ElementsOf<C_PurchaseReqnItemCategoryVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class C_PurchaseReqnItemCategoryVH extends _C_PurchaseReqnItemCategoryVHAspect(__.Entity) {
}
export class C_PurchaseReqnItemCategoryVH_ extends Array<C_PurchaseReqnItemCategoryVH> {
  $count?: number
}

// entity 'C_PurchaseReqnItemNoteType'
export declare function _C_PurchaseReqnItemNoteTypeAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    TechnicalObjectType?: __.Key<string>
    Language?: __.Key<string>
    DocumentText?: __.Key<string>
    Note?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<C_PurchaseReqnItemNoteType>;
    readonly elements: __.ElementsOf<C_PurchaseReqnItemNoteType>;
    readonly actions: globalThis.Record<never, never>;
};
export class C_PurchaseReqnItemNoteType extends _C_PurchaseReqnItemNoteTypeAspect(__.Entity) {
}
export class C_PurchaseReqnItemNoteTypes extends Array<C_PurchaseReqnItemNoteType> {
  $count?: number
}

// entity 'C_PurReqnAccountAssignment'
export declare function _C_PurReqnAccountAssignmentAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    PurchaseRequisition?: __.Key<string>
    PurchaseRequisitionItem?: __.Key<string>
    PurchaseReqnAcctAssgmtNumber?: __.Key<string>
    AssignedWBSElementExternalID_fc?: number | null
    BusinessArea_fc?: number | null
    ControllingArea_fc?: number | null
    CostCenter_fc?: number | null
    CostCtrActivityType_fc?: number | null
    CostObject_fc?: number | null
    CreationDate_fc?: number | null
    EarmarkedFundsDocument_fc?: number | null
    EarmarkedFundsDocumentItem_fc?: number | null
    ExtNetworkActivityForPurg_fc?: number | null
    FixedAsset_fc?: number | null
    FunctionalArea_fc?: number | null
    Fund_fc?: number | null
    FundsCenter_fc?: number | null
    GLAccount_fc?: number | null
    GoodsRecipientName_fc?: number | null
    GrantID_fc?: number | null
    JointVentureRecoveryCode_fc?: number | null
    MasterFixedAsset_fc?: number | null
    NetworkActivity_fc?: number | null
    NetworkActivityInternalID_fc?: number | null
    OrderID_fc?: number | null
    OrderIntBillOfOperationsItem_fc?: number | null
    OrderInternalID_fc?: number | null
    PartnerAccountNumber_fc?: number | null
    PrmtHbProfitabilitySegment_fc?: number | null
    ProfitCenter_fc?: number | null
    ProjectNetwork_fc?: number | null
    ProjectNetworkInternalID_fc?: number | null
    PurchaseReqnAcctAssgmtNumber_fc?: number | null
    PurReqnAcctAssgmtDistrPct_fc?: number | null
    Quantity_fc?: number | null
    SalesOrder_fc?: number | null
    SalesOrderItem_fc?: number | null
    SalesOrderScheduleLine_fc?: number | null
    ServiceDocID_fc?: number | null
    ServiceDocItemID_fc?: number | null
    ServiceDocumentType_fc?: number | null
    SettlementReferenceDate_fc?: number | null
    UnloadingPointName_fc?: number | null
    ValidityDate_fc?: number | null
    WBSElementExternalID_fc?: number | null
    CostCenter?: string | null
    MasterFixedAsset?: string | null
    MasterFixedAsset_Text?: string | null
    CompanyCode?: string | null
    GLAccount?: string | null
    PurReqnAcctAssgmtDistrPct?: number | null
    BaseUnit?: string | null
    ProjectNetwork?: string | null
    Quantity?: number | null
    UnitOfMeasure?: string | null
    ControllingArea?: string | null
    BusinessArea?: string | null
    BusinessArea_Text?: string | null
    SalesOrder?: string | null
    SalesOrderItem?: string | null
    SalesOrderScheduleLine?: string | null
    FixedAsset?: string | null
    OrderID?: string | null
    UnloadingPointName?: string | null
    CostObject?: string | null
    PrmtHbProfitabilitySegment?: string | null
    ProfitCenter?: string | null
    WBSElementInternalID?: string | null
    WBSElementExternalID?: string | null
    WBSDescription?: string | null
    ProjectNetworkInternalID?: string | null
    CommitmentItemShortID?: string | null
    FundsCenter?: string | null
    Fund?: string | null
    FunctionalArea?: string | null
    CreationDate?: __.CdsDate | null
    GoodsRecipientName?: string | null
    REIdentification?: string | null
    NetworkActivityInternalID?: string | null
    NetworkActivity?: string | null
    PartnerAccountNumber?: string | null
    JointVentureRecoveryCode?: string | null
    SettlementReferenceDate?: __.CdsDate | null
    OrderInternalID?: string | null
    OrderIntBillOfOperationsItem?: string | null
    EarmarkedFundsDocument?: string | null
    EarmarkedFundsDocumentItem?: string | null
    CostCtrActivityType?: string | null
    GrantID?: string | null
    ValidityDate?: __.CdsDate | null
    GrantName?: string | null
    ChartOfAccounts?: string | null
    BudgetPeriod?: string | null
    FundedProgram?: string | null
    ServiceDocID?: string | null
    ServiceDocItemID?: string | null
    ServiceDocumentType?: string | null
    AssignedWBSElementExternalID?: string | null
    ExtNetworkActivityForPurg?: string | null
    to_BudgetPeriodStdVH?: __.Association.to<I_BudgetPeriodStdVH> | null
    to_BudgetPeriodStdVH_BudgetPeriod?: string | null
    to_ControllingArea?: __.Association.to<I_ControllingArea> | null
    to_ControllingArea_ControllingArea?: string | null
    to_CostCenter?: __.Association.to<I_MM_CostCenterValueHelp> | null
    to_CostCenter_CostCenter?: string | null
    to_CostCenter_ControllingArea?: string | null
    to_CostCenter_ValidityEndDate?: __.CdsDate | null
    to_CostCenterActivityType?: __.Association.to<I_CostCenterActivityType> | null
    to_CostCenterActivityType_ID?: string | null
    to_FixedAsset?: __.Association.to<I_MM_FixedAssetValueHelp> | null
    to_FixedAsset_CompanyCode?: string | null
    to_FixedAsset_MasterFixedAsset?: string | null
    to_FixedAsset_FixedAsset?: string | null
    to_FndsMgmtFuncnlAreaStdVH?: __.Association.to<I_FndsMgmtFuncnlAreaStdVH> | null
    to_FndsMgmtFuncnlAreaStdVH_FunctionalArea?: string | null
    to_GLAccount?: __.Association.to<I_MM_GLAccountVH> | null
    to_GLAccount_GLAccount?: string | null
    to_GLAccount_CompanyCode?: string | null
    to_GrantStdVH?: __.Association.to<I_GrantStdVH> | null
    to_GrantStdVH_GrantID?: string | null
    to_MasterFixedAsset?: __.Association.to<I_MasterFixedAsset> | null
    to_MasterFixedAsset_CompanyCode?: string | null
    to_MasterFixedAsset_MasterFixedAsset?: string | null
    to_Order?: __.Association.to<I_MM_LogisticsOrderVH> | null
    to_Order_OrderID?: string | null
    to_ProfitCenter?: __.Association.to<I_MM_ProfitCenterValueHelp> | null
    to_ProfitCenter_ControllingArea?: string | null
    to_ProfitCenter_ProfitCenter?: string | null
    to_ProfitCenter_ValidityEndDate?: __.CdsDate | null
    to_ProjectNetwork?: __.Association.to<I_ProjectNetwork> | null
    to_ProjectNetwork_ProjectNetwork?: string | null
    to_Purchaserequisitionitem?: __.Association.to<I_Purchaserequisitionitem> | null
    to_Purchaserequisitionitem_PurchaseRequisition?: string | null
    to_Purchaserequisitionitem_PurchaseRequisitionItem?: string | null
    to_SalesDocumentScheduleLine?: __.Association.to<I_SalesDocumentScheduleLine> | null
    to_SalesDocumentScheduleLine_ID?: string | null
    to_SalesOrder?: __.Association.to<I_MM_SalesOrderValueHelp> | null
    to_SalesOrder_SalesOrder?: string | null
    to_SalesOrderItem?: __.Association.to<I_MM_SalesOrderItemVH> | null
    to_SalesOrderItem_SalesOrder?: string | null
    to_SalesOrderItem_SalesOrderItem?: string | null
    to_WBSElement?: __.Association.to<I_WBSElementBasicData> | null
    to_WBSElement_WBSElementInternalID?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<C_PurReqnAccountAssignment>;
    readonly elements: __.ElementsOf<C_PurReqnAccountAssignment>;
    readonly actions: globalThis.Record<never, never>;
};
export class C_PurReqnAccountAssignment extends _C_PurReqnAccountAssignmentAspect(__.Entity) {
}
export class C_PurReqnAccountAssignment_ extends Array<C_PurReqnAccountAssignment> {
  $count?: number
}

// entity 'C_PurReqnFactSheetHeaderText'
export declare function _C_PurReqnFactSheetHeaderTextAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    Language?: __.Key<string>
    DocumentText?: __.Key<string>
    TechnicalObjectType?: __.Key<string>
    ArchObjectNumber?: __.Key<string>
    DraftUUID?: __.Key<string>
    IsActiveEntity?: __.Key<boolean>
    PurchaseRequisition?: string | null
    NoteDescription?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<C_PurReqnFactSheetHeaderText>;
    readonly elements: __.ElementsOf<C_PurReqnFactSheetHeaderText>;
    readonly actions: globalThis.Record<never, never>;
};
export class C_PurReqnFactSheetHeaderText extends _C_PurReqnFactSheetHeaderTextAspect(__.Entity) {
}
export class C_PurReqnFactSheetHeaderText_ extends Array<C_PurReqnFactSheetHeaderText> {
  $count?: number
}

// entity 'C_PurReqnFactSheetItemNote'
export declare function _C_PurReqnFactSheetItemNoteAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    Language?: __.Key<string>
    DocumentText?: __.Key<string>
    TechnicalObjectType?: __.Key<string>
    ArchObjectNumber?: __.Key<string>
    DraftUUID?: __.Key<string>
    IsActiveEntity?: __.Key<boolean>
    PurchaseRequisition?: string | null
    NoteDescription?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<C_PurReqnFactSheetItemNote>;
    readonly elements: __.ElementsOf<C_PurReqnFactSheetItemNote>;
    readonly actions: globalThis.Record<never, never>;
};
export class C_PurReqnFactSheetItemNote extends _C_PurReqnFactSheetItemNoteAspect(__.Entity) {
}
export class C_PurReqnFactSheetItemNotes extends Array<C_PurReqnFactSheetItemNote> {
  $count?: number
}

// entity 'C_PurReqnItemHierFactSheet'
export declare function _C_PurReqnItemHierFactSheetAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    PurchaseRequisition?: __.Key<string>
    PurchaseRequisitionItem?: __.Key<string>
    PurchasingParentItem?: string | null
    PurgConfigurableItemNumber?: string | null
    PurchaseRequisitionItemText?: string | null
    MaterialName?: string | null
    Material?: string | null
    MaterialGroup?: string | null
    MaterialGroupName?: string | null
    PurchaseRequisitionType?: string | null
    PurchasingDocumentTypeName?: string | null
    PurchasingDocumentItemCategory?: string | null
    PurgDocItemCategoryName?: string | null
    PurchaseRequisitionPrice?: number | null
    ItemNetAmount?: number | null
    PurReqnPriceQuantity?: number | null
    PurReqnItemCurrency?: string | null
    PurReqnReleaseStatus?: string | null
    ExternalApprovalStatus?: string | null
    ExternalApprovalStatusText?: string | null
    PurReqnReleaseStatusName?: string | null
    ProcessingStatus?: string | null
    ProcessingStatusName?: string | null
    RequestedQuantity?: number | null
    BaseUnit?: string | null
    FormattedPurRequisitionItem?: string | null
    PurchasingGroup?: string | null
    PurchasingOrganization?: string | null
    PlainLongText?: string | null
    DeliveryAddressID?: string | null
    FixedSupplier?: string | null
    Plant?: string | null
    StorageLocation?: string | null
    PurchasingDocument?: string | null
    Supplier?: string | null
    IsDeleted?: boolean | null
    CreatedByUser?: string | null
    PurReqnSSPRequestor?: string | null
    PurReqnRequestorFullName?: string | null
    PurReqnRequestor?: string | null
    RequisitionerName?: string | null
    UserFullName?: string | null
    DeliveryDate?: __.CdsDate | null
    IsPurReqnOvrlRel?: boolean | null
    PurReqCreationDate?: __.CdsDate | null
    CreatedByUserFullName?: string | null
    ExpectedOverallLimitAmount?: number | null
    OverallLimitAmount?: number | null
    PurchaseRequisitionReleaseDate?: __.CdsDate | null
    PerformancePeriodStartDate?: __.CdsDate | null
    PerformancePeriodEndDate?: __.CdsDate | null
    IsOnBehalfCart?: boolean | null
    WorkflowScenarioDefinition?: string | null
    PurgHasFlxblWorkflowApproval?: boolean | null
    IsOutline?: boolean | null
    HierarchyNode?: string | null
    HierarchyParentNode?: string | null
    HierarchyLevel?: number | null
    HierarchyNodeSubTreeSize?: number | null
    HierarchyDrillState?: string | null
    HierarchyNodeOrdinalNumber?: number | null
    HasRestrictedVisibility?: number | null
    PurReqnHasDelegateApproval?: boolean | null
    PFMTransDataFootprintUUID?: string | null
    PFMFootprintQuantity?: number | null
    PFMFootprintUnit?: string | null
    to_PurReqnAccountAssignment?: __.Association.to.many<C_PurReqnAccountAssignment_>
    to_PurReqnItemSourceOfSupply?: __.Association.to<C_PurReqnItemSourceOfSupply> | null
    to_PurReqnItemSourceOfSupply_PurchaseRequisition?: string | null
    to_PurReqnItemSourceOfSupply_PurchaseRequisitionItem?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<C_PurReqnItemHierFactSheet>;
    readonly elements: __.ElementsOf<C_PurReqnItemHierFactSheet>;
    readonly actions: globalThis.Record<never, never>;
};
export class C_PurReqnItemHierFactSheet extends _C_PurReqnItemHierFactSheetAspect(__.Entity) {
}
export class C_PurReqnItemHierFactSheet_ extends Array<C_PurReqnItemHierFactSheet> {
  $count?: number
}

// entity 'C_PurReqnItemSourceOfSupply'
export declare function _C_PurReqnItemSourceOfSupplyAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    PurchaseRequisition?: __.Key<string>
    PurchaseRequisitionItem?: __.Key<string>
    PurchaseRequisitionType?: string | null
    Plant?: string | null
    PurchasingGroup?: string | null
    PurchasingOrganization?: string | null
    PreferredSupplier?: string | null
    ExtDesiredSupplierForPurg?: string | null
    ExternalPreferredSupplierName?: string | null
    PreferredSupplierName?: string | null
    SupplierName?: string | null
    FixedSupplier?: string | null
    ExtFixedSupplierForPurg?: string | null
    ExternalSupplierName?: string | null
    PurchaseOutlineAgreement?: string | null
    PurchasingInfoRecord?: string | null
    ProcurementHubSourceSystem?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<C_PurReqnItemSourceOfSupply>;
    readonly elements: __.ElementsOf<C_PurReqnItemSourceOfSupply>;
    readonly actions: globalThis.Record<never, never>;
};
export class C_PurReqnItemSourceOfSupply extends _C_PurReqnItemSourceOfSupplyAspect(__.Entity) {
}
export class C_PurReqnItemSourceOfSupply_ extends Array<C_PurReqnItemSourceOfSupply> {
  $count?: number
}

// entity 'C_PurReqnLimitItemFactSheet'
export declare function _C_PurReqnLimitItemFactSheetAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    PurchaseRequisition?: __.Key<string>
    PurchaseRequisitionItem?: __.Key<string>
    ProcmtHubPurReqnItmIsChanged?: boolean | null
    PurchaseRequisitionItemText?: string | null
    Material?: string | null
    Material_Text?: string | null
    ExtMaterialForPurg?: string | null
    MaterialGroup?: string | null
    MaterialGroup_Text?: string | null
    PurchaseRequisitionType?: string | null
    PurchaseRequisitionType_Text?: string | null
    PurchasingDocumentItemCategory?: string | null
    PurgDocItemCategoryName?: string | null
    PurReqnItemCurrency?: string | null
    PurReqnReleaseStatus?: string | null
    PurReqnReleaseStatus_Text?: string | null
    ExternalApprovalStatus?: string | null
    ExternalApprovalStatus_Text?: string | null
    ProcessingStatus?: string | null
    ProcessingStatus_Text?: string | null
    ProcessingStatusName?: string | null
    FormattedPurRequisitionItem?: string | null
    PurchasingGroup?: string | null
    PurchasingOrganization?: string | null
    PlainLongText?: string | null
    AddressID?: string | null
    FixedSupplier?: string | null
    ExtFixedSupplierForPurg?: string | null
    Plant?: string | null
    StorageLocation?: string | null
    PurchasingDocument?: string | null
    Supplier?: string | null
    ExtDesiredSupplierForPurg?: string | null
    IsDeleted?: boolean | null
    CreatedByUser?: string | null
    PurReqnSSPRequestor?: string | null
    PurReqnRequestorFullName?: string | null
    PurReqnRequestor?: string | null
    RequisitionerName?: string | null
    UserFullName?: string | null
    ContactCardNavLinkSemanticObj?: string | null
    ContactCardNavLinkQueryPart?: string | null
    DeliveryDate?: __.CdsDate | null
    PurReqnItmConfidenceLevelDesc?: string | null
    UtilsMchnLrngRelConfidenceVal?: string | null
    PurReqnApprvlRank1FeatureDesc?: string | null
    PurReqnApprvlRank1Feature?: string | null
    PurReqnApprvlRank1FeatureValue?: string | null
    PurReqnApprvlRank2FeatureDesc?: string | null
    PurReqnApprvlRank2Feature?: string | null
    PurReqnApprvlRank2FeatureValue?: string | null
    PurReqnApprvlRank3FeatureDesc?: string | null
    PurReqnApprvlRank3Feature?: string | null
    PurReqnApprvlRank3FeatureValue?: string | null
    PurReqnApprvlRank4FeatureDesc?: string | null
    PurReqnApprvlRank4Feature?: string | null
    PurReqnApprvlRank4FeatureValue?: string | null
    PurReqnApprvlRank5FeatureDesc?: string | null
    PurReqnApprvlRank5Feature?: string | null
    PurReqnApprvlRank5FeatureValue?: string | null
    IsPurReqnOvrlRel?: boolean | null
    ProcurementHubSourceSystem?: string | null
    PurReqCreationDate?: __.CdsDate | null
    CreatedByUserFullName?: string | null
    WorkflowTaskInternalID?: string | null
    ExpectedOverallLimitAmount?: number | null
    PerformancePeriodStartDate?: __.CdsDate | null
    PerformancePeriodEndDate?: __.CdsDate | null
    OverallLimitAmount?: number | null
    PurchaseRequisitionReleaseDate?: __.CdsDate | null
    IsOnBehalfCart?: boolean | null
    WorkflowScenarioDefinition?: string | null
    PurgHasFlxblWorkflowApproval?: boolean | null
    PurReqnHasDelegateApproval?: boolean | null
    to_ProcmtHubPurReqnItmChgs?: __.Association.to.many<C_ProcmtHubPurReqnItmChgs>
    to_PurReqnAccountAssignment?: __.Association.to.many<C_PurReqnAccountAssignment_>
    to_PurReqnItemSourceOfSupply?: __.Association.to<C_PurReqnItemSourceOfSupply> | null
    to_PurReqnItemSourceOfSupply_PurchaseRequisition?: string | null
    to_PurReqnItemSourceOfSupply_PurchaseRequisitionItem?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<C_PurReqnLimitItemFactSheet>;
    readonly elements: __.ElementsOf<C_PurReqnLimitItemFactSheet>;
    readonly actions: globalThis.Record<never, never>;
};
export class C_PurReqnLimitItemFactSheet extends _C_PurReqnLimitItemFactSheetAspect(__.Entity) {
}
export class C_PurReqnLimitItemFactSheet_ extends Array<C_PurReqnLimitItemFactSheet> {
  $count?: number
}

// entity 'C_PurRequisitionF'
export declare function _C_PurRequisitionFAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    PurchaseRequisition?: __.Key<string>
    PurchaseRequisitionText?: string | null
    PurReqnRequestor?: string | null
    UserFullName?: string | null
    ContactCardNavLinkQueryPart?: string | null
    PurReqCreationDate?: __.CdsDate | null
    NumberOfItems?: number | null
    PurchaseRequisitionType?: string | null
    TotalNetAmount?: number | null
    DisplayCurrency?: string | null
    PurReqnHdrCurrencySourceDesc?: string | null
    WorkflowTaskInternalID?: string | null
    IsPurReqnOvrlRel?: boolean | null
    IsOnBehalfCart?: boolean | null
    CreatedByUser?: string | null
    ProcurementHubSourceSystem?: string | null
    WorkflowScenarioDefinition?: string | null
    PurgHasFlxblWorkflowApproval?: boolean | null
    PurchasingItemHasHierarchy?: boolean | null
    PurReqnIsLimitItemSupported?: boolean | null
    PurReqnIsStandardItemSupported?: boolean | null
    PurReqnHasDelegateApproval?: boolean | null
    CntrlReqnIsRpldBfrApprvl?: boolean | null
    CntrlReqnApprvlStsInRpldReqn?: string | null
    to_PurRequisitionItemFs?: __.Association.to.many<C_PurRequisitionItemFs>
    to_PurRequisitionItemHierFs?: __.Association.to.many<C_PurReqnItemHierFactSheet_>
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<C_PurRequisitionF>;
    readonly elements: __.ElementsOf<C_PurRequisitionF>;
    readonly actions: globalThis.Record<never, never>;
};
export class C_PurRequisitionF extends _C_PurRequisitionFAspect(__.Entity) {
}
export class C_PurRequisitionFs extends Array<C_PurRequisitionF> {
  $count?: number
}

// entity 'C_PurRequisitionItemF'
export declare function _C_PurRequisitionItemFAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    PurchaseRequisition?: __.Key<string>
    PurchaseRequisitionItem?: __.Key<string>
    ProcmtHubPurReqnItmIsChanged?: boolean | null
    PurchaseRequisitionItemText?: string | null
    Material?: string | null
    Material_Text?: string | null
    ExtMaterialForPurg?: string | null
    MaterialGroup?: string | null
    MaterialGroup_Text?: string | null
    PurchaseRequisitionType?: string | null
    PurchaseRequisitionType_Text?: string | null
    PurchasingDocumentItemCategory?: string | null
    PurgDocItemCategoryName?: string | null
    PurchaseRequisitionPrice?: number | null
    PurReqnItemTotalAmount?: number | null
    PurReqnPriceQuantity?: number | null
    PurReqnItemCurrency?: string | null
    PurReqnReleaseStatus?: string | null
    PurReqnReleaseStatus_Text?: string | null
    ExternalApprovalStatus?: string | null
    ExternalApprovalStatus_Text?: string | null
    PurchaseReqnItemUniqueID?: string | null
    ProcessingStatus?: string | null
    ProcessingStatus_Text?: string | null
    ProcessingStatusName?: string | null
    PFMTransDataFootprintUUID?: string | null
    PFMFootprintQuantity?: number | null
    PFMFootprintUnit?: string | null
    RequestedQuantity?: number | null
    BaseUnit?: string | null
    FormattedPurRequisitionItem?: string | null
    PurchasingGroup?: string | null
    PurchasingOrganization?: string | null
    PlainLongText?: string | null
    AddressID?: string | null
    FixedSupplier?: string | null
    ExtFixedSupplierForPurg?: string | null
    Plant?: string | null
    StorageLocation?: string | null
    PurchasingDocument?: string | null
    Supplier?: string | null
    ExtDesiredSupplierForPurg?: string | null
    IsDeleted?: boolean | null
    CreatedByUser?: string | null
    PurReqnSSPRequestor?: string | null
    PurReqnRequestorFullName?: string | null
    PurReqnRequestor?: string | null
    RequisitionerName?: string | null
    UserFullName?: string | null
    DeliveryDate?: __.CdsDate | null
    PurReqnItmConfidenceLevelDesc?: string | null
    UtilsMchnLrngRelConfidenceVal?: string | null
    PurReqnApprvlRank1FeatureDesc?: string | null
    PurReqnApprvlRank1Feature?: string | null
    PurReqnApprvlRank1FeatureValue?: string | null
    PurReqnApprvlRank2FeatureDesc?: string | null
    PurReqnApprvlRank2Feature?: string | null
    PurReqnApprvlRank2FeatureValue?: string | null
    PurReqnApprvlRank3FeatureDesc?: string | null
    PurReqnApprvlRank3Feature?: string | null
    PurReqnApprvlRank3FeatureValue?: string | null
    PurReqnApprvlRank4FeatureDesc?: string | null
    PurReqnApprvlRank4Feature?: string | null
    PurReqnApprvlRank4FeatureValue?: string | null
    PurReqnApprvlRank5FeatureDesc?: string | null
    PurReqnApprvlRank5Feature?: string | null
    PurReqnApprvlRank5FeatureValue?: string | null
    IsPurReqnOvrlRel?: boolean | null
    ProcurementHubSourceSystem?: string | null
    PurReqCreationDate?: __.CdsDate | null
    CreatedByUserFullName?: string | null
    WorkflowTaskInternalID?: string | null
    ExpectedOverallLimitAmount?: number | null
    OverallLimitAmount?: number | null
    PurchaseRequisitionReleaseDate?: __.CdsDate | null
    PerformancePeriodStartDate?: __.CdsDate | null
    PerformancePeriodEndDate?: __.CdsDate | null
    IsOnBehalfCart?: boolean | null
    WorkflowScenarioDefinition?: string | null
    PurgHasFlxblWorkflowApproval?: boolean | null
    IsOutline?: boolean | null
    HasRestrictedVisibility?: number | null
    PurgConfigurableItemNumber?: string | null
    PurReqnHasDelegateApproval?: boolean | null
    CntrlReqnIsRpldBfrApprvl?: boolean | null
    CntrlReqnApprvlStsInRpldReqn?: string | null
    StockSegment?: string | null
    to_ProcmtHubPurReqnItmChgs?: __.Association.to.many<C_ProcmtHubPurReqnItmChgs>
    to_PurReqnAccountAssignment?: __.Association.to.many<C_PurReqnAccountAssignment_>
    to_PurReqnItemSourceOfSupply?: __.Association.to<C_PurReqnItemSourceOfSupply> | null
    to_PurReqnItemSourceOfSupply_PurchaseRequisition?: string | null
    to_PurReqnItemSourceOfSupply_PurchaseRequisitionItem?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<C_PurRequisitionItemF>;
    readonly elements: __.ElementsOf<C_PurRequisitionItemF>;
    readonly actions: globalThis.Record<never, never>;
};
export class C_PurRequisitionItemF extends _C_PurRequisitionItemFAspect(__.Entity) {
}
export class C_PurRequisitionItemFs extends Array<C_PurRequisitionItemF> {
  $count?: number
}

// entity 'I_BudgetPeriodStdVH'
export declare function _I_BudgetPeriodStdVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    BudgetPeriod?: __.Key<string>
    BudgetPeriodName?: string | null
    ValidityStartDate?: __.CdsDate | null
    ValidityEndDate?: __.CdsDate | null
    BudgetPeriodExpirationDate?: __.CdsDate | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_BudgetPeriodStdVH>;
    readonly elements: __.ElementsOf<I_BudgetPeriodStdVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_BudgetPeriodStdVH extends _I_BudgetPeriodStdVHAspect(__.Entity) {
}
export class I_BudgetPeriodStdVH_ extends Array<I_BudgetPeriodStdVH> {
  $count?: number
}

// entity 'I_BusinessArea'
export declare function _I_BusinessAreaAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    BusinessArea?: __.Key<string>
    BusinessArea_Text?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_BusinessArea>;
    readonly elements: __.ElementsOf<I_BusinessArea>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_BusinessArea extends _I_BusinessAreaAspect(__.Entity) {
}
export class I_BusinessArea_ extends Array<I_BusinessArea> {
  $count?: number
}

// entity 'I_BusinessAreaStdVH'
export declare function _I_BusinessAreaStdVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    BusinessArea?: __.Key<string>
    BusinessArea_Text?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_BusinessAreaStdVH>;
    readonly elements: __.ElementsOf<I_BusinessAreaStdVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_BusinessAreaStdVH extends _I_BusinessAreaStdVHAspect(__.Entity) {
}
export class I_BusinessAreaStdVH_ extends Array<I_BusinessAreaStdVH> {
  $count?: number
}

// entity 'I_ChartOfAccountsStdVH'
export declare function _I_ChartOfAccountsStdVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    ChartOfAccounts?: __.Key<string>
    ChartOfAccounts_Text?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_ChartOfAccountsStdVH>;
    readonly elements: __.ElementsOf<I_ChartOfAccountsStdVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_ChartOfAccountsStdVH extends _I_ChartOfAccountsStdVHAspect(__.Entity) {
}
export class I_ChartOfAccountsStdVH_ extends Array<I_ChartOfAccountsStdVH> {
  $count?: number
}

// entity 'I_CompanyCodeStdVH'
export declare function _I_CompanyCodeStdVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    CompanyCode?: __.Key<string>
    CompanyCodeName?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_CompanyCodeStdVH>;
    readonly elements: __.ElementsOf<I_CompanyCodeStdVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_CompanyCodeStdVH extends _I_CompanyCodeStdVHAspect(__.Entity) {
}
export class I_CompanyCodeStdVH_ extends Array<I_CompanyCodeStdVH> {
  $count?: number
}

// entity 'I_ControllingArea'
export declare function _I_ControllingAreaAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    ControllingArea?: __.Key<string>
    FiscalYearVariant?: string | null
    ControllingAreaName?: string | null
    ControllingAreaCurrency?: string | null
    ChartOfAccounts?: string | null
    ChartOfAccounts_Text?: string | null
    CostCenterStandardHierarchy?: string | null
    OperatingConcern?: string | null
    ProfitCenterStandardHierarchy?: string | null
    BusinessProcessStandardHier?: string | null
    CreditDownPaymentDefaultGLAcct?: string | null
    DebitDownPaymentDefaultGLAcct?: string | null
    ControllingAreaCurrencyRole?: string | null
    FinancialManagementArea?: string | null
    ControllingAreaResponsibleUser?: string | null
    DefaultProfitCenter?: string | null
    CtrlgStdFinStatementVersion?: string | null
    CtrlgStdFinStatementVersion_Text?: string | null
    ProfitCenterAccountingCurrency?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_ControllingArea>;
    readonly elements: __.ElementsOf<I_ControllingArea>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_ControllingArea extends _I_ControllingAreaAspect(__.Entity) {
}
export class I_ControllingArea_ extends Array<I_ControllingArea> {
  $count?: number
}

// entity 'I_ControllingAreaStdVH'
export declare function _I_ControllingAreaStdVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    ControllingArea?: __.Key<string>
    ControllingAreaName?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_ControllingAreaStdVH>;
    readonly elements: __.ElementsOf<I_ControllingAreaStdVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_ControllingAreaStdVH extends _I_ControllingAreaStdVHAspect(__.Entity) {
}
export class I_ControllingAreaStdVH_ extends Array<I_ControllingAreaStdVH> {
  $count?: number
}

// entity 'I_CostCenterActivityType'
export declare function _I_CostCenterActivityTypeAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    ID?: __.Key<string>
    ControllingArea?: string | null
    ControllingArea_Text?: string | null
    CostCtrActivityType?: string | null
    CostCtrActivityType_Text?: string | null
    ValidityEndDate?: __.CdsDate | null
    ValidityStartDate?: __.CdsDate | null
    CostCtrActivityTypeQtyUnit?: string | null
    CostCtrActivityTypeCategory?: string | null
    AllocationCostElement?: string | null
    CostCtrActivityTypeOutpQtyUnit?: string | null
    CreationDate?: __.CdsDate | null
    EnteredByUser?: string | null
    CostOriginGroup?: string | null
    ActlPostgCostCenterActyTypeCat?: string | null
    OutputQuantityFactor?: number | null
    ActivityTypeIsBlocked?: string | null
    FixedCostIsPredistributed?: boolean | null
    PriceAllocationMethod?: string | null
    PeriodPriceIsAverage?: boolean | null
    ActualPriceAllocationMethod?: string | null
    ActualQuantityIsSetManually?: boolean | null
    PlanQuantityIsSetManually?: boolean | null
    CostCtrActivityTypeValidCat?: string | null
    CostCtrActyTypeIsCtrlgRlvtComp?: string | null
    CostCtrActyTypeIsHumRsceRlvt?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_CostCenterActivityType>;
    readonly elements: __.ElementsOf<I_CostCenterActivityType>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_CostCenterActivityType extends _I_CostCenterActivityTypeAspect(__.Entity) {
}
export class I_CostCenterActivityType_ extends Array<I_CostCenterActivityType> {
  $count?: number
}

// entity 'I_CostCenterActivityTypeText'
export declare function _I_CostCenterActivityTypeTextAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    ControllingArea?: __.Key<string>
    CostCtrActivityType?: __.Key<string>
    Language?: __.Key<string>
    ValidityEndDate?: __.CdsDate | null
    ControllingArea_Text?: string | null
    CostCtrActivityTypeName?: string | null
    CostCtrActivityTypeDesc?: string | null
    ValidityStartDate?: __.CdsDate | null
    CostCtrActyTypeTxtSearchTerm?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_CostCenterActivityTypeText>;
    readonly elements: __.ElementsOf<I_CostCenterActivityTypeText>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_CostCenterActivityTypeText extends _I_CostCenterActivityTypeTextAspect(__.Entity) {
}
export class I_CostCenterActivityTypeText_ extends Array<I_CostCenterActivityTypeText> {
  $count?: number
}

// entity 'I_CostCenterStdVH'
export declare function _I_CostCenterStdVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    ControllingArea?: __.Key<string>
    CostCenter?: __.Key<string>
    ValidityEndDate?: __.Key<__.CdsDate>
    CostCenter_Text?: string | null
    ValidityStartDate?: __.CdsDate | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_CostCenterStdVH>;
    readonly elements: __.ElementsOf<I_CostCenterStdVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_CostCenterStdVH extends _I_CostCenterStdVHAspect(__.Entity) {
}
export class I_CostCenterStdVH_ extends Array<I_CostCenterStdVH> {
  $count?: number
}

// entity 'I_EmrkdFndsDocumentItemMMVH'
export declare function _I_EmrkdFndsDocumentItemMMVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    ID?: __.Key<string>
    EarmarkedFundsDocument?: string | null
    EarmarkedFundsDocumentItem?: string | null
    EarmarkedFundsDocumentType?: string | null
    CompanyCode?: string | null
    TransactionCurrency?: string | null
    PostingDate?: __.CdsDate | null
    DocumentItemText?: string | null
    ControllingArea?: string | null
    GLAccount?: string | null
    CostCenter?: string | null
    WBSElementExternalID?: string | null
    ProjectNetwork?: string | null
    FinancialManagementArea?: string | null
    Fund?: string | null
    BudgetPeriod?: string | null
    FunctionalArea?: string | null
    GrantID?: string | null
    BusinessArea?: string | null
    EmrkdFndsOpenAmtInTransCrcy?: number | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_EmrkdFndsDocumentItemMMVH>;
    readonly elements: __.ElementsOf<I_EmrkdFndsDocumentItemMMVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_EmrkdFndsDocumentItemMMVH extends _I_EmrkdFndsDocumentItemMMVHAspect(__.Entity) {
}
export class I_EmrkdFndsDocumentItemMMVH_ extends Array<I_EmrkdFndsDocumentItemMMVH> {
  $count?: number
}

// entity 'I_EmrkdFndsDocumentItemStdVH'
export declare function _I_EmrkdFndsDocumentItemStdVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    ID?: __.Key<string>
    EarmarkedFundsDocument?: string | null
    EarmarkedFundsDocumentItem?: string | null
    EarmarkedFundsDocumentCategory?: string | null
    EarmarkedFundsDocumentType?: string | null
    CompanyCode?: string | null
    TransactionCurrency?: string | null
    EarmarkedFundsDocEntryStatus?: string | null
    PostingDate?: __.CdsDate | null
    EmrkdFndsDocItmCreatedByUser?: string | null
    EmrkdFndsDocItmCreationDate?: __.CdsDate | null
    EmrkdFndsDocItmLastChgdByUsr?: string | null
    EmrkdFndsDocItmLastChangeDate?: __.CdsDate | null
    DocumentItemText?: string | null
    DueDate?: __.CdsDate | null
    ControllingArea?: string | null
    GLAccount?: string | null
    CostCenter?: string | null
    WBSElementExternalID?: string | null
    ProjectNetwork?: string | null
    FinancialManagementArea?: string | null
    Fund?: string | null
    BudgetPeriod?: string | null
    FunctionalArea?: string | null
    GrantID?: string | null
    BusinessArea?: string | null
    Supplier?: string | null
    Customer?: string | null
    EmrkdFndsItmIsCompleted?: boolean | null
    EmrkdFndsItmIsBlkdAgainstUsage?: boolean | null
    EmrkdFndsOpenAmtInTransCrcy?: number | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_EmrkdFndsDocumentItemStdVH>;
    readonly elements: __.ElementsOf<I_EmrkdFndsDocumentItemStdVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_EmrkdFndsDocumentItemStdVH extends _I_EmrkdFndsDocumentItemStdVHAspect(__.Entity) {
}
export class I_EmrkdFndsDocumentItemStdVH_ extends Array<I_EmrkdFndsDocumentItemStdVH> {
  $count?: number
}

// entity 'I_FndsMgmtFuncnlAreaStdVH'
export declare function _I_FndsMgmtFuncnlAreaStdVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    FunctionalArea?: __.Key<string>
    FunctionalArea_Text?: string | null
    FunctionalAreaName?: string | null
    ValidityEndDate?: __.CdsDate | null
    ValidityStartDate?: __.CdsDate | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_FndsMgmtFuncnlAreaStdVH>;
    readonly elements: __.ElementsOf<I_FndsMgmtFuncnlAreaStdVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_FndsMgmtFuncnlAreaStdVH extends _I_FndsMgmtFuncnlAreaStdVHAspect(__.Entity) {
}
export class I_FndsMgmtFuncnlAreaStdVH_ extends Array<I_FndsMgmtFuncnlAreaStdVH> {
  $count?: number
}

// entity 'I_GrantStdVH'
export declare function _I_GrantStdVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    GrantID?: __.Key<string>
    GrantName?: string | null
    GranteeMgmtSponsor?: string | null
    BusinessPartnerName?: string | null
    ValidityStartDate?: __.CdsDate | null
    ValidityEndDate?: __.CdsDate | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_GrantStdVH>;
    readonly elements: __.ElementsOf<I_GrantStdVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_GrantStdVH extends _I_GrantStdVHAspect(__.Entity) {
}
export class I_GrantStdVH_ extends Array<I_GrantStdVH> {
  $count?: number
}

// entity 'I_MasterFixedAsset'
export declare function _I_MasterFixedAssetAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    CompanyCode?: __.Key<string>
    MasterFixedAsset?: __.Key<string>
    MasterFixedAssetDescription?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_MasterFixedAsset>;
    readonly elements: __.ElementsOf<I_MasterFixedAsset>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_MasterFixedAsset extends _I_MasterFixedAssetAspect(__.Entity) {
}
export class I_MasterFixedAsset_ extends Array<I_MasterFixedAsset> {
  $count?: number
}

// entity 'I_MaterialGroupText'
export declare function _I_MaterialGroupTextAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    MaterialGroup?: __.Key<string>
    Language?: __.Key<string>
    MaterialGroupName?: string | null
    MaterialGroupText?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_MaterialGroupText>;
    readonly elements: __.ElementsOf<I_MaterialGroupText>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_MaterialGroupText extends _I_MaterialGroupTextAspect(__.Entity) {
}
export class I_MaterialGroupText_ extends Array<I_MaterialGroupText> {
  $count?: number
}

// entity 'I_MaterialStdVH'
export declare function _I_MaterialStdVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    Material?: __.Key<string>
    Material_Text?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_MaterialStdVH>;
    readonly elements: __.ElementsOf<I_MaterialStdVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_MaterialStdVH extends _I_MaterialStdVHAspect(__.Entity) {
}
export class I_MaterialStdVH_ extends Array<I_MaterialStdVH> {
  $count?: number
}

// entity 'I_MM_CostCenterValueHelp'
export declare function _I_MM_CostCenterValueHelpAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    CostCenter?: __.Key<string>
    ControllingArea?: __.Key<string>
    ValidityEndDate?: __.Key<__.CdsDate>
    CostCenter_Text?: string | null
    CompanyCode?: string | null
    CostCtrResponsiblePersonName?: string | null
    ValidityStartDate?: __.CdsDate | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_MM_CostCenterValueHelp>;
    readonly elements: __.ElementsOf<I_MM_CostCenterValueHelp>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_MM_CostCenterValueHelp extends _I_MM_CostCenterValueHelpAspect(__.Entity) {
}
export class I_MM_CostCenterValueHelp_ extends Array<I_MM_CostCenterValueHelp> {
  $count?: number
}

// entity 'I_MM_FixedAssetValueHelp'
export declare function _I_MM_FixedAssetValueHelpAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    CompanyCode?: __.Key<string>
    MasterFixedAsset?: __.Key<string>
    FixedAsset?: __.Key<string>
    FixedAssetDescription?: string | null
    AssetClass?: string | null
    AssetCapitalizationDate?: __.CdsDate | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_MM_FixedAssetValueHelp>;
    readonly elements: __.ElementsOf<I_MM_FixedAssetValueHelp>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_MM_FixedAssetValueHelp extends _I_MM_FixedAssetValueHelpAspect(__.Entity) {
}
export class I_MM_FixedAssetValueHelp_ extends Array<I_MM_FixedAssetValueHelp> {
  $count?: number
}

// entity 'I_MM_GLAccountVH'
export declare function _I_MM_GLAccountVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    GLAccount?: __.Key<string>
    CompanyCode?: __.Key<string>
    GLAccount_Text?: string | null
    ChartOfAccounts?: string | null
    GLAccountLongName?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_MM_GLAccountVH>;
    readonly elements: __.ElementsOf<I_MM_GLAccountVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_MM_GLAccountVH extends _I_MM_GLAccountVHAspect(__.Entity) {
}
export class I_MM_GLAccountVH_ extends Array<I_MM_GLAccountVH> {
  $count?: number
}

// entity 'I_MM_LogisticsOrderVH'
export declare function _I_MM_LogisticsOrderVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    OrderID?: __.Key<string>
    OrderDescription?: string | null
    OrderType?: string | null
    ControllingArea?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_MM_LogisticsOrderVH>;
    readonly elements: __.ElementsOf<I_MM_LogisticsOrderVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_MM_LogisticsOrderVH extends _I_MM_LogisticsOrderVHAspect(__.Entity) {
}
export class I_MM_LogisticsOrderVH_ extends Array<I_MM_LogisticsOrderVH> {
  $count?: number
}

// entity 'I_MM_ProfitCenterValueHelp'
export declare function _I_MM_ProfitCenterValueHelpAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    ControllingArea?: __.Key<string>
    ProfitCenter?: __.Key<string>
    ValidityEndDate?: __.Key<__.CdsDate>
    ProfitCenter_Text?: string | null
    ProfitCtrResponsiblePersonName?: string | null
    ProfitCtrResponsibleUser?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_MM_ProfitCenterValueHelp>;
    readonly elements: __.ElementsOf<I_MM_ProfitCenterValueHelp>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_MM_ProfitCenterValueHelp extends _I_MM_ProfitCenterValueHelpAspect(__.Entity) {
}
export class I_MM_ProfitCenterValueHelp_ extends Array<I_MM_ProfitCenterValueHelp> {
  $count?: number
}

// entity 'I_MM_SalesOrderItemVH'
export declare function _I_MM_SalesOrderItemVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    SalesOrder?: __.Key<string>
    SalesOrderItem?: __.Key<string>
    SalesOrderItemText?: string | null
    Material?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_MM_SalesOrderItemVH>;
    readonly elements: __.ElementsOf<I_MM_SalesOrderItemVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_MM_SalesOrderItemVH extends _I_MM_SalesOrderItemVHAspect(__.Entity) {
}
export class I_MM_SalesOrderItemVH_ extends Array<I_MM_SalesOrderItemVH> {
  $count?: number
}

// entity 'I_MM_SalesOrderValueHelp'
export declare function _I_MM_SalesOrderValueHelpAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    SalesOrder?: __.Key<string>
    CreatedByUser?: string | null
    ValidityStartDate?: __.CdsDate | null
    ValidityEndDate?: __.CdsDate | null
    SalesOrganization?: string | null
    SalesDocumentType?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_MM_SalesOrderValueHelp>;
    readonly elements: __.ElementsOf<I_MM_SalesOrderValueHelp>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_MM_SalesOrderValueHelp extends _I_MM_SalesOrderValueHelpAspect(__.Entity) {
}
export class I_MM_SalesOrderValueHelp_ extends Array<I_MM_SalesOrderValueHelp> {
  $count?: number
}

// entity 'I_MM_WBSElementByIntKeyVH'
export declare function _I_MM_WBSElementByIntKeyVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    WBSElementInternalID?: __.Key<string>
    WBSElement?: string | null
    WBSDescription?: string | null
    ProjectExternalID?: string | null
    Project?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_MM_WBSElementByIntKeyVH>;
    readonly elements: __.ElementsOf<I_MM_WBSElementByIntKeyVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_MM_WBSElementByIntKeyVH extends _I_MM_WBSElementByIntKeyVHAspect(__.Entity) {
}
export class I_MM_WBSElementByIntKeyVH_ extends Array<I_MM_WBSElementByIntKeyVH> {
  $count?: number
}

// entity 'I_ProfitCenterStdVH'
export declare function _I_ProfitCenterStdVHAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    ControllingArea?: __.Key<string>
    ProfitCenter?: __.Key<string>
    ValidityEndDate?: __.Key<__.CdsDate>
    ProfitCenter_Text?: string | null
    ValidityStartDate?: __.CdsDate | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_ProfitCenterStdVH>;
    readonly elements: __.ElementsOf<I_ProfitCenterStdVH>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_ProfitCenterStdVH extends _I_ProfitCenterStdVHAspect(__.Entity) {
}
export class I_ProfitCenterStdVH_ extends Array<I_ProfitCenterStdVH> {
  $count?: number
}

// entity 'I_ProfitCenterText'
export declare function _I_ProfitCenterTextAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    Language?: __.Key<string>
    ControllingArea?: __.Key<string>
    ProfitCenter?: __.Key<string>
    ControllingArea_Text?: string | null
    ValidityEndDate?: __.CdsDate | null
    ValidityStartDate?: __.CdsDate | null
    ProfitCenterName?: string | null
    ProfitCenterLongName?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_ProfitCenterText>;
    readonly elements: __.ElementsOf<I_ProfitCenterText>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_ProfitCenterText extends _I_ProfitCenterTextAspect(__.Entity) {
}
export class I_ProfitCenterText_ extends Array<I_ProfitCenterText> {
  $count?: number
}

// entity 'I_ProjectNetwork'
export declare function _I_ProjectNetworkAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    ProjectNetwork?: __.Key<string>
    ProjectNetworkDescription?: string | null
    ProjectInternalID?: string | null
    WBSElementInternalID?: string | null
    ProjectNetworkInternalID?: string | null
    BusinessArea?: string | null
    CompanyCode?: string | null
    ControllingArea?: string | null
    ProfitCenter?: string | null
    CostCenter?: string | null
    Plant?: string | null
    SalesOrder?: string | null
    SalesOrderItem?: string | null
    MRPController?: string | null
    ResponsiblePlannerGroup?: string | null
    ChangeNumber?: string | null
    PriorityCode?: string | null
    SuperiorProjectNetwork?: string | null
    ProductConfiguration?: string | null
    NetworkProfile?: string | null
    LastScheduledDate?: __.CdsDate | null
    ConfirmedEndDate?: __.CdsDate | null
    ScheduledReleaseDate?: __.CdsDate | null
    ActualReleasedDate?: __.CdsDate | null
    ActualStartDate?: __.CdsDate | null
    ActualEndDate?: __.CdsDate | null
    PlannedStartDate?: __.CdsDate | null
    PlannedEndDate?: __.CdsDate | null
    ForecastedStartDate?: __.CdsDate | null
    ForecastedEndDate?: __.CdsDate | null
    ScheduledForecastedStartDate?: __.CdsDate | null
    ScheduledForecastedEndDate?: __.CdsDate | null
    ScheduledFcstdReleaseDate?: __.CdsDate | null
    ScheduledBasicStartDate?: __.CdsDate | null
    ScheduledBasicEndDate?: __.CdsDate | null
    Reservation?: string | null
    CreationDate?: __.CdsDate | null
    CreationTime?: __.CdsTime | null
    CreatedByUser?: string | null
    LastChangeDate?: __.CdsDate | null
    LastChangeTime?: __.CdsTime | null
    LastChangedByUser?: string | null
    ProjectNetworkType?: string | null
    OrderCategory?: string | null
    JointVentureOriginalCostObject?: string | null
    JointVentureObjectType?: string | null
    JointVenture?: string | null
    JointVentureClass?: string | null
    JointVentureSubClass?: string | null
    TaxJurisdiction?: string | null
    CostingSheet?: string | null
    CostElement?: string | null
    ProjectNetworkObject?: string | null
    Currency?: string | null
    OverheadCode?: string | null
    ProjNtwkInterestCalcProfile?: string | null
    NetworkActivityConfirmation?: string | null
    IsMarkedForDeletion?: boolean | null
    ActualCostsCostingVariant?: string | null
    PlannedCostsCostingVariant?: string | null
    ForecastSchedulingType?: string | null
    BasicSchedulingType?: string | null
    BaseUnit?: string | null
    FunctionalArea?: string | null
    CapacityRequirement?: string | null
    OrderID?: string | null
    ControllingObjectClass?: string | null
    OrderIsNotCostedAutomatically?: string | null
    OrdIsNotSchedldAutomatically?: string | null
    NetworkIsAccountAssigned?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_ProjectNetwork>;
    readonly elements: __.ElementsOf<I_ProjectNetwork>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_ProjectNetwork extends _I_ProjectNetworkAspect(__.Entity) {
}
export class I_ProjectNetwork_ extends Array<I_ProjectNetwork> {
  $count?: number
}

// entity 'I_Purchaserequisitionitem'
export declare function _I_PurchaserequisitionitemAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    PurchaseRequisition?: __.Key<string>
    PurchaseRequisitionItem?: __.Key<string>
    PurReqnDescription?: string | null
    PurchasingDocument?: string | null
    PurchasingDocumentItem?: string | null
    PurReqnReleaseStatus?: string | null
    PurchaseRequisitionType?: string | null
    PurchasingDocumentSubtype?: string | null
    PurchasingDocumentItemCategory?: string | null
    PurchaseRequisitionItemText?: string | null
    AccountAssignmentCategory?: string | null
    PurchasingDocumentCategory?: string | null
    IsOutline?: boolean | null
    PurchasingParentItem?: string | null
    PurReqnItemOutlineType?: string | null
    PurgConfigurableItemNumber?: string | null
    PurgExternalSortNumber?: string | null
    RequestedQuantity?: number | null
    BaseUnit?: string | null
    PurReqnItemCurrency?: string | null
    PurchaseRequisitionPrice?: number | null
    PurReqnPriceQuantity?: number | null
    ReleaseCode?: string | null
    PurchaseRequisitionReleaseDate?: __.CdsDate | null
    PurchasingOrganization?: string | null
    PurchasingGroup?: string | null
    Plant?: string | null
    SourceOfSupplyIsAssigned?: boolean | null
    SupplyingPlant?: string | null
    ProcuringPlant?: string | null
    Material?: string | null
    ManufacturerMaterial?: string | null
    ManufacturerPartProfile?: string | null
    ManufacturerPartNmbr?: string | null
    MaterialGroup?: string | null
    MaterialGoodsReceiptDuration?: number | null
    SupplierMaterialNumber?: string | null
    MaterialRevisionLevel?: string | null
    OrderedQuantity?: number | null
    PurReqnLimitConsumptionAmt?: number | null
    DeliveryDate?: __.CdsDate | null
    CreationDate?: __.CdsDate | null
    LastChangedDate?: __.CdsDate | null
    ProcessingStatus?: string | null
    PurchasingInfoRecord?: string | null
    Supplier?: string | null
    FixedSupplier?: string | null
    IsDeleted?: string | null
    RequisitionerName?: string | null
    CreatedByUser?: string | null
    PurReqCreationDate?: __.CdsDate | null
    AddressID?: string | null
    DeliveryAddressID?: string | null
    ManualDeliveryAddressID?: string | null
    MaterialPlannedDeliveryDurn?: number | null
    DelivDateCategory?: string | null
    MultipleAcctAssgmtDistribution?: string | null
    ItemDeliveryAddressID?: string | null
    PartialInvoiceDistribution?: string | null
    StorageLocation?: string | null
    PurReqnSSPRequestor?: string | null
    PurReqnSSPAuthor?: string | null
    PurchaseContract?: string | null
    PurReqnSourceOfSupplyType?: string | null
    PurchaseContractItem?: string | null
    ConsumptionPosting?: string | null
    PurReqnOrigin?: string | null
    PurReqnSSPCatalog?: string | null
    PurReqnSSPCatalogItem?: string | null
    PurReqnSSPCrossCatalogItem?: number | null
    IsPurReqnBlocked?: string | null
    PurReqnItemBlockingReasonText?: string | null
    Language?: string | null
    IsClosed?: boolean | null
    Reservation?: string | null
    ReleaseIsNotCompleted?: boolean | null
    ServicePerformer?: string | null
    ProductType?: string | null
    PurchaseRequisitionStatus?: string | null
    ReleaseStrategy?: string | null
    PerformancePeriodStartDate?: __.CdsDate | null
    PerformancePeriodEndDate?: __.CdsDate | null
    CompanyCode?: string | null
    ValuationArea?: string | null
    Batch?: string | null
    MinRemainingShelfLife?: number | null
    ItemNetAmount?: number | null
    GoodsReceiptIsExpected?: boolean | null
    InvoiceIsExpected?: boolean | null
    GoodsReceiptIsNonValuated?: boolean | null
    RequirementTracking?: string | null
    MRPArea?: string | null
    MRPController?: string | null
    TaxCode?: string | null
    PurchaseRequisitionIsFixed?: boolean | null
    LastChangeDateTime?: __.CdsTimestamp | null
    IsPurReqnCmplt?: boolean | null
    PurReqnCmpltnsCat?: string | null
    ExtMaterialForPurg?: string | null
    ExtFixedSupplierForPurg?: string | null
    ExtDesiredSupplierForPurg?: string | null
    ExtContractForPurg?: string | null
    ExtContractItemForPurg?: string | null
    ExtInfoRecordForPurg?: string | null
    ExtPlantForPurg?: string | null
    ProcmtHubStorageLocation?: string | null
    ExtCompanyCodeForPurg?: string | null
    ExtPurgOrgForPurg?: string | null
    ExtSourceSystem?: string | null
    ProcurementHubSourceSystem?: string | null
    IsPurReqnOvrlRel?: boolean | null
    ReleaseGroup?: string | null
    ExpectedOverallLimitAmount?: number | null
    OverallLimitAmount?: number | null
    PurContractForOverallLimit?: string | null
    IsEndOfPurposeBlocked?: string | null
    PurchaseReqnItemUniqueID?: string | null
    Subcontractor?: string | null
    PurReqnReceivingCustomer?: string | null
    PurchaseOrderPriceType?: string | null
    IsOnBehalfCart?: string | null
    ExtPurchaseRequisitionType?: string | null
    PurReqnIsCreatedInExpertMode?: boolean | null
    MaterialShortageQuantity?: number | null
    PurchaseOrderDate?: __.CdsDate | null
    PurReqnIntObjNmbr?: string | null
    PFMTransDataFootprintUUID?: string | null
    ExternalProcurementProfile?: string | null
    PurReqnRequestor?: string | null
    ExternalApprovalStatus?: string | null
    CommitmentItemShortID?: string | null
    FundsCenter?: string | null
    Fund?: string | null
    GrantID?: string | null
    FunctionalArea?: string | null
    EarmarkedFundsDocument?: string | null
    EarmarkedFundsDocumentItem?: string | null
    BudgetPeriod?: string | null
    FundedProgram?: string | null
    MaterialOrderUnit?: string | null
    CostCenter?: string | null
    GLAccount?: string | null
    PurReqnExternalReference?: string | null
    PurReqnItemExternalReference?: string | null
    PurReqnExternalSystemId?: string | null
    PurReqnExternalSystemType?: string | null
    PurReqnTypeExternalReference?: string | null
    PurReqnProcessingType?: string | null
    PurReqnProcessingDateTime?: __.CdsDateTime | null
    ProcmtHubBackendBusSyst?: string | null
    ProcmtHubPurReqnItmIsChanged?: boolean | null
    InventorySpecialStockType?: string | null
    SSPAuthorExternalBPIdnNumber?: string | null
    SSPReqrUserId?: string | null
    PurReqnIsValdInCntrlReqnProcg?: boolean | null
    PurchasingDeliveryAddressType?: string | null
    PurReqnHasDelegateApproval?: boolean | null
    CntrlReqnIsRpldBfrApprvl?: boolean | null
    CntrlReqnApprvlStsInRpldReqn?: string | null
    StockSegment?: string | null
    RequirementSegment?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_Purchaserequisitionitem>;
    readonly elements: __.ElementsOf<I_Purchaserequisitionitem>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_Purchaserequisitionitem extends _I_PurchaserequisitionitemAspect(__.Entity) {
}
export class I_Purchaserequisitionitem_ extends Array<I_Purchaserequisitionitem> {
  $count?: number
}

// entity 'I_SalesDocumentScheduleLine'
export declare function _I_SalesDocumentScheduleLineAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    ID?: __.Key<string>
    SalesDocument?: string | null
    SalesDocumentItem?: string | null
    ScheduleLine?: string | null
    ScheduleLineCategory?: string | null
    OrderQuantityUnit?: string | null
    OrderToBaseQuantityDnmntr?: number | null
    OrderToBaseQuantityNmrtr?: number | null
    BaseUnit?: string | null
    DeliveryDate?: __.CdsDate | null
    DelivDateCategory?: string | null
    IsRequestedDelivSchedLine?: string | null
    RequestedDeliveryDate?: __.CdsDate | null
    RequestedDeliveryTime?: __.CdsTime | null
    ScheduleLineOrderQuantity?: number | null
    CorrectedQtyInOrderQtyUnit?: number | null
    IsConfirmedDelivSchedLine?: string | null
    ConfirmedDeliveryDate?: __.CdsDate | null
    ConfirmedDeliveryTime?: __.CdsTime | null
    ConfdOrderQtyByMatlAvailCheck?: number | null
    ConfdSchedLineReqdDelivDate?: __.CdsDate | null
    ProductAvailabilityDate?: __.CdsDate | null
    ProductAvailabilityTime?: __.CdsTime | null
    ProductAvailCheckRqmtDate?: __.CdsDate | null
    ProdAvailabilityCheckRqmtType?: string | null
    ProdAvailyCheckPlanningType?: string | null
    ScheduleLineConfirmationStatus?: string | null
    RequirementsClass?: string | null
    PlannedOrder?: string | null
    OrderID?: string | null
    SchedulingAgreementReleaseType?: string | null
    ScheduleLineByForecastDelivery?: string | null
    OrderSchedulingGroup?: string | null
    CustEngineeringChgStatus?: string | null
    PurchaseRequisition?: string | null
    PurchaseRequisitionItem?: string | null
    PurchasingOrderType?: string | null
    PurchasingDocumentCategory?: string | null
    DeliveryCreationDate?: __.CdsDate | null
    TransportationPlanningDate?: __.CdsDate | null
    TransportationPlanningTime?: __.CdsTime | null
    GoodsIssueDate?: __.CdsDate | null
    LoadingDate?: __.CdsDate | null
    GoodsIssueTime?: __.CdsTime | null
    LoadingTime?: __.CdsTime | null
    ItemIsDeliveryRelevant?: boolean | null
    DelivBlockReasonForSchedLine?: string | null
    OpenReqdDelivQtyInOrdQtyUnit?: number | null
    OpenReqdDelivQtyInBaseUnit?: number | null
    OpenConfdDelivQtyInOrdQtyUnit?: number | null
    OpenConfdDelivQtyInBaseUnit?: number | null
    DeliveredQtyInOrderQtyUnit?: number | null
    DeliveredQuantityInBaseUnit?: number | null
    RequestedRqmtQtyInBaseUnit?: number | null
    ConfirmedRqmtQtyInBaseUnit?: number | null
    MRPRequiredQuantityInBaseUnit?: number | null
    GoodsMovementType?: string | null
    RouteSchedule?: string | null
    OpenDeliveryNetAmount?: number | null
    TransactionCurrency?: string | null
    TradeCmplncLegalCtrlChkSts?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_SalesDocumentScheduleLine>;
    readonly elements: __.ElementsOf<I_SalesDocumentScheduleLine>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_SalesDocumentScheduleLine extends _I_SalesDocumentScheduleLineAspect(__.Entity) {
}
export class I_SalesDocumentScheduleLine_ extends Array<I_SalesDocumentScheduleLine> {
  $count?: number
}

// entity 'I_WBSElementBasicData'
export declare function _I_WBSElementBasicDataAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    WBSElementInternalID?: __.Key<string>
    WBSElementExternalID?: string | null
    WBSElement?: string | null
    WBSElementShortID?: string | null
    WBSDescription?: string | null
    CompanyCode?: string | null
    ControllingArea?: string | null
    FunctionalArea?: string | null
    ProfitCenter?: string | null
    ResponsibleCostCenter?: string | null
    Plant?: string | null
    FactoryCalendar?: string | null
    CostingSheet?: string | null
    CostCenter?: string | null
    ProjectInternalID?: string | null
    WBSElementIsBillingElement?: boolean | null
    WBSElementObject?: string | null
    InvestmentProfile?: string | null
    WBSIsStatisticalWBSElement?: boolean | null
    WBSIsAccountAssignmentElement?: boolean | null
    ProjectType?: string | null
    ProjectType_Text?: string | null
    JointVenture?: string | null
    JointVentureCostRecoveryCode?: string | null
    JointVentureEquityType?: string | null
    JntVntrProjectType?: string | null
    JntIntrstBillgClass?: string | null
    JntIntrstBillgSubClass?: string | null
    Location?: string | null
    ResultAnalysisInternalID?: string | null
    Fund?: string | null
    GrantID?: string | null
    FundIsFixAssigned?: boolean | null
    FunctionalAreaIsFixAssigned?: boolean | null
    GrantIsFixAssigned?: boolean | null
    SponsoredProgram?: string | null
    TaxJurisdiction?: string | null
    FunctionalLocation?: string | null
    CreatedByUser?: string | null
    CreationDate?: __.CdsDate | null
    LastChangedByUser?: string | null
    LastChangeDate?: __.CdsDate | null
    RespCostCenterControllingArea?: string | null
    LeadingSalesOrderItem?: string | null
    LeadingSalesOrder?: string | null
    EntProjectSettlementElement?: boolean | null
    EntProjIsSettlmtRuleInherited?: boolean | null
    ResultAnalysisDescription?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<I_WBSElementBasicData>;
    readonly elements: __.ElementsOf<I_WBSElementBasicData>;
    readonly actions: globalThis.Record<never, never>;
};
export class I_WBSElementBasicData extends _I_WBSElementBasicDataAspect(__.Entity) {
}
export class I_WBSElementBasicData_ extends Array<I_WBSElementBasicData> {
  $count?: number
}

// entity 'SAP__Currency'
export declare function _SAP__CurrencyAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    CurrencyCode?: __.Key<string>
    ISOCode?: string
    Text?: string
    DecimalPlaces?: number
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<SAP__Currency>;
    readonly elements: __.ElementsOf<SAP__Currency>;
    readonly actions: globalThis.Record<never, never>;
};
export class SAP__Currency extends _SAP__CurrencyAspect(__.Entity) {
}
export class SAP__Currencies extends Array<SAP__Currency> {
  $count?: number
}

// entity 'SAP__UnitsOfMeasure'
export declare function _SAP__UnitsOfMeasureAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    UnitCode?: __.Key<string>
    ISOCode?: string
    ExternalCode?: string
    Text?: string
    DecimalPlaces?: number | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<SAP__UnitsOfMeasure>;
    readonly elements: __.ElementsOf<SAP__UnitsOfMeasure>;
    readonly actions: globalThis.Record<never, never>;
};
export class SAP__UnitsOfMeasure extends _SAP__UnitsOfMeasureAspect(__.Entity) {
}
export class SAP__UnitsOfMeasure_ extends Array<SAP__UnitsOfMeasure> {
  $count?: number
}

// entity 'SAP__MyDocumentDescription'
export declare function _SAP__MyDocumentDescriptionAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    Id?: __.Key<string>
    CreatedBy?: string
    CreatedAt?: __.CdsDateTime
    FileName?: string
    Title?: string
    Format?: __.Association.to<SAP__FormatSet> | null
    Format_Id?: string | null
    TableColumns?: __.Association.to.many<SAP__TableColumnsSet_>
    CoverPage?: __.Association.to.many<SAP__CoverPageSet_>
    Signature?: __.Association.to<SAP__SignatureSet> | null
    Signature_Id?: string | null
    PDFStandard?: __.Association.to<SAP__PDFStandardSet> | null
    PDFStandard_Id?: string | null
    Hierarchy?: __.Association.to<SAP__HierarchySet> | null
    Hierarchy_Id?: string | null
    Header?: __.Association.to<SAP__PDFHeaderSet> | null
    Header_Id?: string | null
    Footer?: __.Association.to<SAP__PDFFooterSet> | null
    Footer_Id?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<SAP__MyDocumentDescription>;
    readonly elements: __.ElementsOf<SAP__MyDocumentDescription>;
    readonly actions: globalThis.Record<never, never>;
};
export class SAP__MyDocumentDescription extends _SAP__MyDocumentDescriptionAspect(__.Entity) {
}
export class SAP__MyDocumentDescriptions extends Array<SAP__MyDocumentDescription> {
  $count?: number
}

// entity 'SAP__FormatSet'
export declare function _SAP__FormatSetAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    Id?: __.Key<string>
    FitToPage?: SAP__FitToPage
    FontSize?: number
    Orientation?: string
    PaperSize?: string
    BorderSize?: number
    MarginSize?: number
    FontName?: string
    Padding?: number
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<SAP__FormatSet>;
    readonly elements: __.ElementsOf<SAP__FormatSet>;
    readonly actions: globalThis.Record<never, never>;
};
export class SAP__FormatSet extends _SAP__FormatSetAspect(__.Entity) {
}
export class SAP__FormatSet_ extends Array<SAP__FormatSet> {
  $count?: number
}

// entity 'SAP__PDFStandardSet'
export declare function _SAP__PDFStandardSetAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    Id?: __.Key<string>
    UsePDFAConformance?: boolean
    DoEnableAccessibility?: boolean
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<SAP__PDFStandardSet>;
    readonly elements: __.ElementsOf<SAP__PDFStandardSet>;
    readonly actions: globalThis.Record<never, never>;
};
export class SAP__PDFStandardSet extends _SAP__PDFStandardSetAspect(__.Entity) {
}
export class SAP__PDFStandardSet_ extends Array<SAP__PDFStandardSet> {
  $count?: number
}

// entity 'SAP__TableColumnsSet'
export declare function _SAP__TableColumnsSetAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    Id?: __.Key<string>
    Name?: __.Key<string>
    Header?: __.Key<string>
    HorizontalAlignment?: string
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<SAP__TableColumnsSet>;
    readonly elements: __.ElementsOf<SAP__TableColumnsSet>;
    readonly actions: globalThis.Record<never, never>;
};
export class SAP__TableColumnsSet extends _SAP__TableColumnsSetAspect(__.Entity) {
}
export class SAP__TableColumnsSet_ extends Array<SAP__TableColumnsSet> {
  $count?: number
}

// entity 'SAP__CoverPageSet'
export declare function _SAP__CoverPageSetAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    Title?: __.Key<string>
    Id?: __.Key<string>
    Name?: __.Key<string>
    Value?: string
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<SAP__CoverPageSet>;
    readonly elements: __.ElementsOf<SAP__CoverPageSet>;
    readonly actions: globalThis.Record<never, never>;
};
export class SAP__CoverPageSet extends _SAP__CoverPageSetAspect(__.Entity) {
}
export class SAP__CoverPageSet_ extends Array<SAP__CoverPageSet> {
  $count?: number
}

// entity 'SAP__SignatureSet'
export declare function _SAP__SignatureSetAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    Id?: __.Key<string>
    DoSign?: boolean
    Reason?: string
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<SAP__SignatureSet>;
    readonly elements: __.ElementsOf<SAP__SignatureSet>;
    readonly actions: globalThis.Record<never, never>;
};
export class SAP__SignatureSet extends _SAP__SignatureSetAspect(__.Entity) {
}
export class SAP__SignatureSet_ extends Array<SAP__SignatureSet> {
  $count?: number
}

// entity 'SAP__HierarchySet'
export declare function _SAP__HierarchySetAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    Id?: __.Key<string>
    DistanceFromRootElement?: string
    DrillStateElement?: string
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<SAP__HierarchySet>;
    readonly elements: __.ElementsOf<SAP__HierarchySet>;
    readonly actions: globalThis.Record<never, never>;
};
export class SAP__HierarchySet extends _SAP__HierarchySetAspect(__.Entity) {
}
export class SAP__HierarchySet_ extends Array<SAP__HierarchySet> {
  $count?: number
}

// entity 'SAP__PDFHeaderSet'
export declare function _SAP__PDFHeaderSetAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    Id?: __.Key<string>
    Right?: SAP__HeaderFooterField
    Left?: SAP__HeaderFooterField
    Center?: SAP__HeaderFooterField
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<SAP__PDFHeaderSet>;
    readonly elements: __.ElementsOf<SAP__PDFHeaderSet>;
    readonly actions: globalThis.Record<never, never>;
};
export class SAP__PDFHeaderSet extends _SAP__PDFHeaderSetAspect(__.Entity) {
}
export class SAP__PDFHeaderSet_ extends Array<SAP__PDFHeaderSet> {
  $count?: number
}

// entity 'SAP__PDFFooterSet'
export declare function _SAP__PDFFooterSetAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    Id?: __.Key<string>
    Right?: SAP__HeaderFooterField
    Left?: SAP__HeaderFooterField
    Center?: SAP__HeaderFooterField
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<SAP__PDFFooterSet>;
    readonly elements: __.ElementsOf<SAP__PDFFooterSet>;
    readonly actions: globalThis.Record<never, never>;
};
export class SAP__PDFFooterSet extends _SAP__PDFFooterSetAspect(__.Entity) {
}
export class SAP__PDFFooterSet_ extends Array<SAP__PDFFooterSet> {
  $count?: number
}

// entity 'SAP__ValueHelpSet'
export declare function _SAP__ValueHelpSetAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    VALUEHELP?: __.Key<string>
    FIELD_VALUE?: string
    DESCRIPTION?: string | null
  } & InstanceType<TBase>
    readonly kind: 'entity';
    readonly keys: __.KeysOf<SAP__ValueHelpSet>;
    readonly elements: __.ElementsOf<SAP__ValueHelpSet>;
    readonly actions: globalThis.Record<never, never>;
};
export class SAP__ValueHelpSet extends _SAP__ValueHelpSetAspect(__.Entity) {
}
export class SAP__ValueHelpSet_ extends Array<SAP__ValueHelpSet> {
  $count?: number
}

// entity 'SAP__FitToPage'
export declare function _SAP__FitToPageAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    ErrorRecoveryBehavior?: string
    IsEnabled?: boolean
    MinimumFontSize?: number
  } & InstanceType<TBase>
    readonly kind: 'type';
    readonly keys: __.KeysOf<SAP__FitToPage>;
    readonly elements: __.ElementsOf<SAP__FitToPage>;
    readonly actions: globalThis.Record<never, never>;
};
export class SAP__FitToPage extends _SAP__FitToPageAspect(__.Entity) {
}

// entity 'SAP__HeaderFooterField'
export declare function _SAP__HeaderFooterFieldAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    Type?: string
  } & InstanceType<TBase>
    readonly kind: 'type';
    readonly keys: __.KeysOf<SAP__HeaderFooterField>;
    readonly elements: __.ElementsOf<SAP__HeaderFooterField>;
    readonly actions: globalThis.Record<never, never>;
};
export class SAP__HeaderFooterField extends _SAP__HeaderFooterFieldAspect(__.Entity) {
}
