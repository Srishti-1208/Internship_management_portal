import { useState } from "react";
import axios from "axios";

export default function ChatBot() {
  const [msg, setMsg] = useState("");
  const [reply, setReply] = useState("");

  const sendMessage = async () => {
    const res = await axios.post(
      "http://localhost:4000/api/chat",
      { message: msg }
    );

    setReply(res.data.reply);
  };

  return (
    <div>
      <h2>AI Assistant</h2>

      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
      />

      <button onClick={sendMessage}>
        Ask
      </button>

      <div>
        <strong>Response:</strong>
        <p>{reply}</p>
      </div>
    </div>
  );
}