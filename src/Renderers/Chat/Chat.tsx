// ABOUTME: Reusable chat surface — scrollable transcript plus an input row.
// ABOUTME: Pure presentational; consumers own state and pass messages + onSubmit.

import { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import SendIcon from "@mui/icons-material/Send";

export type TextPart = { type: "text"; text: string };
export type ImagePart = { type: "image"; url: string; alt?: string };
export type ContentPart = TextPart | ImagePart;

export type ChatMessage = {
    id: string;
    role: "user" | "assistant" | "system";
    content: string | ContentPart[];
    authorName?: string;
};

export type ChatProps = {
    messages: ChatMessage[];
    onSubmit: (text: string) => void;
    placeholder?: string;
    busy?: boolean;
    fontSize?: number;
};

function normalizeParts(content: string | ContentPart[]): ContentPart[] {
    if (typeof content === "string") return [{ type: "text", text: content }];
    return content;
}

export function Chat({ messages, onSubmit, placeholder = "Type a message...", busy = false, fontSize = 14 }: ChatProps) {
    const [draft, setDraft] = useState("");
    const transcriptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = transcriptRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages.length]);

    const submit = () => {
        const text = draft.trim();
        if (!text || busy) return;
        onSubmit(text);
        setDraft("");
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
            <Box ref={transcriptRef} sx={{ flex: 1, overflowY: "auto", p: 1, minHeight: 0 }}>
                {messages.map((m) => <ChatBubble key={m.id} message={m} fontSize={fontSize} />)}
            </Box>
            <Box sx={{ display: "flex", gap: 1, p: 1, borderTop: 1, borderColor: "divider", flex: "0 0 auto" }}>
                <TextField
                    fullWidth
                    size="small"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={placeholder}
                    disabled={busy}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            submit();
                        }
                    }}
                />
                <IconButton color="primary" onClick={submit} disabled={busy || !draft.trim()}>
                    <SendIcon />
                </IconButton>
            </Box>
        </Box>
    );
}

function ChatBubble({ message, fontSize }: { message: ChatMessage; fontSize: number }) {
    const parts = normalizeParts(message.content);
    const captionSize = Math.round(fontSize * 0.85);

    if (message.role === "system") {
        const text = parts.filter((p): p is TextPart => p.type === "text").map((p) => p.text).join(" ");
        return (
            <Box sx={{ display: "flex", justifyContent: "center", my: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: captionSize }}>{text}</Typography>
            </Box>
        );
    }

    const isUser = message.role === "user";
    return (
        <Box sx={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", my: 0.5 }}>
            <Paper
                elevation={1}
                sx={{
                    p: 1,
                    px: 1.5,
                    maxWidth: "95%",
                    bgcolor: isUser ? "primary.main" : "background.paper",
                    color: isUser ? "primary.contrastText" : "text.primary",
                }}
            >
                {message.authorName && !isUser && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2, mb: 0.25, fontSize: captionSize }}>
                        {message.authorName}
                    </Typography>
                )}
                {parts.map((part, idx) => <ContentPartView key={idx} part={part} fontSize={fontSize} />)}
            </Paper>
        </Box>
    );
}

function ContentPartView({ part, fontSize }: { part: ContentPart; fontSize: number }) {
    if (part.type === "text") {
        return (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontSize }}>
                {part.text}
            </Typography>
        );
    }
    return (
        <Box
            component="img"
            src={part.url}
            alt={part.alt ?? ""}
            sx={{
                display: "block",
                maxWidth: "100%",
                height: "auto",
                borderRadius: 1,
                mt: 0.5,
            }}
        />
    );
}

export default Chat;
