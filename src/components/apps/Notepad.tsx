import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";

// Simple IndexedDB helper (promise-based)
const DB_NAME = "simos-notes-db";
const DB_STORE = "media";

function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, value: Blob | string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key: string) {
  const db = await openDB();
  return new Promise<any>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const req = tx.objectStore(DB_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(key: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Types
type Note = {
  id: string;
  title: string;
  content: string; // markdown / plain text
  attachments?: { id: string; type: string; name?: string }[];
  updatedAt: number;
};

// Utils
const uid = (prefix = "") => prefix + Math.random().toString(36).slice(2, 9);

const STORAGE_KEY = "simos-notes-v1";

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch (e) {
    console.error("loadNotes error", e);
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// Main Notepad component
export default function NotepadApp() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const existing = loadNotes();
    if (existing.length === 0) {
      const first: Note = {
        id: uid("note-"),
        title: "Untitled",
        content: "# Welcome to Notepad\n\nType here.\n",
        attachments: [],
        updatedAt: Date.now()
      };
      saveNotes([first]);
      return [first];
    }
    return existing;
  });

  const [activeId, setActiveId] = useState<string>(notes[0].id);
  const [autosaveOn, setAutosaveOn] = useState(true);
  const [preview, setPreview] = useState<"edit" | "preview" | "split">("split");
  const [search, setSearch] = useState("");
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  // Keep notes synced to localStorage
  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  // Autosave interval
  useEffect(() => {
    if (!autosaveOn) return;
    const id = setInterval(() => {
      setNotes((cur) =>
        cur.map((n) => (n.id === activeId ? { ...n, updatedAt: Date.now() } : n))
      );
    }, 3000);
    return () => clearInterval(id);
  }, [autosaveOn, activeId]);

  const activeNote = notes.find((n) => n.id === activeId) ?? notes[0];

  function newNote() {
    const n: Note = {
      id: uid("note-"),
      title: "Untitled",
      content: "",
      attachments: [],
      updatedAt: Date.now()
    };
    setNotes((s) => [n, ...s]);
    setActiveId(n.id);
    setTimeout(() => editorRef.current?.focus(), 50);
  }

  function deleteNote(id: string) {
    if (!confirm("Delete note?")) return;
    setNotes((s) => s.filter((x) => x.id !== id));
    if (id === activeId && notes.length > 1)
      setActiveId(notes.filter((x) => x.id !== id)[0].id);
  }

  function updateActiveContent(content: string) {
    setNotes((s) =>
      s.map((n) => (n.id === activeId ? { ...n, content, updatedAt: Date.now() } : n))
    );
  }

  function renameActive(newTitle: string) {
    setNotes((s) => s.map((n) => (n.id === activeId ? { ...n, title: newTitle } : n)));
  }

  // Export text
  function exportTxt(note: Note) {
    const blob = new Blob([note.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title || "note"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export HTML
  function exportHtml(note: Note) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${note.title}</title></head><body>${note.content.replace(/\n/g, "<br/>")}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title || "note"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export PDF (A4, 2cm margins)
  async function exportPdf(note: Note) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 20; // 2 cm = 20 mm
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const lines = doc.splitTextToSize(note.content, pageWidth);
    let cursorY = margin;
    const lineHeight = 7;
    for (const line of lines) {
      if (cursorY > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    }
    doc.save(`${note.title || "note"}.pdf`);
  }

  // Print (opens print dialog with note html)
  function printNote(note: Note) {
    const w = window.open("", "_blank");
    if (!w) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${note.title}</title></head><body><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(note.content)}</pre></body></html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.print();
  }

  function escapeHtml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Drag & drop files on the editor to attach
  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    for (const f of files) {
      const id = uid("att-");
      await idbPut(id, f);
      setNotes((s) =>
        s.map((n) =>
          n.id === activeId
            ? {
                ...n,
                attachments: [
                  ...(n.attachments || []),
                  { id, type: f.type, name: f.name }
                ],
                updatedAt: Date.now()
              }
            : n
        )
      );
    }
  }

  function allowDrop(e: React.DragEvent) {
    e.preventDefault();
  }

  // Insert image inline as markdown (data URL)
  async function insertImageFile(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const data = reader.result as string;
      // Save blob to idb and add attachment entry
      const id = uid("att-");
      // convert dataURL to blob
      const arr = data.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      const blob = new Blob([u8arr], { type: mime });
      await idbPut(id, blob);
      setNotes((s) =>
        s.map((note) =>
          note.id === activeId
            ? {
                ...note,
                attachments: [
                  ...(note.attachments || []),
                  { id, type: mime, name: file.name }
                ],
                content: note.content + `\n![${file.name}](id:${id})\n`,
                updatedAt: Date.now()
              }
            : note
        )
      );
    };
    reader.readAsDataURL(file);
  }

  // Attach via file picker
  async function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type.startsWith("image/")) await insertImageFile(f);
    else {
      const id = uid("att-");
      await idbPut(id, f);
      setNotes((s) =>
        s.map((n) =>
          n.id === activeId
            ? {
                ...n,
                attachments: [
                  ...(n.attachments || []),
                  { id, type: f.type, name: f.name }
                ],
                updatedAt: Date.now()
              }
            : n
        )
      );
    }
    e.currentTarget.value = "";
  }

  // Load attachment URL
  async function getAttachmentUrl(attId: string) {
    const val = await idbGet(attId);
    if (!val) return null;
    if (val instanceof Blob) return URL.createObjectURL(val);
    if (typeof val === "string") return val;
    return null;
  }

  // Simple media recorder (audio/video)
  const mediaChunksRef = useRef<BlobPart[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordType, setRecordType] = useState<"audio" | "video">("audio");

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        recordType === "audio" ? { audio: true } : { audio: true, video: true }
      );
      mediaChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (ev) => mediaChunksRef.current.push(ev.data);
      mr.onstop = async () => {
        const blob = new Blob(mediaChunksRef.current, {
          type: recordType === "audio" ? "audio/webm" : "video/webm"
        });
        const id = uid("att-");
        await idbPut(id, blob);
        setNotes((s) =>
          s.map((n) =>
            n.id === activeId
              ? {
                  ...n,
                  attachments: [
                    ...(n.attachments || []),
                    {
                      id,
                      type: blob.type,
                      name: `${recordType}-${Date.now()}.${recordType === "audio" ? "webm" : "webm"}`
                    }
                  ],
                  updatedAt: Date.now()
                }
              : n
          )
        );
        // stop tracks
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (e) {
      alert("Permission denied or no device");
      console.error(e);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  // Small image editor: apply CSS filters and overlay text; saves edited image to idb
  async function editImage(
    attId: string,
    { brightness = 1, hue = 0, overlay = "" } = {}
  ) {
    const url = await getAttachmentUrl(attId);
    if (!url) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await new Promise((res) => (img.onload = res));
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.filter = `brightness(${brightness}) hue-rotate(${hue}deg)`;
    ctx.drawImage(img, 0, 0);
    if (overlay) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.font = "48px sans-serif";
      ctx.fillText(overlay, 20, 60);
    }
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    if (!blob) return;
    const newId = uid("att-");
    await idbPut(newId, blob);
    // replace attachment in note
    setNotes((s) =>
      s.map((n) =>
        n.id === activeId
          ? {
              ...n,
              attachments: [
                ...(n.attachments || []),
                { id: newId, type: "image/png", name: "edited.png" }
              ],
              updatedAt: Date.now()
            }
          : n
      )
    );
  }

  // Helper to render attachment preview/controls
  function AttachmentItem({ att }: { att: { id: string; type: string; name?: string } }) {
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
      let mounted = true;
      (async () => {
        const u = await getAttachmentUrl(att.id);
        if (mounted) setUrl(u);
      })();
      return () => {
        mounted = false;
        if (url) URL.revokeObjectURL(url);
      };
    }, [att.id]);

    if (!url) return <div className="p-2">Loading...</div>;
    if (att.type.startsWith("image/")) {
      return (
        <div className="p-2">
          <img src={url} alt={att.name} style={{ maxWidth: "100%" }} />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() =>
                editImage(att.id, { brightness: 1.2, hue: 20, overlay: "Burning Bunny" })
              }
              className="px-2 py-1 bg-yellow-600 rounded"
            >
              Apply Burn
            </button>
            <a
              className="px-2 py-1 bg-blue-600 rounded text-white"
              href={url}
              download={att.name || "image.png"}
            >
              Download
            </a>
          </div>
        </div>
      );
    }
    if (att.type.startsWith("video/")) {
      return (
        <div className="p-2">
          <video src={url} controls style={{ maxWidth: "100%" }} />
          <a
            className="mt-2 inline-block px-2 py-1 bg-blue-600 rounded text-white"
            href={url}
            download={att.name || "video.webm"}
          >
            Download
          </a>
        </div>
      );
    }
    if (att.type.startsWith("audio/")) {
      return (
        <div className="p-2">
          <audio src={url} controls />
          <a
            className="mt-2 inline-block px-2 py-1 bg-blue-600 rounded text-white"
            href={url}
            download={att.name || "audio.webm"}
          >
            Download
          </a>
        </div>
      );
    }
    return (
      <div className="p-2">
        <a href={url} download={att.name || "file"} className="text-blue-400">
          {att.name || "file"}
        </a>
      </div>
    );
  }

  // Render
  return (
    <div className="w-full h-full flex bg-neutral-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-neutral-800 p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Notepad</h3>
          <div className="flex gap-1">
            <button onClick={newNote} className="px-2 py-1 bg-green-600 rounded">
              New
            </button>
            <button
              onClick={() => setAutosaveOn(!autosaveOn)}
              className="px-2 py-1 bg-gray-700 rounded"
            >
              {autosaveOn ? "AutoOn" : "AutoOff"}
            </button>
          </div>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="px-2 py-1 bg-neutral-700 rounded"
        />

        <div className="flex-1 overflow-auto mt-2 space-y-1">
          {notes
            .filter(
              (n) =>
                n.title.toLowerCase().includes(search.toLowerCase()) ||
                n.content.toLowerCase().includes(search.toLowerCase())
            )
            .map((n) => (
              <div
                key={n.id}
                className={`p-2 rounded cursor-pointer ${n.id === activeId ? "bg-neutral-700" : "hover:bg-neutral-800"}`}
                onClick={() => setActiveId(n.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{n.title}</div>
                    <div className="text-xs text-neutral-400">
                      {new Date(n.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        renameActive(prompt("New title", n.title) || n.title);
                      }}
                      className="text-xs"
                    >
                      Rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportTxt(n);
                      }}
                      className="text-xs"
                    >
                      TXT
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportHtml(n);
                      }}
                      className="text-xs"
                    >
                      HTML
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportPdf(n);
                      }}
                      className="text-xs"
                    >
                      PDF
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(n.id);
                      }}
                      className="text-xs text-red-400"
                    >
                      Del
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="pt-2 border-t border-neutral-700">
          <input type="file" onChange={onFileInput} />
          <div className="mt-2 flex gap-2">
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as any)}
              className="bg-neutral-700 px-2 py-1 rounded"
            >
              <option value="audio">Audio</option>
              <option value="video">Video</option>
            </select>
            {!recording ? (
              <button onClick={startRecording} className="px-2 py-1 bg-red-600 rounded">
                Record
              </button>
            ) : (
              <button onClick={stopRecording} className="px-2 py-1 bg-yellow-600 rounded">
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="flex-1 flex flex-col" onDrop={handleDrop} onDragOver={allowDrop}>
        <div className="flex gap-2 p-3 items-center border-b border-neutral-800">
          <input
            value={activeNote?.title || ""}
            onChange={(e) => renameActive(e.target.value)}
            className="bg-neutral-800 px-2 py-1 rounded flex-1"
          />
          <div className="flex gap-2">
            <button
              onClick={() => exportTxt(activeNote)}
              className="px-2 py-1 bg-blue-600 rounded"
            >
              Save TXT
            </button>
            <button
              onClick={() => exportPdf(activeNote)}
              className="px-2 py-1 bg-green-600 rounded"
            >
              Save PDF
            </button>
            <button
              onClick={() => exportHtml(activeNote)}
              className="px-2 py-1 bg-indigo-600 rounded"
            >
              Export HTML
            </button>
            <button
              onClick={() => printNote(activeNote)}
              className="px-2 py-1 bg-gray-700 rounded"
            >
              Print
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(activeNote.content);
              }}
              className="px-2 py-1 bg-neutral-700 rounded"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="flex-1 flex">
          <textarea
            ref={editorRef}
            value={activeNote?.content || ""}
            onChange={(e) => updateActiveContent(e.target.value)}
            className="w-1/2 p-4 bg-neutral-900 text-white outline-none resize-none"
          />

          <div className="w-1/2 p-4 overflow-auto bg-neutral-950">
            {preview === "edit" ? null : (
              <div className="prose max-w-none text-white">
                <ReactMarkdown>{activeNote?.content || ""}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* attachments area */}
        <div className="p-3 border-t border-neutral-800 flex gap-3 overflow-auto">
          {(activeNote?.attachments || []).map((att) => (
            <div key={att.id} className="bg-neutral-800 rounded p-2">
              <AttachmentItem att={att} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
