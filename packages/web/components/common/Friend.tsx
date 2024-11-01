import Image from "next/image";

export const Friend = () => {
  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <Image src="/images/croco3.png" alt="Friend" width={300} height={300} />
      <div className="invite_friends self-stretch text-black text-center  text-[2.125rem] leading-[42px] capitalize">
        Invite Friends
      </div>
      <div className="self-stretch text-black text-center  font-light leading-6">
        Earn 15% for your direct referrals, 8% for their referrals, then 5%, 2%,
        and 1% for your fifth-level referrals.{" "}
      </div>
    </div>
  );
};
