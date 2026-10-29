// Bootstrap control only. UI is rendered by the independently built CNMA React dialog.
(function () {
  'use strict';
  var script = document.currentScript;
  var base = new URL('./', script.src);
  var root = document.getElementById('root');
  var ready = false;
  var recoveryRequested = false;
  var recoveryLoaded = false;
  var failureCode;

  function notifyFailure() {
    if (!ready) window.dispatchEvent(new CustomEvent('cnma:startup-error', {
      detail: { code: failureCode, baseUrl: base.href }
    }));
  }

  function showError(code) {
    if (ready) return;
    failureCode = failureCode || code;
    if (recoveryLoaded) return notifyFailure();
    if (recoveryRequested) return;
    recoveryRequested = true;
    var development = script.getAttribute('data-development') === 'true';
    if (!development) {
      var stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = new URL('startup-recovery.css', base).href;
      document.head.appendChild(stylesheet);
    }
    var recovery = document.createElement('script');
    recovery.src = new URL(development ? 'src/startupRecovery.tsx' : 'startup-recovery.js', base).href;
    if (development) recovery.type = 'module';
    recovery.onload = function () { recoveryLoaded = true; notifyFailure(); };
    document.head.appendChild(recovery);
  }

  var timeout = setTimeout(function () {
    showError(navigator.onLine === false ? 'OFFLINE' : 'STARTUP_TIMEOUT');
  }, 20000);
  var observer = new MutationObserver(function () {
    if (root.childElementCount) {
      ready = true;
      clearTimeout(timeout);
      observer.disconnect();
      window.dispatchEvent(new CustomEvent('cnma:startup-ready'));
    }
  });
  observer.observe(root, { childList: true });

  window.addEventListener('error', function (event) {
    var target = event.target;
    if (target && (target.tagName === 'SCRIPT' || (target.tagName === 'LINK' && target.rel === 'stylesheet'))) {
      showError('ASSET_LOAD_FAILED');
    } else if (target === window) showError('STARTUP_FAILED');
  }, true);
  window.addEventListener('unhandledrejection', function () { showError('STARTUP_FAILED'); });

  // A broken cached app bundle must not prevent service worker repair.
  if (script.getAttribute('data-service-worker') === 'true') {
    try {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.register(new URL('sw.js', base).href, { updateViaCache: 'none' })
          .catch(function () { /* Online startup does not require a service worker. */ });
      }
    } catch (_) { /* Private/mobile contexts can disable service workers. */ }
  }
}());
