import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native'
import { AlertCircle } from 'lucide-react-native'
import * as Sharing from 'expo-sharing'
import { colors } from '../../theme/colors'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'
import { useComunicados, useMarcarLido } from '../../hooks/useComunicados'
import { useTreinamentos } from '../../hooks/useTreinamentos'
import { useEscala } from '../../hooks/useEscala'
import { getSignedUrl } from '../../lib/storage'
import { useQueryClient } from '@tanstack/react-query'
import { Comunicado, Treinamento } from '../../types/database'

const tipoVariant: Record<string, 'danger' | 'success' | 'info' | 'neutral'> = {
  urgente: 'danger',
  beneficios: 'success',
  escala: 'info',
  geral: 'neutral',
}

function dataRelativa(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const dias = Math.floor(hrs / 24)
  if (dias > 0) return `${dias}d atrás`
  if (hrs > 0) return `${hrs}h atrás`
  return `${mins}min atrás`
}

function ComunicadosTab() {
  const { data: comunicados, isLoading } = useComunicados()
  const marcarLido = useMarcarLido()
  const [selecionado, setSelecionado] = useState<Comunicado | null>(null)

  const naoLidos = comunicados?.filter((c) => !c.lido).length ?? 0

  const handleAbrir = (c: Comunicado) => {
    setSelecionado(c)
    if (!c.lido) {
      marcarLido.mutate(c.id)
    }
  }

  if (isLoading) return <SkeletonCard />

  return (
    <View style={{ flex: 1 }}>
      {naoLidos > 0 && (
        <View style={styles.naoLidosBanner}>
          <AlertCircle size={14} color="#D97706" />
          <Text style={styles.naoLidosText}>{naoLidos} comunicado(s) não lido(s)</Text>
        </View>
      )}

      <FlatList
        data={comunicados ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListEmptyComponent={<EmptyState title="Nenhum comunicado" />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleAbrir(item)}>
            <Card style={[styles.comItem, !item.lido && styles.comNaoLido]}>
              <View style={styles.comRow}>
                {!item.lido && <View style={styles.dotVerde} />}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <Badge label={item.tipo} variant={tipoVariant[item.tipo] ?? 'neutral'} />
                    <Text style={styles.comData}>{dataRelativa(item.publicado_em)}</Text>
                  </View>
                  <Text style={styles.comTitulo} numberOfLines={1}>{item.titulo}</Text>
                  <Text style={styles.comPreview} numberOfLines={2}>{item.corpo}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!selecionado} animationType="slide" presentationStyle="pageSheet">
        {selecionado && (
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Badge label={selecionado.tipo} variant={tipoVariant[selecionado.tipo] ?? 'neutral'} />
            <Text style={styles.modalTitulo}>{selecionado.titulo}</Text>
            <Text style={styles.modalData}>
              {new Date(selecionado.publicado_em).toLocaleDateString('pt-BR', { dateStyle: 'full' })}
            </Text>
            <Text style={styles.modalCorpo}>{selecionado.corpo}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelecionado(null)}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Fechar</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Modal>
    </View>
  )
}

function TreinamentosTab() {
  const { data: treinamentos, isLoading } = useTreinamentos()

  if (isLoading) return <SkeletonCard />

  const hoje = new Date()
  const proximo = treinamentos?.find((t) => new Date(t.data) > hoje)

  const presencaVariant: Record<string, 'success' | 'danger' | 'neutral'> = {
    confirmada: 'success',
    ausente: 'danger',
    pendente: 'neutral',
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {proximo && (
        <Card style={[styles.comItem, { borderLeftWidth: 4, borderLeftColor: colors.info }]}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.info, textTransform: 'uppercase', marginBottom: 4 }}>
            Próximo treinamento
          </Text>
          <Text style={styles.comTitulo}>{proximo.tema}</Text>
          <Text style={styles.comData}>{new Date(proximo.data).toLocaleDateString('pt-BR', { dateStyle: 'full' })}</Text>
        </Card>
      )}

      <Text style={styles.sectionHeader}>Histórico</Text>
      {(treinamentos ?? []).filter((t) => new Date(t.data) <= hoje).map((t) => (
        <Card key={t.id} style={styles.comItem}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.comTitulo}>{t.tema}</Text>
              <Text style={styles.comData}>{new Date(t.data).toLocaleDateString('pt-BR')}</Text>
            </View>
            <Badge label={t.presenca} variant={presencaVariant[t.presenca] ?? 'neutral'} />
          </View>
        </Card>
      ))}

      {!treinamentos?.length && <EmptyState title="Nenhum treinamento registrado" />}
    </ScrollView>
  )
}

function EscalaTab() {
  const { data: escala, isLoading } = useEscala()
  const [semanaOffset, setSemanaOffset] = useState(0)

  if (isLoading) return <SkeletonCard />

  const hoje = new Date()
  const inicioSemana = new Date(hoje)
  inicioSemana.setDate(hoje.getDate() - hoje.getDay() + 1 + semanaOffset * 7)

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana)
    d.setDate(inicioSemana.getDate() + i)
    return d
  })

  const getEscalaDodia = (data: Date) => {
    const dateStr = data.toISOString().split('T')[0]
    return escala?.find((e) => e.data === dateStr)
  }

  const labelSemana = `${diasSemana[0].toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} – ${diasSemana[6].toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
  const diasSemanaLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={styles.navSemana}>
        <TouchableOpacity onPress={() => setSemanaOffset((v) => v - 1)} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navLabel}>Semana de {labelSemana}</Text>
        <TouchableOpacity onPress={() => setSemanaOffset((v) => v + 1)} style={styles.navBtn}>
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.escalaDias}>
        {diasSemana.map((dia, i) => {
          const e = getEscalaDodia(dia)
          return (
            <View
              key={i}
              style={[
                styles.escalaDia,
                e?.folga && styles.escalaDiaFolga,
              ]}
            >
              <Text style={styles.escalaDiaLabel}>{diasSemanaLabels[i]}</Text>
              <Text style={styles.escalaDiaNum}>{dia.getDate()}</Text>
              {e?.folga ? (
                <Text style={styles.escalaFolga}>Folga</Text>
              ) : (
                <>
                  <Text style={styles.escalaHora}>{e?.entrada ?? '—'}</Text>
                  <Text style={styles.escalaHora}>{e?.saida ?? '—'}</Text>
                </>
              )}
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

export default function ComunicadosScreen() {
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
        <Text style={styles.headerTitle}>Comunicados</Text>
      </View>
      <View style={styles.segmentArea}>
        <SegmentedControl
          options={['Comunicados', 'Treinamentos', 'Escala']}
          selectedIndex={tab}
          onChange={setTab}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {tab === 0 && <ComunicadosTab />}
        {tab === 1 && <TreinamentosTab />}
        {tab === 2 && <EscalaTab />}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  segmentArea: { paddingHorizontal: 16, marginBottom: 12 },
  naoLidosBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  naoLidosText: { fontSize: 13, color: '#D97706', fontWeight: '600' },
  comItem: { marginBottom: 8 },
  comNaoLido: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  comRow: { flexDirection: 'row', gap: 8 },
  dotVerde: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  comData: { fontSize: 11, color: colors.textMuted },
  comTitulo: { fontSize: 14, fontWeight: '700', color: colors.text },
  comPreview: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  sectionHeader: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 8,
  },
  modalContent: { padding: 24, paddingTop: 48 },
  modalTitulo: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 12, marginBottom: 4 },
  modalData: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  modalCorpo: { fontSize: 15, color: colors.text, lineHeight: 24 },
  closeBtn: { marginTop: 32, alignItems: 'center', padding: 12 },
  navSemana: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { padding: 8 },
  navBtnText: { fontSize: 24, color: colors.primary },
  navLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  escalaDias: { flexDirection: 'row', gap: 6 },
  escalaDia: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    minHeight: 90,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  escalaDiaFolga: { backgroundColor: colors.border },
  escalaDiaLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted },
  escalaDiaNum: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  escalaFolga: { fontSize: 9, color: colors.textMuted, textAlign: 'center' },
  escalaHora: { fontSize: 9, color: colors.text, fontWeight: '500' },
})
