import React from "react";
import useLibraryStore from "../store/libraryStore";

export default function BooksButton() {
  const openGallery = useLibraryStore((s) => s.openGallery);

  return (
    <button
      onClick={openGallery}
      className="fixed bottom-5 right-5 z-40 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg px-4 py-2 font-medium backdrop-blur-md border border-gray-200"
      title="Browse all books"
    >
      📚 Books
    </button>
  );
}
