// CNMA Approval Service BFF definition (no DB entities)
// Realtime approvals orchestrator matching Conarum guidelines

service ApprovalService @(path: '/api/cnma/APPROVAL_SRV') {
  type TestResult {
    success        : Boolean;
    message        : String;
    url            : String;
    authentication : String;
    details        : LargeString;
  }

  action testNotificationDestination() returns TestResult;
  action sendTestNotification(
    eventType : String,
    subject   : String,
    body      : String
  ) returns TestResult;
}

service NotificationService @(path: '/api/cnma/NotificationService') {
  type TestResult {
    success        : Boolean;
    message        : String;
    url            : String;
    authentication : String;
    details        : LargeString;
  }

  action testNotificationDestination() returns TestResult;
  action sendTestNotification(
    eventType : String,
    subject   : String,
    body      : String
  ) returns TestResult;
}

