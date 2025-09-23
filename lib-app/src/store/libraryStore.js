import { create } from "zustand";
import { BOOKS } from "../data/books";

const useLibraryStore = create((set, get) => ({
  books: BOOKS,

  selectedBook: null,
  isGalleryOpen: false,

  openGallery: () => set({ isGalleryOpen: true }),
  closeGallery: () => set({ isGalleryOpen: false }),

  selectById: (id) => {
    const b = get().books.find((x) => x.id === id) || null;
    set({ selectedBook: b, isGalleryOpen: false });
  },

  closeModal: () => set({ selectedBook: null }),

  checkout: (id) =>
    set((state) => ({
      books: state.books.map((b) =>
        b.id === id ? { ...b, available: false } : b
      ),
      selectedBook: null,
    })),

  loadBooks: (arr) => set({ books: Array.isArray(arr) ? arr : [] }),
}));

export default useLibraryStore;
