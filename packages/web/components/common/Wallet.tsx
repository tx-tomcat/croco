import Image from "next/image";
import { Button } from "../ui/button";
import { useUserStore } from "@/stores/provider";
import { shortenAddress } from "@/utils/utils";

export const Wallet = () => {
  const { user, saveUser } = useUserStore((state) => state);
  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <div className="flex flex-col items-center gap-1 w-full">
        <div className="wallet self-stretch text-black text-center  text-[2.125rem] leading-[42px] capitalize">
          wallet
        </div>
        <div className="w-2/3 text-black text-center  font-light leading-6">
          Connect your XRPL wallet for future rewards
        </div>
        <Button className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl bg-white">
          <Image src="/images/ton.svg" alt="Wallet" width={20} height={20} />
          <div className="text text-[#00b7aa]  font-medium leading-6 capitalize">
            {user?.xrplAddress
              ? `${shortenAddress(user.xrplAddress)}`
              : "Connect wallet"}
          </div>
        </Button>
      </div>
    </div>
  );
};
