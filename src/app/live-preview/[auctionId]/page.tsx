import { LivePreviewPage } from "@/components/pages/live-preview";

export default function LiveAuction({ params }: { params: { auctionId: string } }) {
  return <LivePreviewPage auctionId={params.auctionId} />;
}
