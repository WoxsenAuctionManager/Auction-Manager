import { AppLayout } from "@/components/app-layout";
import { LivePreviewPage } from "@/components/pages/live-preview";
import { Suspense } from "react";

export default function LivePreview() {
  return (
    <AppLayout showNav={false}>
      <Suspense fallback={<div>Loading...</div>}>
        <LivePreviewPage />
      </Suspense>
    </AppLayout>
  );
}
