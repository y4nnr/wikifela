import type { Metadata } from "next";
import TapissageClient from "./TapissageClient";

export const metadata: Metadata = {
  title: "Tapissage — wikifela",
  description: "Identifiez les accusés dans un tapissage policier.",
};

export default function TapissagePage() {
  return <TapissageClient />;
}
