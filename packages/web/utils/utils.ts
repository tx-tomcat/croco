import axios from "axios";
interface SelectedSpeed {
  id: number;
  speed: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

interface SpeedUpgrade {
  id: number;
  userId: number;
  speedId: number;
  createdAt: string;
  updatedAt: string;
  selectedSpeed: SelectedSpeed;
}
export const axiosInstance = axios.create({
  baseURL: process.env.BACKEND_URL,
});

const data = [
  { year: 2014, cumulativeDownloads: 35000000, age: 10 },
  { year: 2015, cumulativeDownloads: 85000000, age: 9 },
  { year: 2016, cumulativeDownloads: 165000000, age: 8 },
  { year: 2017, cumulativeDownloads: 315000000, age: 7 },
  { year: 2018, cumulativeDownloads: 515000000, age: 6 },
  { year: 2019, cumulativeDownloads: 815000000, age: 5 },
  { year: 2020, cumulativeDownloads: 1215000000, age: 4 },
  { year: 2021, cumulativeDownloads: 1765000000, age: 3 },
  { year: 2022, cumulativeDownloads: 2465000000, age: 2 },
  { year: 2023, cumulativeDownloads: 3265000000, age: 1 },
  { year: 2024, cumulativeDownloads: 4165000000, age: 0.5 },
];

export const BASE_HATCH_TIME = 4 * 60 * 60 * 1000;
export const BASE_REWARD_AMOUNT = 144;

export function getTelegramUserAge(userId: number): number {
  for (let i = 0; i < data.length; i++) {
    if (userId <= data[i].cumulativeDownloads) {
      return data[i].age + 1;
    }
  }
  return 1;
}

export function getLevelByLimit(limit: number): number {
  if (limit < 500) {
    return 0;
  }

  return Math.floor((limit - 500) / 100);
}

export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const getCurrentSpeed = (speedUpgrades: SpeedUpgrade[]): number => {
  if (!speedUpgrades || speedUpgrades.length === 0) {
    return 1; // Default speed if no upgrades
  }

  // Find max speed using reduce
  return speedUpgrades.reduce((maxSpeed, upgrade) => {
    return Math.max(maxSpeed, upgrade.selectedSpeed.speed);
  }, 1);
};

// Alternative using map and Math.max
export const getCurrentSpeedAlt = (speedUpgrades: SpeedUpgrade[]): number => {
  if (!speedUpgrades || speedUpgrades.length === 0) {
    return 1; // Default speed if no upgrades
  }

  return Math.max(
    ...speedUpgrades.map((upgrade) => upgrade.selectedSpeed.speed)
  );
};

export const getNextSpeedLevel = (speed: number): number => {
  switch (speed) {
    case 1:
      return 2;
    case 2:
      return 3;
    case 3:
      return 5;
    case 5:
      return 8;
    case 8:
      return 13;
    case 13:
      return 20;
    case 20:
      return 25;
    default:
      return speed;
  }
};
