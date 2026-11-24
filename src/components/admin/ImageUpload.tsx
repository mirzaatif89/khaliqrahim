import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mediaUrl } from "@/lib/content";
import { uploadMedia } from "@/lib/upload";
import { cn } from "@/lib/utils";

export function ImageUpload({ value, onChange, folder, label, className }: { value: string; onChange: (v: string) => void; folder: string; label: string; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      onChange(await uploadMedia(f, folder));
      toast.success("Image uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-sm font-medium">{label}</p>
      <div className="relative">
        <button type="button" onClick={() => ref.current?.click()} className="grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted transition hover:border-primary">
          {busy ? <Loader2 className="size-6 animate-spin text-primary" /> : value ? <img src={mediaUrl(value)} alt="" className="size-full object-cover" /> : (
            <span className="flex flex-col items-center gap-2 text-xs text-muted-foreground"><ImagePlus className="size-6" /> Upload image</span>
          )}
        </button>
        {value && !busy && (
          <button type="button" onClick={() => onChange("")} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-card shadow-soft" aria-label="Remove image"><X className="size-4" /></button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}
