// This is an automatically generated file. Please do not change its contents manually!
import * as __ from './../_';

export default class {
  static readonly testNotificationDestination: typeof testNotificationDestination;
  static readonly sendTestNotification: typeof sendTestNotification;
}

// entity 'TestResult'
export declare function _TestResultAspect<TBase extends new (...args: any[]) => object>(Base: TBase): {
  new (...args: any[]): {
    success?: boolean | null
    message?: string | null
    url?: string | null
    authentication?: string | null
    details?: string | null
  } & InstanceType<TBase>
    readonly kind: 'type';
    readonly keys: __.KeysOf<TestResult>;
    readonly elements: __.ElementsOf<TestResult>;
    readonly actions: globalThis.Record<never, never>;
};
export class TestResult extends _TestResultAspect(__.Entity) {
}


export declare const testNotificationDestination:  {
  // positional
  (): globalThis.Promise<TestResult | null> | TestResult | null
  // named
  ({}: globalThis.Record<never, never>): globalThis.Promise<TestResult | null> | TestResult | null
  // metadata (do not use)
  __parameters: globalThis.Record<never, never>, __returns: globalThis.Promise<TestResult | null> | TestResult | null, __self: never
  kind: 'action'
}

export declare const sendTestNotification:  {
  // positional
  (eventType: string | null, subject: string | null, body: string | null): globalThis.Promise<TestResult | null> | TestResult | null
  // named
  ({eventType, subject, body}: {eventType?: string | null, subject?: string | null, body?: string | null}): globalThis.Promise<TestResult | null> | TestResult | null
  // metadata (do not use)
  __parameters: {eventType?: string | null, subject?: string | null, body?: string | null}, __returns: globalThis.Promise<TestResult | null> | TestResult | null, __self: never
  kind: 'action'
}