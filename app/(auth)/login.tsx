import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Activity, Eye, EyeOff } from 'lucide-react-native'
import { colors } from '../../theme/colors'
import { Button } from '../../components/ui/Button'
import { loginComCPF, checarPrimeiroAcesso, enviarRecuperacaoPorCPF } from '../../lib/auth'
import { registerPushToken } from '../../lib/notifications'

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export default function LoginScreen() {
  const router = useRouter()
  const [cpf, setCpf] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      Alert.alert('CPF inválido', 'Digite seu CPF completo com 11 dígitos.')
      return
    }
    if (!senha) {
      Alert.alert('Senha obrigatória', 'Digite sua senha.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await loginComCPF(cpfLimpo, senha)
      if (error) {
        Alert.alert('Acesso negado', 'CPF ou senha incorretos.')
        return
      }

      await registerPushToken()

      const primeiroAcesso = await checarPrimeiroAcesso(data.user.id)
      if (primeiroAcesso) {
        router.replace('/(auth)/change-password')
      } else {
        router.replace('/(tabs)')
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleEsqueciSenha = async () => {
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      Alert.alert('Informe o CPF', 'Digite seu CPF antes de solicitar a recuperação.')
      return
    }
    try {
      await enviarRecuperacaoPorCPF(cpfLimpo)
      Alert.alert('E-mail enviado', 'Verifique seu e-mail cadastrado no RH para redefinir a senha.')
    } catch {
      Alert.alert('Não encontrado', 'CPF não localizado. Entre em contato com o RH.')
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Activity size={40} color={colors.white} strokeWidth={2.5} />
          </View>
          <Text style={styles.logoText}>Vitais</Text>
          <Text style={styles.logoSub}>Vitaminas Brasil</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>CPF</Text>
          <TextInput
            style={styles.input}
            value={cpf}
            onChangeText={(v) => setCpf(formatCPF(v))}
            keyboardType="numeric"
            placeholder="000.000.000-00"
            placeholderTextColor={colors.textMuted}
            maxLength={14}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Senha</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!showSenha}
              placeholder="Digite sua senha"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowSenha((v) => !v)}
            >
              {showSenha
                ? <EyeOff size={20} color={colors.textMuted} />
                : <Eye size={20} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>

          <Button
            title="Entrar"
            onPress={handleLogin}
            loading={loading}
            style={styles.btnLogin}
          />

          <TouchableOpacity onPress={handleEsqueciSenha} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Vitaminas Brasil © 2025</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoArea: { alignItems: 'center', marginBottom: 48 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
  },
  logoSub: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  form: { width: '100%' },
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
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputFlex: { flex: 1 },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    height: 52,
    justifyContent: 'center',
  },
  btnLogin: { marginTop: 24, width: '100%' },
  forgotBtn: { alignItems: 'center', marginTop: 16, padding: 8 },
  forgotText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  footer: {
    marginTop: 48,
    color: colors.textMuted,
    fontSize: 12,
  },
})
