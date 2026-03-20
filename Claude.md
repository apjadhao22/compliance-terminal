cat \> CLAUDE.md \<\< 'EOF'  
\# CLAUDE.md — Compliance Terminal

\#\# Supabase Project  
\- Project ref: susnynfoeufnorwapcae  
\- URL: https://susnynfoeufnorwapcae.supabase.co  
\- This is the ONLY Supabase project for this repo

\#\# Rules — NEVER break these  
1\. Every supabase CLI command must use linked project (already linked)  
2\. NEVER run \`supabase link\` again  
3\. NEVER run \`supabase db reset\`  
4\. NEVER cd outside /Users/amar/Desktop/compliance-terminal

\#\# Deno Import Rules — ALL edge functions must use these exact URLs  
\- serve: \`import { serve } from "https://deno.land/std@0.168.0/http/server.ts"\`  
\- supabase: \`import { createClient } from "https://esm.sh/@supabase/supabase-js@2"\`  
\- NO bare specifiers like "std/server" or "@supabase/supabase-js"  
\- NO playwright imports anywhere — use fetch() only

\#\# Secrets already set  
\- OPENROUTER\_API\_KEY ✅  
\- JINA\_API\_KEY ✅

\#\# After every file change, deploy with  
supabase functions deploy FUNCTION\_NAME \--use-api  
EOF

