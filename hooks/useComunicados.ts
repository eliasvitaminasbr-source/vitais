import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Comunicado } from '../types/database'

export function useComunicados() {
  return useQuery<Comunicado[]>({
    queryKey: ['comunicados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_vitais_comunicados')
        .select('*')
        .order('publicado_em', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useMarcarLido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (comunicadoId: number) => {
      const { error } = await supabase.rpc('fn_vitais_marcar_lido', {
        p_comunicado_id: comunicadoId,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comunicados'] }),
  })
}
