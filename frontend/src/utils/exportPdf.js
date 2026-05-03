import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function exportToPdf(elementId, filename = 'viagem.pdf') {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error('Elemento não encontrado:', elementId)
    return
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,           // permite imagens externas
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth  = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth   = pageWidth
    const imgHeight  = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position   = 0

    // Adiciona primeira página
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Adiciona páginas extras se necessário
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(filename)
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    throw error
  }
}
