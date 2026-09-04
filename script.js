/**
 * SIMULAÇÃO DE BANCO DE DADOS
 */
const db = {
    usuarioAutenticado: {
        id: 1, nome: "Priscila", cargo: "Secretária", email: "maria.souza@igrejaesperanca.org"
    },
    pessoas: [
        { id: 1, nome: "Ana Silva", nascimento: "14/07/1982", endereco: "Rua das Flores, 123 - Centro", status: "Recebeu" },
        { id: 2, nome: "João Santos", nascimento: "03/11/1975", endereco: "Av. Brasil, 456 - Jardim das Palmeiras", status: "Não recebeu" },
        { id: 3, nome: "Clarice Lima", nascimento: "25/01/1990", endereco: "Rua Ceará, 90 - Bairro das Indústrias", status: "Recebeu" }
    ],
    // Estoque de cestas prontas para entrega
    estoqueCestas: {
        "Cesta Básica": 0,
        "Cesta Pequena": 0
    },
    // Histórico de cestas entregues (Gestão de Cestas)
    cestas: [
        { id: 1, tipo: "Cesta Básica", qtd: 1, validade: "12/05/2026", pessoaId: 1, status: "Entregue" },
        { id: 2, tipo: "Cesta Pequena", qtd: 1, validade: "18/06/2026", pessoaId: 2, status: "Entregue" }
    ],
    // Matriz de Controle de Recebimentos
    recebimentos: [
        { id: 101, pessoaId: 1, cestaId: 1, ano: 2026, mes: 1, recebido: true },
        { id: 102, pessoaId: 2, cestaId: 2, ano: 2026, mes: 1, recebido: true }
    ],
    // 18 Itens com Estoque e Qtd por Cesta
    itensMontagem: [
        { nome: "Pacote de arroz", estoqueDisponivel: 50, quantidadePorCesta: 2, checked: true },
        { nome: "Bolacha", estoqueDisponivel: 40, quantidadePorCesta: 2, checked: true },
        { nome: "Óleo", estoqueDisponivel: 20, quantidadePorCesta: 1, checked: true },
        { nome: "Achocolatado", estoqueDisponivel: 15, quantidadePorCesta: 1, checked: true },
        { nome: "Vinagre", estoqueDisponivel: 20, quantidadePorCesta: 1, checked: true },
        { nome: "Cartela de ovos", estoqueDisponivel: 30, quantidadePorCesta: 1, checked: true },
        { nome: "Sal", estoqueDisponivel: 25, quantidadePorCesta: 1, checked: true },
        { nome: "Pó de café", estoqueDisponivel: 18, quantidadePorCesta: 1, checked: true },
        { nome: "Farinha de mandioca", estoqueDisponivel: 20, quantidadePorCesta: 1, checked: true },
        { nome: "Fubá", estoqueDisponivel: 10, quantidadePorCesta: 0, checked: false },
        { nome: "Farinha de trigo", estoqueDisponivel: 12, quantidadePorCesta: 0, checked: false },
        { nome: "Açúcar", estoqueDisponivel: 40, quantidadePorCesta: 2, checked: true },
        { nome: "Pacote de macarrão", estoqueDisponivel: 60, quantidadePorCesta: 3, checked: true },
        { nome: "Feijão", estoqueDisponivel: 35, quantidadePorCesta: 2, checked: true },
        { nome: "Sardinha em lata", estoqueDisponivel: 45, quantidadePorCesta: 2, checked: true },
        { nome: "Sabonete", estoqueDisponivel: 50, quantidadePorCesta: 2, checked: true },
        { nome: "Tempero", estoqueDisponivel: 5, quantidadePorCesta: 0, checked: false },
        { nome: "Pasta de dente", estoqueDisponivel: 20, quantidadePorCesta: 1, checked: true }
    ]
};

// ==========================================
// MENU E NAVEGAÇÃO
// ==========================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
    } else {
        sidebar.classList.add('open');
        overlay.classList.remove('hidden');
    }
}

function navigate(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active', 'view-flex');
        view.classList.add('hidden');
    });

    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
        if (viewId === 'view-login') targetView.classList.add('view-flex');
        else targetView.classList.add('active');
    }

    const btnVoltar = document.getElementById('btn-voltar');
    if (viewId !== 'view-inicio' && viewId !== 'view-login') btnVoltar.classList.remove('hidden');
    else btnVoltar.classList.add('hidden');

    // Fechar sidebar se estiver aberta
    if (document.getElementById('sidebar').classList.contains('open')) toggleSidebar();
}

// ==========================================
// RENDERIZAÇÃO BÁSICA (DASHBOARD E PESSOAS)
// ==========================================
function renderUserData() {
    document.getElementById('user-name-display').innerText = db.usuarioAutenticado.nome;
    document.getElementById('user-role-display').innerText = db.usuarioAutenticado.cargo;
    document.getElementById('welcome-message').innerText = `Bem-vinda, ${db.usuarioAutenticado.nome}!`;
}

function renderPessoas() {
    const tbody = document.getElementById('tbody-pessoas');
    const selectCestaPessoa = document.getElementById('cesta-pessoa');
    tbody.innerHTML = ''; selectCestaPessoa.innerHTML = '<option value="">Selecione o beneficiário</option>';

    db.pessoas.forEach(pessoa => {
        const badgeClass = pessoa.status === 'Recebeu' ? 'success' : 'error';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${pessoa.nome}</strong></td><td>${pessoa.nascimento}</td><td>${pessoa.endereco}</td><td><span class="badge ${badgeClass}">${pessoa.status}</span></td><td class="actions"><i class="fa-solid fa-pen text-blue"></i><i class="fa-solid fa-trash text-red" onclick="deletePessoa(${pessoa.id})"></i></td>`;
        tbody.appendChild(tr);

        const option = document.createElement('option');
        option.value = pessoa.id; option.textContent = pessoa.nome;
        selectCestaPessoa.appendChild(option);
    });
}

function deletePessoa(id) {
    if (confirm("Tem certeza que deseja excluir?")) {
        db.pessoas = db.pessoas.filter(p => p.id !== id);
        renderPessoas(); renderCestas(); renderRecebimentos();
    }
}

// ==========================================
// INTEGRAÇÃO: GESTÃO DE CESTAS & ESTOQUE
// ==========================================
function renderEstoqueCestas() {
    document.getElementById('estoque-basica-qtd').innerText = db.estoqueCestas["Cesta Básica"];
    document.getElementById('estoque-pequena-qtd').innerText = db.estoqueCestas["Cesta Pequena"];
}

function renderCestas() {
    const tbody = document.getElementById('tbody-cestas');
    tbody.innerHTML = '';

    // Atualiza os marcadores de estoque disponível no topo
    renderEstoqueCestas();

    db.cestas.forEach(cesta => {
        const pessoa = db.pessoas.find(p => p.id === cesta.pessoaId);
        const badgeClass = cesta.status === 'Entregue' ? 'success' : 'warning';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${cesta.tipo}</strong></td><td>${cesta.qtd}</td><td>${cesta.validade}</td><td><strong>${pessoa ? pessoa.nome : 'Desconhecida'}</strong></td><td>${pessoa ? pessoa.endereco : '-'}</td><td><span class="badge ${badgeClass}">${cesta.status}</span></td><td class="actions"><i class="fa-solid fa-trash text-red" onclick="deleteCesta(${cesta.id})"></i></td>`;
        tbody.appendChild(tr);
    });
}

function deleteCesta(id) {
    if (confirm("Se esta cesta foi excluída, sua quantidade será devolvida ao estoque. Confirmar?")) {
        const cesta = db.cestas.find(c => c.id === id);
        if (cesta) {
            // Devolve a quantidade para o estoque de cestas prontas
            db.estoqueCestas[cesta.tipo] += parseInt(cesta.qtd);
            db.cestas = db.cestas.filter(c => c.id !== id);

            // Remove do controle de recebimentos se estiver vinculada
            db.recebimentos = db.recebimentos.filter(r => r.cestaId !== id);

            renderCestas();
            renderRecebimentos();
        }
    }
}

// ==========================================
// MONTAGEM DA CESTA (ALIMENTOS -> CESTA)
// ==========================================
function renderMontagemCesta() {
    const container = document.getElementById('grid-alimentos-container');
    container.innerHTML = '';

    db.itensMontagem.forEach((item, index) => {
        const isChecked = item.checked ? 'checked' : '';
        const itemClass = item.checked ? 'alimento-item checked' : 'alimento-item';
        const div = document.createElement('div');
        div.className = itemClass;
        div.innerHTML = `
            <div class="alimento-topo"><label class="checkbox-container"><input type="checkbox" ${isChecked} onchange="handleItemChange(${index}, 'checked', this.checked, this)"><span class="checkmark"></span>${item.nome}</label></div>
            <div class="alimento-dados">
                <div class="dado-mini"><label>Estoque disponível</label><input type="number" min="0" value="${item.estoqueDisponivel}" class="qtd-input" oninput="handleItemChange(${index}, 'estoque', this.value, this)"></div>
                <div class="dado-mini"><label>Qtd. por cesta</label><input type="number" min="0" value="${item.quantidadePorCesta}" class="qtd-input" oninput="handleItemChange(${index}, 'qtd', this.value, this)"></div>
            </div>`;
        container.appendChild(div);
    });
    atualizarCapacidadeMontagem();
}

function handleItemChange(index, field, value, element) {
    if (field === 'checked') {
        db.itensMontagem[index].checked = value;
        const container = element.closest('.alimento-item');
        if (value) container.classList.add('checked'); else container.classList.remove('checked');
    } else if (field === 'estoque') db.itensMontagem[index].estoqueDisponivel = parseInt(value) || 0;
    else if (field === 'qtd') db.itensMontagem[index].quantidadePorCesta = parseInt(value) || 0;
    atualizarCapacidadeMontagem();
}

function calcularCapacidadeCestas() {
    const itensSelecionados = db.itensMontagem.filter(item => item.checked);
    if (itensSelecionados.length === 0) return 0;
    let maxCestas = Infinity;
    for (let item of itensSelecionados) {
        if (item.quantidadePorCesta <= 0) return 0;
        const capacidadeItem = Math.floor(item.estoqueDisponivel / item.quantidadePorCesta);
        if (capacidadeItem < maxCestas) maxCestas = capacidadeItem;
    }
    return maxCestas === Infinity ? 0 : maxCestas;
}

function atualizarCapacidadeMontagem() {
    const capacidade = calcularCapacidadeCestas();
    const txtCapacidade = document.getElementById('txt-capacidade-maxima');
    if (capacidade === 0) {
        txtCapacidade.style.color = 'var(--error-text)'; txtCapacidade.style.backgroundColor = 'var(--error-bg)'; txtCapacidade.innerText = "Operação bloqueada (Verifique itens)";
    } else {
        txtCapacidade.style.color = 'var(--primary)'; txtCapacidade.style.backgroundColor = '#E8F3F3'; txtCapacidade.innerText = `Máximo disponível: ${capacidade} cesta(s)`;
    }
}

function montarCestas() {
    const itensSelecionados = db.itensMontagem.filter(item => item.checked);
    const capacidadeMaxima = calcularCapacidadeCestas();
    const qtdDesejada = parseInt(document.getElementById('qtd-montar-input').value) || 0;

    if (itensSelecionados.length === 0) return alert("Selecione pelo menos um alimento.");
    if (itensSelecionados.some(i => i.quantidadePorCesta <= 0)) return alert("Alimentos selecionados não podem ter quantidade zero.");
    if (qtdDesejada <= 0) return alert("Informe uma quantidade válida.");
    if (capacidadeMaxima === 0 || qtdDesejada > capacidadeMaxima) return alert(`Estoque insuficiente! Você pode montar no máximo ${capacidadeMaxima} cesta(s).`);

    // Deduz do mini estoque de alimentos
    db.itensMontagem.forEach(item => {
        if (item.checked) item.estoqueDisponivel -= (item.quantidadePorCesta * qtdDesejada);
    });

    // Identifica o tipo selecionado e injeta nas cestas prontas (pool)
    const tipoSelecionado = document.querySelector('input[name="tipo-cesta-montagem"]:checked').value;
    db.estoqueCestas[tipoSelecionado] += qtdDesejada;

    alert(`Sucesso! ${qtdDesejada} ${tipoSelecionado}(s) produzida(s) e adicionada(s) à Gestão de Cestas.`);

    renderMontagemCesta();
    renderCestas(); // Atualiza contador na Gestão
    document.getElementById('qtd-montar-input').value = 1;
}

// ==========================================
// TELA: CONTROLE DE RECEBIMENTOS
// ==========================================
function renderRecebimentos() {
    const tbody = document.getElementById('tbody-recebimentos');
    const anoSelecionado = parseInt(document.getElementById('recebimentos-ano').value);
    const termoBusca = document.getElementById('recebimentos-busca').value.toLowerCase();

    tbody.innerHTML = '';

    // Filtrar pessoas pela pesquisa
    const pessoasFiltradas = db.pessoas.filter(p => p.nome.toLowerCase().includes(termoBusca));

    pessoasFiltradas.forEach(pessoa => {
        const tr = document.createElement('tr');

        let rowHtml = `<td><strong>${pessoa.nome}</strong></td>`;

        // Gerar as 12 colunas de meses
        for (let mes = 1; mes <= 12; mes++) {
            const recebimento = db.recebimentos.find(r => r.pessoaId === pessoa.id && r.ano === anoSelecionado && r.mes === mes);

            let conteudo = '—';
            if (recebimento && recebimento.recebido) {
                conteudo = '<i class="fa-solid fa-check text-green"></i>';
            }

            rowHtml += `<td class="recebimento-cell" onclick="toggleRecebimento(${pessoa.id}, ${mes})">${conteudo}</td>`;
        }

        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });
}

function toggleRecebimento(pessoaId, mes) {
    const anoSelecionado = parseInt(document.getElementById('recebimentos-ano').value);
    const registroExistente = db.recebimentos.find(r => r.pessoaId === pessoaId && r.ano === anoSelecionado && r.mes === mes);

    if (registroExistente && registroExistente.recebido) {
        // DESFAZER: Remove recebimento, exclui a cesta associada (se existir) e devolve pro estoque
        if (registroExistente.cestaId) {
            const cestaRelacionada = db.cestas.find(c => c.id === registroExistente.cestaId);
            if (cestaRelacionada) {
                db.estoqueCestas[cestaRelacionada.tipo] += 1;
                db.cestas = db.cestas.filter(c => c.id !== registroExistente.cestaId);
            }
        }
        db.recebimentos = db.recebimentos.filter(r => r.id !== registroExistente.id);
    } else {
        // MARCAR: Consome 1 cesta do estoque (Prioriza Básica, senao Pequena)
        let tipoDisponivel = null;
        if (db.estoqueCestas["Cesta Básica"] >= 1) {
            tipoDisponivel = "Cesta Básica";
        } else if (db.estoqueCestas["Cesta Pequena"] >= 1) {
            tipoDisponivel = "Cesta Pequena";
        }

        if (!tipoDisponivel) {
            alert("Nenhuma cesta disponível na Gestão! Produza cestas primeiro na tela de Montagem.");
            return;
        }

        // Deduz do estoque
        db.estoqueCestas[tipoDisponivel] -= 1;

        // Cria o registro da cesta na Gestão de Cestas (para rastreio)
        const novaCestaId = Date.now();
        db.cestas.push({
            id: novaCestaId,
            tipo: tipoDisponivel,
            qtd: 1,
            validade: "N/A (Entrega Rápida)",
            pessoaId: pessoaId,
            status: "Entregue"
        });

        // Cria o registro de recebimento
        db.recebimentos.push({
            id: Date.now() + 1,
            pessoaId: pessoaId,
            cestaId: novaCestaId,
            ano: anoSelecionado,
            mes: mes,
            recebido: true
        });
    }

    // Re-renderiza as telas envolvidas
    renderRecebimentos();
    renderCestas();
}

function exportarExcel() {
    const anoSelecionado = parseInt(document.getElementById('recebimentos-ano').value);
    const termoBusca = document.getElementById('recebimentos-busca').value.toLowerCase();

    // Header do CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Beneficiario,Janeiro,Fevereiro,Marco,Abril,Maio,Junho,Julho,Agosto,Setembro,Outubro,Novembro,Dezembro\n";

    const pessoasFiltradas = db.pessoas.filter(p => p.nome.toLowerCase().includes(termoBusca));

    pessoasFiltradas.forEach(pessoa => {
        let linha = `${pessoa.nome}`;
        for (let mes = 1; mes <= 12; mes++) {
            const recebeu = db.recebimentos.some(r => r.pessoaId === pessoa.id && r.ano === anoSelecionado && r.mes === mes && r.recebido);
            linha += `,${recebeu ? "Recebeu" : "Nao recebeu"}`;
        }
        csvContent += linha + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Controle_Recebimentos_${anoSelecionado}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==========================================
// LISTENERS (INICIALIZAÇÃO E FORMULÁRIOS)
// ==========================================
document.getElementById('cesta-pessoa').addEventListener('change', function (e) {
    const pessoaId = parseInt(e.target.value);
    const pessoa = db.pessoas.find(p => p.id === pessoaId);
    document.getElementById('cesta-endereco-auto').value = pessoa ? pessoa.endereco : '';
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('form-login').addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('view-login').classList.remove('active', 'view-flex');
        document.getElementById('view-login').classList.add('hidden');
        document.getElementById('app-layout').classList.remove('hidden');

        renderUserData();
        renderPessoas();
        renderCestas();
        renderMontagemCesta();
        renderRecebimentos();

        navigate('view-inicio');
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        document.getElementById('app-layout').classList.add('hidden');
        navigate('view-login');
        document.getElementById('form-login').reset();
    });

    // Submissão Pessoas
    document.getElementById('form-pessoa').addEventListener('submit', (e) => {
        e.preventDefault();
        db.pessoas.push({ id: Date.now(), nome: document.getElementById('pessoa-nome').value, nascimento: document.getElementById('pessoa-nascimento').value, endereco: document.getElementById('pessoa-endereco').value, status: "Não recebeu" });
        renderPessoas(); renderRecebimentos(); e.target.reset(); alert("Cadastrado com sucesso!");
    });

    // Submissão Gestão de Cestas (Validação de Estoque)
    document.getElementById('form-cesta').addEventListener('submit', (e) => {
        e.preventDefault();
        const tipo = document.getElementById('cesta-tipo').value;
        const qtd = parseInt(document.getElementById('cesta-qtd').value);

        if (qtd <= 0 || isNaN(qtd)) return alert("Quantidade inválida.");

        // Valida contra o estoque disponível de Cestas Montadas
        if (qtd > db.estoqueCestas[tipo]) {
            return alert(`Quantidade indisponível. Você possui apenas ${db.estoqueCestas[tipo]} ${tipo}(s) disponível(is).`);
        }

        // Deduz do estoque
        db.estoqueCestas[tipo] -= qtd;

        db.cestas.push({
            id: Date.now(),
            tipo: tipo,
            qtd: qtd,
            validade: document.getElementById('cesta-validade').value,
            pessoaId: parseInt(document.getElementById('cesta-pessoa').value),
            status: "Entregue"
        });

        renderCestas();
        e.target.reset();
        document.getElementById('cesta-endereco-auto').value = '';
        alert("Entrega registrada e deduzida do estoque com sucesso!");
    });
});