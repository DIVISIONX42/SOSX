import { useState } from "react";

export default function Notepad() {
  const [text, setText] = useState("");

  const saveTxt = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "note.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const savePdf = async () => {
    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF({
      unit: "mm",
      format: "a4"
    });

    const margin = 20; // = 2 cm
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;

    const lines = doc.splitTextToSize(text, pageWidth);

    doc.text(lines, margin, margin);
    doc.save("note.pdf");
  };

  return (
    <div className="w-full h-full p-4 bg-neutral-900 text-white">
      <textarea
        className="w-full h-[85%] p-2 bg-neutral-800 border border-neutral-700 rounded outline-none resize-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="create ur own mmries"
      />

      <div className="mt-3 flex gap-3">
        <button
          onClick={saveTxt}
          className="px-4 py-1 bg-blue-600 rounded hover:bg-blue-700"
        >
          Save .txt
        </button>

        <button
          onClick={savePdf}
          className="px-4 py-1 bg-green-600 rounded hover:bg-green-700"
        >
          Save .pdf (A4)
        </button>
      </div>
    </div>
  );
}
