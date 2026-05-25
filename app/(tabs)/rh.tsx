import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native'
import { Plus, Upload } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import * as Sharing from 'expo-sharing'
import { colors } from '../../theme/colors'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'
import { useAbsenteismo } from '../../hooks/useAbsenteismo'
import { useAtestados, useEnviarAtestado } from '../../hooks/useAtestados'
import { useFerias } from '../../hooks/useFerias'
import { useColaborador } from '../../hooks/useColaborador'
import { getSignedUrl } from '../../lib/storage'
import { useQueryClient } from '@tanstack/react-query'

const atestadoVariant: Record<string, 'info' | 'success' | 'danger'> = {
  em_analise: 'info',
  aprovado: 'success',
  rejeitado: 'danger',
}

function AbsenteismoTab() {
  const { data: abs, isLoading } = useAbsenteismo()
  const atual = abs?.[0]

  const getPct = (p: number) => {
    if (p > 10) return colors.danger
    if (p > 5) return colors.warning
    return colors.success
  }

  if (isLoading) return <SkeletonCard />

  return (
    <ScrollView>
      {atual && (
        <Card style={styles.gaugeCard}>
          <Text style={styles.gaugeLabel}>Absenteísmo — mês atual</Text>
          <View style={styles.gaugeBar}>
            <View
              style={[
                styles.gaugeFill,
                { width: `${Math.min(atual.percentual, 100)}%`, backgroundColor: getPct(atual.percentual) },
              ]}
            />
            <View style={[styles.gaugeMeta, { left: '5%' }]} />
          </View>
          <Text style={[styles.gaugePct, { color: getPct(atual.percentual) }]}>
            {atual.percentual.toFixed(1)}%
          </Text>

          <View style={styles.resumoGrid}>
            <View style={styles.resumoItem}>
              <Text style={styles.resumoVal}>{atual.dias_presentes}</Text>
              <Text style={styles.resumoLabel}>Presentes</Text>
            </View>
            <View style={styles.resumoItem}>
              <Text style={[styles.resumoVal, { color: colors.danger }]}>{atual.dias_falta}</Text>
              <Text style={styles.resumoLabel}>Faltas</Text>
            </View>
            <View style={styles.resumoItem}>
              <Text style={[styles.resumoVal, { color: colors.warning }]}>{atual.dias_atestado}</Text>
              <Text style={styles.resumoLabel}>Atestados</Text>
            </View>
            <View style={styles.resumoItem}>
              <Text style={styles.resumoVal}>{atual.dias_feriado}</Text>
              <Text style={styles.resumoLabel}>Feriados</Text>
            </View>
          </View>
        </Card>
      )}

      <Text style={styles.sectionTitle}>Histórico</Text>
      {(abs ?? []).map((a, i) => (
        <Card key={i} style={styles.histItem}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.histMes}>{`${String(a.mes).padStart(2, '0')}/${a.ano}`}</Text>
            <Text style={[styles.histPct, { color: getPct(a.percentual) }]}>
              {a.percentual.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.histBar}>
            <View style={[styles.histBarFill, { width: `${Math.min(a.percentual * 5, 100)}%`, backgroundColor: getPct(a.percentual) }]} />
          </View>
        </Card>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  )
}

function AtestadosTab() {
  const { data: atestados, isLoading } = useAtestados()
  const { data: colaborador } = useColaborador()
  const enviar = useEnviarAtestado()
  const [modalVisible, setModalVisible] = useState(false)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [cid, setCid] = useState('')
  const [arquivo, setArquivo] = useState<{ uri: string; name: string; mimeType: string } | null>(null)

  const escolherArquivo = async () => {
    Alert.alert('Origem do arquivo', '', [
      {
        text: 'Câmera',
        onPress: async () => {
          const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'] })
          if (!r.canceled && r.assets[0]) {
            const a = r.assets[0]
            setArquivo({ uri: a.uri, name: a.fileName ?? 'atestado.jpg', mimeType: a.mimeType ?? 'image/jpeg' })
          }
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] })
          if (!r.canceled && r.assets[0]) {
            const a = r.assets[0]
            setArquivo({ uri: a.uri, name: a.fileName ?? 'atestado.jpg', mimeType: a.mimeType ?? 'image/jpeg' })
          }
        },
      },
      {
        text: 'PDF',
        onPress: async () => {
          const r = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' })
          if (!r.canceled && r.assets[0]) {
            const a = r.assets[0]
            setArquivo({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/pdf' })
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ])
  }

  const handleEnviar = async () => {
    if (!dataInicio || !dataFim || !arquivo || !colaborador) {
      Alert.alert('Campos obrigatórios', 'Preencha as datas e selecione um arquivo.')
      return
    }
    try {
      await enviar.mutateAsync({
        colaboradorId: colaborador.id,
        dataInicio,
        dataFim,
        cid: cid || undefined,
        fileUri: arquivo.uri,
        fileName: arquivo.name,
        mimeType: arquivo.mimeType,
      })
      Alert.alert('Enviado!', 'Atestado enviado. Aguardando análise do RH.')
      setModalVisible(false)
      setDataInicio(''); setDataFim(''); setCid(''); setArquivo(null)
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar o atestado.')
    }
  }

  if (isLoading) return <SkeletonCard />

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={atestados ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={<EmptyState title="Nenhum atestado enviado ainda" />}
        renderItem={({ item }) => (
          <Card style={styles.histItem}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.histMes}>
                {new Date(item.data_inicio).toLocaleDateString('pt-BR')} –{' '}
                {new Date(item.data_fim).toLocaleDateString('pt-BR')}
              </Text>
              <Badge label={item.status.replace('_', ' ')} variant={atestadoVariant[item.status]} />
            </View>
            {item.cid && <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>CID: {item.cid}</Text>}
          </Card>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus size={24} color={colors.white} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Enviar Atestado</Text>

          <Text style={styles.label}>Data de início (AAAA-MM-DD)</Text>
          <TextInput style={styles.input} value={dataInicio} onChangeText={setDataInicio} placeholder="2025-01-15" placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>Data de fim (AAAA-MM-DD)</Text>
          <TextInput style={styles.input} value={dataFim} onChangeText={setDataFim} placeholder="2025-01-15" placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>CID (opcional)</Text>
          <TextInput style={styles.input} value={cid} onChangeText={setCid} placeholder="Ex: J06" placeholderTextColor={colors.textMuted} />

          <TouchableOpacity style={styles.uploadBtn} onPress={escolherArquivo}>
            <Upload size={20} color={colors.primary} />
            <Text style={styles.uploadText}>{arquivo ? arquivo.name : 'Selecionar arquivo'}</Text>
          </TouchableOpacity>

          <Button title="Enviar atestado" onPress={handleEnviar} loading={enviar.isPending} style={{ marginTop: 16 }} />
          <Button title="Cancelar" onPress={() => setModalVisible(false)} variant="outline" style={{ marginTop: 8 }} />
        </ScrollView>
      </Modal>
    </View>
  )
}

function FeriasTab() {
  const { data: ferias, isLoading } = useFerias()

  if (isLoading) return <SkeletonCard />
  if (!ferias?.length) return <EmptyState title="Nenhum registro de férias ainda" />

  const atual = ferias[0]
  const saldoPct = atual.dias_total > 0 ? (atual.dias_gozados / atual.dias_total) * 100 : 0

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card style={styles.feriaCard}>
        <Text style={styles.feriaLabel}>Período aquisitivo</Text>
        <Text style={styles.feriaPeriodo}>
          {new Date(atual.periodo_aquisitivo_inicio).toLocaleDateString('pt-BR')} –{' '}
          {new Date(atual.periodo_aquisitivo_fim).toLocaleDateString('pt-BR')}
        </Text>
        <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.resumoLabel}>Gozados: {atual.dias_gozados}d</Text>
            <Text style={styles.resumoLabel}>Total: {atual.dias_total}d</Text>
          </View>
          <View style={styles.gaugeBar}>
            <View style={[styles.gaugeFill, { width: `${saldoPct}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>
        <Text style={[styles.gaugePct, { color: atual.saldo > 15 ? colors.success : colors.warning }]}>
          Saldo: {atual.saldo} dias
        </Text>
        {atual.aviso_ferias_url && (
          <TouchableOpacity
            style={styles.avisoBnt}
            onPress={async () => {
              const url = await getSignedUrl(atual.aviso_ferias_url!)
              if (url) Sharing.shareAsync(url)
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Ver aviso de férias</Text>
          </TouchableOpacity>
        )}
      </Card>

      <Text style={styles.sectionTitle}>Histórico</Text>
      {ferias.slice(1).map((f, i) => (
        <Card key={i} style={styles.histItem}>
          <Text style={styles.histMes}>
            {new Date(f.periodo_aquisitivo_inicio).getFullYear()} –{' '}
            {new Date(f.periodo_aquisitivo_fim).getFullYear()}
          </Text>
          <Text style={styles.resumoLabel}>{f.dias_gozados} de {f.dias_total} dias gozados</Text>
        </Card>
      ))}
    </ScrollView>
  )
}

export default function RHScreen() {
  const [tab, setTab] = useState(0)
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries()
    setRefreshing(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RH</Text>
      </View>
      <View style={styles.segmentArea}>
        <SegmentedControl
          options={['Absenteísmo', 'Atestados', 'Férias']}
          selectedIndex={tab}
          onChange={setTab}
        />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={{ paddingHorizontal: 16 }}>
          {tab === 0 && <AbsenteismoTab />}
          {tab === 2 && <FeriasTab />}
        </View>
        {tab === 1 && <AtestadosTab />}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  segmentArea: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8, marginTop: 16 },
  gaugeCard: { marginBottom: 16 },
  gaugeLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  gaugeBar: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  gaugeFill: { height: '100%', borderRadius: 6 },
  gaugeMeta: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.textMuted },
  gaugePct: { fontSize: 32, fontWeight: '800', marginTop: 8 },
  resumoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  resumoItem: { alignItems: 'center' },
  resumoVal: { fontSize: 20, fontWeight: '800', color: colors.text },
  resumoLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  histItem: { marginBottom: 8 },
  histMes: { fontSize: 14, fontWeight: '600', color: colors.text },
  histPct: { fontSize: 16, fontWeight: '700' },
  histBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  histBarFill: { height: '100%', borderRadius: 3 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalContent: { padding: 24, paddingTop: 48 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 12 },
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
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    marginTop: 12,
    borderStyle: 'dashed',
  },
  uploadText: { color: colors.primary, fontWeight: '500' },
  feriaCard: { marginBottom: 16 },
  feriaLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  feriaPeriodo: { fontSize: 15, fontWeight: '600', color: colors.text },
  avisoBnt: { marginTop: 12, padding: 8, alignItems: 'center' },
})
