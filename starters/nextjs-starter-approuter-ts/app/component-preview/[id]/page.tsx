import { notFound } from "next/navigation";
import { clientSmartComponentMap } from "../../../components/smart-components/client-components";

export default async function ComponentPreviewPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attrs: string }>;
}) {
  const searchParams = await props.searchParams;

  const { attrs } = searchParams;

  const params = await props.params;
  if (!params.id) {
    return notFound();
  }

  const decodedAttrs =
    attrs && typeof attrs === "string"
      ? JSON.parse(Buffer.from(attrs, "base64").toString())
      : {};

  const SmartComponent =
    clientSmartComponentMap[params.id?.toString()]?.reactComponent;

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
