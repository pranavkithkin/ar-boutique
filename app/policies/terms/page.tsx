import { ComingSoon } from "@/components/store/ComingSoon";
import { previewPages, previewPageMetadata } from "@/features/content/preview-pages";

export const metadata = previewPageMetadata("terms");

export default function Page() {
  return <ComingSoon page={previewPages.terms} />;
}
