import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Holerite } from '../types/database'

export function useHolerites() {
  return useQuery<Holerite[]>({
    queryKey: ['holerites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_vitais_holerites')
        .select('*')
        .order('publicado_em', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}
