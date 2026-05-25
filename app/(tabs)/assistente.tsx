import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ScrollView,
  Animated,
} from 'react-native'
import { Bot, Send, Trash2, MessageSquarePlus } from 'lucide-react-native'
import { colors } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { ChatMensagem } from '../../types/database'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!

const CHIPS = [
  'Qual meu absenteísmo este mês?',
  'Tenho holerites disponíveis?',
  'Qual meu saldo de férias?',
  'Quando foi meu último treinamento?',
  'Como envio um atestado?',
]

const CATEGORIAS = ['Geral', 'Benefícios', 'Ambiente de trabalho', 'App Vitais', 'Outros']

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current
  const dot2 = useRef(new Animated.Value(0)).current
  const dot3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const anim = (d: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      )
    Animated.parallel([anim(dot1, 0), anim(dot2, 150), anim(dot3, 300)]).start()
  }, [dot1, dot2, dot3])

  return (
    <View style={styles.typing}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View
          key={i}
          style={[styles.typingDot, { opacity: d }]}
        />
      ))}
    </View>
  )
}

export default function AssistenteScreen() {
  const [mensagens, setMensagens] = useState<ChatMensagem[]>([])
  const [texto, setTexto] = useState('')
  const [digitando, setDigitando] = useState(false)
  const [sugestaoVisible, setSugestaoVisible] = useState(false)
  const [categoriaSug, setCategoriaSug] = useState(CATEGORIAS[0])
  const [textoSug, setTextoSug] = useState('')
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    carregarHistorico()
  }, [])

  const carregarHistorico = async () => {
    const { data } = await supabase
      .from('vitais_chat_historico')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(20)
    if (data) setMensagens(data)
  }

  const enviarMensagem = async (msg?: string) => {
    const conteudo = (msg ?? texto).trim()
    if (!conteudo || digitando) return

    setTexto('')
    const novaMensagem: ChatMensagem = { role: 'user', conteudo }
    setMensagens((prev) => [...prev, novaMensagem])
    setDigitando(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sem sessão')

      const historico = mensagens.slice(-10).map((m) => ({ role: m.role, conteudo: m.conteudo }))

      const res = await fetch(`${SUPABASE_URL}/functions/v1/vitais-chat-ia`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mensagem: conteudo, historico }),
      })

      const json = await res.json()
      if (json.resposta) {
        setMensagens((prev) => [
          ...prev,
          { role: 'assistant', conteudo: json.resposta },
        ])
      }
    } catch {
      setMensagens((prev) => [
        ...prev,
        { role: 'assistant', conteudo: 'Desculpe, ocorreu um erro. Tente novamente.' },
      ])
    } finally {
      setDigitando(false)
    }
  }

  const limparChat = async () => {
    Alert.alert('Limpar conversa', 'Deseja apagar o histórico?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('vitais_chat_historico').delete().neq('id', 0)
          setMensagens([])
        },
      },
    ])
  }

  const enviarSugestao = async () => {
    if (textoSug.trim().length < 10) {
      Alert.alert('Texto muito curto', 'Escreva pelo menos 10 caracteres.')
      return
    }
    await supabase.from('vitais_sugestoes').insert({
      categoria: categoriaSug.toLowerCase().replace(/ /g, '_'),
      mensagem: textoSug.trim(),
    })
    Alert.alert('Enviado!', 'Sua sugestão foi enviada anonimamente. Obrigado!')
    setSugestaoVisible(false)
    setTextoSug('')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarBot}>
            <Bot size={22} color={colors.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Assistente Vitais</Text>
            <Text style={styles.headerSub}>Powered by Claude</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={limparChat}>
            <Trash2 size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSugestaoVisible(true)}>
            <MessageSquarePlus size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {mensagens.length === 0 && (
        <View style={styles.chips}>
          {CHIPS.map((c) => (
            <TouchableOpacity key={c} style={styles.chip} onPress={() => enviarMensagem(c)}>
              <Text style={styles.chipText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        ref={listRef}
        data={mensagens}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.lista}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bolha, item.role === 'user' ? styles.bolhaUser : styles.bolhaBot]}>
            <Text style={[styles.bolhaTexto, item.role === 'user' ? styles.bolhaTextoUser : styles.bolhaTextoBot]}>
              {item.conteudo}
            </Text>
          </View>
        )}
        ListFooterComponent={digitando ? <TypingIndicator /> : null}
      />

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Digite uma mensagem..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!texto.trim() || digitando) && styles.sendBtnDisabled]}
          onPress={() => enviarMensagem()}
          disabled={!texto.trim() || digitando}
        >
          <Send size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <Modal visible={sugestaoVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitulo}>Enviar sugestão</Text>
          <Text style={styles.modalSub}>Seu envio é completamente anônimo.</Text>

          <Text style={styles.label}>Categoria</Text>
          <View style={styles.catGrid}>
            {CATEGORIAS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.catChip, categoriaSug === c && styles.catChipActive]}
                onPress={() => setCategoriaSug(c)}
              >
                <Text style={[styles.catChipText, categoriaSug === c && styles.catChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Mensagem</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={textoSug}
            onChangeText={setTextoSug}
            multiline
            maxLength={500}
            placeholder="Escreva sua sugestão..."
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.counter}>{textoSug.length}/500</Text>

          <TouchableOpacity style={styles.sendSugBtn} onPress={enviarSugestao}>
            <Text style={styles.sendSugText}>Enviar anonimamente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setSugestaoVisible(false)}>
            <Text style={{ color: colors.textMuted, textAlign: 'center' }}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  avatarBot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 11, color: colors.textMuted },
  chips: { padding: 16, gap: 8 },
  chip: {
    backgroundColor: colors.white,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: 13, color: colors.text },
  lista: { padding: 16, paddingBottom: 8 },
  bolha: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  bolhaUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bolhaBot: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bolhaTexto: { fontSize: 15, lineHeight: 22 },
  bolhaTextoUser: { color: colors.white },
  bolhaTextoBot: { color: colors.text },
  typing: {
    flexDirection: 'row',
    gap: 4,
    padding: 12,
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  inputArea: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  modalContent: { padding: 24, paddingTop: 48 },
  modalTitulo: { fontSize: 22, fontWeight: '800', color: colors.text },
  modalSub: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 16 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.primary },
  catChipText: { fontSize: 13, color: colors.textMuted },
  catChipTextActive: { color: colors.white },
  textarea: { height: 140, textAlignVertical: 'top' },
  counter: { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: 4 },
  sendSugBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  sendSugText: { color: colors.white, fontWeight: '600', fontSize: 16 },
  cancelBtn: { marginTop: 12, padding: 12 },
})
