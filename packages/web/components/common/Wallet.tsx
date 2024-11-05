import Image from "next/image";
import { Button } from "../ui/button";
import { useUserStore } from "@/stores/provider";
import { Avatar } from "../ui/avatar";
import { useRouter } from "next/navigation";
import useApi from "@/hooks/useApi";
import { shortenAddress } from "@/utils/utils";
import xrpl from "xrpl";
import { useEffect } from "react";
import { formatXrpBalance, useXrplBalance } from "@/hooks/useXrplBalance";
import { useXrplFaucet } from "@/hooks/useXrplFaucet";
import { useToast } from "../ui/use-toast";
export const Wallet = () => {
  const { user, saveUser } = useUserStore((state) => state);
  const { requestFunds } = useXrplFaucet();
  const { toast } = useToast();

  const { xrp, refreshBalance } = useXrplBalance(
    user?.xrplAddress || "",
    "testnet"
  );

  const handleRequestFunds = async () => {
    await requestFunds(user?.xrplAddress || "");
    // Refresh balance after successful request
    refreshBalance();
  };

  const router = useRouter();
  const createWalletApi = useApi({
    method: "POST",
    url: "user/create-wallet",
    key: ["create-wallet"],
  }).post;

  if (!user?.xrplAddress)
    return (
      <div className="flex flex-col items-center gap-1 w-full">
        <div className="wallet self-stretch text-black text-center text-[2.125rem] leading-[42px] capitalize">
          wallet
        </div>
        <Button
          onClick={() => router.push("/import-wallet")}
          className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl bg-white text text-[#00b7aa] font-medium leading-6 capitalize"
        >
          Import wallet
        </Button>
        <Button
          onClick={() =>
            createWalletApi?.mutateAsync({}).then(async (walletData) => {
              const { address, publicKey } = walletData;
              saveUser({
                ...user,
                xrplAddress: address,
                xrplPublicKey: publicKey,
              });
            })
          }
          disabled={createWalletApi?.isPending}
          isLoading={createWalletApi?.isPending}
          className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl bg-white text-1 text-[#00b7aa] font-medium leading-6 capitalize"
        >
          Create New Wallet
        </Button>
      </div>
    );

  const logout = () => {
    const removedWallet = {
      ...user,
      xrplAddress: undefined,
      xrplSeed: undefined,
      xrplPublicKey: undefined,
      xrplPrivateKey: undefined,
    };
    saveUser(removedWallet);
  };
  return (
    <div className="flex flex-col items-start gap-2 p-4 w-full rounded-3xl border border-white">
      <div className="flex items-center gap-4 self-stretch">
        <Avatar className="flex justify-center items-center pb-[0.025px] pt-px px-0 w-12 h-12 rounded-full bg-[#3e997d]">
          <Image src="/images/avatar.png" alt="Check" width={48} height={46} />
        </Avatar>
        <div className="hi_koko_ text-black text-2xl leading-8 capitalize">
          Hi {`${user?.firstName} ${user?.lastName}` || user?.username}!
        </div>
      </div>
      <div className="flex items-center">
        <div className="rkzqep___3333 text-[#3e997d] leading-6 capitalize">
          {shortenAddress(user?.xrplAddress || "")}
        </div>
        <Image
          src="/images/copy.svg"
          alt="Check"
          width={24}
          height={24}
          onClick={() => {
            navigator.clipboard.writeText(user?.xrplAddress || "");
            toast({
              description: "Copied to clipboard",
              duration: 2000,
            });
          }}
        />
      </div>
      <div className="flex items-center">
        <Image src="/images/xrp.svg" alt="Check" width={24} height={24} />
        <div className="3_333 text-[#3e997d] text-xl leading-7 capitalize">
          {formatXrpBalance(xrp)}
        </div>
      </div>
      <div className="flex items-start gap-2 self-stretch w-full">
        <Button
          onClick={() => router.push("/deposit")}
          className="button flex justify-center items-center gap-2 py-2 px-4 rounded-2xl bg-white text text-[#00b7aa] font-medium leading-6 capitalize w-full"
        >
          Deposit
        </Button>
        <Button
          onClick={() => router.push("/transfer")}
          className="button-1 flex justify-center items-center gap-2 py-2 px-4 rounded-2xl bg-white text-1 text-[#00b7aa] font-medium leading-6 capitalize w-full"
        >
          Transfer
        </Button>
        <Button
          onClick={() => handleRequestFunds()}
          className="button-1 flex justify-center items-center gap-2 py-2 px-4 rounded-2xl bg-white text-1 text-[#00b7aa] font-medium leading-6 capitalize w-full"
        >
          Faucet
        </Button>
      </div>
      <Button
        onClick={() => router.push("/private-key")}
        className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl border border-[#1f1f1f] bg-transparent text-2 text-black font-medium leading-6 capitalize"
      >
        Private key
      </Button>
      <Button
        onClick={() => logout()}
        className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl border border-[#1f1f1f] bg-transparent text-3 text-[#e03232] font-medium leading-6 capitalize"
      >
        Logout
      </Button>
    </div>
  );
};
