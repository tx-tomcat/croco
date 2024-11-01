import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "@/lib/utils";
import Image from "next/image";
import useApi from "@/hooks/useApi";
import { Button } from "../ui/button";

export const Shop = () => {
  const getTonList = useApi({
    key: ["getTonList"],
    method: "GET",
    url: "user/fish-list",
  }).get;

  useEffect(() => {
    getTonList?.refetch();
  }, []);

  return (
    <div className="flex flex-col items-start gap-2 self-stretch px-8 py-4 w-[var(--tg-viewport-width)]">
      <Tabs
        defaultValue="ton"
        className={cn(
          "flex w-full flex-col justify-between h-full items-center"
        )}
      >
        <TabsList
          className={cn(
            "flex items-center gap-8 py-2 px-4 rounded-[1.25rem] bg-neutral-100"
          )}
        >
          <TabsTrigger value="ton" className="px-0 py-0">
            <Image src="/images/ton.svg" alt="Ton" width={24} height={24} />
            <div className="text-center  leading-6">Ton</div>
          </TabsTrigger>
          <TabsTrigger value="star" className="px-0 py-0 ">
            <Image src="/images/star.png" alt="Star" width={24} height={24} />
            <div className="text-center  leading-6">Star</div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ton" className="w-full flex flex-wrap gap-2">
          {getTonList?.data?.map((item: any, index: number) => (
            <div
              key={item.id}
              className={cn(
                "flex flex-col items-center gap-1 p-4 rounded-3xl border border-white w-[48%]",
                getTonList?.data?.length % 2 === 1 &&
                  index === getTonList?.data?.length - 1 &&
                  "w-full"
              )}
            >
              <div className="flex items-center gap-2">
                <Image
                  src="/images/fish.svg"
                  alt="Ton"
                  width={24}
                  height={24}
                />
                <div className="500 text-black  font-semibold leading-6 capitalize">
                  {item.amount.toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-col ">
                <Image src="/images/up.svg" alt="Ton" width={24} height={24} />
                <div className="flex items-center gap-2">
                  <Image
                    src="/images/ton.svg"
                    alt="Ton"
                    width={24}
                    height={24}
                  />

                  <div className="1_44 text-black  font-semibold leading-6 capitalize">
                    {item.priceTON.toLocaleString()}
                  </div>
                </div>
              </div>
              <Button className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl bg-white text text-[#00b7aa]  font-medium leading-6 capitalize">
                Buy
              </Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="star" className="w-full flex flex-wrap gap-2">
          {getTonList?.data?.map((item: any, index: number) => (
            <div
              key={item.id}
              className={cn(
                "flex flex-col items-center gap-1 p-4 rounded-3xl border border-white w-[48%]",
                getTonList?.data?.length % 2 === 1 &&
                  index === getTonList?.data?.length - 1 &&
                  "w-full"
              )}
            >
              <div className="flex items-center gap-2">
                <Image
                  src="/images/fish.svg"
                  alt="Ton"
                  width={24}
                  height={24}
                />
                <div className="500 text-black  font-semibold leading-6 capitalize">
                  {item.amount.toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-col ">
                <Image src="/images/up.svg" alt="Ton" width={24} height={24} />
                <div className="flex items-center gap-2">
                  <Image
                    src="/images/star.png"
                    alt="Ton"
                    width={24}
                    height={24}
                  />

                  <div className="1_44 text-black  font-semibold leading-6 capitalize">
                    {item.priceStar.toLocaleString()}
                  </div>
                </div>
              </div>
              <Button className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl bg-white text text-[#00b7aa]  font-medium leading-6 capitalize">
                Buy
              </Button>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
