import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Atestado } from '../types/database'
import { uploadAtestado } from '../lib/storage'

export function useAtestados() {
  return useQuery<Atestado[]>({
    queryKey: ['atestados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_vitais_atestados')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

interface EnviarAtestadoParams {
  colaboradorId: number
  dataInicio: string
  dataFim: string
  cid?: string
  fileUri: string
  fileName: string
  mimeType: string
}

export function useEnviarAtestado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: EnviarAtestadoParams) => {
      const path = await uploadAtestado(
        params.colaboradorId,
        params.fileUri,
        params.fileName,
        params.mimeType
      )
      if (!path) throw new Error('Falha no upload do arquivo')

      const { error } = await supabase.from('rh_atestados').insert({
        data_inicio: params.dataInicio,
        data_fim: params.dataFim,
        cid: params.cid || null,
        status: 'em_analise',
        arquivo_url: path,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['atestados'] }),
  })
}
