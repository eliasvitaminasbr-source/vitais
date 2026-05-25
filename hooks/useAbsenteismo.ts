import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Absenteismo } from '../types/database'

export function useAbsenteismo() {
  return useQuery<Absenteismo[]>({
    queryKey: ['absenteismo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_vitais_absenteismo_historico')
        .select('*')
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}
