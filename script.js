/**
 * SIMULAÇÃO DE BANCO DE DADOS
 */
const db = {
    usuarioAutenticado: {
        id: 1, nome: "Priscila", cargo: "Secretária", email: "maria.souza@igrejaesperanca.org"
    },
    pessoas: [
        { id: 1, nome: "Ana Silva", nascimento: "14/07/1982", endereco: "Rua das Flores, 123 - Centro" },
        { id: 2, nome: "João Santos", nascimento: "03/11/1975", endereco: "Av. Brasil, 456 - Jardim das Palmeiras" },
        { id: 3, nome: "Clarice Lima", nascimento: "25/01/1990", endereco: "Rua Ceará, 90 - Bairro das Indústrias" }
    ],
    // Estoque de cestas prontas para entrega
    estoqueCestas: {
        "Cesta Básica": 0,
        "Cesta Pequena": 0
    },
    // Histórico de Cestas (Fonte universal de dados e recebimentos)
    cestas: [
        { id: 1, tipo: "Cesta Básica", qtd: 1, validade: "30/12/2026", dataRecebimento: "15/01/2026", pessoaId: 1, status: "Entregue" },
        { id: 2, tipo: "Cesta Pequena", qtd: 1, validade: "18/06/2026", dataRecebimento: "10/02/2026", pessoaId: 2, status: "Entregue" },
        { id: 3, tipo: "Cesta Básica", qtd: 1, validade: "25/03/2026", dataRecebimento: "", pessoaId: 3, status: "Pendente" }
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
// FUNÇÕES UTILITÁRIAS
// ==========================================

// Parse seguro de data para identificar ano e mes do formato dd/mm/yyyy
function parseDataRecebimento(dataStr) {
    if (!dataStr || dataStr.trim() === '') return null;
    const parts = dataStr.split('/');
    if (parts.length === 3) {
        const mes = parseInt(parts[1]);
        const ano = parseInt(parts[2]);
        if (!isNaN(mes) && !isNaN(ano)) return { mes, ano };
    }
    return null;
}

// ==========================================
// NAVEGAÇÃO
// ==========================================
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
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${pessoa.nome}</strong></td><td>${pessoa.nascimento}</td><td>${pessoa.endereco}</td><td class="actions"><i class="fa-solid fa-trash text-red" onclick="deletePessoa(${pessoa.id})"></i></td>`;
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

    renderEstoqueCestas();

    db.cestas.forEach(cesta => {
        const pessoa = db.pessoas.find(p => p.id === cesta.pessoaId);
        const dataVisualizacao = cesta.dataRecebimento ? cesta.dataRecebimento : '-';
        const badgeClass = cesta.status === 'Entregue' ? 'success' : 'warning';

        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${cesta.tipo}</strong></td><td>${cesta.qtd}</td><td>${dataVisualizacao}</td><td><strong>${pessoa ? pessoa.nome : 'Desconhecida'}</strong></td><td>${pessoa ? pessoa.endereco : '-'}</td><td><span class="badge ${badgeClass}">${cesta.status}</span></td><td class="actions"><i class="fa-solid fa-trash text-red" onclick="deleteCesta(${cesta.id})"></i></td>`;
        tbody.appendChild(tr);
    });
}

function deleteCesta(id) {
    if (confirm("Se esta cesta foi excluída, sua quantidade será devolvida ao estoque e sumirá do Controle. Confirmar?")) {
        const cesta = db.cestas.find(c => c.id === id);
        if (cesta) {
            db.estoqueCestas[cesta.tipo] += parseInt(cesta.qtd);
            db.cestas = db.cestas.filter(c => c.id !== id);
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

    db.itensMontagem.forEach(item => {
        if (item.checked) item.estoqueDisponivel -= (item.quantidadePorCesta * qtdDesejada);
    });

    const tipoSelecionado = document.querySelector('input[name="tipo-cesta-montagem"]:checked').value;
    db.estoqueCestas[tipoSelecionado] += qtdDesejada;

    alert(`Sucesso! ${qtdDesejada} ${tipoSelecionado}(s) produzida(s) e adicionada(s) à Gestão de Cestas.`);

    renderMontagemCesta();
    renderCestas();
    document.getElementById('qtd-montar-input').value = 1;
}

// ==========================================
// TELA: CONTROLE DE RECEBIMENTOS AUTOMATIZADO
// ==========================================
function renderRecebimentos() {
    const tbody = document.getElementById('tbody-recebimentos');
    const anoSelecionado = parseInt(document.getElementById('recebimentos-ano').value);
    const termoBusca = document.getElementById('recebimentos-busca').value.toLowerCase();

    tbody.innerHTML = '';

    const pessoasFiltradas = db.pessoas.filter(p => p.nome.toLowerCase().includes(termoBusca));

    pessoasFiltradas.forEach(pessoa => {
        const tr = document.createElement('tr');
        let rowHtml = `<td><strong>${pessoa.nome}</strong></td>`;

        for (let mes = 1; mes <= 12; mes++) {
            // Verifica na base de Gestão de Cestas se há entrega para esta pessoa, neste mês e ano
            const recebeu = db.cestas.some(c => {
                if (c.pessoaId !== pessoa.id) return false;
                const dataParsed = parseDataRecebimento(c.dataRecebimento);
                return dataParsed && dataParsed.ano === anoSelecionado && dataParsed.mes === mes;
            });

            let conteudo = '—';
            if (recebeu) {
                conteudo = '<i class="fa-solid fa-check text-green"></i>';
            }
            rowHtml += `<td>${conteudo}</td>`;
        }

        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });
}

// Utiliza SheetJS para gerar um XLSX real e bem formatado
function exportarExcel() {
    const anoSelecionado = parseInt(document.getElementById('recebimentos-ano').value);
    const termoBusca = document.getElementById('recebimentos-busca').value.toLowerCase();

    const pessoasFiltradas = db.pessoas.filter(p => p.nome.toLowerCase().includes(termoBusca));
    const dadosExcel = [];

    pessoasFiltradas.forEach(pessoa => {
        const linha = { "Beneficiário": pessoa.nome };

        const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

        for (let mes = 1; mes <= 12; mes++) {
            const recebeu = db.cestas.some(c => {
                if (c.pessoaId !== pessoa.id) return false;
                const dataParsed = parseDataRecebimento(c.dataRecebimento);
                return dataParsed && dataParsed.ano === anoSelecionado && dataParsed.mes === mes;
            });

            linha[mesesNomes[mes - 1]] = recebeu ? "Recebeu" : "Não recebeu";
        }

        dadosExcel.push(linha);
    });

    // Cria Worksheet e Workbook e aplica as regras estruturais de colunas (SheetJS)
    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    const wb = XLSX.utils.book_new();

    // Ajusta o tamanho da primeira coluna
    ws['!cols'] = [{ wch: 30 }];

    XLSX.utils.book_append_sheet(wb, ws, `Recebimentos_${anoSelecionado}`);

    // Dispara o download do arquivo .xlsx verdadeiro
    XLSX.writeFile(wb, `Controle_de_Recebimentos_${anoSelecionado}.xlsx`);
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

    document.getElementById('form-pessoa').addEventListener('submit', (e) => {
        e.preventDefault();
        db.pessoas.push({ id: Date.now(), nome: document.getElementById('pessoa-nome').value, nascimento: document.getElementById('pessoa-nascimento').value, endereco: document.getElementById('pessoa-endereco').value });
        renderPessoas(); renderRecebimentos(); e.target.reset(); alert("Cadastrado com sucesso!");
    });

    // Submissão Gestão de Cestas - Controlando Status pela Data de Recebimento
    document.getElementById('form-cesta').addEventListener('submit', (e) => {
        e.preventDefault();
        const tipo = document.getElementById('cesta-tipo').value;
        const qtd = parseInt(document.getElementById('cesta-qtd').value);
        const validade = document.getElementById('cesta-validade').value;
        const dataRecebimento = document.getElementById('cesta-recebimento').value.trim();
        const pessoaId = parseInt(document.getElementById('cesta-pessoa').value);

        if (qtd <= 0 || isNaN(qtd)) return alert("Quantidade inválida.");

        if (qtd > db.estoqueCestas[tipo]) {
            return alert(`Quantidade indisponível. Você possui apenas ${db.estoqueCestas[tipo]} ${tipo}(s) disponível(is).`);
        }

        db.estoqueCestas[tipo] -= qtd;

        // Regra do Status via Data de Recebimento
        const statusReal = dataRecebimento ? "Entregue" : "Pendente";

        db.cestas.push({
            id: Date.now(),
            tipo: tipo,
            qtd: qtd,
            validade: validade,
            dataRecebimento: dataRecebimento,
            pessoaId: pessoaId,
            status: statusReal
        });

        renderCestas();
        renderRecebimentos();
        e.target.reset();
        document.getElementById('cesta-endereco-auto').value = '';
        alert("Cesta registrada com sucesso!");
    });
});