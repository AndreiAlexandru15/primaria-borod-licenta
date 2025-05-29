import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { writeToBuffer } from "fast-csv"
import ExcelJS from "exceljs"

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const registruId = searchParams.get("registruId")
  const format = searchParams.get("format") || "excel"

  if (!registruId) {
    return NextResponse.json({ error: "registruId is required" }, { status: 400 })
  }

  // Fetch registrations from DB
  const inregistrari = await prisma.inregistrare.findMany({
    where: { registruId: registruId },
    include: {
      fisiere: true,
      destinatarUtilizator: true,
      confidentialitate: true
    },
  })

  if (format === "csv") {
    // CSV export
    const csvRows = inregistrari.map((row) => ({
      ...row,
      fisiere: row.fisiere.map(f => f.nume).join("; ")
    }))
    const buffer = await new Promise((resolve, reject) => {
      writeToBuffer(csvRows, { headers: true })
        .then(resolve)
        .catch(reject)
    })
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=registru_${registruId}.csv`,
      },
    })
  } else if (format === "pdf") {
    // PDF export (minimal, tabular)
    const PDFDocument = (await import("pdfkit")).default
    const doc = new PDFDocument()
    let buffers = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => {})
    doc.fontSize(16).text(`Registru #${registruId} - Înregistrări`, { align: 'center' })
    doc.moveDown()
    inregistrari.forEach((row, idx) => {
      doc.fontSize(12).text(`${idx + 1}. ${JSON.stringify(row)}`)
      doc.moveDown(0.5)
    })
    doc.end()
    const pdfBuffer = await new Promise(resolve => {
      doc.on('end', () => resolve(Buffer.concat(buffers)))
    })
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=registru_${registruId}.pdf`,
      },
    })
  } else {
    // Excel export (default)
    // Pentru export Excel: doar coloanele vizibile în lista-inregistrari
    if (format === "excel" || !format) {
      // Definim coloanele exact ca în lista-inregistrari.jsx
      const columns = [
        { header: "Nr. Înregistrare", key: "numarInregistrare" },
        { header: "Număr Document", key: "numarDocument" },
        { header: "Data Înregistrare", key: "dataInregistrare" },
        { header: "Data Document", key: "dataFisier" },
        { header: "Expeditor", key: "expeditor" },
        { header: "Destinatar", key: "destinatarNume" },
        { header: "Obiect", key: "obiect" },
        { header: "Confidențialitate", key: "confidentialitate" },
        { header: "Status", key: "status" },
      ];
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Înregistrări");
      sheet.columns = columns;
      inregistrari.forEach(row => {
        // Data Document: data primului fișier dacă există
        let dataFisier = '';
        if (row.fisiere && row.fisiere.length > 0 && row.fisiere[0].createdAt) {
          dataFisier = new Date(row.fisiere[0].createdAt).toLocaleDateString('ro-RO');
        }
        // Destinatar: concatenează nume + prenume dacă există, altfel doar nume, altfel destinatar (string)
        let destinatarNume = '';
        if (row.destinatarUtilizator) {
          destinatarNume = [row.destinatarUtilizator.nume, row.destinatarUtilizator.prenume].filter(Boolean).join(' ');
        }
        if (!destinatarNume) destinatarNume = row.destinatar || '';
        // Confidențialitate: preferă confidentialitate.denumire, altfel '-'
        let confidentialitate = row.confidentialitate?.denumire || '-';
        sheet.addRow({
          numarInregistrare: row.numarInregistrare,
          numarDocument: row.numarDocument || '',
          dataInregistrare: row.dataInregistrare ? new Date(row.dataInregistrare).toLocaleDateString('ro-RO') : '',
          dataFisier,
          expeditor: row.expeditor || '',
          destinatarNume,
          obiect: row.obiect + (row.observatii ? `\n${row.observatii}` : ''),
          confidentialitate,
          status: row.status,
        });
      });
      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=registru_${registruId}.xlsx`,
        },
      });
    }
  }
}
