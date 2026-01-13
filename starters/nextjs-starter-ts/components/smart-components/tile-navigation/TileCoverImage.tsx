interface TileCoverImageProps {
  imageSrc: string | null | undefined;
  imageAltText?: string | undefined;
}

// Simple component for placeholder images
function TileCoverImage({ imageSrc, imageAltText }: TileCoverImageProps) {
  return imageSrc != null ? (
    <img
      src={imageSrc}
      alt={imageAltText}
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="h-full w-full bg-gradient-to-t from-neutral-800 to-neutral-100" />
  );
}

export default TileCoverImage;
