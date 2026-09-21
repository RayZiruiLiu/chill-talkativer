"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };
type Recognition = { start: () => void; stop: () => void; onresult: ((event: SpeechRecognitionEvent) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; continuous: boolean; interimResults: boolean; lang: string };

declare global { interface Window { webkitSpeechRecognition?: new () => Recognition; SpeechRecognition?: new () => Recognition; } }
interface SpeechRecognitionEvent extends Event { results: { [index: number]: { [index: number]: { transcript: string } } }; }

const openers = [
  "Give me a no-effort question",
  "What’s a weirdly good hill to die on?",
  "Help me turn today into a convo",
  "Random rabbit hole, please"
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "Hey, I’m Macca. No performative small talk here — we can chew the fat about something oddly specific, or just vibe. What’s been taking up space in your brain lately?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<Recognition | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  function speak(text: string) {
    if (!voiceOn || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.97;
    const voice = speechSynthesis.getVoices().find(v => /en-AU/i.test(v.lang));
    if (voice) utterance.voice = voice;
    speechSynthesis.speak(utterance);
  }

  async function send(content = input) {
    const clean = content.trim();
    if (!clean || loading) return;
    setInput(""); setError(""); setLoading(true);
    const next = [...messages, { role: "user" as const, content: clean }];
    setMessages(next);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went sideways");
      setMessages(current => [...current, { role: "assistant", content: data.message }]);
      speak(data.message);
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn’t reach Macca right now."); }
    finally { setLoading(false); }
  }

  function toggleMic() {
    if (listening) { recognition.current?.stop(); return; }
    const BrowserRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!BrowserRecognition) { setError("Voice input is best supported in Chrome or Edge."); return; }
    const mic = new BrowserRecognition();
    mic.lang = "en-AU"; mic.continuous = false; mic.interimResults = false;
    mic.onresult = event => setInput(event.results[0][0].transcript);
    mic.onend = () => setListening(false);
    mic.onerror = () => { setListening(false); setError("Couldn’t hear that — check microphone permission and try again."); };
    recognition.current = mic; setListening(true); mic.start();
  }

  function submit(e: FormEvent) { e.preventDefault(); send(); }

  return <main>
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">~</span><span>chill<br/><b>talkativer</b></span></div>
      <div className="side-copy"><p className="eyebrow">YOUR LOW-PRESSURE CORNER</p><h2>Talking is a<br/><i>place to wander.</i></h2><p>Not a performance. Not networking. Just seeing where a thought goes.</p></div>
      <div className="status"><span className="pulse"/> Macca’s round</div>
      <button className="voice-toggle" onClick={() => { setVoiceOn(v => !v); speechSynthesis.cancel(); }}><span>{voiceOn ? "◖" : "◌"}</span> Voice {voiceOn ? "on" : "off"}</button>
    </aside>
    <section className="chat-shell">
      <header><div><p className="eyebrow">CONVERSATION MODE</p><h1>Pull up a chair <span>↓</span></h1></div><button className="new-chat" onClick={() => { speechSynthesis.cancel(); setMessages([messages[0]]); setError(""); }}>↻ Fresh start</button></header>
      <div className="conversation" aria-live="polite">
        {messages.map((message, index) => <article key={index} className={`message ${message.role}`}><div className="avatar">{message.role === "assistant" ? "M" : "YOU"}</div><p>{message.content}</p>{message.role === "assistant" && <button className="speak" onClick={() => speak(message.content)} aria-label="Read response aloud">⌁</button>}</article>)}
        {loading && <article className="message assistant"><div className="avatar">M</div><p className="thinking"><i/> <i/> <i/></p></article>}
        <div ref={endRef}/>
      </div>
      <div className="composer-wrap">
        <div className="quickies">{openers.map(opener => <button key={opener} onClick={() => send(opener)}>{opener}</button>)}</div>
        {error && <p className="error">{error}</p>}
        <form onSubmit={submit} className="composer"><button type="button" onClick={toggleMic} className={`mic ${listening ? "live" : ""}`} aria-label="Use voice input">{listening ? "◉" : "◌"}</button><input value={input} onChange={e => setInput(e.target.value)} placeholder={listening ? "Listening…" : "Say something. Anything."}/><button type="submit" className="send" disabled={!input.trim() || loading} aria-label="Send message">↑</button></form>
        <p className="hint">Tap the circle to talk · Macca can talk back</p>
      </div>
    </section>
  </main>;
}
