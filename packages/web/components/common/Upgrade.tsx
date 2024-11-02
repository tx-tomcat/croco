import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "@/lib/utils";
import Image from "next/image";
import useApi from "@/hooks/useApi";
import { Button } from "../ui/button";
import { Shop } from "./Shop";
import { useUserStore } from "@/stores/provider";
import { getCurrentSpeed, getNextSpeedLevel } from "@/utils/utils";
import { useToast } from "../ui/use-toast";

export const Upgrade = () => {
  const { toast } = useToast();
  const [showShop, setShowShop] = useState(false);
  const { user, saveUser } = useUserStore((state) => state);

  const getSpeedList = useApi({
    key: ["getSpeedList"],
    method: "GET",
    url: "user/speed-list",
  }).get;

  const getMe = useApi({
    key: ["getMe"],
    method: "GET",
    url: "user/me",
  }).get;

  const getBoostList = useApi({
    key: ["getBoostList"],
    method: "GET",
    url: "user/boost-list",
  }).get;

  const speedUpgradeApi = useApi({
    key: ["speedUpgrade"],
    method: "POST",
    url: "speed-upgrade/purchase",
  }).post;

  const autoHatchApi = useApi({
    key: ["autoHatch"],
    method: "POST",
    url: "auto-hatching/purchase",
  }).post;

  const boostPurchaseApi = useApi({
    key: ["boostPurchase"],
    method: "POST",
    url: "boosts/purchase",
  }).post;

  useEffect(() => {
    getSpeedList?.refetch();
    getBoostList?.refetch();
  }, []);

  const currentSpeed = useMemo(() => {
    return getCurrentSpeed(user?.speedUpgrade || []);
  }, [user?.speedUpgrade]);

  if (showShop) {
    return <Shop />;
  }

  return (
    <div className="flex flex-col items-start gap-2 self-stretch px-8 py-4 w-[var(--tg-viewport-width)]">
      <Tabs
        defaultValue="speed"
        className={cn(
          "flex w-full flex-col justify-between h-full items-center"
        )}
      >
        <TabsList
          className={cn(
            "flex items-center gap-8 py-2 px-4 rounded-[1.25rem] bg-neutral-100"
          )}
        >
          <TabsTrigger value="speed" className="px-0 py-0">
            <div className="text-center  leading-6">Speed</div>
          </TabsTrigger>
          <TabsTrigger value="auto" className="px-0 py-0 ">
            <div className="text-center  leading-6">Auto</div>
          </TabsTrigger>
          <TabsTrigger value="boosts" className="px-0 py-0">
            <div className="text-center leading-6">Boosts</div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="speed" className="w-full flex flex-col gap-2">
          <div className="flex flex-col items-start gap-4 self-stretch p-4 rounded-3xl border border-white mt-2">
            <div className="flex items-center">
              <Image
                src="/images/croco.png"
                alt="Coin"
                width={32}
                height={32}
              />
              <div className="13_000 text-[#3e997d] text-2xl leading-8 capitalize">
                {user?.crocoBalance.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="w-full flex flex-wrap gap-2">
            {getSpeedList?.data?.map((item: any, index: number) => (
              <div
                key={item.id}
                className={cn(
                  "flex w-[48%]",
                  index === getSpeedList?.data?.length - 1 && "w-full"
                )}
              >
                <div className="lex flex-col items-start gap-2 p-4 rounded-3xl border border-white w-full">
                  <div className="x2_tokens_every_4_hours self-stretch text-black text-sm font-semibold leading-6 capitalize">
                    x{item.speed} tokens every 4 hours
                  </div>
                  <div className="flex items-center">
                    <Image
                      src="/images/croco.png"
                      alt="Coin"
                      width={24}
                      height={24}
                    />
                    <div className="10_000 text-[#3e997d] text-sm font-semibold leading-6 capitalize">
                      {item.price.toLocaleString()}
                    </div>
                  </div>
                  <Button
                    disabled={
                      (user?.crocoBalance && user?.crocoBalance < item.price) ||
                      getNextSpeedLevel(currentSpeed) != item.speed ||
                      speedUpgradeApi?.isPending
                    }
                    isLoading={speedUpgradeApi?.isPending}
                    className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl bg-white text text-[#00b7aa] font-medium leading-6 capitalize w-full"
                    onClick={() =>
                      speedUpgradeApi
                        ?.mutateAsync({
                          packageId: item.id,
                        })
                        .then(() =>
                          getMe?.refetch().then((resp) => {
                            if (resp.data) {
                              saveUser(resp.data);
                            }
                          })
                        )
                    }
                  >
                    {user?.crocoBalance && user?.crocoBalance >= item.price
                      ? getNextSpeedLevel(currentSpeed) === item.speed
                        ? "Upgrade"
                        : "Not available"
                      : "Not enough"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="auto" className="h-full w-full flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4 self-stretch p-4 rounded-3xl border border-white mt-2">
            <div className="flex items-center">
              <Image src="/images/fish.svg" alt="Coin" width={32} height={32} />
              <div className="13_000 text-[#3e997d] text-2xl leading-8 capitalize">
                {user?.fishBalance.toLocaleString()}
              </div>
            </div>
            <Image
              src="/images/plus.svg"
              alt="Auto"
              width={32}
              height={32}
              onClick={() => setShowShop(true)}
            />
          </div>
          <div className="frame_5 flex flex-col items-center gap-1 p-4 rounded-3xl border border-white">
            <Image
              src="/images/croco 2.png"
              alt="Hatching"
              width={268}
              height={133}
            />
            <div className="automatic_hatching self-stretch text-black text-sm font-semibold leading-6 capitalize">
              Automatic hatching
            </div>
            <div className="flex items-center gap-1 w-full">
              <Image src="/images/fish.svg" alt="Coin" width={24} height={25} />
              <div className="500 text-[#3e997d] text-sm  leading-6 capitalize">
                500
              </div>
            </div>
            <Button
              isLoading={autoHatchApi?.isPending}
              disabled={autoHatchApi?.isPending || !!user?.autoHatching}
              className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl bg-white text text-[#00b7aa] font-medium leading-6 capitalize"
              onClick={() =>
                autoHatchApi
                  ?.mutateAsync({})
                  .then((resp) => {
                    toast({
                      description: resp.success
                        ? "Auto hatching purchased"
                        : resp.message,
                      variant: resp.success ? "success" : "error",
                      duration: 2000,
                    });
                    getMe?.refetch().then((resp) => {
                      if (resp.data) {
                        saveUser(resp.data);
                      }
                    });
                  })
                  .catch(() => {
                    toast({
                      description: "Something went wrong",
                      variant: "error",
                      duration: 2000,
                    });
                  })
              }
            >
              {user?.autoHatching ? "Active" : "Buy"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="boosts" className=" w-full flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4 self-stretch p-4 rounded-3xl border border-white mt-2">
            <div className="flex items-center">
              <Image src="/images/fish.svg" alt="Coin" width={32} height={32} />
              <div className="13_000 text-[#3e997d] text-2xl leading-8 capitalize">
                {user?.fishBalance.toLocaleString()}
              </div>
            </div>
            <Image
              src="/images/plus.svg"
              alt="Auto"
              width={32}
              height={32}
              onClick={() => setShowShop(true)}
            />
          </div>
          <div className="w-full flex flex-wrap gap-2">
            {getBoostList?.data?.map((item: any, index: number) => (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-4 rounded-3xl border border-white w-[48%]",
                  getBoostList?.data?.length % 2 === 1 &&
                    index === getBoostList?.data?.length - 1 &&
                    "w-full"
                )}
              >
                <div className=" self-stretch text-black  text-sm font-semibold leading-6 capitalize">
                  Get x{item.speed} hatch speed for {item.duration} days
                </div>
                <div className="flex items-center">
                  <Image
                    src="/images/fish.svg"
                    alt="Coin"
                    width={24}
                    height={25}
                  />
                  <div className="500 text-[#3e997d]  text-sm font-semibold leading-6 capitalize">
                    {item.fishPrice.toLocaleString()}
                  </div>
                </div>
                <Button
                  isLoading={boostPurchaseApi?.isPending}
                  disabled={boostPurchaseApi?.isPending}
                  className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl bg-white text text-[#00b7aa]  font-medium leading-6 capitalize"
                  onClick={() =>
                    boostPurchaseApi
                      ?.mutateAsync({ boostId: item.id })
                      .then((resp) => {
                        toast({
                          description: resp.success
                            ? "Boost purchased"
                            : resp.message,
                          variant: resp.success ? "success" : "error",
                          duration: 2000,
                        });
                        getMe?.refetch().then((resp) => {
                          if (resp.data) {
                            saveUser(resp.data);
                          }
                        });
                      })
                      .catch(() => {
                        toast({
                          description: "Something went wrong",
                          variant: "error",
                          duration: 2000,
                        });
                      })
                  }
                >
                  Buy
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
