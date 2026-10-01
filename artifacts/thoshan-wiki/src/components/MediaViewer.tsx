import { useLocale } from "../contexts/LocaleContext";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, X } from "lucide-react";
import { useFocusRestore } from "../hooks/use-focus-restore";

export type MediaViewerItem = {
  src: string;
  alt?: string;
  caption?: string;
  type?: "image" | "video";
  muted?: boolean;
};

interface MediaViewerProps {
  item: MediaViewerItem;
  onClose: () => void;
}

export default function MediaViewer({ item, onClose }: MediaViewerProps) {
  const { t } = useLocale();
  const isVideo = item.type === "video";
  // v10.10: return focus to the thumbnail that opened the viewer.
  useFocusRestore(true);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // Portal to body so floated article content, sticky headers, and
  // iframe embeds can never paint over the dialog. z-[300] matches
  // --z-modal (above nav/dropdowns, below tooltips).
  return createPortal(
    <div
      className="fixed inset-0 z-[300] isolate flex flex-col bg-black/95 p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={
        isVideo ? t("media.openVideo") : t("media.openImage")
      }
      onClick={onClose}
    >
      <div
        className="flex min-h-0 flex-1 items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          item.src.endsWith(".mp4") ? (
            <video
              src={item.src}
              title={item.caption || item.alt || "Video"}
              className="max-h-[82vh] w-full max-w-7xl border border-white/20 bg-black"
              controls
              autoPlay
              loop
              // Viewer opens from an explicit tap (a user gesture), so
              // browsers allow sound: default unmuted unless the opener
              // passed an explicit muted flag (e.g. page state).
              muted={item.muted ?? false}
              playsInline
              data-testid="media-viewer-video"
            />
          ) : (
            <iframe
              src={item.src}
              title={item.caption || item.alt || "Video"}
              className="h-full max-h-[82vh] w-full max-w-7xl border border-white/20 bg-black"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              data-testid="media-viewer-video"
            />
          )
        ) : (
          <img
            src={item.src}
            alt={item.alt || ""}
            className="max-h-[82vh] max-w-full object-contain"
            data-testid="media-viewer-image"
          />
        )}
      </div>

      {item.caption && (
        <p className="mx-auto mt-3 max-w-4xl text-center text-sm text-white/75">
          {item.caption}
        </p>
      )}

      <div
        className="mt-4 flex items-center justify-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("media.closeViewer")}
          className="inline-flex h-10 items-center gap-2 border border-white/25 bg-white/10 px-4 text-sm font-medium text-white hover:bg-white/20"
          data-testid="button-media-viewer-close"
        >
          <X size={16} />
          {t("media.closeViewer")}
        </button>
        <a
          href={item.src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 border border-white/25 bg-white/10 px-4 text-sm font-medium text-white hover:bg-white/20"
          data-testid="link-media-viewer-new-tab"
        >
          <ExternalLink size={16} />
          Open new tab
        </a>
      </div>
    </div>,
    document.body,
  );
}
