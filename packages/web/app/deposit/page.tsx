"use client";
import { useUserStore } from "@/stores/provider";
import { initBackButton } from "@telegram-apps/sdk-react";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
export const PrivateKey = () => {
  const { user } = useUserStore((state) => state);
  const [backButton] = initBackButton();
  const router = useRouter();
  useEffect(() => {
    backButton.show();
    backButton.on("click", () => {
      router.push("/");
    });
  }, []);
  return (
    <div className="flex flex-col items-center gap-2 m-8 w-full rounded-3xl h-fit">
      <div className="flex flex-col items-center gap-2 p-4 w-[18.75rem] rounded-3xl border border-white">
        <div className="deposit self-stretch text-black text-center leading-6 capitalize">
          Deposit
        </div>
        <div className="lightgray 50% / cover no-repeat] w-[16.75rem] h-[16.75rem] rounded-3xl bg-[url(<path-to-image>)" />
        <div className="flex items-center">
          <div className="rkzqep___3333 text-[#3e997d] leading-6 capitalize">
            rKzQep...3333
          </div>
        </div>
        <Button className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl bg-white text text-[#00b7aa] font-medium leading-6 capitalize">
          Copy
        </Button>
      </div>
    </div>
  );
};
export default PrivateKey;
