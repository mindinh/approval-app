// This is an automatically generated file. Please do not change its contents manually!
const { createEntityProxy } = require('./../_')
// service
const ApprovalService = { name: 'ApprovalService' }
module.exports = ApprovalService
module.exports.ApprovalService = ApprovalService
// TestResult
module.exports.TestResult = createEntityProxy(['ApprovalService', 'TestResult'], { target: { is_singular: true } })
module.exports.__Array_TestResult_ = createEntityProxy(['ApprovalService', 'TestResult'], { target: { is_singular: false }})
// events
// actions
module.exports.testNotificationDestination = 'testNotificationDestination'
module.exports.sendTestNotification = 'sendTestNotification'
// enums
