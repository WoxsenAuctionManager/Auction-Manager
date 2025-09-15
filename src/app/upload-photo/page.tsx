import { AppLayout } from "@/components/app-layout";
import { UploadForm } from "@/components/pages/upload-photo";

export default function UploadPhoto() {
  return (
    <AppLayout>
      <h1 className="font-semibold text-3xl">Upload Photo</h1>
      <p className="text-muted-foreground mt-1">
        This is where you can upload photos to Firebase Storage using Server Actions.
      </p>
      <UploadForm />
    </AppLayout>
  );
}
