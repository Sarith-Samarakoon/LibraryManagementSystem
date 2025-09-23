import React from "react";

export default function BookModal({ book, onClose, onCheckout }) {
  if (!book) return null;

  const {
    id,
    title,
    author,
    description,
    available,
    coverUrl,
    size = {},
  } = book;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[min(900px,92vw)] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
          <div className="text-lg font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="h-9 px-3 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-sm"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-0">
          {/* Cover */}
          <div className="p-5 md:border-r border-gray-200">
            <div className="aspect-[2/3] w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={title}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // hide broken image, show fallback below
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
              ) : null}
              {/* Fallback */}
              <div
                style={{ display: coverUrl ? "none" : "flex" }}
                className="h-full w-full items-center justify-center text-gray-500 text-sm"
              >
                No cover available
              </div>
            </div>

            {/* Dimensions (optional) */}
            {(size.width || size.height || size.thick) && (
              <div className="mt-3 text-xs text-gray-600">
                Size (m):{" "}
                {[
                  size.width ? `W ${size.width.toFixed(3)}` : null,
                  size.height ? `H ${size.height.toFixed(3)}` : null,
                  size.thick ? `T ${size.thick.toFixed(3)}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            )}
          </div>

          {/* Details + actions */}
          <div className="p-5 space-y-4">
            <div>
              <div className="text-sm text-gray-600">Author</div>
              <div className="text-base font-medium">{author}</div>
            </div>

            {description && (
              <div>
                <div className="text-sm text-gray-600">Description</div>
                <p className="mt-1 text-[15px] leading-relaxed text-gray-800">
                  {description}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span
                className={
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs border " +
                  (available
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-100 text-gray-600 border-gray-200")
                }
              >
                {available ? "Available" : "Checked out"}
              </span>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => onCheckout?.(id)}
                disabled={!available}
                className={
                  "h-10 px-4 rounded-md text-white text-sm " +
                  (available
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-gray-400 cursor-not-allowed")
                }
                title={available ? "Check out this book" : "Not available"}
              >
                {available ? "Check out" : "Unavailable"}
              </button>

              <button
                onClick={onClose}
                className="h-10 px-4 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
