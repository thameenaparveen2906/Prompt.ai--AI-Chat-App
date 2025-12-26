import { useEffect, useRef, useState } from "react";
import { SendHorizonalIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import vs2015 from "react-syntax-highlighter/dist/esm/styles/prism/atom-dark";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getChatMessages, promptGPT } from "@/lib/api";
import TypingLoader from "@/components/TypingLoader";

export default function Homepage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [chatID, setChatID] = useState("");
  const { chat_uid } = useParams();

  useEffect(() => {
    if (chat_uid) {
      setChatID(chat_uid);
    } else {
      setChatID(crypto.randomUUID());
    }

    console.log("chat id changed!!")
  }, [chat_uid]);

  const [messages, setMessages] = useState([
    { role: "assistant", content: "Welcome! I'm here to assist you." },
  ]);

  const mutation = useMutation({
    mutationFn: promptGPT,
    onSuccess: (res) => {
      console.log(res);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply },
      ]);
    },
  });

  const { data: chatData } = useQuery({
    queryKey: ["chatMessages", chatID],
    queryFn: () => getChatMessages(chatID),
  });

  useEffect(() => {
    if (chatID && chatData) {
      setMessages(chatData);
    }
  }, [chatID, chatData]);

  console.log("chatdtata", chatData);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.pathname == "/" || location.pathname == "/chats/new") {
      setMessages([
        { role: "assistant", content: "Welcome! I'm here to assist you." },
      ]);

      // setChatID("");
    }
  }, [location.pathname]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    if (location.pathname == "/" || location.pathname == "/chats/new") {
      navigate(`/chats/${chatID}`);
    }

    const newMessage = { role: "user", content: input };
    setMessages((prev) =>
      [...prev, newMessage].filter(
        (p) => p.content != "Welcome! I'm here to assist you."
      )
    );

    mutation.mutate({ chat_id: chatID, content: input });
    setInput("");
  };

  return (
    <div className="flex flex-1">
      <div className="flex flex-col flex-1 bg-background text-foreground">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) =>
            msg.role === "user" ? (
              <div
                key={idx}
                className="w-full mx-auto p-4 rounded-xl bg-primary text-primary-foreground self-end"
              >
                {msg.content}
              </div>
            ) : (
              <div
                key={idx}
                className="prose dark:prose-invert max-w-none bg-muted text-foreground p-4 rounded-lg shadow mb-4"
              >
                <ReactMarkdown
                  components={{
                    code({ inline, className, children }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vs2015}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-md"
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className="bg-muted rounded px-1 py-0.5 text-sm">
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            )
          )}

          {mutation.isPending && <TypingLoader />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4 sticky bottom-0 z-50 bg-background text-foreground">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <Textarea
              placeholder="Send a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 resize-none min-h-[80px] max-h-[200px] rounded-md border border-input bg-muted/40 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 placeholder:text-muted-foreground shadow-sm transition"
            />

            <button
              onClick={handleSend}
              className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition"
            >
              <SendHorizonalIcon size={18} className="cursor-pointer" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}