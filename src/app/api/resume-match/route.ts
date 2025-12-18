import { NextResponse } from "next/server";
import { generateText } from "ai";
import { InferenceClient } from "@huggingface/inference";
import { queryTopJobListingsByEmbedding } from "@/lib/db";
import { deepseek } from "@ai-sdk/deepseek";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const LLM_MODEL = "deepseek-chat";
const TOP_JOBS_COUNT = 3;

const SYSTEM_PROMPT = `You are a precise career coach. Compare a resume against job listings and give actionable, concise improvements.`;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface JobListing {
    id: string;
    title: string;
    company: string;
    location: string;
}

class AppError extends Error {
    constructor(
        message: string,
        public statusCode: number = 400,
    ) {
        super(message);
        this.name = "AppError";
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Embedding
// ─────────────────────────────────────────────────────────────────────────────

function getHFClient(): InferenceClient {
    const token = process.env.HF_TOKEN;
    if (!token) {
        throw new AppError(
            "HF_TOKEN is not set. Please add a Hugging Face token to use embeddings.",
            500,
        );
    }
    return new InferenceClient(token);
}

function meanPoolEmbedding(tokens: number[][]): number[] {
    const dims = tokens[0]?.length ?? 0;
    const sum = new Array<number>(dims).fill(0);

    for (const tok of tokens) {
        for (let i = 0; i < dims; i++) {
            sum[i] += tok[i] ?? 0;
        }
    }

    return sum.map((v) => v / Math.max(tokens.length, 1));
}

async function embedText(text: string): Promise<number[]> {
    const client = getHFClient();

    const output = await client.featureExtraction({
        model: EMBEDDING_MODEL,
        inputs: text,
    });

    // Flat [384] vector
    if (Array.isArray(output) && typeof output[0] === "number") {
        return output as number[];
    }

    // Token-level [[..., 384], ...] → mean pool
    if (Array.isArray(output) && Array.isArray(output[0])) {
        return meanPoolEmbedding(output as number[][]);
    }

    throw new AppError("Unexpected embedding response shape from HuggingFace", 502);
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF Parsing
// ─────────────────────────────────────────────────────────────────────────────

function isPdfFile(file: File): boolean {
    return (
        file.type === "application/pdf" ||
        file.name?.toLowerCase().endsWith(".pdf")
    );
}

async function extractPdfText(buffer: Buffer): Promise<string> {
    const { extractText } = await import("unpdf");
    const data = new Uint8Array(buffer);
    const result = await extractText(data);
    // unpdf returns text as an array of strings (one per page)
    return result?.text?.join("\n\n") || "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Request Parsing
// ─────────────────────────────────────────────────────────────────────────────

function combineTexts(base: string, additional: string): string {
    return base ? `${base}\n\n${additional}` : additional;
}

async function extractFromFormData(req: Request): Promise<string> {
    const form = await req.formData();
    const text = (form.get("resumeText") as string) || "";
    const file = form.get("file") as File | null;

    if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());

        if (isPdfFile(file)) {
            const pdfText = await extractPdfText(buffer);
            return combineTexts(text, pdfText);
        }

        // Fallback: treat as UTF-8 text
        return combineTexts(text, buffer.toString("utf8"));
    }

    if (text.trim()) return text;
    throw new AppError("No resume text or file provided in form data.");
}

async function extractFromJson(req: Request): Promise<string> {
    const body = (await req.json().catch(() => ({}))) as { resumeText?: string };
    const text = body?.resumeText?.trim();

    if (text) return text;
    throw new AppError("No resume text provided.");
}

async function extractResumeText(req: Request): Promise<string> {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
        return extractFromFormData(req);
    }

    return extractFromJson(req);
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt Building
// ─────────────────────────────────────────────────────────────────────────────

function buildMatchPrompt(resumeText: string, jobs: JobListing[]): string {
    const jobsSummary = jobs.map(({ id, title, company, location }) => ({
        id,
        title,
        company,
        location,
    }));

    return `Resume:
"""
${resumeText}
"""

Top ${jobs.length} job listings (JSON):
${JSON.stringify(jobsSummary, null, 2)}

For each listing, provide:
- 1-2 sentence fit summary
- 5 specific resume improvements (skills, keywords, quantification, structure) tailored to that listing
- A single tailored objective/summary line we could add to the resume

Format as Markdown with clear sections per job (use headings).`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        const resumeText = await extractResumeText(request);
        const embedding = await embedText(resumeText);
        const jobs = await queryTopJobListingsByEmbedding(embedding, TOP_JOBS_COUNT);

        const { text: suggestions } = await generateText({
            model: deepseek(LLM_MODEL),
            system: SYSTEM_PROMPT,
            prompt: buildMatchPrompt(resumeText, jobs as JobListing[]),
        });

        return NextResponse.json({ jobs, suggestions });
    } catch (error) {
        console.error("[resume-match]", error);

        if (error instanceof AppError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.statusCode },
            );
        }

        const message = error instanceof Error ? error.message : "Unexpected server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}


