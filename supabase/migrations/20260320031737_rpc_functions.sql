-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- Vector search RPC for rag-chat
CREATE OR REPLACE FUNCTION match_documents_by_embedding(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.65,
  match_count int DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  title text,
  ai_summary text,
  source_name text,
  source_url text,
  category text,
  urgency text,
  similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id, d.title, d.ai_summary, d.source_name,
    d.source_url, d.category, d.urgency,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Anomaly detector RPC
CREATE OR REPLACE FUNCTION get_source_counts_since(since_time TIMESTAMPTZ)
RETURNS TABLE(source_name TEXT, cnt BIGINT)
LANGUAGE SQL AS $$
  SELECT source_name, count(*) as cnt
  FROM documents
  WHERE published_at > since_time
    AND source_name IS NOT NULL
  GROUP BY source_name
  HAVING count(*) >= 5;
$$;

-- Evidence upload race condition fix
CREATE OR REPLACE FUNCTION append_evidence_url(task_id uuid, new_url text)
RETURNS void LANGUAGE SQL AS $$
  UPDATE compliance_tasks
  SET evidence_urls = array_append(COALESCE(evidence_urls, ARRAY[]::text[]), new_url)
  WHERE id = task_id;
$$;

-- Duplicate prevention
CREATE UNIQUE INDEX IF NOT EXISTS documents_source_url_idx ON documents(source_url);

-- Performance indexes
CREATE INDEX IF NOT EXISTS documents_published_at_idx ON documents(published_at DESC);
CREATE INDEX IF NOT EXISTS documents_urgency_idx ON documents(urgency);
CREATE INDEX IF NOT EXISTS documents_category_idx ON documents(category);
