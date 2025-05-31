import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { writeToBuffer } from "fast-csv"
import ExcelJS from "exceljs"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const registruId = searchParams.get("registruId")
    const format = searchParams.get("format") || "excel"

    if (!registruId) {
      return NextResponse.json({ error: "registruId is required" }, { status: 400 })
    }

    // Fetch registrations from DB with all necessary relations
    const inregistrari = await prisma.inregistrare.findMany({
      where: { registruId: registruId },
      include: {
        fisiere: {
          select: {
            id: true,
            numeFisierDisk: true,
            numeOriginal: true,
            createdAt: true,
            extensie: true,
            marime: true
          }
        },
        destinatarUtilizator: {
          select: {
            nume: true,
            prenume: true,
            email: true
          }
        },
        confidentialitate: {
          select: {
            denumire: true,
            cod: true
          }
        },
        tipDocument: {
          select: {
            nume: true,
            cod: true
          }
        },
        registru: {
          select: {
            nume: true,
            cod: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get registry name for filename
    const numeRegistru = inregistrari[0]?.registru?.nume || 'Registru';
    const numeRegistruCurat = numeRegistru.replace(/[^a-zA-Z0-9]/g, '_'); // Replace special chars with underscore

    // Helper function to format data for export
    const formatRowData = (row) => {
      // Data Document: folosește dataDocument dacă există, altfel data primului fișier
      let dataDocument = '';
      if (row.dataDocument) {
        dataDocument = new Date(row.dataDocument).toLocaleDateString('ro-RO');
      } else if (row.fisiere && row.fisiere.length > 0 && row.fisiere[0].createdAt) {
        dataDocument = new Date(row.fisiere[0].createdAt).toLocaleDateString('ro-RO');
      }

      // Destinatar: concatenează nume + prenume dacă există
      let destinatarNume = '';
      if (row.destinatarUtilizator) {
        destinatarNume = [row.destinatarUtilizator.nume, row.destinatarUtilizator.prenume]
          .filter(Boolean)
          .join(' ');
      }
      if (!destinatarNume) destinatarNume = row.destinatar || '';

      // Confidențialitate
      const confidentialitate = row.confidentialitate?.denumire || 'Public';

      // Status - bazat pe prezența fișierelor
      const status = row.fisiere && row.fisiere.length > 0 ? 'Complet' : 'În proces';

      // Lista fișiere pentru export - folosește numeOriginal sau numeFisierDisk
      const fisiere = row.fisiere?.map(f => f.numeOriginal || f.numeFisierDisk || 'Fișier').join('; ') || '';

      return {
        numarInregistrare: row.numarInregistrare || '',
        numarDocument: row.numarDocument || '',
        dataInregistrare: row.dataInregistrare ? new Date(row.dataInregistrare).toLocaleDateString('ro-RO') : '',
        dataDocument,
        expeditor: row.expeditor || '',
        destinatarNume,
        obiect: row.obiect || '',
        observatii: row.observatii || '',
        confidentialitate,
        status,
        tipDocument: row.tipDocument?.nume || '',
        fisiere,
        createdAt: row.createdAt ? new Date(row.createdAt).toLocaleDateString('ro-RO') : ''
      };
    };

    if (format === "csv") {
      // CSV export
      const csvData = inregistrari.map(formatRowData);
      
      const buffer = await new Promise((resolve, reject) => {
        writeToBuffer(csvData, { 
          headers: true,
          encoding: 'utf8'
        })
        .then(resolve)
        .catch(reject);
      });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="Raport_Inregistrari_${numeRegistruCurat}.csv"`,
        },
      });

     } else if (format === "pdf") {
      // Simple PDF export without autoTable to avoid compatibility issues
      const { jsPDF } = await import("jspdf");
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Set font
      doc.setFont("helvetica");
      
      // Title
      doc.setFontSize(16);
      doc.text(`Export Registru - ${new Date().toLocaleDateString('ro-RO')}`, 148, 20, { align: 'center' });
      
      // Headers
      doc.setFontSize(8);
      let y = 40;
      
      // Table headers - fără Status
      const headers = ['Nr. Inreg.', 'Nr. Doc.', 'Data Inreg.', 'Expeditor', 'Destinatar', 'Obiect'];
      const colWidths = [25, 25, 25, 40, 40, 80];
      let x = 10;
      
      // Draw header row
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      headers.forEach((header, index) => {
        doc.text(header, x, y);
        x += colWidths[index];
      });
      
      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      
      // Draw data rows
      inregistrari.forEach((row, index) => {
        if (y > 190) { // New page if needed (landscape)
          doc.addPage();
          y = 20;
          
          // Redraw headers on new page
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          x = 10;
          headers.forEach((header, index) => {
            doc.text(header, x, y);
            x += colWidths[index];
          });
          y += 10;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
        }
        
        const formattedRow = formatRowData(row);
        x = 10;
        
        // Row data fără Status
        const rowData = [
          formattedRow.numarInregistrare,
          formattedRow.numarDocument,
          formattedRow.dataInregistrare,
          formattedRow.expeditor.substring(0, 15) + (formattedRow.expeditor.length > 15 ? '...' : ''),
          formattedRow.destinatarNume.substring(0, 15) + (formattedRow.destinatarNume.length > 15 ? '...' : ''),
          formattedRow.obiect.substring(0, 35) + (formattedRow.obiect.length > 35 ? '...' : '')
        ];
        
        rowData.forEach((cell, index) => {
          doc.text(cell || '', x, y);
          x += colWidths[index];
        });
        
        y += 8;
      });

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Raport_Inregistrari_${numeRegistruCurat}.pdf"`,
        },
      });

    } else {
      // Excel export (default)
      const columns = [
        { header: "Nr. Înregistrare", key: "numarInregistrare", width: 20 },
        { header: "Număr Document", key: "numarDocument", width: 20 },
        { header: "Data Înregistrare", key: "dataInregistrare", width: 15 },
        { header: "Data Document", key: "dataDocument", width: 15 },
        { header: "Expeditor", key: "expeditor", width: 25 },
        { header: "Destinatar", key: "destinatarNume", width: 25 },
        { header: "Obiect", key: "obiect", width: 40 },
        { header: "Observații", key: "observatii", width: 30 },
        { header: "Tip Document", key: "tipDocument", width: 20 },
        { header: "Confidențialitate", key: "confidentialitate", width: 20 },
        { header: "Status", key: "status", width: 15 },
        { header: "Fișiere", key: "fisiere", width: 30 }
      ];

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Înregistrări");
      
      // Set columns
      sheet.columns = columns;
      
      // Style header row
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Add borders to header
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      // Add data
      inregistrari.forEach(row => {
        const formattedRow = formatRowData(row);
        const newRow = sheet.addRow({
          numarInregistrare: formattedRow.numarInregistrare,
          numarDocument: formattedRow.numarDocument,
          dataInregistrare: formattedRow.dataInregistrare,
          dataDocument: formattedRow.dataDocument,
          expeditor: formattedRow.expeditor,
          destinatarNume: formattedRow.destinatarNume,
          obiect: formattedRow.obiect,
          observatii: formattedRow.observatii,
          tipDocument: formattedRow.tipDocument,
          confidentialitate: formattedRow.confidentialitate,
          status: formattedRow.status,
          fisiere: formattedRow.fisiere
        });
        
        // Add borders to data rows
        newRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });
      
      // Auto-fit columns
      sheet.columns.forEach(column => {
        if (column.width < 10) column.width = 10;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="Raport_Inregistrari_${numeRegistruCurat}.xlsx"`,
        },
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: "Eroare la export", details: error.message }, 
      { status: 500 }
    );
  }
}