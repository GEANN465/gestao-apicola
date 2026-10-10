
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('recebimentos') // 'recebimentos', 'insumos', 'financeiro', 'produtores'
  
  // Estados para Produtores
  const [produtores, setProdutores] = useState([])
  const [nome, setNome] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [tipo, setTipo] = useState('ASSOCIADO')
  const [telefone, setTelefone] = useState('')

  // Estados para Recebimentos
  const [recebimentos, setRecebimentos] = useState([])
  const [produtorId, setProdutorId] = useState('')
  const [produto, setProduto] = useState('MEL')
  const [tipoRecipiente, setTipoRecipiente] = useState('TAMBOR')
  const [quantidadeRecipientes, setQuantidadeRecipientes] = useState('1')
  const [pesoLiquido, setPesoLiquido] = useState('')
  const [dataRecebimento, setDataRecebimento] = useState(new Date().toISOString().split('T')[0])
  const [observacao, setObservacao] = useState('')

  // Estados para Insumos
  const [insumos, setInsumos] = useState([])
  const [insumoId, setInsumoId] = useState('')
  const [tipoMovimentacao, setTipoMovimentacao] = useState('ENTRADA')
  const [qtdMovimentacao, setQtdMovimentacao] = useState('')
  const [obsInsumo, setObsInsumo] = useState('')
  const [novoInsumoNome, setNovoInsumoNome] = useState('')
  const [novoInsumoCategoria, setNovoInsumoCategoria] = useState('EMBALAGEM')
  const [novoInsumoUnidade, setNovoInsumoUnidade] = useState('UN')

  // Estados para Financeiro
  const [repasses, setRepasses] = useState([])
  const [produtorFinId, setProdutorFinId] = useState('')
  const [precoKg, setPrecoKg] = useState('15.00')
  const [totalKgProdutor, setTotalKgProdutor] = useState(0)

  const [loading, setLoading] = useState(false)

  // Função para excluir produtor
  const handleDeleteProdutor = async (id) => {
    const confirmacao = window.confirm("Tem certeza que deseja excluir este produtor?");
    if (!confirmacao) return;

    const { error } = await supabase
      .from('produtor')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Erro ao excluir: " + error.message);
    } else {
      setProdutores((prev) => prev.filter((p) => p.id !== id));
      alert("Produtor excluído com sucesso!");
    }
  };

  // Carregar todos os dados
  const carregarDados = async () => {
    setLoading(true)
    
    // Buscar Produtores
    const { data: dataProdutores } = await supabase
      .from('produtor')
      .select('*')
      .order('nome', { ascending: true })
    setProdutores(dataProdutores || [])

    // Buscar Recebimentos
    const { data: dataRecebimentos } = await supabase
      .from('recebimento')
      .select('*, produtor(nome, tipo)')
      .order('id', { ascending: false })
    setRecebimentos(dataRecebimentos || [])

    // Buscar Insumos
    const { data: dataInsumos } = await supabase
      .from('insumo')
      .select('*')
      .order('nome', { ascending: true })
    setInsumos(dataInsumos || [])

    // Buscar Repasses Financeiros
    const { data: dataRepasses } = await supabase
      .from('repasse_financeiro')
      .select('*, produtor(nome, tipo)')
      .order('id', { ascending: false })
    setRepasses(dataRepasses || [])

    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Atualizar total de kg quando escolhe um produtor no financeiro
  const handleSelecionarProdutorFin = (id) => {
    setProdutorFinId(id)
    if (!id) {
      setTotalKgProdutor(0)
      return
    }

    // Soma apenas as entradas de MEL do produtor selecionado
    const total = recebimentos
      .filter(r => r.produtor_id === parseInt(id) && r.produto === 'MEL')
      .reduce((acc, curr) => acc + parseFloat(curr.peso_liquido_kg || 0), 0)

    setTotalKgProdutor(total)
  }

  // Cadastrar Produtor
  const handleSalvarProdutor = async (e) => {
    e.preventDefault()
    if (!nome) return alert('Informe o nome do produtor!')

    const { error } = await supabase.from('produtor').insert([
      { nome, cpf_cnpj: cpfCnpj, tipo, telefone }
    ])

    if (error) alert('Erro ao cadastrar: ' + error.message)
    else {
      alert('Produtor cadastrado com sucesso!')
      setNome('')
      setCpfCnpj('')
      setTelefone('')
      carregarDados()
    }
  }

  // Cadastrar Recebimento
  const handleSalvarRecebimento = async (e) => {
    e.preventDefault()
    if (!produtorId) return alert('Selecione um produtor!')
    if (!pesoLiquido || pesoLiquido <= 0) return alert('Informe um peso líquido válido!')

    const { error } = await supabase.from('recebimento').insert([
      {
        produtor_id: produtorId,
        produto,
        tipo_recipiente: tipoRecipiente,
        quantidade_recipientes: parseInt(quantidadeRecipientes) || 1,
        peso_liquido_kg: parseFloat(pesoLiquido),
        data_recebimento: dataRecebimento,
        observacao
      }
    ])

    if (error) alert('Erro ao registrar recebimento: ' + error.message)
    else {
      alert('Entrada de ' + produto + ' registrada com sucesso!')
      setPesoLiquido('')
      setObservacao('')
      carregarDados()
    }
  }

  // Cadastrar Novo Insumo
  const handleCriarInsumo = async (e) => {
    e.preventDefault()
    if (!novoInsumoNome) return alert('Informe o nome do material!')

    const { error } = await supabase.from('insumo').insert([
      {
        nome: novoInsumoNome,
        categoria: novoInsumoCategoria,
        unidade_medida: novoInsumoUnidade,
        quantidade_estoque: 0
      }
    ])

    if (error) alert('Erro ao criar insumo: ' + error.message)
    else {
      alert('Material cadastrado no catálogo!')
      setNovoInsumoNome('')
      carregarDados()
    }
  }

  // Movimentar Insumo
  const handleMovimentarInsumo = async (e) => {
    e.preventDefault()
    if (!insumoId) return alert('Selecione o material!')
    const qtd = parseFloat(qtdMovimentacao)
    if (!qtd || qtd <= 0) return alert('Informe uma quantidade válida!')

    const insumoSel = insumos.find(i => i.id === parseInt(insumoId))
    if (!insumoSel) return

    let novoEstoque = insumoSel.quantidade_estoque
    if (tipoMovimentacao === 'ENTRADA') {
      novoEstoque += qtd
    } else {
      if (qtd > novoEstoque) return alert('Quantidade maior que o estoque disponível!')
      novoEstoque -= qtd
    }

    const { error: errMov } = await supabase.from('movimentacao_insumo').insert([
      { insumo_id: insumoId, tipo_movimentacao: tipoMovimentacao, quantidade: qtd, observacao: obsInsumo }
    ])

    if (errMov) return alert('Erro na movimentação: ' + errMov.message)

    await supabase.from('insumo').update({ quantidade_estoque: novoEstoque }).eq('id', insumoId)

    alert('Movimentação registrada!')
    setQtdMovimentacao('')
    setObsInsumo('')
    carregarDados()
  }

  // Lançar Acerto Financeiro
  const handleGerarRepasse = async (e) => {
    e.preventDefault()
    if (!produtorFinId) return alert('Selecione um produtor!')
    if (totalKgProdutor <= 0) return alert('Este produtor não possui entregas de mel registradas!')

    const valorTotal = totalKgProdutor * parseFloat(precoKg)

    const { error } = await supabase.from('repasse_financeiro').insert([
      {
        produtor_id: produtorFinId,
        total_kg_mel: totalKgProdutor,
        preco_por_kg: parseFloat(precoKg),
        valor_total: valorTotal,
        status_pagamento: 'PENDENTE'
      }
    ])

    if (error) alert('Erro ao gerar repasse: ' + error.message)
    else {
      alert('Acerto financeiro gerado com sucesso!')
      setProdutorFinId('')
      setTotalKgProdutor(0)
      carregarDados()
    }
  }

  return (
    <div style={{ maxWidth: '980px', margin: '30px auto', fontFamily: 'Arial, sans-serif', padding: '0 20px' }}>
      <header style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
        <h1 style={{ color: '#1a202c', marginBottom: '10px' }}>🐝 Gestão Apícola - Cooperativa</h1>
        
        {/* Menu de Navegação */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setAbaAtiva('recebimentos')}
            style={{
              padding: '10px 18px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
              backgroundColor: abaAtiva === 'recebimentos' ? '#d97706' : '#edf2f7',
              color: abaAtiva === 'recebimentos' ? '#fff' : '#4a5568'
            }}
          >
            🍯 Recebimento de Mel / Cera
          </button>
          
          <button 
            onClick={() => setAbaAtiva('insumos')}
            style={{
              padding: '10px 18px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
              backgroundColor: abaAtiva === 'insumos' ? '#059669' : '#edf2f7',
              color: abaAtiva === 'insumos' ? '#fff' : '#4a5568'
            }}
          >
            📦 Controle de Insumos / Estoque
          </button>

          <button 
            onClick={() => setAbaAtiva('financeiro')}
            style={{
              padding: '10px 18px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
              backgroundColor: abaAtiva === 'financeiro' ? '#7c3aed' : '#edf2f7',
              color: abaAtiva === 'financeiro' ? '#fff' : '#4a5568'
            }}
          >
            💰 Repasse / Acerto Financeiro
          </button>

          <button 
            onClick={() => setAbaAtiva('produtores')}
            style={{
              padding: '10px 18px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
              backgroundColor: abaAtiva === 'produtores' ? '#2563eb' : '#edf2f7',
              color: abaAtiva === 'produtores' ? '#fff' : '#4a5568'
            }}
          >
            👤 Cadastro de Produtores
          </button>
        </div>
      </header>

      {/* ABA 1: RECEBIMENTO */}
      {abaAtiva === 'recebimentos' && (
        <div>
          <h2>🍯 Ficha de Entrada - Recepção de Matéria-Prima</h2>
          <form onSubmit={handleSalvarRecebimento} style={{ background: '#fffbe3', padding: '20px', borderRadius: '8px', border: '1px solid #fde68a', marginBottom: '30px' }}>
            <h3>Registrar Nova Entrada</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label><strong>Produtor / Apicultor:*</strong></label><br />
                <select value={produtorId} onChange={(e) => setProdutorId(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} required>
                  <option value="">-- Selecione o Produtor --</option>
                  {produtores.map(p => (<option key={p.id} value={p.id}>{p.nome} ({p.tipo})</option>))}
                </select>
              </div>
              <div>
                <label><strong>Produto:*</strong></label><br />
                <select value={produto} onChange={(e) => setProduto(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                  <option value="MEL">Mel</option>
                  <option value="CERA">Cera Alveolada / Bruta</option>
                </select>
              </div>
              <div>
                <label><strong>Recipiente:</strong></label><br />
                <select value={tipoRecipiente} onChange={(e) => setTipoRecipiente(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                  <option value="TAMBOR">Tambor (200L / ~280kg)</option>
                  <option value="BALDE">Balde (20L / ~25kg)</option>
                  <option value="CAIXA">Caixa / Bloco (Cera)</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>
              <div>
                <label><strong>Qtd. de Recipientes:</strong></label><br />
                <input type="number" min="1" value={quantidadeRecipientes} onChange={(e) => setQuantidadeRecipientes(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
              </div>
              <div>
                <label><strong>Peso Líquido (kg):*</strong></label><br />
                <input type="number" step="0.01" placeholder="Ex: 280.50" value={pesoLiquido} onChange={(e) => setPesoLiquido(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} required />
              </div>
              <div>
                <label><strong>Data da Entrega:</strong></label><br />
                <input type="date" value={dataRecebimento} onChange={(e) => setDataRecebimento(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Observações / Qualidade do Mel:</label><br />
              <input type="text" placeholder="Ex: Mel de Floração Silvestre, umidade OK" value={observacao} onChange={(e) => setObservacao(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <button type="submit" style={{ backgroundColor: '#d97706', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Registrar Entrada de Mel/Cera
            </button>
          </form>

          <h3>Histórico de Entradas Registradas</h3>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#fef3c7' }}>
                  <th>Data</th><th>Produtor</th><th>Vínculo</th><th>Produto</th><th>Recipientes</th><th>Peso Líquido (kg)</th>
                </tr>
              </thead>
              <tbody>
                {recebimentos.map(r => (
                  <tr key={r.id}>
                    <td>{r.data_recebimento}</td>
                    <td><strong>{r.produtor?.nome || 'Produtor removido'}</strong></td>
                    <td>{r.produtor?.tipo === 'ASSOCIADO' ? 'Associado' : 'Não Sócio'}</td>
                    <td>{r.produto}</td>
                    <td>{r.quantidade_recipientes}x {r.tipo_recipiente}</td>
                    <td><strong>{r.peso_liquido_kg} kg</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 2: INSUMOS */}
      {abaAtiva === 'insumos' && (
        <div>
          <h2>📦 Gestão de Insumos e Materiais</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <form onSubmit={handleMovimentarInsumo} style={{ background: '#ecfdf5', padding: '20px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
              <h3>Lançar Entrada / Saída</h3>
              <div style={{ marginBottom: '10px' }}>
                <label>Material / Insumo:*</label><br />
                <select value={insumoId} onChange={(e) => setInsumoId(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} required>
                  <option value="">-- Selecione o Material --</option>
                  {insumos.map(i => (<option key={i.id} value={i.id}>{i.nome} (Atual: {i.quantidade_estoque} {i.unidade_medida})</option>))}
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Tipo de Operação:*</label><br />
                <select value={tipoMovimentacao} onChange={(e) => setTipoMovimentacao(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                  <option value="ENTRADA">🟢 ENTRADA (Comprar / Receber)</option>
                  <option value="SAIDA">🔴 SAÍDA (Uso no envase / Fornecer)</option>
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Quantidade:*</label><br />
                <input type="number" step="0.01" value={qtdMovimentacao} onChange={(e) => setQtdMovimentacao(e.target.value)} placeholder="Ex: 50" style={{ width: '100%', padding: '8px', marginTop: '4px' }} required />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Observação:</label><br />
                <input type="text" value={obsInsumo} onChange={(e) => setObsInsumo(e.target.value)} placeholder="Ex: Lote 04/2026" style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
              </div>
              <button type="submit" style={{ backgroundColor: '#059669', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Registrar Operação
              </button>
            </form>

            <form onSubmit={handleCriarInsumo} style={{ background: '#f4f4f9', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3>Cadastrar Novo Tipo de Material</h3>
              <div style={{ marginBottom: '10px' }}>
                <label>Nome do Material:*</label><br />
                <input type="text" value={novoInsumoNome} onChange={(e) => setNovoInsumoNome(e.target.value)} placeholder="Ex: Fita Lacre" style={{ width: '100%', padding: '8px', marginTop: '4px' }} required />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Categoria:</label><br />
                <select value={novoInsumoCategoria} onChange={(e) => setNovoInsumoCategoria(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                  <option value="EMBALAGEM">Embalagem (Frascos/Baldes)</option>
                  <option value="ROTULO">Rótulos / Etiquetas</option>
                  <option value="CERA">Cera Alveolada</option>
                  <option value="OUTRO">Outros Insumos</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Unidade de Medida:</label><br />
                <select value={novoInsumoUnidade} onChange={(e) => setNovoInsumoUnidade(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                  <option value="UN">Unidades (UN)</option>
                  <option value="KG">Quilogramas (KG)</option>
                  <option value="CX">Caixas (CX)</option>
                </select>
              </div>
              <button type="submit" style={{ backgroundColor: '#4b5563', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Adicionar ao Catálogo
              </button>
            </form>
          </div>

          <h3>Saldo Atual do Estoque de Insumos</h3>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#d1fae5' }}>
                  <th>Material / Insumo</th><th>Categoria</th><th>Saldo em Estoque</th><th>Unidade</th>
                </tr>
              </thead>
              <tbody>
                {insumos.map(i => (
                  <tr key={i.id}>
                    <td><strong>{i.nome}</strong></td>
                    <td>{i.categoria}</td>
                    <td><span style={{ color: i.quantidade_estoque < 50 ? '#dc2626' : '#047857', fontWeight: 'bold' }}>{i.quantidade_estoque}</span></td>
                    <td>{i.unidade_medida}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 3: REPASSE FINANCEIRO */}
      {abaAtiva === 'financeiro' && (
        <div>
          <h2>💰 Repasse e Acerto Financeiro com Cooperados</h2>
          
          <form onSubmit={handleGerarRepasse} style={{ background: '#f3e8ff', padding: '20px', borderRadius: '8px', border: '1px solid #d8b4fe', marginBottom: '30px' }}>
            <h3>Calcular e Registrar Acerto</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label><strong>Produtor / Apicultor:*</strong></label><br />
                <select value={produtorFinId} onChange={(e) => handleSelecionarProdutorFin(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} required>
                  <option value="">-- Selecione o Produtor --</option>
                  {produtores.map(p => (<option key={p.id} value={p.id}>{p.nome} ({p.tipo})</option>))}
                </select>
              </div>

              <div>
                <label><strong>Total Mel Entregue (kg):</strong></label><br />
                <input type="text" value={totalKgProdutor + ' kg'} disabled style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: '#e9d5ff', fontWeight: 'bold' }} />
              </div>

              <div>
                <label><strong>Preço Pago por kg (R$):*</strong></label><br />
                <input type="number" step="0.50" value={precoKg} onChange={(e) => setPrecoKg(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} required />
              </div>
            </div>

            <div style={{ padding: '15px', background: '#fff', borderRadius: '6px', marginBottom: '15px', border: '1px solid #c084fc' }}>
              <h4 style={{ margin: 0, color: '#6b21a8' }}>
                Valor Total a Pagar: R$ {(totalKgProdutor * parseFloat(precoKg || 0)).toFixed(2)}
              </h4>
            </div>

            <button type="submit" style={{ backgroundColor: '#7c3aed', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Gerar Acerto Financeiro
            </button>
          </form>

          <h3>Histórico de Acertos Financeiros</h3>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#f3e8ff' }}>
                  <th>Data</th><th>Produtor</th><th>Total kg Mel</th><th>Preço/kg</th><th>Valor Total (R$)</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {repasses.map(rep => (
                  <tr key={rep.id}>
                    <td>{rep.data_acerto}</td>
                    <td><strong>{rep.produtor?.nome || 'Desconhecido'}</strong></td>
                    <td>{rep.total_kg_mel} kg</td>
                    <td>R$ {parseFloat(rep.preco_por_kg).toFixed(2)}</td>
                    <td><strong>R$ {parseFloat(rep.valor_total).toFixed(2)}</strong></td>
                    <td>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', background: rep.status_pagamento === 'PAGO' ? '#dcfce7' : '#fef9c3', color: rep.status_pagamento === 'PAGO' ? '#15803d' : '#a16207', fontWeight: 'bold' }}>
                        {rep.status_pagamento}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 4: PRODUTORES */}
      {abaAtiva === 'produtores' && (
        <div>
          <h2>👤 Gestão de Produtores e Associados</h2>
          <form onSubmit={handleSalvarProdutor} style={{ background: '#f4f4f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
            <h3>Cadastrar Novo Produtor</h3>
            <div style={{ marginBottom: '10px' }}>
              <label>Nome:*</label><br />
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} required />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>CPF / CNPJ:</label><br />
              <input type="text" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Tipo de Vínculo:</label><br />
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                <option value="ASSOCIADO">Associado à Cooperativa</option>
                <option value="NAO_SOCIO">Não Sócio (Produtor Externo)</option>
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Telefone / Contato:</label><br />
              <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Salvar Produtor
            </button>
          </form>

          <h3>Produtores Cadastrados</h3>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#eee' }}>
                  <th>ID</th><th>Nome</th><th>CPF/CNPJ</th><th>Tipo</th><th>Telefone</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtores.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.nome}</td>
                    <td>{p.cpf_cnpj || '-'}</td>
                    <td>{p.tipo}</td>
                    <td>{p.telefone || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteProdutor(p.id)}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        🗑️ Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}