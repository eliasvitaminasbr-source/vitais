import React from 'react'
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { TrendingUp, TrendingDown, FileText, Bell, Calendar } from 'lucide-react-native'
import { colors } from '../../theme/colors'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'
import { useColaborador } from '../../hooks/useColaborador'
import { useAbsenteismo } from '../../hooks/useAbsenteismo'
import { useHolerites } from '../../hooks/useHolerites'
import { useComunicados } from '../../hooks/useComunicados'
import { useFerias } from '../../hooks/useFerias'
import { usePontoRegistros } from '../../hooks/usePontoRegistros'
import { useQueryClient } from '@tanstack/react-query'

function calcTempoNaEquipe(dataAdmissao: string) {
  const admissao = new Date(dataAdmissao)
  const hoje = new Date()
  const anos = hoje.getFullYear() - admissao.getFullYear()
  const meses = hoje.getMonth() - admissao.getMonth()
  const totalMeses = anos * 12 + meses
  const a = Math.floor(totalMeses / 12)
  const m = totalMeses % 12
  if (a === 0) return `${m} ${m === 1 ? 'mês' : 'meses'} na equipe`
  if (m === 0) return `${a} ${a === 1 ? 'ano' : 'anos'} na equipe`
  return `${a} ${a === 1 ? 'ano' : 'anos'} e ${m} ${m === 1 ? 'mês' : 'meses'} na equipe`
}

export default function HomeScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = React.useState(false)

  const { data: colaborador, isLoading: loadingColab } = useColaborador()
  const { data: absenteismo } = useAbsenteismo()
  const { data: holerites } = useHolerites()
  const { data: comunicados } = useComunicados()
  const { data: ferias } = useFerias()
  const { data: ponto } = usePontoRegistros()

  const onRefresh = async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries()
    setRefreshing(false)
  }

  const absAtual = absenteismo?.[0]
  const absAnterior = absenteismo?.[1]
  const naoLidos = comunicados?.filter((c) => !c.lido).length ?? 0
  const ultimoHolerite = holerites?.[0]
  const feriasSaldo = ferias?.[0]
  const pontosRecentes = ponto?.slice(-3) ?? []

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {loadingColab ? (
        <SkeletonCard />
      ) : colaborador ? (
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Avatar
              name={colaborador.nome_completo?.trim()}
              photoUrl={colaborador.foto}
              size={56}
            />
            <View style={styles.headerInfo}>
              <Text style={styles.ola}>
                Olá, {colaborador.nome_completo?.trim().split(' ')[0]}!
              </Text>
              <Text style={styles.cargo}>{colaborador.cargo}</Text>
              <Text style={styles.depto}>{colaborador.departamento}</Text>
            </View>
          </View>
          {colaborador.data_admissao && (
            <Text style={styles.tempoEquipe}>
              {calcTempoNaEquipe(colaborador.data_admissao)}
            </Text>
          )}
        </Card>
      ) : null}

      <Text style={styles.sectionTitle}>Resumo</Text>
      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(tabs)/rh')}>
          <Card style={styles.miniCard}>
            <Text style={styles.miniLabel}>Absenteísmo</Text>
            <Text style={[styles.miniValue, { color: absAtual && absAtual.percentual > 10 ? colors.danger : absAtual && absAtual.percentual > 5 ? colors.warning : colors.success }]}>
              {absAtual ? `${absAtual.percentual.toFixed(1)}%` : '—'}
            </Text>
            {absAtual && absAnterior && (
              <View style={styles.miniTrend}>
                {absAtual.percentual > absAnterior.percentual
                  ? <TrendingUp size={14} color={colors.danger} />
                  : <TrendingDown size={14} color={colors.success} />}
                <Text style={styles.miniTrendText}>vs mês anterior</Text>
              </View>
            )}
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(tabs)/documentos')}>
          <Card style={styles.miniCard}>
            <View style={styles.miniRow}>
              <FileText size={18} color={colors.danger} />
              <Text style={styles.miniLabel}>  Holerite</Text>
            </View>
            <Text style={styles.miniValueSm} numberOfLines={1}>
              {ultimoHolerite?.competencia ?? '—'}
            </Text>
            {ultimoHolerite && (
              <Text style={[styles.miniTrendText, { color: colors.primary }]}>Disponível</Text>
            )}
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(tabs)/comunicados')}>
          <Card style={styles.miniCard}>
            <View style={styles.miniRow}>
              <Bell size={18} color={naoLidos > 0 ? colors.danger : colors.textMuted} />
              <Text style={styles.miniLabel}>  Comunicados</Text>
            </View>
            <Text style={[styles.miniValue, { color: naoLidos > 0 ? colors.danger : colors.text }]}>
              {naoLidos}
            </Text>
            <Text style={styles.miniTrendText}>não lidos</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(tabs)/rh')}>
          <Card style={styles.miniCard}>
            <View style={styles.miniRow}>
              <Calendar size={18} color={colors.primary} />
              <Text style={styles.miniLabel}>  Férias</Text>
            </View>
            <Text style={[styles.miniValue, {
              color: (feriasSaldo?.saldo ?? 0) > 15 ? colors.success : colors.warning,
            }]}>
              {feriasSaldo ? `${feriasSaldo.saldo}d` : '—'}
            </Text>
            <Text style={styles.miniTrendText}>de saldo</Text>
          </Card>
        </TouchableOpacity>
      </View>

      {pontosRecentes.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Últimos registros de ponto</Text>
          {pontosRecentes.map((p, i) => (
            <Card key={i} style={styles.pontoItem}>
              <View style={styles.pontoRow}>
                <Text style={styles.pontoData}>{new Date(p.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</Text>
                <Badge
                  label={p.status_dia}
                  variant={
                    p.status_dia === 'presente' ? 'success'
                    : p.status_dia === 'falta' ? 'danger'
                    : p.status_dia === 'atestado' ? 'warning'
                    : 'neutral'
                  }
                />
              </View>
              {p.horas_trabalhadas && (
                <Text style={styles.pontoHoras}>{p.horas_trabalhadas} trabalhadas</Text>
              )}
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingTop: 56 },
  headerCard: { marginBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerInfo: { flex: 1 },
  ola: { fontSize: 20, fontWeight: '800', color: colors.primary },
  cargo: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 },
  depto: { fontSize: 12, color: colors.textMuted },
  tempoEquipe: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  gridItem: { width: '47%' },
  miniCard: { minHeight: 90 },
  miniLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginBottom: 4 },
  miniValue: { fontSize: 26, fontWeight: '800', color: colors.text },
  miniValueSm: { fontSize: 14, fontWeight: '700', color: colors.text },
  miniRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  miniTrend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  miniTrendText: { fontSize: 11, color: colors.textMuted },
  pontoItem: { marginBottom: 8 },
  pontoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pontoData: { fontSize: 14, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  pontoHoras: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
})
