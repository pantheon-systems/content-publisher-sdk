"use client";

import { getPreviewComponentFromURL, SUPPORTED_PROVIDERS } from "./providers";

interface Props {
  url: string;
  isSmartComponentPreview?: boolean;
}

const MediaPreview = ({ url, isSmartComponentPreview }: Props) => {
  const previewComponent = getPreviewComponentFromURL(url);

  if (!previewComponent) {
    if (isSmartComponentPreview) {
      return (
        <div className="w-full max-w-[400px] rounded-md p-4 outline outline-black/10">
          <p className="my-2 text-4xl font-medium">
            Paste the URL you want to embed on the right 👉
          </p>
        </div>
      );
    }

    return (
      <div className="w-full max-w-[400px] rounded-md p-4 outline outline-black/10">
        <p className="my-2 text-lg font-medium">
          Unsupported Media Preview URL &quot;{url}&quot;
        </p>
        <p className="text-sm">
          Supported Platforms: {SUPPORTED_PROVIDERS.join(", ")}
        </p>
      </div>
    );
  }

  return <div className="w-full">{previewComponent}</div>;
};

export default MediaPreview;
