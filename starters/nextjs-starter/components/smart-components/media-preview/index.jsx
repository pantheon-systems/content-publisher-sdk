"use client";

import { getPreviewComponentFromURL, SUPPORTED_PROVIDERS } from "./providers";

const MediaPreview = ({ url, isSmartComponentPreview }) => {
  const previewComponent = getPreviewComponentFromURL(url);

  if (!previewComponent) {
    if (isSmartComponentPreview) {
      return (
        <div className="flex w-full items-center justify-center rounded-md bg-[#1d1d28] p-4 text-center text-white">
          <p className="my-2 max-w-[400px] text-left text-4xl font-medium">
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
