import type { Weather } from "./weather";

export type SavedComparison = {
  id: string;
  firstCity: string;
  secondCity: string;
  firstWeather: Weather;
  secondWeather: Weather;
  comparedUtc: string;
};
