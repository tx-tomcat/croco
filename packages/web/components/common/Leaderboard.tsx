import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "@/lib/utils";
import Image from "next/image";
import useApi from "@/hooks/useApi";
import { Button } from "../ui/button";
import { Shop } from "./Shop";

export const Leaderboard = () => {
  const [showShop, setShowShop] = useState(false);
  const getSpeedList = useApi({
    key: ["getSpeedList"],
    method: "GET",
    url: "user/speed-list",
  }).get;

  useEffect(() => {
    getSpeedList?.refetch();
  }, []);

  if (showShop) {
    return <Shop />;
  }

  return (
    <div className="flex flex-col items-start gap-2 self-stretch px-8 py-4 w-[var(--tg-viewport-width)]">
      <div className="leaderboard self-stretch text-black text-center  text-xl leading-7 capitalize">
        Leaderboard
      </div>

      <Tabs
        defaultValue="earn"
        className={cn(
          "flex w-full flex-col justify-between h-full items-center"
        )}
      >
        <TabsList
          className={cn(
            "flex items-center gap-8 py-2 px-4 rounded-[1.25rem] bg-neutral-100"
          )}
        >
          <TabsTrigger value="earn" className="px-0 py-0">
            <div className="text-center  leading-6">Earn Croco</div>
          </TabsTrigger>
          <TabsTrigger value="invite" className="px-0 py-0 ">
            <div className="text-center  leading-6">Invite Friends</div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earn" className="w-full flex flex-col gap-2">
          <div className="flex flex-col items-start gap-1 p-4 w-full rounded-3xl border border-white bg-[#ffebad]">
            <div className="earn_croco___win self-stretch text-black  text-2xl leading-8 capitalize">
              Earn Croco &amp; Win
            </div>
            <div className="flex justify-between items-center self-stretch">
              <div className="flex items-center">
                <Image
                  src="/images/croco.png"
                  alt="Check"
                  width={24}
                  height={24}
                />
                <div className="500_000 text-[#3e997d]  text-2xl leading-8 capitalize">
                  500,000
                </div>
              </div>
              <div className="flex justify-center items-center gap-2 py-2 px-4 rounded-2xl bg-white text text-[#00b7aa]  font-medium leading-6 capitalize">
                Detail
              </div>
            </div>
          </div>
          {getSpeedList?.data?.map((item: any, index: number) => (
            <div
              key={index}
              className="flex justify-between items-center p-4 w-full h-20 rounded-3xl border border-white"
            >
              <div className="flex items-center gap-1">
                <div className="flex justify-center items-center pb-[0.025px] pt-px px-0 w-12 h-12 rounded-full bg-[#3e997d]">
                  <Image
                    src="/images/avatar.png"
                    alt="Check"
                    width={48}
                    height={46}
                  />
                </div>
                <div className="flex flex-col justify-center items-start">
                  <div className="samlongleg text-black  text-sm font-semibold leading-6 capitalize">
                    samlongleg
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex justify-center items-center w-6 h-6">
                      <div className="lightgray 50% / cover no-repeat] flex-shrink-0 w-6 h-6 bg-[url(<path-to-image>)" />
                    </div>
                    <div className="39_000 text-[#3e997d]  text-sm font-semibold leading-6 capitalize">
                      39,000
                    </div>
                  </div>
                </div>
              </div>
              <div className="_1 text-[#3e997d]  text-sm font-semibold leading-6 capitalize">
                #1
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
