import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { colors } from '../../theme/colors'
import { Button } from '../../components/ui/Button'
import { trocarSenha, confirmarPrimeiroAcesso } from '../../lib/auth'

function getSenhaForca(senha: string): { nivel: 'fraca' | 'media' | 'forte'; cor: string; pct: number } {
  let score = 0
  if (senha.length >= 8) score++
  if (/[A-Z]/.test(senha)) score++
  if (/[0-9]/.test(senha)) score++
  if (/[^A-Za-z0-9]/.test(senha)) score++

  if (score <= 1) return { nivel: 'fraca', cor: colors.danger, pct: 33 }
  if (score <= 2) return { nivel: 'media', cor: colors.warning, pct: 66 }
  return { nivel: 'forte', cor: colors.success, pct: 100 }
}

export default function ChangePasswordScreen() {
  const router = useRouter()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)

  const forca = getSenhaForca(novaSenha)

  const requisitos = [
    { label: 'Mínimo 8 caracteres', ok: novaSenha.length >= 8 },
    { label: '1 letra maiúscula', ok: /[A-Z]/.test(novaSenha) },
    { label: '1 número', ok: /[0-9]/.test(novaSenha) },
  ]

  const handleDefinir = async () => {
    if (!requisitos.every((r) => r.ok)) {
      Alert.alert('Senha fraca', 'Sua senha não atende todos os requisitos.')
      return
    }
    if (novaSenha !== confirmar) {
      Alert.alert('Senhas diferentes', 'As senhas digitadas não coincidem.')
      return
    }

    setLoading(true)
    try {
      const { error } = await trocarSenha(novaSenha)
      if (error) throw error
      await confirmarPrimeiroAcesso()
      router.replace('/(tabs)')
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Crie sua senha pessoal</Text>
        <Text style={styles.sub}>
          Bem-vindo(a)! Defina uma senha segura para acessar o Vitais.
        </Text>

        <Text style={styles.label}>Nova senha</Text>
        <TextInput
          style={styles.input}
          value={novaSenha}
          onChangeText={setNovaSenha}
          secureTextEntry
          placeholder="Nova senha"
          placeholderTextColor={colors.textMuted}
        />

        {novaSenha.length > 0 && (
          <View style={styles.forcaArea}>
            <View style={styles.forcaBar}>
              <View
                style={[
                  styles.forcaFill,
                  { width: `${forca.pct}%`, backgroundColor: forca.cor },
                ]}
              />
            </View>
            <Text style={[styles.forcaLabel, { color: forca.cor }]}>
              Força: {forca.nivel}
            </Text>
          </View>
        )}

        <View style={styles.requisitos}>
          {requisitos.map((r) => (
            <Text key={r.label} style={[styles.req, r.ok && styles.reqOk]}>
              {r.ok ? '✓' : '○'} {r.label}
            </Text>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>Confirmar senha</Text>
        <TextInput
          style={styles.input}
          value={confirmar}
          onChangeText={setConfirmar}
          secureTextEntry
          placeholder="Repita a senha"
          placeholderTextColor={colors.textMuted}
        />

        <Button
          title="Definir minha senha"
          onPress={handleDefinir}
          loading={loading}
          style={styles.btn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: 24, paddingTop: 60 },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 32,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  forcaArea: { marginTop: 8, marginBottom: 4 },
  forcaBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  forcaFill: {
    height: '100%',
    borderRadius: 2,
  },
  forcaLabel: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  requisitos: { marginTop: 8, gap: 4 },
  req: { fontSize: 13, color: colors.textMuted },
  reqOk: { color: colors.success },
  btn: { marginTop: 32, width: '100%' },
})
