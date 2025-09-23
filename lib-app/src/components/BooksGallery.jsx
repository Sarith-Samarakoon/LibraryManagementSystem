import React, { useEffect, useMemo, useRef, useState } from "react";
import useLibraryStore from "../store/libraryStore";

function Cover({ url, title }) {
  // Maintain book-ish aspect ratio
  return (
    <div className="w-full aspect-[2/3] rounded-md overflow-hidden bg-gray-200 border border-gray-200">
      {url ? (
        <img
          src={url}
          alt={title}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">
          No cover
        </div>
      )}
    </div>
  );
}

export default function BooksGallery() {
  const isOpen = useLibraryStore((s) => s.isGalleryOpen);
  const close = useLibraryStore((s) => s.closeGallery);
  const selectById = useLibraryStore((s) => s.selectById);
  const books = useLibraryStore((s) => s.books);

  const [q, setQ] = useState("");
  const dialogRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return books;
    return books.filter((b) => {
      return (
        b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s)
      );
    });
  }, [books, q]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        // click-to-close on backdrop
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        className="absolute left-1/2 top-10 -translate-x-1/2 w-[min(1200px,92vw)] h-[80vh] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 bg-gray-50">
          <div className="text-lg font-semibold">Library</div>
          <div className="ml-auto flex items-center gap-2">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title or author"
              className="h-9 w-[260px] rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={close}
              className="h-9 px-3 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-sm"
            >
              Close
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="h-[calc(80vh-56px)] overflow-auto p-5">
          <div
            className="grid gap-5"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(180px, 42vw), 1fr))",
            }}
          >
            {filtered.map((b) => (
              <div
                key={b.id}
                className="group rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
              >
                <div className="p-3">
                  <Cover url={b.coverUrl} title={b.title} />
                </div>
                <div className="px-3 pb-3">
                  <div className="text-sm font-semibold leading-snug line-clamp-2">
                    {b.title}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">{b.author}</div>

                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs border " +
                        (b.available
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-600 border-gray-200")
                      }
                    >
                      {b.available ? "Available" : "Checked out"}
                    </span>

                    <button
                      onClick={() => selectById(b.id)}
                      className="text-xs rounded-md px-2.5 py-1 bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full text-center text-sm text-gray-500 py-16">
                No books match your search.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
