import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Colaborador } from '../types/database'

export function useColaborador() {
  return useQuery<Colaborador>({
    queryKey: ['colaborador'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_vitais_colaborador')
        .select('*')
        .single()
      if (error) throw error
      return data
    },
  })
}
