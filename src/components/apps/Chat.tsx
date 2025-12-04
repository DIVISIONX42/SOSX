// src/apps/Chat.tsx
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";

interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface ChatProps {
  currentUser: User | null;
}

export function Chat({ currentUser }: ChatProps) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<any>(null);
  const subRef = useRef<any>(null);

  // colors for users 0–3
  const userColors: Record<number, string> = {
    0: "#9b59b6",
    1: "#3498db",
    2: "#2ecc71",
    3: "#f1c40f"
  };

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // load messages + subscribe to Supabase
  useEffect(() => {
    if (!currentUser) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(200);
      setMsgs(data ?? []);
      scrollToBottom();
    };

    loadMessages();

    subRef.current = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMsgs((prev) => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      if (subRef.current) supabase.removeChannel(subRef.current);
    };
  }, [currentUser]);

  // send message
  const send = async () => {
    if (!currentUser || !text.trim()) return;

    const payload = {
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      avatar_url: currentUser.avatar,
      text: text.trim()
    };

    try {
      await supabase.from("messages").insert(payload);
      setText("");
      scrollToBottom();
    } catch (err) {
      console.error("Send failed:", err);
      alert("Failed to send message");
    }
  };

  // typing indicator
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    setTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setTyping(false), 1000);
  };

  const getBubbleStyle = (m: any) => {
    const isMine = m.sender_id === currentUser?.id;
    const userIndex = parseInt(m.sender_id.replace(/\D/g, "")) % 4 || 0;
    const baseColor = isMine ? "#007bff" : userColors[userIndex] || "#ccc";
    return { background: baseColor, color: isMine ? "#fff" : "#000" };
  };

  if (!currentUser) {
    return <div style={{ padding: 20 }}>Select a user to start chatting</div>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        border: "1px solid #ccc",
        borderRadius: 8,
        overflow: "hidden"
      }}
    >
      {/* top menu / user avatar */}
      <div
        style={{
          padding: 8,
          borderBottom: "1px solid #ccc",
          display: "flex",
          alignItems: "center",
          background: "#eee"
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            background: "#888",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            marginRight: 8
          }}
        >
          {currentUser.name?.[0]?.toUpperCase() || "?"}
        </div>
        <div style={{ fontWeight: 600 }}>{currentUser.name}</div>
        {typing && (
          <div style={{ marginLeft: 8, fontSize: 12, color: "#666" }}>typing...</div>
        )}
      </div>

      {/* messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          background: "#f5f5f5"
        }}
      >
        {msgs.map((m, i) => {
          const isMine = m.sender_id === currentUser.id;
          const bubbleStyle = getBubbleStyle(m);
          return (
            <div
              key={i}
              style={{
                alignSelf: isMine ? "flex-end" : "flex-start",
                padding: "8px 12px",
                borderRadius: 16,
                marginBottom: 6,
                maxWidth: "70%",
                wordBreak: "break-word",
                ...bubbleStyle
              }}
            >
              {!isMine && (
                <div style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
                  {m.avatar_url && (
                    <img
                      src={m.avatar_url}
                      style={{ width: 20, height: 20, borderRadius: 10, marginRight: 4 }}
                    />
                  )}
                  <div style={{ fontSize: 10, fontWeight: 600 }}>
                    {m.sender_name ?? "anon"}
                  </div>
                </div>
              )}
              {m.text}
              <div
                style={{ fontSize: 10, textAlign: "right", marginTop: 4, opacity: 0.7 }}
              >
                {new Date(m.created_at).toLocaleTimeString()}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* input */}
      <div
        style={{
          display: "flex",
          padding: 8,
          borderTop: "1px solid #ccc",
          background: "#fff"
        }}
      >
        <input
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 20,
            border: "1px solid #ccc",
            outline: "none"
          }}
          value={text}
          onChange={handleTyping}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          style={{
            marginLeft: 8,
            padding: "8px 16px",
            borderRadius: 20,
            border: "none",
            background: "#007bff",
            color: "#fff",
            cursor: "pointer"
          }}
          onClick={send}
          disabled={!text.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;

