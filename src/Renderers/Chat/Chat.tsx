// ABOUTME: Reusable chat surface — scrollable transcript plus an input row.
// ABOUTME: Pure presentational; consumers own state and pass messages + onSubmit.

import { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import SendIcon from "@mui/icons-material/Send";

export type ChatMessage = {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    authorName?: string;
};

export type ChatProps = {
    messages: ChatMessage[];
    onSubmit: (text: string) => void;
    placeholder?: string;
    busy?: boolean;
};

export function Chat({ messages, onSubmit, placeholder = "Type a message...", busy = false }: ChatProps) {
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
                {messages.map((m) => <ChatBubble key={m.id} message={m} />)}
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

function ChatBubble({ message }: { message: ChatMessage }) {
    if (message.role === "system") {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", my: 0.5 }}>
                <Typography variant="caption" color="text.secondary">{message.content}</Typography>
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
                    maxWidth: "75%",
                    bgcolor: isUser ? "primary.main" : "background.paper",
                    color: isUser ? "primary.contrastText" : "text.primary",
                }}
            >
                {message.authorName && !isUser && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2, mb: 0.25 }}>
                        {message.authorName}
                    </Typography>
                )}
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {message.content}
                </Typography>
            </Paper>
        </Box>
    );
}

export default Chat;
