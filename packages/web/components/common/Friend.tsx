import useApi from "@/hooks/useApi";
import { useUserStore } from "@/stores/provider";
import Image from "next/image";
import { useEffect } from "react";
import { Button } from "../ui/button";
import { Avatar } from "../ui/avatar";
import { useToast } from "../ui/use-toast";
import { useUtils } from "@telegram-apps/sdk-react";

export const Friend = () => {
  const { user } = useUserStore((state) => state);
  const { toast } = useToast();
  const utils = useUtils();
  const getRefereesApi = useApi({
    key: ["referees"],
    method: "GET",
    url: `user/referees/${user?.referralCode}`,
  }).get;

  useEffect(() => {
    getRefereesApi?.refetch();
  }, [user?.referralCode]);

  const onShare = async () => {
    try {
      if (!user?.referralCode) return;
      utils.shareURL(
        "https://t.me/crocoxrplbot/join?startapp=" + user?.referralCode,
        "Incubate your eggs"
      );
    } catch (error) {
      console.log(error);
    }
  };

  const onCopy = async () => {
    try {
      if (!user?.referralCode) return;
      navigator.clipboard.writeText(
        "https://t.me/crocoxrplbot/join?startapp=" + user?.referralCode
      );
      toast({
        description: "Copied to clipboard",
        variant: "success",
        duration: 1000,
      });
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="flex flex-col items-center gap-1 w-full px-12">
      {getRefereesApi?.data?.referees.length === 0 && (
        <Image src="/images/croco3.png" alt="Friend" width={300} height={300} />
      )}
      <div className="invite_friends self-stretch text-black text-center  text-[2.125rem] leading-[42px] capitalize">
        Invite Friends
      </div>
      <div className="self-stretch text-black text-center  font-light leading-6">
        Earn 15% for your direct referrals, 8% for their referrals, then 5%, 2%,
        and 1% for your fifth-level referrals.{" "}
      </div>
      <div className="flex justify-center items-center gap-2 w-full z-10">
        <Button
          onClick={onShare}
          className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-lg bg-primary text text-white  text-sm leading-6 uppercase  h-fit"
        >
          Share
        </Button>
        <Button
          onClick={onCopy}
          className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-lg bg-primary text text-white  text-sm leading-6 uppercase  h-fit"
        >
          Copy
        </Button>
      </div>
      {getRefereesApi?.data?.referees.length > 0 && (
        <div className="flex items-center">
          <Image
            src="/images/croco.png"
            alt="lightgray"
            width={20}
            height={20}
          />
          <div className="2_500 text-[#3e997d] text-2xl leading-8 capitalize">
            {(user?.totalTokenReferral || 0) -
              (user?.claimedTokenReferral || 0)}
          </div>
        </div>
      )}
      {getRefereesApi?.data?.referees.length > 0 && (
        <Button className="flex justify-center items-center gap-2 self-stretch py-2 px-4 rounded-2xl bg-white text text-[#00b7aa] font-medium leading-6 capitalize">
          Claim
        </Button>
      )}
      {getRefereesApi?.data?.referees.length > 0 && (
        <div className="2_friends self-stretch text-black text-center text-sm font-extrabold leading-6">
          {getRefereesApi?.data?.referees?.length || 0} Friends
        </div>
      )}
      {getRefereesApi?.data?.referees?.map((referee: any, index: number) => (
        <div
          className=" flex justify-between items-center p-4 rounded-3xl border border-white"
          key={index}
        >
          <div className="flex items-center gap-1">
            <Avatar className="flex justify-center items-center pb-[0.025px] pt-px px-0 w-12 h-12 rounded-full bg-[#3e997d]">
              <Image
                src="/images/avatar.png"
                alt="Avatar"
                width={48}
                height={48}
              />
            </Avatar>
            <div className="flex flex-col justify-center items-start">
              <div className="samlongleg text-black text-sm font-semibold leading-6 capitalize">
                {`${referee.firstName} ${referee.lastName}` || referee.username}
              </div>
              <div className="flex items-center gap-1">
                <Image
                  src="/images/friend.svg"
                  alt="Lightgray"
                  width={12}
                  height={12}
                />
                <div className="2 text-[#3e997d] text-sm font-semibold leading-6 capitalize">
                  0
                </div>
              </div>
            </div>
          </div>
          <div className="1_500 text-[#3e997d] text-sm font-semibold leading-6 capitalize">
            {referee.referralToken.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};
