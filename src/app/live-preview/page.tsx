import { LivePreviewPage } from "@/components/pages/live-preview";
import { Suspense } from "react";

export default function LivePreview() {
  return (
    <Suspense>
      <LivePreviewPage />
    </Suspense>
  );
}
