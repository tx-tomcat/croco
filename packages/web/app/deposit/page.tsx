"use client";
import { useUserStore } from "@/stores/provider";
import { initBackButton } from "@telegram-apps/sdk-react";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/utils/utils";
import { useToast } from "@/components/ui/use-toast";
export const PrivateKey = () => {
  const { user } = useUserStore((state) => state);
  const { toast } = useToast();
  const [backButton] = initBackButton();
  const router = useRouter();
  useEffect(() => {
    backButton.show();
    backButton.on("click", () => {
      router.push("/");
    });
  }, []);

  const generateQRCode = (text: string) => {
    if (!text) return "";
    const size = 256;
    const qrData = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
    return qrData;
  };
  console.log(user);
  return (
    <div className="flex flex-col items-center gap-2 m-8 w-full rounded-3xl h-fit">
      <div className="flex flex-col items-center gap-2 p-4 w-[18.75rem] rounded-3xl border border-white">
        <div className="deposit self-stretch text-black text-center leading-6 capitalize">
          Deposit
        </div>
        <div className="bg-white p-4 rounded-3xl">
          {user?.xrplAddress && (
            <Image
              src={generateQRCode(user?.xrplAddress || "")}
              alt="QR Code"
              className="w-full h-full"
              width={256}
              height={256}
            />
          )}
        </div>
        <div className="flex items-center">
          <div className="rkzqep___3333 text-[#3e997d] leading-6 capitalize">
            {shortenAddress(user?.xrplAddress || "")}
          </div>
        </div>
        <Button
          className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl bg-white text text-[#00b7aa] font-medium leading-6 capitalize"
          onClick={() => {
            navigator.clipboard.writeText(user?.xrplAddress || "");
            toast({
              description: "Copied to clipboard",
              duration: 2000,
            });
          }}
        >
          Copy
        </Button>
      </div>
    </div>
  );
};
export default PrivateKey;
