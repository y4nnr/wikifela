import { Suspense } from "react";
import GeoFelaClient from "./GeoFelaClient";

export const metadata = {
  title: "GeoFELA — wikifela",
  description: "Identifiez l'affaire à partir de ses lieux sur la carte de France.",
};

export default function GeoFelaPage() {
  return (
    <Suspense fallback={null}>
      <GeoFelaClient />
    </Suspense>
  );
}
