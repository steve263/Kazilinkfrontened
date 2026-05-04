import dynamic from "next/dynamic";

const MapPageClient = dynamic(() => import("./MapPageClient"), { ssr: false });

export default function Page() {
  return <MapPageClient />;
}
