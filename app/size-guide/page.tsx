import { ComingSoon } from "@/components/store/ComingSoon";
import { previewPages, previewPageMetadata } from "@/features/content/preview-pages";

export const metadata = previewPageMetadata("sizeGuide");

export default function Page() {
  return <ComingSoon page={previewPages.sizeGuide} />;
}
