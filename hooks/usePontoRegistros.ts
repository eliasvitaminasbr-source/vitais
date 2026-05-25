import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { PontoRegistro } from '../types/database'

export function usePontoRegistros(mes?: number, ano?: number) {
  const now = new Date()
  const m = mes ?? now.getMonth() + 1
  const a = ano ?? now.getFullYear()

  return useQuery<PontoRegistro[]>({
    queryKey: ['ponto', m, a],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_vitais_ponto_registros')
        .select('*')
        .order('data', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}
