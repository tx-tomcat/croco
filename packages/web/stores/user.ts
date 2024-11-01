import { createStore } from "zustand/vanilla";

export type UserState = {
  user: User | null;
  activeTab: string;
  checkUserExists: boolean;
  isInitialNavigation: boolean;
};

export type UserActions = {
  saveUser: (user: any) => void;
  deleteUser: () => void;
  setActiveTab: (tab: string) => void;
  setCheckUserExists: (checkUserExists: boolean) => void;
  setIsInitialNavigation: (isInitialNavigation: boolean) => void;
};

export type UserStore = UserState & UserActions;

export const defaultInitState: UserState = {
  user: null,
  activeTab: "home",
  checkUserExists: false,
  isInitialNavigation: false,
};

export const createUserStore = (initState: UserState = defaultInitState) => {
  return createStore<UserStore>()((set) => ({
    ...initState,
    saveUser: (user) => set(() => ({ user })),
    setActiveTab: (activeTab) => set(() => ({ activeTab })),
    deleteUser: () => set(() => ({ user: null })),
    setCheckUserExists: (checkUserExists) => set(() => ({ checkUserExists })),
    setIsInitialNavigation: (isInitialNavigation: boolean) =>
      set(() => ({ isInitialNavigation })),
  }));
};
export type User = {
  id: number;
  telegramId: string;
  firstName: string;
  lastName: string;
  username: string;
  walletAddress: string | null;
  photoUrl: string;
  isPremium: boolean;
  languageCode: string;
  crocoBalance: number;
  fishBalance: number;
  lastDailyReward: string | null;
  streakDays: number;
  referralCode: string;
  referredByCode: string | null;
  referralLevel: number;
  treePath: string | null;
  createdAt: string;
  updatedAt: string;
  xrplAddress: string;
  xrplSeed: string;
  xrplPublicKey: string;
  xrplPrivateKey: string;
};
