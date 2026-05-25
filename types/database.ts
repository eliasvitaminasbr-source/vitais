export interface Colaborador {
  id: number
  nome_completo: string
  cpf: string
  cargo: string
  departamento: string
  data_admissao: string
  foto: string | null
  email: string | null
  app_habilitado: boolean
  primeiro_acesso: boolean
  auth_user_id: string | null
}

export interface Holerite {
  id: number
  colaborador_id: number
  competencia: string
  tipo: string
  arquivo_path: string
  publicado_em: string
}

export interface Atestado {
  id: number
  colaborador_id: number
  data_inicio: string
  data_fim: string
  cid: string | null
  arquivo_url: string | null
  status: 'em_analise' | 'aprovado' | 'rejeitado'
  observacao: string | null
  created_at: string
}

export interface Comunicado {
  id: number
  titulo: string
  corpo: string
  tipo: 'geral' | 'urgente' | 'beneficios' | 'escala'
  publicado_em: string
  lido: boolean
}

export interface Treinamento {
  id: number
  colaborador_id: number
  tema: string
  data: string
  presenca: 'confirmada' | 'ausente' | 'pendente'
  certificado_url: string | null
}

export interface Absenteismo {
  mes: number
  ano: number
  percentual: number
  dias_presentes: number
  dias_falta: number
  dias_atestado: number
  dias_feriado: number
}

export interface CompraInterna {
  id: number
  colaborador_id: number
  produto: string
  sku: string | null
  quantidade: number
  valor: number
  competencia_desconto: string
  status: 'pendente' | 'aprovado' | 'cancelado'
  arquivo_url: string | null
}

export interface Vale {
  id: number
  colaborador_id: number
  tipo: 'vt' | 'va' | 'adiantamento' | 'outros'
  valor: number
  competencia: string
  descricao: string | null
}

export interface Ferias {
  id: number
  colaborador_id: number
  periodo_aquisitivo_inicio: string
  periodo_aquisitivo_fim: string
  dias_gozados: number
  dias_total: number
  saldo: number
  aviso_ferias_url: string | null
}

export interface PontoRegistro {
  data: string
  status_dia: 'presente' | 'falta' | 'atestado' | 'feriado' | 'folga' | 'futuro'
  entrada: string | null
  saida_almoco: string | null
  retorno_almoco: string | null
  saida: string | null
  horas_trabalhadas: string | null
  horas_extras: string | null
}

export interface Escala {
  data: string
  dia_semana: string
  entrada: string | null
  saida: string | null
  folga: boolean
  arquivo_url: string | null
}

export interface FechamentoFolha {
  competencia: string
  salario_base: number
  desconto_faltas: number
  desconto_dsr: number
  desconto_vt: number
  desconto_va: number
  desconto_compras: number
  total_descontos: number
  salario_liquido: number
  fechado: boolean
}

export interface ChatMensagem {
  id?: number
  role: 'user' | 'assistant'
  conteudo: string
  created_at?: string
}

export interface Sugestao {
  id?: number
  categoria: 'geral' | 'beneficios' | 'ambiente' | 'app' | 'outros'
  mensagem: string
  status?: 'nova' | 'em_analise' | 'respondida' | 'arquivada'
  resposta_rh?: string | null
  respondido_em?: string | null
  created_at?: string
}
