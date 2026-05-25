import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Treinamento } from '../types/database'

export function useTreinamentos() {
  return useQuery<Treinamento[]>({
    queryKey: ['treinamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_vitais_treinamentos')
        .select('*')
        .order('data', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}
