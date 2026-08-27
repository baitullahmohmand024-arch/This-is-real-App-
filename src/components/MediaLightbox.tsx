import React from 'react';
import { X, Download, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
  senderName?: string;
  timestamp?: string;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  senderName,
  timestamp,
}) => {
  if (!isOpen || !mediaUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="media-lightbox-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <div
          id="media-lightbox-content"
          className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header controls */}
          <div className="absolute top-0 inset-x-0 -translate-y-12 flex items-center justify-between px-2 text-zinc-300">
            <div>
              {senderName && <p className="text-sm font-medium text-white">{senderName}</p>}
              {timestamp && <p className="text-xs text-zinc-400">{timestamp}</p>}
            </div>
            <div className="flex items-center gap-2">
              <a
                id="media-download-btn"
                href={mediaUrl}
                download="luxury-media"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white transition-colors"
                title="Download media"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                id="media-close-btn"
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Media Body */}
          <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl border border-zinc-800">
            {mediaType === 'video' ? (
              <video
                src={mediaUrl}
                controls
                autoPlay
                className="max-h-[80vh] max-w-full rounded-2xl object-contain bg-black"
              />
            ) : (
              <img
                src={mediaUrl}
                alt="Chat attachment preview"
                className="max-h-[80vh] max-w-full rounded-2xl object-contain"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
