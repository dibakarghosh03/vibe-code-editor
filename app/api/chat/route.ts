import { type NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openrouter";

interface ChatMessage {
  role: "user" | "system";
  content: string;
}

interface EnhancePromptRequest {
  prompt: string;
  context?: {
    fileName?: string;
    language?: string;
    codeContent?: string;
  };
}

async function generateChatResponse(messages: ChatMessage[]) {
  const systemPrompt = `You are an expert AI coding assistant. You help developers with:
- Code explanations and debugging
- Best practices and architecture advice
- Writing clean, efficient code
- Troubleshooting errors
- Code reviews and optimizations

Always provide clear, practical answers. When showing code, use proper formatting with language-specific syntax.
Keep responses concise but comprehensive. Use code blocks with language specification when providing code examples.`;

  return await callAI(systemPrompt, messages);
}

async function generateReviewResponse(messages: ChatMessage[]) {
  const systemPrompt = `You are a senior code reviewer.
Your job is to review the user's code and provide:
- Performance suggestions
- Security best practices
- Readability/maintainability improvements
- Clear reasoning for each suggestion
DO NOT rewrite the whole file, only give detailed feedback and targeted improvements.
`;

  return await callAI(systemPrompt, messages);
}

async function generateFixResponse(messages: ChatMessage[]) {
  const systemPrompt = `You are an expert bug fixer.
Your job is to carefully analyze the given file and return a corrected version of the code if errors exist.
Rules:
- Return the FULL fixed file.
- Preserve coding style.
- Fix syntax errors, type errors, logical issues.
- If no issue is found, say "No issues found in the file."
`;

  return await callAI(systemPrompt, messages);
}

async function generateOptimizeResponse(messages: ChatMessage[]) {
  const systemPrompt = `You are an expert code optimization assistant. 
Your job is to analyze the provided code and suggest improvements for:
- Performance
- Memory usage
- Clean architecture
- Readability

Rules:
1. Always provide **two sections** in your response:
   - "Suggestions" → A clear numbered list of improvements with reasoning.
   - "Optimized Code" → The full optimized version of the code inside a properly formatted code block (with language tag).
2. Suggestions must explain WHY the change improves the code.
3. If the code is already optimal, explicitly say: "The code is already optimized. No changes needed."
`;

  return await callAI(systemPrompt, messages);
}

async function callAI(systemPrompt: string, messages: ChatMessage[]) {
  const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

  try {
    const completion = await openai.chat.completions.create({
    model: "qwen/qwen3-coder:free",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    max_tokens: 1000,
    temperature: 0.7,
    top_p: 0.9,
  });

  return completion.choices[0].message?.content?.trim() ?? "// No response";
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Request timeout: AI model took too long to respond");
    }
    throw error;
  }
}

async function enhancePrompt(request: EnhancePromptRequest) {
  const enhancementPrompt = `You are a prompt enhancement assistant. Take the user's basic prompt and enhance it to be more specific, detailed, and effective for a coding AI assistant.

Original prompt: "${request.prompt}"

Context: ${
    request.context
      ? JSON.stringify(request.context, null, 2)
      : "No additional context"
  }

Enhanced prompt should:
- Be more specific and detailed
- Include relevant technical context
- Ask for specific examples or explanations
- Be clear about expected output format
- Maintain the original intent

Return only the enhanced prompt, nothing else.`;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen2.5-coder:3b",
        prompt: enhancementPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          max_tokens: 500,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to enhance prompt");
    }

    const data = await response.json();
    return data.response?.trim() || request.prompt;
  } catch (error) {
    console.error("Prompt enhancement error:", error);
    return request.prompt; // Return original if enhancement fails
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle prompt enhancement
    if (body.action === "enhance") {
      const enhancedPrompt = await enhancePrompt(body as EnhancePromptRequest);
      return NextResponse.json({ enhancedPrompt });
    }

    const { message, history, mode } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    const validHistory = Array.isArray(history)
      ? history.filter(
          (msg: any) =>
            msg &&
            typeof msg === "object" &&
            typeof msg.role === "string" &&
            typeof msg.content === "string" &&
            ["user", "system"].includes(msg.role)
        )
      : [];
    const recentHistory = validHistory.slice(-10);
    const messages: ChatMessage[] = [
      ...recentHistory,
      { role: "user", content: message },
    ];

    let aiResponse: string | null = null;

    switch (mode) {
      case "review":
        aiResponse = await generateReviewResponse(messages);
        break;
      case "fix":
        aiResponse = await generateFixResponse(messages);
        break;
      case "optimize":
        aiResponse = await generateOptimizeResponse(messages);
        break;
      default:
        aiResponse = await generateChatResponse(messages);
    }

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in AI chat route:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "AI Chat API is running",
    timestamp: new Date().toISOString(),
    info: "Use POST method to send chat messages or enhance prompts",
  });
}
