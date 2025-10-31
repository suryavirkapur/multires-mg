import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { queryTopJobListingsByEmbedding } from "@/lib/db";

async function embedWithMiniLM(text: string): Promise<number[]> {
    const apiKey = process.env.HF_API_KEY;
    if (!apiKey) {
        throw new Error(
            "HF_API_KEY is not set. Please add a Hugging Face token to use embeddings.",
        );
    }

    const response = await fetch(
        "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
        },
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`HF Inference error: ${response.status} ${err}`);
    }

    const data = (await response.json()) as unknown;
    // Expect either a flat [384] vector or token-level [[..., 384], ...]
    if (Array.isArray(data) && typeof data[0] === "number") {
        return data as number[];
    }
    if (Array.isArray(data) && Array.isArray(data[0])) {
        const tokens = data as number[][];
        const dims = tokens[0]?.length ?? 0;
        const sum = new Array(dims).fill(0) as number[];
        for (const tok of tokens) {
            for (let i = 0; i < dims; i++) sum[i] += tok[i] ?? 0;
        }
        return sum.map((v) => v / Math.max(tokens.length, 1));
    }
    throw new Error("Unexpected embedding response shape from HF");
}

async function extractTextFromRequest(req: Request): Promise<string> {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
        const form = await req.formData();
        const text = (form.get("resumeText") as string) || "";
        const file = form.get("file") as File | null;
        if (file && file.size > 0) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            // Lazy-import pdf-parse to avoid type issues and heavy load when not needed
            if (
                file.type === "application/pdf" ||
                file.name?.toLowerCase().endsWith(".pdf")
            ) {
                const pdfParse = (await import("pdf-parse")).default as any;
                const parsed = await pdfParse(buffer);
                const pdfText: string = parsed?.text || "";
                return text ? `${text}\n\n${pdfText}` : pdfText;
            }
            // Fallback: try treat as UTF-8 text
            const utfText = buffer.toString("utf8");
            return text ? `${text}\n\n${utfText}` : utfText;
        }
        if (text.trim().length > 0) return text;
        throw new Error("No resume text or file provided in form data.");
    }

    // JSON body fallback
    const body = (await req.json().catch(() => ({}))) as {
        resumeText?: string;
    };
    const text = body?.resumeText?.trim();
    if (text) return text;
    throw new Error("No resume text provided.");
}

export async function POST(request: Request) {
    try {
        const resumeText = await extractTextFromRequest(request);
        const embedding = await embedWithMiniLM(resumeText);

        const jobs = await queryTopJobListingsByEmbedding(embedding, 3);

        // Generate improvement suggestions per job
        const { text: suggestions } = await generateText({
            model: openai("gpt-5"),
            system:
                "You are a precise career coach. Compare a resume against job listings and give actionable, concise improvements.",
            prompt: `Resume:\n"""\n${resumeText}\n"""\n\nTop 3 job listings (JSON):\n${JSON.stringify(
                jobs.map((j) => ({
                    id: j.id,
                    title: j.title,
                    company: j.company,
                    url: j.url,
                    description: j.description,
                })),
                null,
                2,
            )}\n\nFor each listing, provide:\n- 1-2 sentence fit summary\n- 5 specific resume improvements (skills, keywords, quantification, structure) tailored to that listing\n- A single tailored objective/summary line we could add to the resume\nFormat as Markdown with clear sections per job (use headings).`,
        });

        return NextResponse.json({ jobs, suggestions });
    } catch (error) {
        console.error("resume-match route error", error);
        const message =
            error instanceof Error ? error.message : "Unexpected server error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}


