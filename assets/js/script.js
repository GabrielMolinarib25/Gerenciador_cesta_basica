/**
 * SCRIPT PRINCIPAL - INTEGRAÇÃO COM SUPABASE
 */
const db = {
    usuarioAutenticado: {
        id: 1, nome: "Priscila", cargo: "Secretária", email: "maria.souza@igrejaesperanca.org"
    }
};

// Estados Locais (Cache)
let pessoas = [];
let estoqueCestas = { "Cesta Básica": 0, "Cesta Pequena": 0 };
let cestas = [];
let itensMontagem = [];

// ==========================================
// FUNÇÕES UTILITÁRIAS DE DATA
// ==========================================

// Converte DD/MM/YYYY para YYYY-MM-DD (Para salvar no Supabase)
function converterDataParaBanco(dataBr) {
    if (!dataBr || dataBr.trim() === '') return null;
    const parts = dataBr.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return null;
}

// Converte YYYY-MM-DD para DD/MM/YYYY (Para exibir na tela)
function converterDataParaBr(dataIso) {
    if (!dataIso) return '';
    const parts = dataIso.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dataIso;
}

// Parse seguro de data ISO para identificar ano e mes (Para Controle de Recebimentos)
function parseDataRecebimentoIso(dataStr) {
    if (!dataStr || dataStr.trim() === '') return null;
    const parts = dataStr.split('-'); // YYYY-MM-DD
    if (parts.length === 3) {
        const ano = parseInt(parts[0]);
        const mes = parseInt(parts[1]);
        if (!isNaN(mes) && !isNaN(ano)) return { mes, ano };
    }
    return null;
}

// ==========================================
// INTEGRAÇÃO ASSÍNCRONA (FETCH INICIAL)
// ==========================================
async function fetchDadosIniciais() {
    // 1. Pessoas
    let res = await supabase.from('pessoas').select('*').order('nome');
    if (res.error) throw res.error;
    if (res.data) pessoas = res.data;

    // 2. Estoque
    res = await supabase.from('estoque_cestas').select('*');
    if (res.error) throw res.error;
    if (res.data) {
        res.data.forEach(e => {
            estoqueCestas[e.tipo] = e.quantidade;
        });
    }

    // 3. Histórico de Cestas
    res = await supabase.from('historico_cestas').select('*').order('created_at', { ascending: false });
    if (res.error) throw res.error;
    if (res.data) cestas = res.data;

    // 4. Itens de Montagem
    res = await supabase.from('itens_montagem').select('*').order('id');
    if (res.error) throw res.error;
    if (res.data) itensMontagem = res.data;
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
// RENDERIZAÇÃO BÁSICA E PESSOAS
// ==========================================
function renderUserData() {
    document.getElementById('user-name-display').innerText = db.usuarioAutenticado.nome;
    document.getElementById('user-role-display').innerText = db.usuarioAutenticado.cargo;
    document.getElementById('welcome-message').innerText = `Bem-vinda, ${db.usuarioAutenticado.nome}!`;
}

function renderPessoas() {
    const tbody = document.getElementById('tbody-pessoas');
    const selectCestaPessoa = document.getElementById('cesta-pessoa');
    tbody.innerHTML = '';
    selectCestaPessoa.innerHTML = '<option value="">Selecione o beneficiário</option>';

    pessoas.forEach(pessoa => {
        const tr = document.createElement('tr');
        const dataNascBr = converterDataParaBr(pessoa.nascimento);
        tr.innerHTML = `<td><strong>${pessoa.nome}</strong></td><td>${dataNascBr}</td><td>${pessoa.endereco}</td><td class="actions"><i class="fa-solid fa-trash text-red" onclick="deletePessoa(${pessoa.id})"></i></td>`;
        tbody.appendChild(tr);

        const option = document.createElement('option');
        option.value = pessoa.id;
        option.textContent = pessoa.nome;
        selectCestaPessoa.appendChild(option);
    });
}

async function deletePessoa(id) {
    if (confirm("Tem certeza que deseja excluir? O histórico de cestas dessa pessoa também será apagado.")) {
        const { error } = await supabase.from('pessoas').delete().eq('id', id);
        if (error) {
            alert("Erro ao deletar: " + error.message);
            return;
        }
        pessoas = pessoas.filter(p => p.id !== id);
        // Filtra cestas localmente para refletir o CASCADE do banco
        cestas = cestas.filter(c => c.pessoa_id !== id);
        renderPessoas();
        renderCestas();
        renderRecebimentos();
    }
}

// ==========================================
// INTEGRAÇÃO: GESTÃO DE CESTAS & ESTOQUE
// ==========================================
function renderEstoqueCestas() {
    document.getElementById('estoque-basica-qtd').innerText = estoqueCestas["Cesta Básica"] || 0;
    document.getElementById('estoque-pequena-qtd').innerText = estoqueCestas["Cesta Pequena"] || 0;
}

function renderCestas() {
    const tbody = document.getElementById('tbody-cestas');
    tbody.innerHTML = '';

    renderEstoqueCestas();

    cestas.forEach(cesta => {
        const pessoa = pessoas.find(p => p.id === cesta.pessoa_id);
        const dataRecebimentoBr = cesta.data_recebimento ? converterDataParaBr(cesta.data_recebimento) : '-';
        const badgeClass = cesta.status === 'Entregue' ? 'success' : 'warning';

        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${cesta.tipo}</strong></td><td>${cesta.quantidade}</td><td>${dataRecebimentoBr}</td><td><strong>${pessoa ? pessoa.nome : 'Desconhecida'}</strong></td><td>${pessoa ? pessoa.endereco : '-'}</td><td><span class="badge ${badgeClass}">${cesta.status}</span></td><td class="actions"><i class="fa-solid fa-trash text-red" onclick="deleteCesta(${cesta.id}, '${cesta.tipo}', ${cesta.quantidade})"></i></td>`;
        tbody.appendChild(tr);
    });
}

async function deleteCesta(id, tipo, qtd) {
    if (confirm("Se esta cesta foi excluída, sua quantidade será devolvida ao estoque e sumirá do Controle. Confirmar?")) {
        // Deleta histórico no banco
        const { error } = await supabase.from('historico_cestas').delete().eq('id', id);
        if (error) {
            alert("Erro ao excluir: " + error.message);
            return;
        }

        // Devolve ao estoque
        const novoEstoque = estoqueCestas[tipo] + qtd;
        await supabase.from('estoque_cestas').update({ quantidade: novoEstoque }).eq('tipo', tipo);

        // Atualiza cache local
        estoqueCestas[tipo] = novoEstoque;
        cestas = cestas.filter(c => c.id !== id);

        renderCestas();
        renderRecebimentos();
    }
}

// ==========================================
// MONTAGEM DA CESTA (ALIMENTOS -> CESTA)
// ==========================================
function renderMontagemCesta() {
    const container = document.getElementById('grid-alimentos-container');
    container.innerHTML = '';

    itensMontagem.forEach((item, index) => {
        const isChecked = item.checked ? 'checked' : '';
        const itemClass = item.checked ? 'alimento-item checked' : 'alimento-item';
        const div = document.createElement('div');
        div.className = itemClass;
        div.innerHTML = `
            <div class="alimento-topo"><label class="checkbox-container"><input type="checkbox" ${isChecked} onchange="handleItemChange(${item.id}, 'checked', this.checked, this)"><span class="checkmark"></span>${item.nome}</label></div>
            <div class="alimento-dados">
                <div class="dado-mini"><label>Estoque disponível</label><input type="number" min="0" value="${item.estoque_disponivel}" class="qtd-input" oninput="handleItemChange(${item.id}, 'estoque_disponivel', this.value, this)"></div>
                <div class="dado-mini"><label>Qtd. por cesta</label><input type="number" min="0" value="${item.quantidade_por_cesta}" class="qtd-input" oninput="handleItemChange(${item.id}, 'quantidade_por_cesta', this.value, this)"></div>
            </div>`;
        container.appendChild(div);
    });
    atualizarCapacidadeMontagem();
}

async function handleItemChange(itemId, field, value, element) {
    const itemIndex = itensMontagem.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    let finalValue = value;
    if (field === 'checked') {
        finalValue = value; // boolean
        const container = element.closest('.alimento-item');
        if (value) container.classList.add('checked'); else container.classList.remove('checked');
    } else {
        finalValue = parseInt(value) || 0; // integer for numbers
    }

    // Atualiza estado local
    itensMontagem[itemIndex][field] = finalValue;
    atualizarCapacidadeMontagem();

    // Atualiza no Supabase "em background"
    await supabase.from('itens_montagem').update({ [field]: finalValue }).eq('id', itemId);
}

function calcularCapacidadeCestas() {
    const itensSelecionados = itensMontagem.filter(item => item.checked);
    if (itensSelecionados.length === 0) return 0;

    let maxCestas = Infinity;
    for (let item of itensSelecionados) {
        if (item.quantidade_por_cesta <= 0) return 0;
        const capacidadeItem = Math.floor(item.estoque_disponivel / item.quantidade_por_cesta);
        if (capacidadeItem < maxCestas) maxCestas = capacidadeItem;
    }
    return maxCestas === Infinity ? 0 : maxCestas;
}

function atualizarCapacidadeMontagem() {
    const capacidade = calcularCapacidadeCestas();
    const txtCapacidade = document.getElementById('txt-capacidade-maxima');
    if (capacidade === 0) {
        txtCapacidade.style.color = 'var(--error-text)';
        txtCapacidade.style.backgroundColor = 'var(--error-bg)';
        txtCapacidade.innerText = "Operação bloqueada (Verifique itens)";
    } else {
        txtCapacidade.style.color = 'var(--primary)';
        txtCapacidade.style.backgroundColor = '#E8F3F3';
        txtCapacidade.innerText = `Máximo disponível: ${capacidade} cesta(s)`;
    }
}

async function montarCestas() {
    const itensSelecionados = itensMontagem.filter(item => item.checked);
    const capacidadeMaxima = calcularCapacidadeCestas();
    const qtdDesejada = parseInt(document.getElementById('qtd-montar-input').value) || 0;

    if (itensSelecionados.length === 0) return alert("Selecione pelo menos um alimento.");
    if (itensSelecionados.some(i => i.quantidade_por_cesta <= 0)) return alert("Alimentos selecionados não podem ter quantidade zero.");
    if (qtdDesejada <= 0) return alert("Informe uma quantidade válida.");
    if (capacidadeMaxima === 0 || qtdDesejada > capacidadeMaxima) return alert(`Estoque insuficiente! Você pode montar no máximo ${capacidadeMaxima} cesta(s).`);

    const tipoSelecionado = document.querySelector('input[name="tipo-cesta-montagem"]:checked').value;

    // Mostra indicador visual de loading mudando o texto do botão
    const btn = document.querySelector('button[onclick="montarCestas()"]');
    const txtOriginal = btn.innerText;
    btn.innerText = "Montando...";
    btn.disabled = true;

    try {
        // Atualiza estoque de alimentos
        for (let item of itensSelecionados) {
            item.estoque_disponivel -= (item.quantidade_por_cesta * qtdDesejada);
            await supabase.from('itens_montagem').update({ estoque_disponivel: item.estoque_disponivel }).eq('id', item.id);
        }

        // Atualiza estoque da cesta pronta
        estoqueCestas[tipoSelecionado] += qtdDesejada;
        await supabase.from('estoque_cestas').update({ quantidade: estoqueCestas[tipoSelecionado] }).eq('tipo', tipoSelecionado);

        alert(`Sucesso! ${qtdDesejada} ${tipoSelecionado}(s) produzida(s) e adicionada(s) à Gestão de Cestas.`);

        renderMontagemCesta();
        renderCestas();
        document.getElementById('qtd-montar-input').value = 1;
    } catch (err) {
        alert("Erro na montagem: " + err.message);
    } finally {
        btn.innerText = txtOriginal;
        btn.disabled = false;
    }
}

// ==========================================
// TELA: CONTROLE DE RECEBIMENTOS AUTOMATIZADO
// ==========================================
function renderRecebimentos() {
    const tbody = document.getElementById('tbody-recebimentos');
    const anoSelecionado = parseInt(document.getElementById('recebimentos-ano').value);
    const termoBusca = document.getElementById('recebimentos-busca').value.toLowerCase();

    tbody.innerHTML = '';

    const pessoasFiltradas = pessoas.filter(p => p.nome.toLowerCase().includes(termoBusca));

    pessoasFiltradas.forEach(pessoa => {
        const tr = document.createElement('tr');
        let rowHtml = `<td><strong>${pessoa.nome}</strong></td>`;

        for (let mes = 1; mes <= 12; mes++) {
            // Verifica no cache 'cestas'
            const recebeu = cestas.some(c => {
                if (c.pessoa_id !== pessoa.id) return false;
                const dataParsed = parseDataRecebimentoIso(c.data_recebimento);
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

// Exportação Excel usa cache local
function exportarExcel() {
    const anoSelecionado = parseInt(document.getElementById('recebimentos-ano').value);
    const termoBusca = document.getElementById('recebimentos-busca').value.toLowerCase();

    const pessoasFiltradas = pessoas.filter(p => p.nome.toLowerCase().includes(termoBusca));
    const dadosExcel = [];

    pessoasFiltradas.forEach(pessoa => {
        const linha = { "Beneficiário": pessoa.nome };
        const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

        for (let mes = 1; mes <= 12; mes++) {
            const recebeu = cestas.some(c => {
                if (c.pessoa_id !== pessoa.id) return false;
                const dataParsed = parseDataRecebimentoIso(c.data_recebimento);
                return dataParsed && dataParsed.ano === anoSelecionado && dataParsed.mes === mes;
            });

            linha[mesesNomes[mes - 1]] = recebeu ? "Recebeu" : "Não recebeu";
        }
        dadosExcel.push(linha);
    });

    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    const wb = XLSX.utils.book_new();
    ws['!cols'] = [{ wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, `Recebimentos_${anoSelecionado}`);
    XLSX.writeFile(wb, `Controle_de_Recebimentos_${anoSelecionado}.xlsx`);
}

// ==========================================
// LISTENERS (INICIALIZAÇÃO E FORMULÁRIOS)
// ==========================================
document.getElementById('cesta-pessoa').addEventListener('change', function (e) {
    const pessoaId = parseInt(e.target.value);
    const pessoa = pessoas.find(p => p.id === pessoaId);
    document.getElementById('cesta-endereco-auto').value = pessoa ? pessoa.endereco : '';
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = e.target.querySelector('button');
        btn.innerText = "Entrando...";
        btn.disabled = true;

        try {
            // Busca todos os dados do Supabase
            await fetchDadosIniciais();

            document.getElementById('view-login').classList.remove('active', 'view-flex');
            document.getElementById('view-login').classList.add('hidden');
            document.getElementById('app-layout').classList.remove('hidden');

            renderUserData();
            renderPessoas();
            renderCestas();
            renderMontagemCesta();
            renderRecebimentos();

            navigate('view-inicio');
        } catch (err) {
            console.error(err);
            alert("Não foi possível conectar ao banco de dados.\nDetalhe: " + (err.message || err));
        } finally {
            btn.innerText = "Entrar no Sistema";
            btn.disabled = false;
        }
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        document.getElementById('app-layout').classList.add('hidden');
        navigate('view-login');
        document.getElementById('form-login').reset();
    });

    document.getElementById('form-pessoa').addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = e.target.querySelector('button');
        const txtOriginal = btn.innerText;
        btn.innerText = "Salvando...";
        btn.disabled = true;

        const nome = document.getElementById('pessoa-nome').value;
        const nascimentoBr = document.getElementById('pessoa-nascimento').value;
        const endereco = document.getElementById('pessoa-endereco').value;

        const nascimentoIso = converterDataParaBanco(nascimentoBr);
        if (!nascimentoIso) {
            alert("Formato de data inválido. Use DD/MM/YYYY");
            btn.innerText = txtOriginal; btn.disabled = false;
            return;
        }

        const novaPessoa = { nome, nascimento: nascimentoIso, endereco };

        const { data, error } = await supabase.from('pessoas').insert([novaPessoa]).select();

        if (error) {
            alert("Erro ao cadastrar: " + error.message);
        } else if (data && data.length > 0) {
            pessoas.push(data[0]);
            renderPessoas();
            renderRecebimentos();
            e.target.reset();
            alert("Cadastrado com sucesso!");
        }

        btn.innerText = txtOriginal;
        btn.disabled = false;
    });

    // Submissão Gestão de Cestas - Controlando Status pela Data de Recebimento
    document.getElementById('form-cesta').addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = e.target.querySelector('button');
        const txtOriginal = btn.innerText;
        btn.innerText = "Registrando...";
        btn.disabled = true;

        const tipo = document.getElementById('cesta-tipo').value;
        const qtd = parseInt(document.getElementById('cesta-qtd').value);
        const validadeBr = document.getElementById('cesta-validade').value.trim();
        const dataRecebimentoBr = document.getElementById('cesta-recebimento').value.trim();
        const pessoaId = parseInt(document.getElementById('cesta-pessoa').value);

        if (qtd <= 0 || isNaN(qtd)) {
            alert("Quantidade inválida.");
            btn.innerText = txtOriginal; btn.disabled = false;
            return;
        }

        if (qtd > (estoqueCestas[tipo] || 0)) {
            alert(`Quantidade indisponível. Você possui apenas ${estoqueCestas[tipo] || 0} ${tipo}(s) disponível(is).`);
            btn.innerText = txtOriginal; btn.disabled = false;
            return;
        }

        const validadeIso = converterDataParaBanco(validadeBr);
        const recebimentoIso = converterDataParaBanco(dataRecebimentoBr);
        const statusReal = recebimentoIso ? "Entregue" : "Pendente";

        const novaCesta = {
            tipo: tipo,
            quantidade: qtd,
            validade: validadeIso,
            data_recebimento: recebimentoIso,
            pessoa_id: pessoaId,
            status: statusReal
        };

        try {
            // Insere no histórico
            const { data, error } = await supabase.from('historico_cestas').insert([novaCesta]).select();
            if (error) throw error;

            // Abate do estoque
            estoqueCestas[tipo] -= qtd;
            await supabase.from('estoque_cestas').update({ quantidade: estoqueCestas[tipo] }).eq('tipo', tipo);

            // Atualiza local
            if (data && data.length > 0) cestas.unshift(data[0]);

            renderCestas();
            renderRecebimentos();
            e.target.reset();
            document.getElementById('cesta-endereco-auto').value = '';
            alert("Cesta registrada com sucesso!");
        } catch (err) {
            alert("Erro ao registrar cesta: " + err.message);
        } finally {
            btn.innerText = txtOriginal;
            btn.disabled = false;
        }
    });
});