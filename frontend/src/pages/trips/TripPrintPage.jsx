import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import { getFileUrl } from '../../utils/getFileUrl'

export default function TripPrintPage() {
  const { id } = useParams()
  const printRef = useRef(null)

  const [trip, setTrip] = useState(null)
  const [days, setDays] = useState([])
  const [activities, setActivities] = useState({})
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [id])

  async function fetchAll() {
    try {
      const [tripRes, daysRes, expensesRes] = await Promise.all([
        api.get(`/trips/${id}`),
        api.get(`/trips/${id}/days`),
        api.get(`/trips/${id}/expenses`),
      ])

      const tripData = tripRes.data.trip || tripRes.data
      const daysData = daysRes.data.days || []
      const expensesData = expensesRes.data.expenses || []

      setTrip(tripData)
      setDays(daysData)
      setExpenses(expensesData)

      const activityResults = await Promise.all(
        daysData.map((day) =>
          api
            .get(`/trips/${id}/activities?dayId=${day.id}`)
            .then((r) => ({ dayId: day.id, activities: r.data.activities || [] }))
            .catch(() => ({ dayId: day.id, activities: [] }))
        )
      )

      const actMap = {}
      activityResults.forEach(({ dayId, activities }) => {
        actMap[dayId] = activities
      })
      setActivities(actMap)
    } catch (err) {
      console.error('Erro ao carregar dados para impressão:', err)
    } finally {
      setLoading(false)
    }
  }

async function handleExportPDF() {
  console.log('🔵 [1] Botão clicado')
  setExporting(true)
  try {
    console.log('🔵 [2] Importando jsPDF...')
    const { jsPDF } = await import('jspdf')
    console.log('🔵 [3] jsPDF importado:', typeof jsPDF)

    console.log('🔵 [4] Importando html2canvas...')
    const { default: html2canvas } = await import('html2canvas-pro')
    console.log('🔵 [5] html2canvas importado:', typeof html2canvas)

    const element = printRef.current
    console.log('🔵 [6] Elemento ref:', element)
    if (!element) throw new Error('Elemento não encontrado')

    console.log('🔵 [7] Renderizando canvas...')
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: true,
    })
    console.log('🔵 [8] Canvas pronto:', canvas.width, 'x', canvas.height)

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfPageWidth = pdf.internal.pageSize.getWidth()
    const pdfPageHeight = pdf.internal.pageSize.getHeight()
    const imgHeight = (canvas.height * pdfPageWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, pdfPageWidth, imgHeight)
    heightLeft -= pdfPageHeight

    while (heightLeft > 0) {
      position -= pdfPageHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, pdfPageWidth, imgHeight)
      heightLeft -= pdfPageHeight
    }

    console.log('🔵 [9] Salvando PDF...')
    pdf.save(`${trip?.name || 'itinerario'}.pdf`)
    console.log('🟢 [10] PDF salvo com sucesso!')
  } catch (err) {
    console.error('🔴 Erro ao gerar PDF:', err)
    alert('Erro ao gerar PDF: ' + err.message)
  } finally {
    setExporting(false)
  }
}



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Preparando itinerário...</p>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Viagem não encontrada</p>
      </div>
    )
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="bg-gray-100 min-h-screen">

      {/* Barra de ações */}
      <div className="print:hidden bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <Link to={`/trips/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← Voltar
        </Link>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {exporting ? 'Gerando PDF...' : '📄 Baixar PDF'}
          </button>
        </div>
      </div>

      {/* Conteúdo imprimível */}
      <div
        ref={printRef}
        className="max-w-3xl mx-auto bg-white my-6 rounded-2xl shadow-sm overflow-hidden print:shadow-none print:my-0 print:rounded-none"
      >
        {/* Capa */}
        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-indigo-700 flex items-end">
          {getFileUrl(trip.coverImage) && (
            <img
              src={getFileUrl(trip.coverImage)}
              alt={trip.name}
              className="absolute inset-0 w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative p-6 text-white">
            <h1 className="text-3xl font-bold">{trip.name}</h1>
            <div className="flex gap-4 text-sm mt-1 text-white/80">
              {trip.destination && <span>📍 {trip.destination}</span>}
              {trip.startDate && (
                <span>
                  📅 {new Date(trip.startDate).toLocaleDateString('pt-BR')}
                  {trip.endDate &&
                    ` → ${new Date(trip.endDate).toLocaleDateString('pt-BR')}`}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">

          {/* Descrição */}
          {trip.description && (
            <p className="text-gray-600 mb-6 text-sm leading-relaxed border-l-4 border-blue-200 pl-4">
              {trip.description}
            </p>
          )}

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: '🗓️', label: 'Dias planejados', value: days.length },
              {
                icon: '🎯',
                label: 'Atividades',
                value: Object.values(activities).flat().length,
              },
              {
                icon: '💰',
                label: 'Total de despesas',
                value: `R$ ${totalExpenses.toFixed(2)}`,
              },
            ].map((stat) => (
              <div key={stat.label} className="text-center border rounded-xl p-3">
                <p className="text-2xl">{stat.icon}</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Itinerário por dia */}
          {days.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
                🗓️ Itinerário
              </h2>
              <div className="flex flex-col gap-6">
                {days.map((day, index) => {
                  // ✅ Corrigido: ordenar por startTime
                  const dayActivities = (activities[day.id] || [])
                    .slice()
                    .sort((a, b) =>
                      (a.startTime || '').localeCompare(b.startTime || '')
                    )

                  return (
                    <div key={day.id} className="border rounded-xl overflow-hidden">
                      {/* Header do dia */}
                      <div className="bg-blue-50 border-b px-4 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{day.title}</p>
                          {day.date && (
                            <p className="text-xs text-gray-500">
                              📅{' '}
                              {new Date(day.date).toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Atividades */}
                      {dayActivities.length === 0 ? (
                        <p className="text-sm text-gray-400 px-4 py-3">
                          Nenhuma atividade planejada para este dia
                        </p>
                      ) : (
                        <div className="divide-y">
                          {dayActivities.map((activity) => (
                            <div
                              key={activity.id}
                              className="px-4 py-3 flex gap-3 items-start"
                            >
                              {/* ✅ Corrigido: startTime */}
                              {activity.startTime && (
                                <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded shrink-0 mt-0.5">
                                  {activity.startTime}
                                </span>
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-800">
                                  {activity.title}
                                </p>
                                {/* ✅ Corrigido: locationName */}
                                {activity.locationName && (
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    📍 {activity.locationName}
                                  </p>
                                )}
                                {/* ✅ Corrigido: description */}
                                {activity.description && (
                                  <p className="text-xs text-gray-500 mt-1 italic">
                                    {activity.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Despesas */}
          {expenses.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
                💰 Despesas
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b">
                    <th className="pb-2 font-medium">Título</th>
                    <th className="pb-2 font-medium">Categoria</th>
                    <th className="pb-2 font-medium">Pago por</th>
                    <th className="pb-2 font-medium text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="text-gray-600">
                      <td className="py-2">{expense.title}</td>
                      <td className="py-2 text-xs text-gray-400">{expense.category}</td>
                      <td className="py-2 text-xs text-gray-400">
                        {expense.payer?.name || '-'}
                      </td>
                      <td className="py-2 text-right font-medium text-gray-800">
                        R$ {Number(expense.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-bold text-gray-800">
                    <td colSpan={3} className="pt-3">Total</td>
                    <td className="pt-3 text-right">R$ {totalExpenses.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </section>
          )}

        {/* Rodapé com logo */}
        <div className="flex flex-col items-center gap-2 pt-6 border-t mt-6">
          <img
            src="/logo.png"
            alt="TriPlanner"
            className="h-14 w-auto object-contain"
            crossOrigin="anonymous"
          />
          <p className="text-xs text-gray-300">
            Itinerário gerado em{' '}
            {new Date().toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        </div>
      </div>
    </div>
  )
}
