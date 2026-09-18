// This is an automatically generated file. Please do not change its contents manually!
const { createEntityProxy } = require('./../_')
// service
const NotificationService = { name: 'NotificationService' }
module.exports = NotificationService
module.exports.NotificationService = NotificationService
// TestResult
module.exports.TestResult = createEntityProxy(['NotificationService', 'TestResult'], { target: { is_singular: true } })
module.exports.__Array_TestResult_ = createEntityProxy(['NotificationService', 'TestResult'], { target: { is_singular: false }})
// events
// actions
module.exports.testNotificationDestination = 'testNotificationDestination'
module.exports.sendTestNotification = 'sendTestNotification'
// enums
