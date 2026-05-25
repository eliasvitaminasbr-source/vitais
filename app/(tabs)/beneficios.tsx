import React, { useState } from 'react'
import { View, Text, FlatList, SectionList, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native'
import { Bus, UtensilsCrossed, DollarSign, Tag, Wallet } from 'lucide-react-native'
import { colors } from '../../theme/colors'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'
import { useComprasInternas } from '../../hooks/useComprasInternas'
import { useVales } from '../../hooks/useVales'
import { useFechamentoFolha } from '../../hooks/useFechamentoFolha'
import { useHolerites } from '../../hooks/useHolerites'
import { useQueryClient } from '@tanstack/react-query'
import { Vale } from '../../types/database'

const statusVariant: Record<string, 'success' | 'warning' | 'neutral'> = {
  aprovado: 'success',
  pendente: 'warning',
  cancelado: 'neutral',
}

const valeIcon = (tipo: string) => {
  if (tipo === 'vt') return <Bus size={18} color={colors.info} />
  if (tipo === 'va') return <UtensilsCrossed size={18} color={colors.success} />
  if (tipo === 'adiantamento') return <DollarSign size={18} color={colors.warning} />
  return <Tag size={18} color={colors.textMuted} />
}

function ComprasTab() {
  const { data: compras, isLoading } = useComprasInternas()
  const [filtro, setFiltro] = useState<string | null>(null)

  const filtros = ['Todos', 'Pendente', 'Aprovado', 'Cancelado']

  const agora = new Date()
  const competenciaAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`
  const totalMes = compras
    ?.filter((c) => c.competencia_desconto === competenciaAtual && c.status === 'aprovado')
    .reduce((s, c) => s + (c.valor ?? 0), 0) ?? 0

  const listaFiltrada = compras?.filter((c) => {
    if (!filtro || filtro === 'Todos') return true
    return c.status === filtro.toLowerCase()
  }) ?? []

  if (isLoading) return <SkeletonCard />

  return (
    <ScrollView>
      <Card style={styles.totalCard}>
        <Wallet size={20} color={colors.primary} />
        <Text style={styles.totalLabel}>Total no mês (aprovado)</Text>
        <Text style={styles.totalValor}>R$ {totalMes.toFixed(2)}</Text>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {filtros.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filtro === f && styles.chipActive]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.chipText, filtro === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {listaFiltrada.length === 0 ? (
        <EmptyState title="Nenhuma compra encontrada" />
      ) : (
        listaFiltrada.map((item) => (
          <Card key={item.id} style={styles.itemCard}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemNome}>{item.produto}</Text>
                {item.sku && <Text style={styles.itemSub}>SKU: {item.sku}</Text>}
                <Text style={styles.itemSub}>
                  {item.quantidade}x · Desconto: {item.competencia_desconto}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.itemValor}>R$ {item.valor?.toFixed(2)}</Text>
                <Badge label={item.status} variant={statusVariant[item.status] ?? 'neutral'} />
              </View>
            </View>
          </Card>
        ))
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

function ValesTab() {
  const { data: vales, isLoading } = useVales()

  const agora = new Date()
  const competenciaAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`
  const totalDesc = vales
    ?.filter((v) => v.competencia === competenciaAtual)
    .reduce((s, v) => s + (v.valor ?? 0), 0) ?? 0

  const valesPorComp = React.useMemo(() => {
    if (!vales) return []
    const grupos: Record<string, Vale[]> = {}
    for (const v of vales) {
      if (!grupos[v.competencia]) grupos[v.competencia] = []
      grupos[v.competencia].push(v)
    }
    return Object.entries(grupos)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([title, data]) => ({ title, data }))
  }, [vales])

  if (isLoading) return <SkeletonCard />

  return (
    <ScrollView>
      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Descontos previstos este mês</Text>
        <Text style={[styles.totalValor, { color: colors.danger }]}>R$ {totalDesc.toFixed(2)}</Text>
      </Card>

      <SectionList
        sections={valesPorComp}
        scrollEnabled={false}
        keyExtractor={(item) => String(item.id)}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Card style={styles.itemCard}>
            <View style={styles.row}>
              {valeIcon(item.tipo)}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.itemNome}>{item.tipo.toUpperCase()}</Text>
                {item.descricao && <Text style={styles.itemSub}>{item.descricao}</Text>}
              </View>
              <Text style={styles.itemValor}>R$ {item.valor?.toFixed(2)}</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState title="Nenhum vale registrado" />}
      />
      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

function FolhaTab() {
  const { data: folha, isLoading } = useFechamentoFolha()
  const { data: holerites } = useHolerites()

  if (isLoading) return <SkeletonCard />

  if (!folha || !folha.fechado) {
    return (
      <EmptyState
        title="Folha não fechada"
        subtitle="A folha do mês atual ainda não foi processada pelo RH."
      />
    )
  }

  const holeriteCorrespondente = holerites?.find((h) => h.competencia === folha.competencia)

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Text style={styles.folhaComp}>Folha: {folha.competencia}</Text>

        <View style={styles.folhaLinha}>
          <Text style={styles.folhaKey}>Salário base</Text>
          <Text style={styles.folhaVal}>R$ {folha.salario_base.toFixed(2)}</Text>
        </View>

        <Text style={[styles.folhaComp, { color: colors.danger, marginTop: 16 }]}>Descontos</Text>
        {[
          { label: 'Faltas', val: folha.desconto_faltas },
          { label: 'DSR', val: folha.desconto_dsr },
          { label: 'Vale-Transporte', val: folha.desconto_vt },
          { label: 'Vale-Alimentação', val: folha.desconto_va },
          { label: 'Compras internas', val: folha.desconto_compras },
        ].map(({ label, val }) =>
          val > 0 ? (
            <View key={label} style={styles.folhaLinha}>
              <Text style={styles.folhaKey}>{label}</Text>
              <Text style={[styles.folhaVal, { color: colors.danger }]}>- R$ {val.toFixed(2)}</Text>
            </View>
          ) : null
        )}

        <View style={[styles.folhaLinha, styles.folhaTotalDesc]}>
          <Text style={[styles.folhaKey, { fontWeight: '700', color: colors.danger }]}>Total descontos</Text>
          <Text style={[styles.folhaVal, { color: colors.danger, fontWeight: '800' }]}>
            - R$ {folha.total_descontos.toFixed(2)}
          </Text>
        </View>

        <View style={[styles.folhaLinha, styles.folhaLiquido]}>
          <Text style={[styles.folhaKey, { fontWeight: '700', fontSize: 16 }]}>Salário líquido</Text>
          <Text style={[styles.folhaVal, { color: colors.success, fontSize: 22, fontWeight: '800' }]}>
            R$ {folha.salario_liquido.toFixed(2)}
          </Text>
        </View>

        {holeriteCorrespondente && (
          <TouchableOpacity style={styles.verHolBtn}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Ver holerite</Text>
          </TouchableOpacity>
        )}
      </Card>
    </ScrollView>
  )
}

export default function BeneficiosScreen() {
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
        <Text style={styles.headerTitle}>Benefícios</Text>
      </View>
      <View style={styles.segmentArea}>
        <SegmentedControl
          options={['Compras', 'Vales', 'Folha']}
          selectedIndex={tab}
          onChange={setTab}
        />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {tab === 0 && <ComprasTab />}
        {tab === 1 && <ValesTab />}
        {tab === 2 && <FolhaTab />}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  segmentArea: { paddingHorizontal: 16, marginBottom: 16 },
  totalCard: { marginBottom: 12, gap: 4 },
  totalLabel: { fontSize: 12, color: colors.textMuted },
  totalValor: { fontSize: 24, fontWeight: '800', color: colors.primary },
  chips: { marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: colors.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  chipTextActive: { color: colors.white },
  itemCard: { marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  itemNome: { fontSize: 14, fontWeight: '600', color: colors.text },
  itemSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  itemValor: { fontSize: 15, fontWeight: '700', color: colors.text },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  folhaComp: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  folhaLinha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  folhaKey: { fontSize: 14, color: colors.text },
  folhaVal: { fontSize: 14, color: colors.text },
  folhaTotalDesc: { marginTop: 8, borderBottomWidth: 0 },
  folhaLiquido: { marginTop: 16, borderBottomWidth: 0, backgroundColor: colors.primaryLight, borderRadius: 8, padding: 12 },
  verHolBtn: { marginTop: 16, alignItems: 'center', padding: 10 },
})
