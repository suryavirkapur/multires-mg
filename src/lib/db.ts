import { Pool } from "pg";

let pool: Pool | null = null;

export function getPgPool(): Pool {
    if (pool) return pool;

    const {
        PGHOST,
        PGDATABASE,
        PGUSER,
        PGPASSWORD,
        PGPORT,
    } = process.env;

    // Validate required environment variables
    if (!PGHOST || !PGDATABASE || !PGUSER || !PGPASSWORD) {
        const missing = [
            !PGHOST && "PGHOST",
            !PGDATABASE && "PGDATABASE",
            !PGUSER && "PGUSER",
            !PGPASSWORD && "PGPASSWORD",
        ]
            .filter(Boolean)
            .join(", ");
        throw new Error(
            `Missing required PostgreSQL environment variables: ${missing}`,
        );
    }

    pool = new Pool({
        host: PGHOST.trim(),
        database: PGDATABASE.trim(),
        user: PGUSER.trim(),
        password: PGPASSWORD.trim(),
        port: PGPORT ? Number(PGPORT) : 5432,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30_000,
    });

    return pool;
}

export type JobListing = {
    id: string | number;
    title?: string;
    company?: string;
    location?: string;
    similarity?: number;
};

export async function queryTopJobListingsByEmbedding(
    embedding: number[],
    limit = 3,
): Promise<JobListing[]> {
    const pool = getPgPool();

    const table = process.env.JOB_TABLE ?? "job_listings";
    const embeddingColumn = process.env.JOB_EMBEDDING_COLUMN ?? "embedding";

    // Basic identifier safety: only allow alphanumerics and underscores in env-provided identifiers
    const safeIdent = (name: string) => {
        if (!/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(name)) {
            throw new Error(`Unsafe SQL identifier: ${name}`);
        }
        return name;
    };

    const tableSafe = safeIdent(table);
    const embeddingColumnSafe = safeIdent(embeddingColumn);

    // Using cosine distance operator (<=>) from pgvector; lower is closer.
    // We also return a similarity score as (1 - distance).
    const sql = `
    SELECT 
      id,
      title,
      company,
      location,
      (1 - ("${embeddingColumnSafe}" <=> $1::vector))::float AS similarity
    FROM ${tableSafe}
    ORDER BY "${embeddingColumnSafe}" <=> $1::vector ASC
    LIMIT $2
  `;

    // Build parameter list: $1 must be the vector; construct as Postgres array literal for pgvector
    // Use the pg parameterization: we send text for vector cast
    const vectorText = `[${embedding.join(",")}]`;

    try {
        const result = await pool.query(sql, [vectorText, limit]);
        return result.rows as JobListing[];
    } catch (error) {
        const host = process.env.PGHOST || "unknown";
        const db = process.env.PGDATABASE || "unknown";
        console.error("Database query error:", {
            host,
            database: db,
            table,
            error: error instanceof Error ? error.message : String(error),
        });
        throw new Error(
            `Failed to query job listings: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}


