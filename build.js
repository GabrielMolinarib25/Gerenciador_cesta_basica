const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('AVISO: Variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não encontradas no ambiente.');
}

const content = `// Arquivo de configuração e inicialização do cliente Supabase (gerado automaticamente no build)
const SUPABASE_URL = '${supabaseUrl || ''}';
const SUPABASE_ANON_KEY = '${supabaseKey || ''}';

window.supabaseLib = supabase;
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
`;

const targetDir = path.join(__dirname, 'assets', 'js');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(path.join(targetDir, 'supabaseClient.js'), content, 'utf8');
console.log('assets/js/supabaseClient.js gerado com sucesso para o deploy!');
