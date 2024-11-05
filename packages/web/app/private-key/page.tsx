"use client";
import { useUserStore } from "@/stores/provider";
import { initBackButton } from "@telegram-apps/sdk-react";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";
export const PrivateKey = () => {
  const { user } = useUserStore((state) => state);
  const [backButton] = initBackButton();
  const router = useRouter();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const holdDuration = 1000; // 1 second hold duration
  let holdTimer: number | null = null;
  useEffect(() => {
    backButton.show();
    backButton.on("click", () => {
      router.back();
    });
    return () => {
      if (holdTimer) clearTimeout(holdTimer);
    };
  }, []);

  useEffect(() => {
    let hideTimer: NodeJS.Timeout;
    if (showKey) {
      hideTimer = setTimeout(() => {
        setShowKey(false);
        setHoldProgress(0);
      }, 5000);
    }
    return () => {
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [showKey]);

  const handleHoldStart = useCallback(() => {
    setHolding(true);
    const startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / holdDuration) * 100, 100);
      setHoldProgress(progress);

      if (progress < 100) {
        holdTimer = requestAnimationFrame(updateProgress);
      } else {
        setShowKey(true);
      }
    };

    holdTimer = requestAnimationFrame(updateProgress);
  }, []);

  const handleHoldEnd = useCallback(() => {
    setHolding(false);
    if (holdTimer) {
      cancelAnimationFrame(holdTimer);
      holdTimer = null;
    }
    if (holdProgress < 100) {
      setHoldProgress(0);
    }
  }, [holdProgress]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(user?.xrplSeed || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const maskPrivateKey = (key) => {
    if (!key) return "";
    return "•".repeat(key.length);
  };
  return (
    <div className="flex flex-col items-center gap-2 m-8 w-full rounded-3xl border border-solid border-white p-4 h-fit">
      <div className="private_key self-stretch text-black text-center leading-6 capitalize">
        Private Key
      </div>
      <div className="toast flex items-center gap-2 self-stretch py-3 px-4 rounded-3xl border border-white bg-[#ffebad]">
        <Image src="/images/warning.svg" alt="Check" width={24} height={24} />
        <div className="this_is_message text-black text-sm font-extrabold leading-6">
          Do not share your private key with anyone, even with us!
        </div>
      </div>
      <div className="save_your_seed_key_right_now_to_avoid_losing_your_account_ self-stretch text-black text-center text-sm font-light leading-6">
        Save your seed key right now to avoid losing your account!
      </div>
      <div className="flex flex-col items-center gap-1 self-stretch rounded-xl bg-white h-10">
        <div className="flex items-start gap-4 self-stretch py-2 px-3 rounded-xl bg-white text h-6 text-black text-sm font-light leading-6">
          {showKey ? user?.xrplSeed : maskPrivateKey(user?.xrplSeed)}
        </div>
      </div>
      <div className="flex items-start gap-2 self-stretch w-full">
        <div className="flex flex-col gap-2">
          <Button
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-[#00b7aa]"
          >
            {showKey ? (
              <>
                <EyeOff size={18} />
                Hidden in 5s
              </>
            ) : (
              <>
                <Eye size={18} />
                Hold to View
              </>
            )}
          </Button>
          {holding && !showKey && (
            <Progress value={holdProgress} className="h-1 bg-gray-200" />
          )}
        </div>
        <Button
          onClick={handleCopy}
          disabled={copied}
          className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-[#00b7aa] w-full"
        >
          {copied ? (
            <>
              <Check size={18} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={18} />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
export default PrivateKey;
