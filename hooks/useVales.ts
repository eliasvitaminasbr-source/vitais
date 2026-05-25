import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Vale } from '../types/database'

export function useVales() {
  return useQuery<Vale[]>({
    queryKey: ['vales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_vitais_vales')
        .select('*')
        .order('competencia', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}
