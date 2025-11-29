import React, { useEffect, useRef, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { jsPDF } from "jspdf";

/* ---------- IndexedDB simple helpers ---------- */
const DB_NAME = "simos-notes-db";
const DB_STORE = "attachments";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
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

async function blobToDataURL(blob: Blob) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

/* ---------- Utilities ---------- */
const uid = (p = "") => p + Math.random().toString(36).slice(2, 9);
const STORAGE_KEY = "simos-notes-rich-v1";

type Note = {
  id: string;
  title: string;
  html: string;
  attachments?: { id: string; type: string; name?: string }[];
  updatedAt: number;
};

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

/* ---------- Quill toolbar config ---------- */
const toolbarOptions = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ align: [] }],
  [{ size: ["10px", "12px", "14px", "18px", "22px"] }],
  ["blockquote", "code-block"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link", "image", "video"],
  ["clean"]
];

/* ---------- Notepad Component ---------- */
export default function Notepad() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const existing = loadNotes();
    if (existing.length === 0) {
      const first: Note = {
        id: uid("note-"),
        title: "Note",
        html: "<p>Welcome — tap to edit. Add images/videos with the toolbar or drop files.</p>",
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
  const [title, setTitle] = useState(notes[0].title);
  const quillRef = useRef<ReactQuill | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeNote = notes.find((n) => n.id === activeId)!;

  useEffect(() => {
    setTitle(activeNote.title);
  }, [activeId]);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  useEffect(() => {
    if (!autosaveOn) return;
    const t = setInterval(() => {
      setNotes((cur) =>
        cur.map((n) => (n.id === activeId ? { ...n, updatedAt: Date.now() } : n))
      );
    }, 3000);
    return () => clearInterval(t);
  }, [autosaveOn, activeId]);

  /* ---------- Editor handlers ---------- */
  function onChangeHtml(html: string) {
    setNotes((s) =>
      s.map((n) => (n.id === activeId ? { ...n, html, updatedAt: Date.now() } : n))
    );
  }

  function newNote() {
    const n: Note = {
      id: uid("note-"),
      title: "Untitled",
      html: "<p></p>",
      attachments: [],
      updatedAt: Date.now()
    };
    setNotes((s) => [n, ...s]);
    setActiveId(n.id);
    setTimeout(() => quillRef.current?.focus(), 50);
  }

  function deleteNote(id: string) {
    if (!confirm("Delete note?")) return;
    setNotes((s) => s.filter((x) => x.id !== id));
    if (id === activeId && notes.length > 1)
      setActiveId(notes.find((x) => x.id !== id)!.id);
  }

  /* --------- Custom image handler for Quill --------- */
  async function handleImageInsert() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const id = uid("att-");
      await idbPut(id, file);
      setNotes((s) =>
        s.map((n) =>
          n.id === activeId
            ? {
                ...n,
                attachments: [
                  ...(n.attachments || []),
                  { id, type: file.type, name: file.name }
                ],
                updatedAt: Date.now()
              }
            : n
        )
      );
      const editor = (quillRef.current as any).getEditor();
      const range = editor.getSelection(true);
      const node = `<img src="id:${id}" alt="${file.name}" />`;
      editor.clipboard.dangerouslyPasteHTML(range.index, node);
    };
    input.click();
  }

  /* --------- Custom video handler --------- */
  async function handleVideoInsert() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const id = uid("att-");
      await idbPut(id, file);
      setNotes((s) =>
        s.map((n) =>
          n.id === activeId
            ? {
                ...n,
                attachments: [
                  ...(n.attachments || []),
                  { id, type: file.type, name: file.name }
                ],
                updatedAt: Date.now()
              }
            : n
        )
      );
      const editor = (quillRef.current as any).getEditor();
      const range = editor.getSelection(true);
      const node = `<video controls src="id:${id}"></video>`;
      editor.clipboard.dangerouslyPasteHTML(range.index, node);
    };
    input.click();
  }

  /* --------- Media recorder ---------- */
  const mediaChunks: BlobPart[] = [];
  let mediaRecorder: MediaRecorder | null = null;

  async function startRecord(kind: "audio" | "video") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === "audio" ? { audio: true } : { audio: true, video: true }
      );
      mediaChunks.length = 0;
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => mediaChunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(mediaChunks, {
          type: kind === "audio" ? "audio/webm" : "video/webm"
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
                    { id, type: blob.type, name: `${kind}-${Date.now()}.webm` }
                  ],
                  updatedAt: Date.now()
                }
              : n
          )
        );
        const editor = (quillRef.current as any).getEditor();
        const range = editor.getSelection(true);
        const node =
          kind === "audio"
            ? `<audio controls src="id:${id}"></audio>`
            : `<video controls src="id:${id}"></video>`;
        editor.clipboard.dangerouslyPasteHTML(range.index, node);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
      alert("Recording started — click Stop to finish.");
    } catch (e) {
      alert("Device access denied or not available.");
      console.error(e);
    }
  }

  function stopRecord() {
    mediaRecorder?.stop();
  }

  /* --------- Drag & Drop files ---------- */
  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const editor = quillRef.current?.getEditor();
    const range = editor?.getSelection(true) ?? { index: 0 };
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
      if (f.type.startsWith("image/")) {
        editor?.clipboard.dangerouslyPasteHTML(range.index, `<img src="id:${id}" />`);
      } else if (f.type.startsWith("video/")) {
        editor?.clipboard.dangerouslyPasteHTML(
          range.index,
          `<video controls src="id:${id}"></video>`
        );
      }
    }
  }

  function allowDrop(e: React.DragEvent) {
    e.preventDefault();
  }

  /* ---------- Export HTML ---------- */
  async function exportHtml(note: Note) {
    let html = note.html;
    const idMatches = Array.from(html.matchAll(/src="id:([^"]+)"/g)).map((m) => m[1]);
    const unique = Array.from(new Set(idMatches));
    for (const attId of unique) {
      const val = await idbGet(attId);
      if (!val) continue;
      if (val instanceof Blob) {
        const dataUrl = await blobToDataURL(val);
        html = html.replaceAll(`src="id:${attId}"`, `src="${dataUrl}"`);
      } else if (typeof val === "string") {
        html = html.replaceAll(`src="id:${attId}"`, `src="${val}"`);
      }
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

  /* ---------- Export TXT ---------- */
  function exportTxt(note: Note) {
    const tmp = document.createElement("div");
    tmp.innerHTML = note.html;
    const txt = tmp.innerText;
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title || "note"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------- Export PDF ---------- */
  async function exportPdf(note: Note) {
    let html = note.html;
    const idMatches = Array.from(html.matchAll(/src="(id:[^"]+)"/g)).map((m) => m[1]);
    const unique = Array.from(new Set(idMatches));
    for (const attId of unique) {
      const val = await idbGet(attId);
      if (!val) continue;
      if (val instanceof Blob) {
        const dataUrl = await blobToDataURL(val);
        html = html.replaceAll(`src="id:${attId}"`, `src="${dataUrl}"`);
      }
    }
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const txt = tmp.innerText;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const lines = doc.splitTextToSize(txt, pageWidth);
    let y = margin;
    const lineHeight = 7;
    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
    doc.save(`${note.title || "note"}.pdf`);
  }

  /* ---------- Toolbar handlers ---------- */
  const modules = {
    toolbar: {
      container: toolbarOptions,
      handlers: {
        image: handleImageInsert,
        video: handleVideoInsert
      }
    },
    clipboard: { matchVisual: false }
  };

  /* ---------- Render ---------- */
  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-neutral-900 text-white">
      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0 bg-neutral-800 p-3 flex flex-col gap-2">
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
              {autosaveOn ? "Auto" : "Manual"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto mt-2 space-y-1">
          {notes.map((n) => (
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
                      const t = prompt("Rename", n.title);
                      if (t)
                        setNotes((s) =>
                          s.map((x) => (x.id === n.id ? { ...x, title: t } : x))
                        );
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
          <div className="flex gap-2">
            <button
              onClick={() => startRecord("audio")}
              className="px-2 py-1 bg-red-600 rounded"
            >
              Rec Audio
            </button>
            <button
              onClick={() => startRecord("video")}
              className="px-2 py-1 bg-red-600 rounded"
            >
              Rec Video
            </button>
            <button
              onClick={() => stopRecord()}
              className="px-2 py-1 bg-yellow-600 rounded"
            >
              Stop
            </button>
          </div>
          <div className="mt-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
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
                e.currentTarget.value = "";
              }}
            />
          </div>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col" onDragOver={allowDrop} onDrop={handleDrop}>
        <div className="p-2 border-b border-neutral-800 flex items-center gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() =>
              setNotes((s) =>
                s.map((n) => (n.id === activeNote.id ? { ...n, title } : n))
              )
            }
            className="bg-neutral-800 px-2 py-1 rounded flex-1"
          />
          <div className="flex gap-2">
            <button
              onClick={() => exportTxt(activeNote)}
              className="px-2 py-1 bg-blue-600 rounded"
            >
              TXT
            </button>
            <button
              onClick={() => exportHtml(activeNote)}
              className="px-2 py-1 bg-indigo-600 rounded"
            >
              HTML
            </button>
            <button
              onClick={() => exportPdf(activeNote)}
              className="px-2 py-1 bg-green-600 rounded"
            >
              PDF
            </button>
          </div>
        </div>

        <div className="flex-1 md:flex">
          <div className="flex-1 min-h-0">
            <ReactQuill
              ref={(r) => (quillRef.current = r)}
              value={activeNote.html}
              onChange={onChangeHtml}
              modules={modules}
              theme="snow"
              style={{ height: "100%", minHeight: "300px" }}
            />
          </div>

          {/* Attachment previews on the right */}
          <div className="hidden md:block w-80 bg-neutral-950 p-3 overflow-auto">
            <h4 className="font-semibold mb-2">Attachments (drag into editor)</h4>
            {(activeNote.attachments || []).map((a) => (
              <DraggableAttachment key={a.id} att={a} quillRef={quillRef} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Draggable Attachment Component ---------- */
function DraggableAttachment({
  att,
  quillRef
}: {
  att: { id: string; type: string; name?: string };
  quillRef: React.RefObject<ReactQuill>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const val = await idbGet(att.id);
      if (!val) return;
      if (val instanceof Blob) {
        const u = URL.createObjectURL(val);
        if (mounted) setUrl(u);
      } else if (typeof val === "string") {
        if (mounted) setUrl(val);
      }
    })();
    return () => {
      mounted = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [att.id]);

  if (!url) return <div className="p-1">Loading...</div>;

  const commonProps = {
    className: `rounded cursor-pointer transition-all ${expanded ? "max-w-full max-h-[400px]" : "max-w-[120px] max-h-[80px]"}`,
    onClick: () => setExpanded((x) => !x),
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", att.id);
    }
  };

  if (att.type.startsWith("image/"))
    return <img src={url} alt={att.name} {...commonProps} />;
  if (att.type.startsWith("video/")) return <video src={url} controls {...commonProps} />;
  if (att.type.startsWith("audio/"))
    return <audio src={url} controls className="w-full" />;

  return (
    <a href={url} download className="text-blue-400 block">
      {att.name || "file"}
    </a>
  );
}
