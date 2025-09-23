import React from "react";
import World from "./components/World.jsx";
import HUD from "./components/HUD.jsx";
import BookModal from "./components/BookModal.jsx";
import BooksButton from "./components/BooksButton.jsx";
import BooksGallery from "./components/BooksGallery.jsx";
import useLibraryStore from "./store/libraryStore.js";

export default function App() {
  const { selectedBook, closeModal, checkout } = useLibraryStore();

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <World />
      <HUD />

      {/* Floating open button */}
      <BooksButton />
      {/* Overlay gallery with covers */}
      <BooksGallery />

      {/* Detail modal stays as-is */}
      <BookModal
        book={selectedBook}
        onClose={closeModal}
        onCheckout={(id) => checkout(id)}
      />
    </div>
  );
}
