import { notFound } from "next/navigation";
import { Suspense } from "react";
import { clientSmartComponentMap } from "../../../components/smart-components/client-components";

async function PreviewContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attrs: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const { attrs } = resolvedSearchParams;

  const resolvedParams = await params;
  if (!resolvedParams.id) {
    return notFound();
  }

  const decodedAttrs =
    attrs && typeof attrs === "string"
      ? JSON.parse(Buffer.from(attrs, "base64").toString())
      : {};

  const SmartComponent =
    clientSmartComponentMap[resolvedParams.id?.toString()]?.reactComponent;

  return (
    <div>
      {SmartComponent ? (
        <div>
          <SmartComponent isSmartComponentPreview {...decodedAttrs} />
        </div>
      ) : (
        <div>Component not found</div>
      )}
    </div>
  );
}

export default function ComponentPreviewPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attrs: string }>;
}) {
  return (
    <Suspense>
      <PreviewContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
