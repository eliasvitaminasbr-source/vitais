import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Ferias } from '../types/database'

export function useFerias() {
  return useQuery<Ferias[]>({
    queryKey: ['ferias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_vitais_ferias')
        .select('*')
        .order('periodo_aquisitivo_inicio', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}
