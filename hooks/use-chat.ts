import { useCallback, useState } from "react";
import { apiClient, Conversation, ConversationMessage } from "@/lib/api-client";

export type { Conversation, ConversationMessage };

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ?? null;

  // ── Load the full conversation list ───────────────────────────────────────

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    const res = await apiClient.listConversations();
    if (res.success && res.data) {
      // Sort newest first
      setConversations(
        [...res.data].sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        ),
      );
    }
    setIsLoadingConversations(false);
  }, []);

  // ── Select + load a conversation ──────────────────────────────────────────

  const selectConversation = useCallback(async (id: number) => {
    setActiveConversationId(id);
    setMessages([]);
    setIsLoadingMessages(true);
    const res = await apiClient.getConversation(id);
    if (res.success && res.data) {
      setMessages(res.data.messages ?? []);
    }
    setIsLoadingMessages(false);
  }, []);

  // ── Create a new conversation ─────────────────────────────────────────────

  const createConversation = useCallback(async (title?: string) => {
    const res = await apiClient.createConversation(title);
    if (res.success && res.data) {
      const newConv = res.data;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setMessages([]);
      return newConv;
    }
    return null;
  }, []);

  // ── Rename a conversation ─────────────────────────────────────────────────

  const renameConversation = useCallback(async (id: number, title: string) => {
    const res = await apiClient.renameConversation(id, title);
    if (res.success) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c)),
      );
    }
    return res;
  }, []);

  // ── Delete a conversation ─────────────────────────────────────────────────

  const deleteConversation = useCallback(
    async (id: number) => {
      const res = await apiClient.deleteConversation(id);
      if (res.success) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
      return res;
    },
    [activeConversationId],
  );

  // ── Send a message (with optional file) ───────────────────────────────────

  const sendMessage = useCallback(
    async (message: string, file?: File) => {
      const trimmed = message.trim();
      if ((!trimmed && !file) || isStreaming) {
        return { success: false, error: "Cannot send empty message" };
      }

      setError(null);
      setIsStreaming(true);

      // Ensure we have an active conversation — create one on demand
      let convId = activeConversationId;
      if (!convId) {
        const firstLine =
          trimmed.slice(0, 60) || (file?.name ?? "New Conversation");
        const conv = await createConversation(firstLine);
        if (!conv) {
          setIsStreaming(false);
          return { success: false, error: "Could not create conversation" };
        }
        convId = conv.id;
      }

      // Optimistic user bubble
      const userLabel = trimmed + (file ? `\n\n📎 ${file.name}` : "");
      const optimisticUser: ConversationMessage = {
        id: Date.now(),
        role: "user",
        content: userLabel,
        attachment_name: file?.name ?? null,
        created_at: new Date().toISOString(),
      };
      const optimisticAssistant: ConversationMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "",
        attachment_name: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUser, optimisticAssistant]);

      try {
        const response = await apiClient.sendConversationMessage(
          convId,
          trimmed,
          file,
        );
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          // SSE events are separated by \n\n
          const parts = buffer.split("\n\n");
          buffer = parts.pop()!;

          for (const part of parts) {
            const raw = part.replace(/^data: /, "").trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              const parsed = JSON.parse(raw);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.token) {
                assistantContent += parsed.token;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...last,
                      content: assistantContent,
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // Ignore malformed / partial JSON chunks
            }
          }
        }

        // Bubble the conversation to the top of the list
        setConversations((prev) =>
          [...prev]
            .map((c) =>
              c.id === convId
                ? { ...c, updated_at: new Date().toISOString() }
                : c,
            )
            .sort(
              (a, b) =>
                new Date(b.updated_at).getTime() -
                new Date(a.updated_at).getTime(),
            ),
        );

        return { success: true };
      } catch (err: any) {
        const msg = err?.message ?? "An error occurred";
        setError(msg);
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: "⚠️ " + msg,
            };
          }
          return updated;
        });
        return { success: false, error: msg };
      } finally {
        setIsStreaming(false);
      }
    },
    [activeConversationId, isStreaming, createConversation],
  );

  return {
    conversations,
    activeConversation,
    activeConversationId,
    messages,
    isStreaming,
    isLoadingConversations,
    isLoadingMessages,
    error,
    loadConversations,
    selectConversation,
    createConversation,
    renameConversation,
    deleteConversation,
    sendMessage,
  };
}
