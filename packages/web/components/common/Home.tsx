"use client";
import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { retrieveLaunchParams } from "@telegram-apps/sdk";
import { useUserStore } from "@/stores/provider";
import { Upgrade } from "./Upgrade";
import useApi from "@/hooks/useApi";
import { useToast } from "../ui/use-toast";
import { Avatar } from "../ui/avatar";
export const Home = () => {
  const { toast } = useToast();
  const { user, saveUser } = useUserStore((state) => state);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const startHatching = useApi({
    key: ["startHatching"],
    method: "POST",
    url: "user/start-hatching",
  }).post;

  const getUser = useApi({
    key: ["getUser"],
    method: "GET",
    url: "user/me",
  }).get;

  const claimToken = useApi({
    key: ["claimToken"],
    method: "POST",
    url: "user/claim-token",
  }).post;

  const crocoEarned = useMemo(() => {
    const multiplier = user?.autoBoosts?.find(
      (boost) =>
        boost.boostType === "speed" &&
        new Date(boost.expiresAt).getTime() > new Date().getTime()
    )?.multiplier;
    const speedBoost = user?.egg?.hatchSpeed || 1;
    const totalMultiplier = multiplier ? multiplier * speedBoost : speedBoost;
    const reward = 144 * totalMultiplier;

    if (!user?.egg?.lastIncubationStart) {
      return 0;
    }
    if (
      new Date(user?.egg?.lastIncubationStart).getTime() + 4 * 60 * 60 * 1000 <
      new Date().getTime()
    ) {
      return 0;
    }
    if (
      ((new Date().getTime() -
        new Date(user?.egg?.lastIncubationStart ?? "").getTime()) /
        (4 * 60 * 60 * 1000)) *
        reward >
      reward
    ) {
      return reward;
    }
    return (
      ((new Date().getTime() -
        new Date(user?.egg?.lastIncubationStart ?? "").getTime()) /
        (4 * 60 * 60 * 1000)) *
      reward
    );
  }, [user?.autoBoosts, user?.egg?.hatchSpeed, user?.egg?.lastIncubationStart]);

  if (showUpgrade) {
    return <Upgrade />;
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-[var(--tg-viewport-width)] overflow-y-hidden px-12 py-12 gap-1">
      <div className="flex flex-col items-start gap-2 self-stretch p-4 rounded-3xl border border-white">
        <div className="flex items-center gap-4 self-stretch">
          <Avatar className="flex justify-center items-center pb-[0.025px] pt-px px-0 w-12 h-12 rounded-full bg-[#3e997d]">
            <Image
              src="/images/avatar.png"
              alt="Avatar"
              width={48}
              height={48}
            />
          </Avatar>
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
        <Image
          src="/images/croco2.png"
          alt="Croco"
          width={268}
          height={133}
          className="w-full"
        />
        <Button
          disabled={startHatching?.isPending || claimToken?.isPending}
          isLoading={startHatching?.isPending || claimToken?.isPending}
          onClick={() => {
            if (
              user?.egg?.isIncubating &&
              new Date(user?.egg?.lastIncubationStart ?? "").getTime() +
                4 * 60 * 60 * 1000 <
                new Date().getTime()
            ) {
              claimToken?.mutateAsync({}).then(async (res) => {
                const user = await getUser?.refetch();
                saveUser(user?.data);
                toast({
                  description: res.message,
                  variant: res.success ? "success" : "error",
                  duration: 2000,
                });
              });
              return;
            }
            if (!user?.egg?.isIncubating) {
              startHatching?.mutateAsync({}).then(async (res) => {
                const user = await getUser?.refetch();
                saveUser(user?.data);
                toast({
                  description: res.message,
                  variant: res.success ? "success" : "error",
                  duration: 2000,
                });
              });
            }
          }}
          className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl bg-white text text-[#00b7aa] font-medium leading-6 capitalize"
        >
          {user?.egg?.isIncubating ? (
            <div className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl bg-white text-[#00b7aa] font-medium">
              <Image
                src="/images/croco.png"
                alt="Hatching"
                width={24}
                height={24}
              />
              <div>{crocoEarned.toFixed(2)} </div>
              {"-"}
              {user?.egg?.lastIncubationStart && (
                <div className="flex items-center gap-2">
                  <div>
                    {new Date(user?.egg?.lastIncubationStart).getTime() +
                      4 * 60 * 60 * 1000 -
                      new Date().getTime() >
                    0
                      ? new Date(
                          new Date(user?.egg?.lastIncubationStart).getTime() +
                            4 * 60 * 60 * 1000 -
                            new Date().getTime()
                        )
                          .toISOString()
                          .substr(11, 8)
                      : "Claim"}
                  </div>
                </div>
              )}
            </div>
          ) : (
            "Start hatching eggs"
          )}
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
