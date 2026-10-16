# 📋 Documentação de Implementação, Deploy e Segurança

Este documento detalha todas as etapas técnicas executadas no projeto **Controle de Cestas Básicas (Igreja Batista Betel)**, abordando a infraestrutura de deploy contínuo, correção de erros do cliente Supabase e o endurecimento de segurança no banco de dados.

---

## 🛠️ 1. Ferramentas e Tecnologias Utilizadas

| Ferramenta / Serviço | Papel no Projeto | Como foi utilizado |
| :--- | :--- | :--- |
| **Vercel** | Hospedagem & CDN Global | Hospeda o frontend estático, gerencia domínios e certificados SSL gratuitos. |
| **Vercel MCP Server** | Automação e Gerenciamento de Infraestrutura | Criação do projeto, vinculação ao repositório GitHub, configuração de permissões e monitoramento de deploys diretamente pelo assistente. |
| **GitHub & Git** | Controle de Versão & CI/CD | Armazenamento do código-fonte e gatilho automático de publicação a cada novo `git push` na branch `main`. |
| **Supabase (PostgreSQL)** | Banco de Dados Relacional | Armazena dados de beneficiários (`pessoas`), estoque (`estoque_cestas`), histórico (`historico_cestas`), alimentos (`itens_montagem`) e perfis de acesso (`perfis`). |
| **Supabase Auth** | Autenticação & Gestão de Sessões | Login seguro por e-mail e senha, emissão de tokens JWT e controle de níveis de acesso (`Admin` e `Gerente`). |
| **Supabase MCP Server** | Gestão e Auditoria do Banco | Execução de migrações DDL, auditoria de segurança via *Database Advisors / Linters* e confirmação de usuários. |
| **Frontend Stack** | Interface da Aplicação | HTML5 semântico, Vanilla CSS moderno, JavaScript puro, biblioteca SheetJS (relatórios XLSX) e biblioteca `@supabase/supabase-js@2`. |

---

## 🚀 2. Deploy Contínuo na Vercel (CI/CD)

### O que foi feito:
1. **Criação do Projeto:**
   - Criado o projeto `gerenciador-cesta-basica` vinculado à conta Vercel do usuário.
2. **Integração com GitHub:**
   - O projeto foi conectado ao repositório remoto [`GabrielMolinarib25/Gerenciador_cesta_basica`](https://github.com/GabrielMolinarib25/Gerenciador_cesta_basica) na branch de produção `main`.
   - **Fluxo Automatizado:** Qualquer novo commit enviado ao GitHub via `git push origin main` agora dispara uma compilação e deploy instantâneo na Vercel de forma 100% autônoma.
3. **Ajuste de Acesso Público:**
   - A proteção de SSO/Deployment Protection foi configurada para permitir acesso direto e público aos usuários finais sem necessidade de login na Vercel.

### Links Oficiais de Produção:
- **Domínio Principal:** [https://gerenciador-cesta-basica.vercel.app](https://gerenciador-cesta-basica.vercel.app)
- **Domínio Alternativo:** [https://gerenciador-cesta-basica-gabriel-molinari.vercel.app](https://gerenciador-cesta-basica-gabriel-molinari.vercel.app)

---

## 🐛 3. Diagnóstico e Resolução do Erro 404 (`supabaseClient.js`)

### O Problema:
Ao abrir o site pela primeira vez no navegador, o console apresentava dois erros:
1. `Failed to load resource: the server responded with a status of 404 (assets/js/supabaseClient.js)`
2. `Uncaught ReferenceError: supabaseLib is not defined at script.js:15`

### A Causa:
O arquivo `supabaseClient.js` estava listado no `.gitignore`. Por esse motivo, ele foi omitido no repositório do GitHub e a Vercel não o possuía nos arquivos publicados. Sem ele, a inicialização do cliente Supabase não ocorria.

### A Solução:
- **Conceito de Segurança:** As credenciais presentes nesse arquivo (`SUPABASE_URL` e `SUPABASE_ANON_KEY`) utilizam a chave *anon/publishable* (`sb_publishable_...`). Essa chave foi projetada pela arquitetura do Supabase especificamente para rodar no navegador do cliente, pois a segurança real dos dados é delegada às regras de RLS (*Row Level Security*) no banco PostgreSQL.
- O `.gitignore` foi atualizado para ignorar apenas diretórios temporários (`.vercel`).
- O arquivo `assets/js/supabaseClient.js` foi adicionado ao Git, comitado e enviado ao GitHub.
- A Vercel executou o deploy automático com sucesso, normalizando o carregamento do script (Status 200 OK).

---

## 👤 4. Confirmação do Usuário no Supabase Auth

### O que foi feito:
- O usuário administrativo **`lucas@ibbetel.org.br`** (Lucas Augusto, cargo `Admin`) havia sido cadastrado, mas permanecia com a confirmação de e-mail pendente (`email_confirmed_at = null`).
- Foi executada uma atualização segura via MCP no schema `auth.users` definindo `email_confirmed_at = now()` e marcando `email_verified = true`.
- O registro de perfil na tabela `public.perfis` foi verificado, permitindo login imediato no sistema sem barreiras de confirmação.

---

## 🛡️ 5. Blindagem de Segurança das Tabelas (Row Level Security - RLS)

### O Problema Identificado:
O auditor de segurança (*Security Linter*) do Supabase apontou que 4 tabelas do banco de dados estavam com o **Row Level Security (RLS) desativado**:
- `public.pessoas`
- `public.estoque_cestas`
- `public.historico_cestas`
- `public.itens_montagem`

Com o RLS desativado, qualquer pessoa na internet com a chave pública do site poderia efetuar leituras, alterações ou exclusões arbitrárias nessas tabelas via API REST.

### A Solução Implementada (Migração DDL):
1. **Habilitação do RLS:**
   ```sql
   ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.estoque_cestas ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.historico_cestas ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.itens_montagem ENABLE ROW LEVEL SECURITY;
   ```
2. **Criação de Políticas Granulares para Usuários Autenticados:**
   - Para cada tabela, criamos políticas com alvo exclusivo `TO authenticated`:
     - `pessoas`: Acesso completo (CRUD) liberado apenas para usuários logados.
     - `estoque_cestas`: Acesso completo liberado apenas para usuários logados.
     - `historico_cestas`: Acesso completo liberado apenas para usuários logados.
     - `itens_montagem`: Acesso completo liberado apenas para usuários logados.
   - **Bloqueio Total:** Usuários anônimos (`anon`, qualquer um navegando sem login) têm 100% das operações de leitura e escrita negadas pelo banco.
3. **Proteção da Tabela `perfis` (já ativa anteriormente):**
   - Leitura liberada para usuários autenticados.
   - Criação, edição e exclusão de usuários restritas estritamente ao cargo `Admin`.
4. **Proteção da Função `rls_auto_enable()`:**
   - Revogadas permissões públicas de execução da trigger function (`REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated`), sanando o alerta de *Security Definer*.

---

## 📌 6. Resumo da Estrutura Atual do Banco

| Tabela | RLS Ativo? | Nível de Proteção |
| :--- | :---: | :--- |
| `public.pessoas` | ✅ **Sim** | Restrito a usuários autenticados (`authenticated`) |
| `public.estoque_cestas` | ✅ **Sim** | Restrito a usuários autenticados (`authenticated`) |
| `public.historico_cestas` | ✅ **Sim** | Restrito a usuários autenticados (`authenticated`) |
| `public.itens_montagem` | ✅ **Sim** | Restrito a usuários autenticados (`authenticated`) |
| `public.perfis` | ✅ **Sim** | Leitura: autenticados \| Escrita: exclusivo `Admin` |

---

## 🔄 7. Como Manter o Sistema Daqui para Frente

- **Para publicar melhorias no site:** Faça suas alterações de código localmente, execute `git add .`, crie um commit (`git commit -m "sua mensagem"`) e rode `git push origin main`. A Vercel atualizará o site automaticamente em poucos segundos.
- **Para novos usuários:** Cadastre-os pela tela de *Gerenciar Usuários* (quando logado como `Admin`).
- **Segurança:** O banco agora bloqueia qualquer acesso externo não autorizado, mantendo todas as informações de estoque e beneficiários totalmente protegidas.
