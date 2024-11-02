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
      router.back();
    });
  }, []);
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
          {user?.xrplSeed}
        </div>
      </div>
      <div className="flex items-start gap-2 self-stretch w-full">
        <Button className="button flex justify-center items-center gap-2 py-2 px-4 rounded-2xl bg-white text-1 text-[#00b7aa] font-medium leading-6 capitalize w-full">
          View
        </Button>
        <Button
          onClick={() => navigator.clipboard.writeText(user?.xrplSeed || "")}
          className="button-1 flex justify-center items-center gap-2 py-2 px-4 rounded-2xl bg-white text-2 text-[#00b7aa] font-medium leading-6 capitalize w-full"
        >
          Copy
        </Button>
      </div>
    </div>
  );
};
export default PrivateKey;
