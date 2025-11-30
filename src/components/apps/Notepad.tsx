import React, { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";

// IndexedDB helper
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

// Types
type Note = {
  id: string;
  title: string;
  content: string;
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

// Convert blob -> DataURL
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

// Escape HTML
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Main Notepad
export default function NotepadApp() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const existing = loadNotes();
    if (!existing.length) {
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
  const [activeId, setActiveId] = useState(notes[0].id);
  const [autosaveOn, setAutosaveOn] = useState(true);
  const [search, setSearch] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordType, setRecordType] = useState<"audio" | "video">("audio");
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const activeNote = notes.find((n) => n.id === activeId) ?? notes[0];

  // Save to localStorage
  useEffect(() => saveNotes(notes), [notes]);

  // Autosave timestamp
  useEffect(() => {
    if (!autosaveOn) return;
    const id = setInterval(() => {
      setNotes((cur) =>
        cur.map((n) => (n.id === activeId ? { ...n, updatedAt: Date.now() } : n))
      );
    }, 3000);
    return () => clearInterval(id);
  }, [autosaveOn, activeId]);

  // CRUD
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

  // Attachments
  async function getAttachmentUrl(attId: string) {
    const val = await idbGet(attId);
    if (!val) return null;
    if (val instanceof Blob) return URL.createObjectURL(val);
    if (typeof val === "string") return val;
    return null;
  }

  async function insertAtCursor(text: string) {
    if (!editorRef.current) return;
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    const newContent = before + text + after;
    updateActiveContent(newContent);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 10);
  }

  async function insertImageFile(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const data = reader.result as string;
      const id = uid("att-");
      const arr = data.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
      const bstr = atob(arr[1]);
      const u8arr = new Uint8Array(bstr.length);
      for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
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
                content: note.content,
                updatedAt: Date.now()
              }
            : note
        )
      );
    };
    reader.readAsDataURL(file);
  }

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

  // Drag & Drop
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

  // Recording
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
                    { id, type: blob.type, name: `${recordType}-${Date.now()}.webm` }
                  ],
                  updatedAt: Date.now()
                }
              : n
          )
        );
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

  // Export TXT
  function exportTxt(note: Note) {
    const blob = new Blob([note.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title || "note"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export HTML with inline attachments
  async function exportHtml(note: Note) {
    let html = escapeHtml(note.content).replace(/\n/g, "<br/>");

    html += "<hr/>";

    for (const att of note.attachments || []) {
      const val = await idbGet(att.id);
      if (!val) continue;

      let dataUrl = "";
      if (val instanceof Blob) dataUrl = await blobToDataURL(val);
      else if (typeof val === "string") dataUrl = val;

      if (att.type.startsWith("image/"))
        html += `<img src="${dataUrl}" style="max-width:100%;margin-top:10px;" />`;
      else if (att.type.startsWith("video/"))
        html += `<video controls src="${dataUrl}" style="max-width:100%;margin-top:10px;"></video>`;
      else if (att.type.startsWith("audio/"))
        html += `<audio controls src="${dataUrl}" style="margin-top:10px;"></audio>`;
    }

    const full = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${note.title}</title></head><body>${html}</body></html>`;
    const blob = new Blob([full], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title || "note"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export PDF (text + images)
  async function exportPdf(note: Note) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    let cursorY = margin;

    const lines = doc.splitTextToSize(note.content, pageWidth);
    const lineHeight = 7;
    for (const line of lines) {
      if (cursorY > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    }

    // Add images at the end
    for (const att of note.attachments || []) {
      if (!att.type.startsWith("image/")) continue;
      const val = await idbGet(att.id);
      if (!val) continue;
      const dataUrl = val instanceof Blob ? await blobToDataURL(val) : val;
      const img = new Image();
      img.src = dataUrl;
      await new Promise((res) => (img.onload = res));
      const ratio = img.width / img.height;
      const imgWidth = pageWidth;
      const imgHeight = imgWidth / ratio;
      if (cursorY + imgHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.addImage(dataUrl, "PNG", margin, cursorY, imgWidth, imgHeight);
      cursorY += imgHeight + 5;
    }
    doc.save(`${note.title || "note"}.pdf`);
  }

  // Print
  function printNote(note: Note) {
    const w = window.open("", "_blank");
    if (!w) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${note.title}</title></head><body><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(note.content)}</pre></body></html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.print();
  }

  // Attachment preview
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

    if (att.type.startsWith("image/"))
      return (
        <div className="p-2 flex flex-col pointer-events-auto">
          <img
            src={url}
            alt={att.name}
            className="max-w-full max-h-40 object-contain rounded"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => insertAtCursor(`![${att.name}](id:${att.id})\n`)}
              className="px-2 py-1 bg-green-600 rounded text-white"
            >
              Apply
            </button>

            <a
              href={url}
              download={att.name || "image.png"}
              className="px-2 py-1 bg-blue-600 rounded text-white"
            >
              Download
            </a>
          </div>
        </div>
      );

    if (att.type.startsWith("video/"))
      return (
        <div className="p-2 pointer-events-auto">
          <video src={url} controls className="w-full max-h-60 rounded object-contain" />
          <a
            className="mt-2 inline-block px-2 py-1 bg-blue-600 rounded text-white"
            href={url}
            download={att.name || "video.webm"}
          >
            Download
          </a>
        </div>
      );

    if (att.type.startsWith("audio/"))
      return (
        <div className="p-2 pointer-events-auto">
          <audio src={url} controls className="w-full" />
          <a
            className="mt-2 inline-block px-2 py-1 bg-blue-600 rounded text-white"
            href={url}
            download={att.name || "audio.webm"}
          >
            Download
          </a>
        </div>
      );

    return (
      <div className="p-2 pointer-events-auto">
        <a href={url} download={att.name || "file"} className="text-blue-400">
          {att.name || "file"}
        </a>
      </div>
    );
  }

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

      {/* Editor + Attachments */}
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

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Text Editor */}
          <textarea
            ref={editorRef}
            value={(activeNote?.content || "").replace(/!\[.*?\]\(id:att-[^)]+\)/g, "")}
            onChange={(e) => updateActiveContent(e.target.value)}
            className="w-full md:w-1/2 h-60 md:h-auto p-4 bg-neutral-900 text-white outline-none resize-none"
          />

          {/* Attachments Panel */}
          <div className="flex-1 p-3 border-t md:border-t-0 md:border-l border-neutral-800 overflow-auto flex flex-col gap-2 mt-2 md:mt-0 md:ml-2">
            {(activeNote?.attachments || []).map((att) => (
              <div key={att.id} className="bg-neutral-800 rounded p-2 flex-shrink-0">
                <AttachmentItem att={att} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
