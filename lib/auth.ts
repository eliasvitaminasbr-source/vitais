import { supabase } from './supabase'

export function cpfToEmail(cpf: string): string {
  return `${cpf.replace(/\D/g, '')}@vitais.vb`
}

export async function loginComCPF(cpf: string, senha: string) {
  const email = cpfToEmail(cpf)
  return supabase.auth.signInWithPassword({ email, password: senha })
}

export async function checarPrimeiroAcesso(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('rh_vb')
    .select('primeiro_acesso')
    .eq('auth_user_id', userId)
    .single()
  return data?.primeiro_acesso ?? false
}

export async function confirmarPrimeiroAcesso() {
  return supabase.rpc('fn_vitais_confirmar_primeiro_acesso')
}

export async function trocarSenha(novaSenha: string) {
  return supabase.auth.updateUser({ password: novaSenha })
}

export async function logout() {
  return supabase.auth.signOut()
}

export async function enviarRecuperacaoPorCPF(cpf: string) {
  const cpfLimpo = cpf.replace(/\D/g, '')
  const { data, error } = await supabase
    .from('rh_vb')
    .select('"E-mail"')
    .eq('"CPF"', cpfLimpo)
    .single()

  if (error || !data) throw new Error('CPF não encontrado no sistema')

  const email = data['E-mail'] as string
  await supabase.auth.resetPasswordForEmail(email)
}
