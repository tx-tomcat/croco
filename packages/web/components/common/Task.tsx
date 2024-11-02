import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "@/lib/utils";
import Image from "next/image";
import useApi from "@/hooks/useApi";
import { Button } from "../ui/button";
import { Shop } from "./Shop";

export const Task = () => {
  const [showShop, setShowShop] = useState(false);

  useEffect(() => {}, []);

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

        <TabsContent
          value="active"
          className="w-full flex flex-col gap-2"
        ></TabsContent>
      </Tabs>
    </div>
  );
};
