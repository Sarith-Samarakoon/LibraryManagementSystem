import React from "react";
import useLibraryStore from "../store/libraryStore.js";

export default function HUD() {
  const resetAll = useLibraryStore((s) => s.resetAll);

  return (
    <>
      <div className="absolute top-4 left-4 z-10 text-white">
        <div className="font-bold text-lg">
          Click to lock pointer. WASD move, Space up, Shift down
        </div>
        <div className="opacity-80 text-sm">
          Look at a book and click to open details
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={resetAll}
          className="px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20"
        >
          Reset dummy data
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20 text-sm">
          Fiction section ahead at the sign
        </div>
      </div>
    </>
  );
}
