import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export function resolvePhoto(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BACKEND_URL}${url}`;
}

export default function ImageUpload({ value, onChange, label = "Kép" }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/uploads", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data.url);
      toast.success("Feltöltve");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Sikertelen feltöltés");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="col-span-2">
      <div className="text-xs uppercase tracking-widest text-[#9A8F83] mb-2">{label}</div>
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-[#EAE5DE] bg-[#F3EFEA]">
            <img src={resolvePhoto(value)} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange("")} data-testid="image-remove"
              className="absolute top-1 right-1 bg-white/90 rounded-full p-1 hover:bg-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-2xl border border-dashed border-[#B5A79A] bg-[#F3EFEA]/50 grid place-items-center text-[#9A8F83] text-xs italic">nincs kép</div>
        )}
        <div>
          <input ref={inputRef} type="file" accept="image/*" onChange={handle} className="hidden" data-testid="image-input" />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            data-testid="image-upload-btn"
            className="inline-flex items-center gap-2 rounded-full bg-[#7A5C50] text-white px-4 py-2 text-sm hover:bg-[#63584D] disabled:opacity-60">
            <Upload className="w-4 h-4" /> {uploading ? "Feltöltés…" : "Kép feltöltése"}
          </button>
          <p className="mt-2 text-xs text-[#9A8F83]">JPG, PNG, WEBP · max 8 MB</p>
        </div>
      </div>
    </div>
  );
}
