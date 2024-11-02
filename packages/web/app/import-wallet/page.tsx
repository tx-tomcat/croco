"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useApi from "@/hooks/useApi";
import { useUserStore } from "@/stores/provider";
import { initBackButton } from "@telegram-apps/sdk-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const ImportWallet = () => {
  const { user, saveUser } = useUserStore((state) => state);
  const [backButton] = initBackButton();
  const router = useRouter();
  useEffect(() => {
    backButton.show();
    backButton.on("click", () => {
      router.back();
    });
  }, []);

  const getMeApi = useApi({
    method: "GET",
    url: "user/me",
    key: ["me"],
  }).get;

  const importWalletApi = useApi({
    method: "POST",
    url: "user/import-wallet",
    key: ["import-wallet"],
  }).post;
  return (
    <div className="flex flex-col items-center gap-1 w-full px-12 pt-4">
      <div className="wallet self-stretch text-black text-center text-[2.125rem] leading-[42px] capitalize">
        wallet
      </div>
      <Input
        className="flex items-start gap-4 self-stretch py-2 px-3 rounded-xl bg-white text text-black text-sm font-light leading-6"
        placeholder=" Enter your private key to login"
        value={"sEdVN2Zs63pM6vQPK8s642Uo5YV8ygF"}
      />

      <Button
        onClick={() =>
          importWalletApi
            ?.mutateAsync({
              privateKey: "sEdVN2Zs63pM6vQPK8s642Uo5YV8ygF",
            })
            .then((res) => {
              getMeApi?.refetch().then((res) => {
                saveUser(res.data);
                router.push("/");
              });
            })
        }
        disabled={importWalletApi?.isPending}
        isLoading={importWalletApi?.isPending}
        className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl bg-white text-1 text-[#00b7aa] font-medium leading-6 capitalize"
      >
        Continue
      </Button>
    </div>
  );
};

export default ImportWallet;
