import { CSSProperties, forwardRef, ImgHTMLAttributes } from "react";
import { assetPath } from "./assetPath";

type ImageLikeSource = string | { src: string };

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: ImageLikeSource;
  fill?: boolean;
  priority?: boolean;
};

const Image = forwardRef<HTMLImageElement, Props>(function Image(
  { src, alt, fill, style, priority, ...rest },
  ref
) {
  const rawSrc = typeof src === "string" ? src : src.src;
  const resolvedSrc = assetPath(rawSrc);
  const mergedStyle: CSSProperties = fill
    ? {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        ...style
      }
    : style || {};

  return (
    <img
      ref={ref}
      src={resolvedSrc}
      alt={alt || ""}
      loading={priority ? "eager" : "lazy"}
      style={mergedStyle}
      {...rest}
    />
  );
});

export default Image;
