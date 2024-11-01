import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "@/lib/utils";
import Image from "next/image";
import useApi from "@/hooks/useApi";
import { Button } from "../ui/button";
import { Shop } from "./Shop";

export const Task = () => {
  const [showShop, setShowShop] = useState(false);
  const getSpeedList = useApi({
    key: ["getSpeedList"],
    method: "GET",
    url: "user/speed-list",
  }).get;

  const getBoostList = useApi({
    key: ["getBoostList"],
    method: "GET",
    url: "user/boost-list",
  }).get;

  useEffect(() => {
    getSpeedList?.refetch();
    getBoostList?.refetch();
  }, []);

  if (showShop) {
    return <Shop />;
  }

  return (
    <div className="flex flex-col items-start gap-2 self-stretch px-8 py-4 w-[var(--tg-viewport-width)]">
      <Tabs
        defaultValue="active"
        className={cn(
          "flex w-full flex-col justify-between h-full items-center"
        )}
      >
        <TabsList
          className={cn(
            "flex items-center gap-8 py-2 px-4 rounded-[1.25rem] bg-neutral-100"
          )}
        >
          <TabsTrigger value="active" className="px-0 py-0">
            <div className="text-center  leading-6">Active</div>
          </TabsTrigger>
          <TabsTrigger value="completed" className="px-0 py-0 ">
            <div className="text-center  leading-6">Completed</div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="w-full flex flex-col gap-2">
          {getSpeedList?.data?.map((item: any, index: number) => (
            <div
              key={item.id}
              className="frame_5 flex flex-col items-start gap-1 p-4 rounded-3xl border border-white"
            >
              <div className="join___play_toncapy self-stretch text-black  text-sm font-semibold leading-6 capitalize">
                Join &amp; Play TonCapy
              </div>
              <div className="flex justify-between items-center self-stretch">
                <div className="flex items-center">
                  <Image
                    src="/images/croco.png"
                    alt="Check"
                    width={24}
                    height={24}
                  />
                  <div className="_100 text-[#3e997d]  text-sm font-semibold leading-6 capitalize">
                    +100
                  </div>
                </div>
                <div className="flex justify-center items-center gap-2 py-2 px-4 w-[7.5rem] rounded-2xl bg-white text text-[#00b7aa]  font-medium leading-6 capitalize">
                  Start
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
