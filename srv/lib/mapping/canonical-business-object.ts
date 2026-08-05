export interface ApprovalStep {
  documentId: string;
  level: number;
  releaseCode: string;
  releaseText?: string;
  approver: string;
  approverUserId: string;
  status: string;
  noteText: string;
  postedOn: string;
  postedTime: string;
}

export interface Comment {
  id: string;
  createdBy: string;
  createdByName: string;
  text: string;
  createdAt: string;
}

export interface AttachmentMetadata {
  id: string;
  fileName: string;
  fileDisplayName: string;
  mimeType: string;
  fileSize: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  link: string;
}

export interface CanonicalBusinessObject {
  objectType: string;
  objectId: string;
  header: Record<string, any>;
  items: Array<Record<string, any>>;
  workflow: {
    strategyName?: string;
    steps: ApprovalStep[];
    comments: Comment[];
  };
  attachments: AttachmentMetadata[];
  accountAssignments?: Array<Record<string, any>>;
  scheduleLines?: Array<Record<string, any>>;
  transitMilestones?: Array<Record<string, any>>;
  tariffsBreakdown?: Array<Record<string, any>>;
  channelBreakdown?: Array<Record<string, any>>;
  deprSchedule?: Array<Record<string, any>>;
}

export interface TaskMetadata {
  instanceId: string;
  sapOrigin: string;
  title: string;
  status: string;
  priority: string;
  createdOn?: string;
  createdByName?: string;
  requestorName?: string;
  taskDefinitionId: string;
  supports: {
    forward: boolean;
    comments: boolean;
  };
  total?: number;
  curr_vnd?: string;
  total_doc_curr?: number;
  doc_curr?: string;
  businessChips?: Array<{
    label?: string;
    value: any;
    dataType: string;
    isPrimary?: boolean;
    currency?: string;
  }>;
  normalTask: boolean;
}

export interface TaskDetailResponse {
  task: TaskMetadata;
  object: CanonicalBusinessObject;
  uiSchema: any;
  metadata: {
    objectType: string;
    configurationVersion: number;
    profile: string;
    mappingWarnings?: string[];
  };
  decisions?: any[];
  comments?: Comment[];
  attachments?: AttachmentMetadata[];
  fieldSchema?: any;
  actions?: any[];
  customAttributes?: any[];
  taskObjects?: any[];
  processingLogs?: any[];
  workflowLogs?: any[];
}
