import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Smartphone, Download, Share } from "lucide-react";
import { isAndroid, isIos, isRunningStandalone } from "../utils/pwa";
import { Button, Card, CardContent } from "@cnma/react-ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallBanner() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIosPlatform, setIsIosPlatform] = useState(false);
  const [isAndroidPlatform, setIsAndroidPlatform] = useState(false);

  useEffect(() => {
    // 1. Never show if already running in standalone/installed mode
    if (isRunningStandalone()) {
      return;
    }

    // 2. Check if user dismissed this session
    const isDismissed = sessionStorage.getItem("pwa-banner-dismissed");
    if (isDismissed === "true") {
      return;
    }

    const ios = isIos();
    const android = isAndroid();
    setIsIosPlatform(ios);
    setIsAndroidPlatform(android);

    // 3. For iOS, we show the manual instruction banner since we can't trigger install programmatically
    if (ios) {
      // Small delay for smoother load experience
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }

    // 4. For Android/Chromium, we listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-banner-dismissed", "true");
    setShowBanner(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the native browser install prompt
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install prompt outcome: ${outcome}`);

    // Clear prompt regardless of outcome
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  // If banner should not be displayed
  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] max-w-md mx-auto md:right-4 md:left-auto transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-5">
      <Card className="shadow-lg border border-sidebar-border bg-sidebar text-sidebar-foreground overflow-hidden">
        <CardContent className="p-4 flex gap-3 relative">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-full"
            title={t("pwa.btnDismiss", "Dismiss")}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Icon */}
          <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            {isAndroidPlatform ? (
              <Download className="h-5 w-5" />
            ) : (
              <Smartphone className="h-5 w-5" />
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 pr-6 flex flex-col justify-center">
            <h4 className="font-semibold text-sm leading-tight mb-1">
              {t("pwa.installTitle", "Install prorequest")}
            </h4>
            <p className="text-xs text-muted-foreground leading-normal">
              {isIosPlatform
                ? t("pwa.installDescIos", "To add this app to your Home Screen: tap the Share button and select 'Add to Home Screen'.")
                : t("pwa.installDescAndroid", "Install this app on your home screen for quick and easy access.")}
            </p>

            {/* Install Button (Android only) */}
            {isAndroidPlatform && deferredPrompt && (
              <div className="mt-3 flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-xs font-semibold cursor-pointer h-8 px-3"
                >
                  {t("pwa.btnDismiss", "Dismiss")}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleInstall}
                  className="text-xs font-semibold cursor-pointer h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {t("pwa.btnInstall", "Install")}
                </Button>
              </div>
            )}

            {/* iOS visual hints (Share helper) */}
            {isIosPlatform && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                <Share className="h-3 w-3 inline text-primary shrink-0" />
                <span>Safari → Share → Add to Home Screen</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
