import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { CompraInterna } from '../types/database'

export function useComprasInternas() {
  return useQuery<CompraInterna[]>({
    queryKey: ['compras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_vitais_compras_internas')
        .select('*')
        .order('competencia_desconto', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}
