import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { UploadCloudIcon } from 'lucide-react';
import { toast } from 'sonner';

const PDF_MIME = 'application/pdf';

interface UploadDropzoneProps {
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  children: ReactNode;
}

/**
 * Wraps the folder contents. Dropping outside the zone must not navigate the
 * browser away to the file, which is its default behaviour, so the window
 * gets its own suppressors as well.
 */
export function UploadDropzone({
  disabled = false,
  onFiles,
  children,
}: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  // dragenter/dragleave fire for every child element; a counter keeps the
  // highlight from flickering as the pointer crosses them.
  const depth = useRef(0);

  useEffect(() => {
    const suppress = (event: DragEvent) => event.preventDefault();

    window.addEventListener('dragover', suppress);
    window.addEventListener('drop', suppress);
    return () => {
      window.removeEventListener('dragover', suppress);
      window.removeEventListener('drop', suppress);
    };
  }, []);

  const accept = useCallback(
    (fileList: FileList | null) => {
      const all = Array.from(fileList ?? []);
      const pdfs = all.filter((file) => isPdf(file));

      for (const rejected of all.filter((file) => !isPdf(file))) {
        toast.error(`${rejected.name} is not a PDF and was skipped.`);
      }
      if (pdfs.length > 0) onFiles(pdfs);
    },
    [onFiles],
  );

  return (
    <div
      className="relative"
      onDragEnter={(event) => {
        event.preventDefault();
        if (disabled) return;
        depth.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        event.preventDefault();
        depth.current -= 1;
        if (depth.current <= 0) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        depth.current = 0;
        setDragging(false);
        if (!disabled) accept(event.dataTransfer.files);
      }}
    >
      {children}

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary bg-background/85">
          <UploadCloudIcon className="size-7 text-primary" strokeWidth={1.5} />
          <p className="text-sm font-medium">Drop PDFs to upload</p>
        </div>
      )}
    </div>
  );
}

/** Some browsers report an empty type; fall back to the extension. */
function isPdf(file: File): boolean {
  return file.type === PDF_MIME || /\.pdf$/i.test(file.name);
}
