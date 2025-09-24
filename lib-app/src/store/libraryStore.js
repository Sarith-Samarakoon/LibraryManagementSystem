import { create } from "zustand";
import { BOOKS } from "../data/books";

const useLibraryStore = create((set, get) => ({
  books: [...BOOKS], // Spread to create a new array, avoiding direct reference

  selectedBook: null,
  isGalleryOpen: false,

  openGallery: () => set({ isGalleryOpen: true }),
  closeGallery: () => set({ isGalleryOpen: false }),

  selectById: (id) => {
    const book = get().books.find((x) => x.id === id) || null;
    set({ selectedBook: book, isGalleryOpen: false });
  },

  closeModal: () => set({ selectedBook: null }),

  checkout: (id) =>
    set((state) => ({
      books: state.books.map((b) =>
        b.id === id ? { ...b, available: false } : b
      ),
      selectedBook: null,
    })),

  loadBooks: (arr) =>
    set((state) => ({
      books: Array.isArray(arr) && arr.length > 0 ? [...arr] : [...state.books],
    })),

  // Debug function to log current books state
  debugBooks: () => {
    console.log("Current books:", get().books);
    return get().books;
  },
}));

export default useLibraryStore;
