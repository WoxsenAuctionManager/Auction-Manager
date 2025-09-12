import { AppLayout } from "@/components/app-layout";
import { AuctionsListPage } from "@/components/pages/auctions-list";

export default function Home() {
  return (
    <AppLayout showNav={false}>
      <AuctionsListPage />
    </AppLayout>
  );
}
