import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Track Your Order | AaaS Atelier",
  description: "Track the shipping status of your handcrafted orders from AaaS Atelier securely with your order number and phone number.",
  alternates: {
    canonical: getCanonicalUrl("/track-order"),
  },
  openGraph: {
    title: "Track Your Order | AaaS Atelier",
    description: "Track the shipping status of your handcrafted orders from AaaS Atelier securely with your order number and phone number.",
  },
};

export default function TrackOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
