export interface Feedback {
  text: string;
  type: "success" | "info" | "error";
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: GroundingSource[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  systemInstruction?: string;
  useSearch: boolean;
  modelName: string;
  createdAt: string;
}
