import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  SectionList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native'
import { FileText, Download } from 'lucide-react-native'
import * as Sharing from 'expo-sharing'
import { colors } from '../../theme/colors'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'
import { useHolerites } from '../../hooks/useHolerites'
import { useComprasInternas } from '../../hooks/useComprasInternas'
import { usePontoRegistros } from '../../hooks/usePontoRegistros'
import { getSignedUrl } from '../../lib/storage'
import { useQueryClient } from '@tanstack/react-query'
import { Holerite } from '../../types/database'

const statusVariant: Record<string, 'success' | 'warning' | 'neutral'> = {
  aprovado: 'success',
  pendente: 'warning',
  cancelado: 'neutral',
}

const pontoCor: Record<string, string> = {
  presente: '#1D9E75',
  falta: '#EF4444',
  atestado: '#F59E0B',
  feriado: '#9CA3AF',
  folga: '#9CA3AF',
  futuro: '#F4F6F8',
}

export default function DocumentosScreen() {
  const [tab, setTab] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const queryClient = useQueryClient()

  const { data: holerites, isLoading: loadingH } = useHolerites()
  const { data: compras, isLoading: loadingC } = useComprasInternas()
  const { data: ponto, isLoading: loadingP } = usePontoRegistros()

  const onRefresh = async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['holerites', 'compras', 'ponto'] })
    setRefreshing(false)
  }

  const abrirHolerite = async (h: Holerite) => {
    const url = await getSignedUrl(h.arquivo_path)
    if (!url) {
      Alert.alert('Erro', 'Não foi possível abrir o arquivo.')
      return
    }
    const canShare = await Sharing.isAvailableAsync()
    if (canShare) {
      await Sharing.shareAsync(url)
    } else {
      Alert.alert('Link do holerite', url)
    }
  }

  const holeiritesPorAno = React.useMemo(() => {
    if (!holerites) return []
    const grupos: Record<string, Holerite[]> = {}
    for (const h of holerites) {
      const ano = h.competencia?.split('-')[0] ?? 'Sem data'
      if (!grupos[ano]) grupos[ano] = []
      grupos[ano].push(h)
    }
    return Object.entries(grupos)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([title, data]) => ({ title, data }))
  }, [holerites])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documentos</Text>
      </View>

      <View style={styles.segmentArea}>
        <SegmentedControl
          options={['Holerites', 'Comprovantes', 'Ponto']}
          selectedIndex={tab}
          onChange={setTab}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {tab === 0 && (
          loadingH ? <SkeletonCard /> :
          holeiritesPorAno.length === 0 ? (
            <EmptyState
              icon={<FileText size={48} color={colors.textMuted} />}
              title="Nenhum holerite disponível"
              subtitle="Aguardando publicação pelo RH"
            />
          ) : (
            <SectionList
              sections={holeiritesPorAno}
              scrollEnabled={false}
              keyExtractor={(item) => String(item.id)}
              renderSectionHeader={({ section }) => (
                <Text style={styles.sectionHeader}>{section.title}</Text>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => abrirHolerite(item)}>
                  <Card style={styles.holItem}>
                    <View style={styles.holRow}>
                      <FileText size={28} color={colors.danger} />
                      <View style={styles.holInfo}>
                        <Text style={styles.holComp}>{item.competencia}</Text>
                        <Badge label={item.tipo ?? 'Holerite'} variant="neutral" />
                      </View>
                      <Download size={20} color={colors.primary} />
                    </View>
                  </Card>
                </TouchableOpacity>
              )}
            />
          )
        )}

        {tab === 1 && (
          loadingC ? <SkeletonCard /> :
          !compras?.length ? (
            <EmptyState title="Nenhum comprovante disponível" />
          ) : (
            <FlatList
              data={compras.filter((c) => c.arquivo_url)}
              scrollEnabled={false}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <Card style={styles.compItem}>
                  <View style={styles.holRow}>
                    <View style={styles.holInfo}>
                      <Text style={styles.holComp}>{item.produto}</Text>
                      <Text style={styles.compSub}>{item.competencia_desconto} · R$ {item.valor?.toFixed(2)}</Text>
                    </View>
                    <Badge label={item.status} variant={statusVariant[item.status] ?? 'neutral'} />
                  </View>
                </Card>
              )}
            />
          )
        )}

        {tab === 2 && (
          loadingP ? <SkeletonCard /> :
          !ponto?.length ? (
            <EmptyState title="Nenhum registro de ponto" />
          ) : (
            <View style={styles.calendarioGrid}>
              {ponto.map((p, i) => (
                <View
                  key={i}
                  style={[
                    styles.diaCell,
                    { backgroundColor: pontoCor[p.status_dia] ?? colors.border },
                  ]}
                >
                  <Text style={styles.diaCellText}>
                    {new Date(p.data).getDate()}
                  </Text>
                </View>
              ))}
            </View>
          )
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  segmentArea: { paddingHorizontal: 16, marginBottom: 16 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  holItem: { marginBottom: 8 },
  holRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  holInfo: { flex: 1, gap: 4 },
  holComp: { fontSize: 15, fontWeight: '600', color: colors.text },
  compItem: { marginBottom: 8 },
  compSub: { fontSize: 12, color: colors.textMuted },
  calendarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 4,
  },
  diaCell: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaCellText: { fontSize: 13, fontWeight: '600', color: colors.white },
})
