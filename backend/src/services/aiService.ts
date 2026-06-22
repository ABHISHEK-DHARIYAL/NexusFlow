import { TaskType } from "../models/types.js";
import { getGeminiClient } from "../config/gemini.js";

export async function runAIGeneration(
  taskType: TaskType,
  payload: {
    channelName?: string;
    niche?: string;
    topic?: string;
    leetcodeData?: string;
    githubData?: string;
  }
): Promise<string> {
  const {
    channelName = "Weekend Channel",
    niche = "Education",
    topic = "Tech Advancements",
    leetcodeData,
    githubData,
  } = payload;

  let prompt = "";
  switch (taskType) {
    case TaskType.AI_GENERATE_SCRIPT:
      prompt = `You are an expert YouTube script writer for a ${niche} channel called "${channelName}". Write a short, highly detailed video outline script about: "${topic}". Include an intro hook, three core points, and a call-to-action outtro.`;
      break;
    case TaskType.AI_GENERATE_TITLE:
      prompt = `Generate 5 click-worthy, highly SEO-optimized YouTube title options for a video about "${topic}" in the ${niche} domain.`;
      break;
    case TaskType.AI_GENERATE_DESCRIPTION:
      prompt = `Write a clean YouTube video description for a video about "${topic}". Include helpful resource bullet points, dynamic keywords, and placeholders for timestamps.`;
      break;
    case TaskType.AI_GENERATE_TAGS:
      prompt = `Generate 15 popular keyword search tags for YouTube for a video about "${topic}" in ${niche} niche. Return them only as a comma-separated list.`;
      break;
    case TaskType.AI_GENERATE_THUMBNAIL_PROMPT:
      prompt = `Write a detailed image generation prompt for a Midjourney / Imagen engine that represents a YouTube thumbnail for: "${topic}". Focus on rich colors, high contrast, and dynamic typography ideas.`;
      break;
    case TaskType.AI_GENERATE_HOOK:
      prompt = `Write a high-retention 15-second visual hook script for a YouTube Short or Instagram Reel about "${topic}". Must capture attention instantly within the first 3 words.`;
      break;
    case TaskType.AI_GENERATE_CAPTION:
      prompt = `Write a short visual post description caption with emojis and relevant hashtags for a short-form content piece about: "${topic}".`;
      break;
    case TaskType.GENERATE_REPORT:
      prompt = `Analyze productivity stats and formulate an executive developer performance morning digest:
- GitHub Developer Commits & Repo State: ${githubData || "Not connected"}
- LeetCode Concurrency Practice Solve: ${leetcodeData || "Not connected"}
State 3 major highlights, 1 key bottleneck, and custom concurrency recommendations.`;
      break;
    default:
      return "Executed standard concurrency task.";
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      return response.text || "AI completed script output safely.";
    } catch (e: any) {
      console.error("Gemini invocation failed, using smart offline fallback generator:", e);
    }
  }

  // Fallback content offline generator
  return `### [FORGE ENGINE OFFLINE GENERATOR]
*(Offline synthesis based on topic: "${topic}")*

#### 💡 Topic Focus: ${topic}
#### 🏷️ Channel: ${channelName} • Niche: ${niche}
#### ⚙️ Task Executor: CPU_ThreadExecutorv1.0.4

This document is synthesized in real-time by ThreadForge's local sandbox simulator. 

1. **Section 1: The Core Thread Hook (0:00 - 1:15)**
   Start with a high contrast visual showing active code threads executing, asking the watcher if they ever hit CPU lockups. Introduce ${topic} as the revolutionary solution to this problem.
   
2. **Section 2: Deep Dive Anatomy (1:15 - 5:30)**
   Highlight standard race conditions and why typical thread pools are prone to lock-contention. Break down the queue mechanics under ${niche} guidelines.
   
3. **Section 3: Practical Performance Optimization (5:30 - 8:45)**
   Implement manual Priority Heap structures (like CustomPriorityQueue min-heaps) to speed up scheduling.
   
4. **Section 4: Wrap & CTA**
   Include links to user profiles. Prompt the user to Star the repository and subscribe to "${channelName}"!
   
*Generated at ${new Date().toLocaleTimeString()} by ThreadForge Creator Hub scheduler.*`;
}
