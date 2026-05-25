import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { FechamentoFolha } from '../types/database'

export function useFechamentoFolha() {
  return useQuery<FechamentoFolha | null>({
    queryKey: ['fechamento-folha'],
    queryFn: async () => {
      const now = new Date()
      const competencia = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      const { data, error } = await supabase
        .from('vw_vitais_fechamento_folha')
        .select('*')
        .eq('competencia', competencia)
        .maybeSingle()
      if (error) throw error
      return data ?? null
    },
  })
}
