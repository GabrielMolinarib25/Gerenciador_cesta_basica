// Arquivo de configuração e inicialização do cliente Supabase
// As credenciais reais serão inseridas na próxima etapa da implementação.

const SUPABASE_URL = 'https://hfqfielvjhmvqtuwrivt.supabase.co';

const SUPABASE_ANON_KEY = 'sb_publishable_kG0AuQwCIxS3S6BouHLjHQ_nfItuDNM';

window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
