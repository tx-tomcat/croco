"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { retrieveLaunchParams } from "@telegram-apps/sdk";
import { useUserStore } from "@/stores/provider";
import { Upgrade } from "./Upgrade";
export const Home = () => {
  const { initDataRaw, initData } = retrieveLaunchParams();
  const { user, saveUser } = useUserStore((state) => state);
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (showUpgrade) {
    return <Upgrade />;
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-[var(--tg-viewport-width)] overflow-y-hidden px-12 py-12 gap-1">
      <div className="flex flex-col items-start gap-2 self-stretch p-4 rounded-3xl border border-white">
        <div className="flex items-center gap-4 self-stretch">
          <div className="flex justify-center items-center pb-[0.025px] pt-px px-0 w-12 h-12 rounded-full bg-[#3e997d]">
            <Image
              src="/images/avatar.png"
              alt="Avatar"
              width={48}
              height={48}
            />
          </div>
          <div className="hi_koko_ text-black text-2xl leading-8 capitalize">
            Hi {user?.username}!
          </div>
        </div>
        <div className="flex items-center">
          <Image src="/images/croco.png" alt="Coin" width={32} height={32} />
          <div className="13_000 text-[#3e997d] text-2xl leading-8 capitalize">
            {user?.crocoBalance?.toFixed(2).toLocaleString()}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-start gap-2 self-stretch p-4 rounded-3xl border border-white bg-[#ffebad]">
        <Image src="/images/croco 2.png" alt="Croco" width={268} height={133} />
        <Button className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl bg-white text text-[#00b7aa] font-medium leading-6 capitalize">
          Start hatching eggs
        </Button>
        <Button
          onClick={() => setShowUpgrade(true)}
          className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl bg-white text-1 text-[#00b7aa] font-medium leading-6 capitalize"
        >
          Upgrade
        </Button>
      </div>
    </div>
  );
};

export default Home;
