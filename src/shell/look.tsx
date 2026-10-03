import { createContext, useContext, type ReactNode } from "react";
import type { Prefs } from "./catalog";

export type Look = {
  family: string;
  zen: boolean;
  light: boolean;
  rot: number;
  flip: boolean;
  zoom: number;
  fit: Prefs["fit"];
  pz: number;
  spread: "single" | "double";
  ts: number;
  wrap: boolean;
};

export const IDLE_LOOK: Look = {
  family: "other",
  zen: false,
  light: false,
  rot: 0,
  flip: false,
  zoom: 100,
  fit: "fill",
  pz: 100,
  spread: "single",
  ts: 0,
  wrap: false,
};

const LookContext = createContext<Look>(IDLE_LOOK);

export function LookProvider({ value, children }: { value: Look; children: ReactNode }) {
  return <LookContext.Provider value={value}>{children}</LookContext.Provider>;
}

export function useLook(): Look {
  return useContext(LookContext);
}
