"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import useApi from "@/hooks/useApi";
import {
  initBackButton,
  retrieveLaunchParams,
  useLaunchParams,
  useUtils,
} from "@telegram-apps/sdk-react";
import { useUserStore } from "@/stores/provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home } from "@/components/common/Home";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Task } from "@/components/common/Task";
import { Friend } from "@/components/common/Friend";
import { Leaderboard } from "@/components/common/Leaderboard";
import { Wallet } from "@/components/common/Wallet";

const enum TABS {
  HOME = "home",
  TASK = "task",
  FRIEND = "friend",
  RANK = "rank",
  WALLET = "wallet",
}

const HomePage = () => {
  const { initDataRaw, initData } = retrieveLaunchParams();
  const lp = useLaunchParams();
  const loginInProgress = useRef(false);
  const [activeTab, setActiveTab] = React.useState<TABS>(TABS.HOME);
  const { user, saveUser } = useUserStore((state) => state);

  const [backButton] = initBackButton();

  const authApi = useApi({
    key: ["login"],
    method: "POST",
    url: "auth/login",
  }).post;

  const getMe = useApi({
    key: ["auth"],
    method: "GET",
    url: "user/me",
  }).get;

  const initAuth = async () => {
    // If login is already in progress, skip
    if (loginInProgress.current) return;
    loginInProgress.current = true;

    try {
      const existUser = localStorage.getItem("user");
      const existToken = localStorage.getItem("token");

      // Check if user changed
      if (existUser && initData?.user) {
        const localUser = JSON.parse(existUser);
        if (initData.user.id !== localUser.id) {
          localStorage.clear();
        }
      }

      // Update stored user
      if (initData?.user) {
        localStorage.setItem("user", JSON.stringify(initData.user));
      }

      // Only login if no token exists
      if (!existToken) {
        const response = await authApi?.mutateAsync({
          initData: initDataRaw,
          referralCode: lp.startParam,
        });

        if (response?.access_token) {
          localStorage.setItem("token", response.access_token);
        }
      }

      // Get user data
      const me = await getMe?.refetch();
      if (me?.data) {
        saveUser(me.data);
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
    } finally {
      loginInProgress.current = false;
    }
  };

  useEffect(() => {
    backButton.hide();
    initAuth();
  }, []);

  if (!user) return <div className="root__loading">Loading</div>;
  return (
    <div className="flex w-[var(--tg-viewport-width)] px-8 flex-col h-full items-center">
      <Tabs
        defaultValue="home"
        className={cn(
          "flex w-[var(--tg-viewport-width)] flex-col justify-between h-full items-center"
        )}
      >
        <TabsList
          className={cn(
            "inline-flex items-center gap-2 p-1 rounded-3xl bg-neutral-100 fixed bottom-[10px] z-10"
          )}
        >
          <TabsTrigger
            value="home"
            className="px-0 py-0"
            onClick={() => setActiveTab(TABS.HOME)}
          >
            {activeTab !== TABS.HOME ? (
              <div className="flex items-center gap-2 p-2 rounded-[1.25rem] bg-white">
                <Image
                  src="/images/home.svg"
                  alt="Home"
                  width={20}
                  height={20}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-[1.25rem] bg-[#3e997d]">
                <Image
                  src="/images/home-white.svg"
                  alt="Home"
                  width={20}
                  height={20}
                />
              </div>
            )}
            {activeTab === TABS.HOME && (
              <div className="text-black text-center  text-sm font-extrabold leading-6">
                Home
              </div>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="task"
            className="px-0 py-0"
            onClick={() => setActiveTab(TABS.TASK)}
          >
            {activeTab !== TABS.TASK ? (
              <div className="flex items-center gap-2 p-2 rounded-[1.25rem] bg-white">
                <Image
                  src="/images/task.svg"
                  alt="Tasks"
                  width={20}
                  height={20}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-[1.25rem] bg-[#3e997d]">
                <Image
                  src="/images/task-white.svg"
                  alt="Tasks"
                  width={20}
                  height={20}
                />
              </div>
            )}
            {activeTab === TABS.TASK && (
              <div className="text-black text-center  text-sm font-extrabold leading-6">
                Task
              </div>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="friend"
            className="px-0 py-0"
            onClick={() => setActiveTab(TABS.FRIEND)}
          >
            {activeTab !== TABS.FRIEND ? (
              <div className="flex items-center gap-2 p-2 rounded-[1.25rem] bg-white">
                <Image
                  src="/images/friend.svg"
                  alt="Friends"
                  width={20}
                  height={20}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-[1.25rem] bg-[#3e997d]">
                <Image
                  src="/images/friend-white.svg"
                  alt="Friends"
                  width={20}
                  height={20}
                />
              </div>
            )}
            {activeTab === TABS.FRIEND && (
              <div className="text-black text-center  text-sm font-extrabold leading-6">
                Friends
              </div>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="rank"
            className="px-0 py-0"
            onClick={() => setActiveTab(TABS.RANK)}
          >
            {activeTab !== TABS.RANK ? (
              <div className="flex items-center gap-2 p-2 rounded-[1.25rem] bg-white">
                <Image
                  src="/images/rank.svg"
                  alt="Rank"
                  width={20}
                  height={20}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-[1.25rem] bg-[#3e997d]">
                <Image
                  src="/images/rank-white.svg"
                  alt="Rank"
                  width={20}
                  height={20}
                />
              </div>
            )}
            {activeTab === TABS.RANK && (
              <div className="text-black text-center  text-sm font-extrabold leading-6">
                Activity
              </div>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="wallet"
            className="px-0 py-0"
            onClick={() => setActiveTab(TABS.WALLET)}
          >
            {activeTab !== TABS.WALLET ? (
              <div className="flex items-center gap-2 p-2 rounded-[1.25rem] bg-white">
                <Image
                  src="/images/wallet.svg"
                  alt="Wallet"
                  width={20}
                  height={20}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-[1.25rem] bg-[#3e997d]">
                <Image
                  src="/images/wallet-white.svg"
                  alt="Wallet"
                  width={20}
                  height={20}
                />
              </div>
            )}
            {activeTab === TABS.WALLET && (
              <div className="text-black text-center  text-sm font-extrabold leading-6">
                Wallet
              </div>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="home" className="pb-[120px]">
          <Home />
        </TabsContent>
        <TabsContent value="task" className="h-full">
          <Task />
        </TabsContent>
        <TabsContent value="friend" className="h-full">
          <Friend />
        </TabsContent>
        <TabsContent value="rank" className="h-full">
          <Leaderboard />
        </TabsContent>

        <TabsContent value="wallet" className="h-full w-full p-8">
          <Wallet />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomePage;
