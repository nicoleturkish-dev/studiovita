import { Placeholder } from "@/components/Placeholder";
import { resolvePhoto } from "@/components/ImageUpload";

export function Photo({ url, alt, label, className = "", minH = "min-h-[280px]", rounded = true }) {
  if (url) {
    return (
      <img
        src={resolvePhoto(url)}
        alt={alt || label || ""}
        className={`w-full h-full object-cover ${rounded ? "rounded-[2rem]" : ""} ${minH} ${className}`}
        data-testid="photo"
      />
    );
  }
  return <Placeholder label={label} minH={minH} className={className} />;
}
