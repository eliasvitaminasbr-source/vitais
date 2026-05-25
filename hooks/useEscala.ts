import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Escala } from '../types/database'

export function useEscala() {
  return useQuery<Escala[]>({
    queryKey: ['escala'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_vitais_escalas')
        .select('*')
        .order('data', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}
