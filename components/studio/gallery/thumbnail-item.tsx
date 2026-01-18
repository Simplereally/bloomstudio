import * as React from "react";
import { GalleryThumbnail } from "./gallery-thumbnail";
import { ThumbnailData } from "./types";

export interface ThumbnailItemProps {
  image: ThumbnailData;
  isActive: boolean;
  isChecked: boolean;
  onSelect: (image: ThumbnailData) => void;
  onCheckedChange: (id: string, checked: boolean) => void;
  showCheckbox: boolean;
  size: "sm" | "md" | "lg";
  className?: string;
}

export const ThumbnailItem = React.memo(function ThumbnailItem({
  image,
  isActive,
  isChecked,
  onSelect,
  onCheckedChange,
  showCheckbox,
  size,
  className,
}: ThumbnailItemProps) {
  // Create stable callbacks that use the image's data
  const handleClick = React.useCallback(() => {
    onSelect(image);
  }, [onSelect, image]);

  const handleChecked = React.useCallback(
    (checked: boolean) => {
      onCheckedChange(image.id, checked);
    },
    [onCheckedChange, image.id],
  );

  return (
    <GalleryThumbnail
      image={image}
      isActive={isActive}
      isChecked={isChecked}
      onClick={handleClick}
      onCheckedChange={handleChecked}
      showCheckbox={showCheckbox}
      size={size}
      className={className}
    />
  );
});
