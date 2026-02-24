import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper function to convert image URL to base64
const loadImageAsBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to load image:", url, error);
    return null;
  }
};

export const generatePaketPDF = async (paket, progressImages = []) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("LAPORAN REALISASI FISIK", pageWidth / 2, 15, { align: "center" });
  doc.text("KABUPATEN LAMONGAN", pageWidth / 2, 22, { align: "center" });

  const documents = paket.documents || [];

  // Get unique progress percentages and sort them
  const uniqueProgress = [
    ...new Set(documents.map((doc) => doc.progressPercentage)),
  ].sort((a, b) => a - b);

  // Get 3 progress stages (0%, 50%, and highest)
  const progressStages = [];
  if (uniqueProgress.length >= 3) {
    progressStages.push(uniqueProgress[0]); // First (e.g., 0%)
    // Find 50% or closest to middle
    const midProgress = uniqueProgress.find(p => p === 50) || uniqueProgress[Math.floor(uniqueProgress.length / 2)];
    progressStages.push(midProgress); // Middle (50%)
    progressStages.push(uniqueProgress[uniqueProgress.length - 1]); // Last (100%)
  } else if (uniqueProgress.length === 2) {
    progressStages.push(uniqueProgress[0]); // First
    progressStages.push(50); // Force 50% even if no data
    progressStages.push(uniqueProgress[1]); // Last
  } else if (uniqueProgress.length === 1) {
    progressStages.push(uniqueProgress[0]);
    progressStages.push(50);
    progressStages.push(uniqueProgress[0]);
  } else {
    progressStages.push(0, 50, 100); // Default
  }

  // Load images for each progress stage (2 images per stage)
  const stageImages = await Promise.all(
    progressStages.map(async (progress) => {
      const stageDocuments = documents
        .filter((doc) => doc.progressPercentage === progress)
        .slice(0, 2); // Maximum 2 images per stage

      const imageUrls = stageDocuments.map(
        (doc) => `http://localhost:4000${doc.filepath}`,
      );
      const imagesBase64 = await Promise.all(
        imageUrls.map((url) => loadImageAsBase64(url)),
      );

      return {
        progress,
        images: imagesBase64,
      };
    }),
  );

  let yPosition = 30;

  // ── Layout constants ──────────────────────────────────────────────────────
  const contentWidth  = pageWidth - margin * 2;
  const photoColWidth = contentWidth * 0.57;         // left panel ≈57%
  const tableColWidth = contentWidth - photoColWidth - 4; // right panel, 4mm gap
  const tableX        = margin + photoColWidth + 4;

  const NUM_STAGES    = 3;
  const GAP           = 2;                           // mm between sections
  const BUTTON_H      = 8;                           // mm for label bar

  // Total available height for both panels (leave footer space)
  const totalH = pageHeight - yPosition - margin - 6;

  // Each section height = equal slice of total
  const sectionH  = (totalH - (NUM_STAGES - 1) * GAP) / NUM_STAGES;
  const photoH    = sectionH - BUTTON_H - 1;        // photo area inside section
  const photoW    = photoColWidth / 2 - 2;           // each of 2 side-by-side

  // ── Outer green borders ───────────────────────────────────────────────────
  doc.setDrawColor(0, 180, 0);
  doc.setLineWidth(1.5);
  // Left panel
  doc.rect(margin, yPosition, photoColWidth, totalH);
  // Right panel
  doc.rect(tableX, yPosition, tableColWidth, totalH);

  // ── Draw 3 progress stage sections ───────────────────────────────────────
  for (let si = 0; si < NUM_STAGES; si++) {
    const stage   = stageImages[si] || { progress: si * 50, images: [] };
    const secTop  = yPosition + si * (sectionH + GAP);

    // Blue border around this section (entire section)
    doc.setDrawColor(0, 0, 139);
    doc.setLineWidth(1);
    doc.rect(margin, secTop, photoColWidth, sectionH);

    // Draw 2 photos side by side
    for (let col = 0; col < 2; col++) {
      const px = margin + col * (photoW + 2) + 1;
      const py = secTop + 1;

      doc.setDrawColor(0, 0, 139);
      doc.setLineWidth(0.5);
      doc.rect(px, py, photoW, photoH);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(130);

      if (stage.images && stage.images[col]) {
        try {
          doc.addImage(stage.images[col], "JPEG", px + 1, py + 1, photoW - 2, photoH - 2);
        } catch {
          doc.text("FOTO TIDAK TERSEDIA", px + photoW / 2, py + photoH / 2, { align: "center" });
        }
      } else {
        doc.text("FOTO TIDAK TERSEDIA", px + photoW / 2, py + photoH / 2, { align: "center" });
      }
    }

    // Blue label bar at bottom of section
    const barY = secTop + sectionH - BUTTON_H + 1;
    doc.setFillColor(0, 0, 139);
    doc.rect(margin + 0.5, barY, photoColWidth - 1, BUTTON_H - 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Gambar Realisasi ${stage.progress ?? si * 50}%`,
      margin + photoColWidth / 2,
      barY + BUTTON_H / 2 + 1,
      { align: "center" },
    );
  }

  // ── Right info table – stretch rows to fill totalH ────────────────────────
  doc.setTextColor(0);
  const tableData = [
    ["OPD",                 paket.opd?.name || "-"],
    ["KEGIATAN",            paket.kegiatan || "-"],
    ["LOKASI",              paket.lokasi || "-"],
    ["Nomor Kontrak",       paket.nomorKontrak || "-"],
    ["Tanggal",             paket.tanggalMulai ? new Date(paket.tanggalMulai).toLocaleDateString("id-ID") : "-"],
    ["Nilai Kontrak",       new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2 }).format(paket.nilai || 0)],
    ["No SPMK",             paket.noSPMK || "-"],
    ["Tgl Mulai Pekerjaan", paket.tanggalMulai ? new Date(paket.tanggalMulai).toLocaleDateString("id-ID") : "-"],
    ["Tanggal Akhir",       paket.tanggalSelesai ? new Date(paket.tanggalSelesai).toLocaleDateString("id-ID") : "-"],
    ["Dana Pagu",           new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2 }).format(paket.pagu || paket.nilai || 0)],
    ["Sumber Dana",         paket.sumberDana || "APBD"],
    ["Pelaksana",           paket.pelaksana || "-"],
    ["Kode Rekening",       paket.kodeRekening || paket.code || "-"],
  ];

  const rowH = totalH / tableData.length;

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: tableData.map((row) => [
      { content: row[0], styles: { fontStyle: "bold", cellWidth: 38 } },
      { content: row[1], styles: { cellWidth: tableColWidth - 38 } },
    ]),
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: { top: 0, bottom: 0, left: 2, right: 2 },
      valign: "middle",
      minCellHeight: rowH,
      lineColor: [0, 0, 139],
      lineWidth: 0.5,
      overflow: "linebreak",
    },
    columnStyles: {
      0: { fillColor: [255, 255, 255] },
      1: { fillColor: [255, 255, 255] },
    },
    margin: { left: tableX, right: margin },
    tableWidth: tableColWidth,
  });

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth / 2, pageHeight - 5, {
      align: "center",
    });
    doc.text(
      `Dicetak: ${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID")}`,
      pageWidth - margin,
      pageHeight - 5,
      { align: "right" },
    );
  }

  // Save PDF
  const fileName = `Laporan_${paket.code}_${new Date().getTime()}.pdf`;
  doc.save(fileName);

  return fileName;
};

// Helper function to get progress stages
const getProgressStages = (paket) => {
  const stages = [];
  const progressHistory = paket.progress || [];
  const documents = paket.documents || [];

  // Group documents by progress percentage
  const docsByProgress = documents.reduce((acc, doc) => {
    const key = doc.progressPercentage?.toString() || "other";
    if (!acc[key]) acc[key] = [];
    // Use full URL for images
    acc[key].push(`http://localhost:4000${doc.filepath}`);
    return acc;
  }, {});

  // If we have actual progress history, use that
  if (progressHistory.length > 0) {
    // Get first, middle, and last progress
    const sortedProgress = [...progressHistory].sort(
      (a, b) => new Date(a.tanggal) - new Date(b.tanggal),
    );

    if (sortedProgress.length === 1) {
      stages.push({
        percentage: sortedProgress[0].progres,
        nilaiRealisasi: sortedProgress[0].nilaiRealisasi,
        tanggal: sortedProgress[0].tanggal,
        keterangan: sortedProgress[0].keterangan,
        images: docsByProgress[sortedProgress[0].progres.toString()] || [],
      });
    } else if (sortedProgress.length === 2) {
      stages.push({
        percentage: sortedProgress[0].progres,
        nilaiRealisasi: sortedProgress[0].nilaiRealisasi,
        tanggal: sortedProgress[0].tanggal,
        keterangan: sortedProgress[0].keterangan,
        images: docsByProgress[sortedProgress[0].progres.toString()] || [],
      });
      stages.push({
        percentage: sortedProgress[1].progres,
        nilaiRealisasi: sortedProgress[1].nilaiRealisasi,
        tanggal: sortedProgress[1].tanggal,
        keterangan: sortedProgress[1].keterangan,
        images: docsByProgress[sortedProgress[1].progres.toString()] || [],
      });
    } else {
      // First progress
      stages.push({
        percentage: sortedProgress[0].progres,
        nilaiRealisasi: sortedProgress[0].nilaiRealisasi,
        tanggal: sortedProgress[0].tanggal,
        keterangan: sortedProgress[0].keterangan,
        images: docsByProgress[sortedProgress[0].progres.toString()] || [],
      });

      // Middle progress
      const midIndex = Math.floor(sortedProgress.length / 2);
      stages.push({
        percentage: sortedProgress[midIndex].progres,
        nilaiRealisasi: sortedProgress[midIndex].nilaiRealisasi,
        tanggal: sortedProgress[midIndex].tanggal,
        keterangan: sortedProgress[midIndex].keterangan,
        images:
          docsByProgress[sortedProgress[midIndex].progres.toString()] || [],
      });

      // Last progress
      stages.push({
        percentage: sortedProgress[sortedProgress.length - 1].progres,
        nilaiRealisasi:
          sortedProgress[sortedProgress.length - 1].nilaiRealisasi,
        tanggal: sortedProgress[sortedProgress.length - 1].tanggal,
        keterangan: sortedProgress[sortedProgress.length - 1].keterangan,
        images:
          docsByProgress[
            sortedProgress[sortedProgress.length - 1].progres.toString()
          ] || [],
      });
    }
  } else {
    // Default stages: 0%, 50%, 100%
    stages.push({
      percentage: 0,
      nilaiRealisasi: 0,
      tanggal: paket.tanggalMulai || new Date(),
      keterangan: "Awal Pekerjaan",
      images: docsByProgress["0"] || [],
    });
    stages.push({
      percentage: 50,
      nilaiRealisasi: paket.nilai * 0.5,
      tanggal: new Date(),
      keterangan: "Progres Setengah",
      images: docsByProgress["50"] || [],
    });
    stages.push({
      percentage: 100,
      nilaiRealisasi: paket.nilai,
      tanggal: paket.tanggalSelesai || new Date(),
      keterangan: "Selesai",
      images: docsByProgress["100"] || [],
    });
  }

  return stages;
};

// Generate individual progress stage PDF
export const generateProgressStagePDF = (paket, progressStage, images = []) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("LAPORAN REALISASI FISIK", pageWidth / 2, 15, { align: "center" });
  doc.text("KABUPATEN LAMONGAN", pageWidth / 2, 22, { align: "center" });

  let yPosition = 35;

  // Section Title
  doc.setFontSize(14);
  doc.text(`REALISASI ${progressStage}%`, pageWidth / 2, yPosition, {
    align: "center",
  });

  yPosition += 10;

  // Left side - Photos
  const photoSectionWidth = (pageWidth - margin * 3) * 0.6;
  const photoWidth = photoSectionWidth / 2 - 5;
  const photoHeight = 40;

  // Draw 6 photo placeholders (2x3 grid)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const x = margin + col * (photoWidth + 5);
      const y = yPosition + row * (photoHeight + 5);

      doc.setDrawColor(0, 0, 139);
      doc.setLineWidth(1);
      doc.rect(x, y, photoWidth, photoHeight);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);

      if (images[row * 2 + col]) {
        try {
          doc.addImage(
            images[row * 2 + col],
            "JPEG",
            x + 2,
            y + 2,
            photoWidth - 4,
            photoHeight - 4,
          );
        } catch (e) {
          doc.text(
            "FOTO TIDAK TERSEDIA",
            x + photoWidth / 2,
            y + photoHeight / 2,
            {
              align: "center",
            },
          );
        }
      } else {
        doc.text(
          "FOTO TIDAK TERSEDIA",
          x + photoWidth / 2,
          y + photoHeight / 2,
          {
            align: "center",
          },
        );
      }
    }
  }

  // Button
  const buttonY = yPosition + 3 * (photoHeight + 5) + 5;
  const buttonWidth = 60;
  const buttonHeight = 10;
  const buttonX = margin + photoSectionWidth / 2 - buttonWidth / 2;

  doc.setFillColor(200, 0, 0);
  doc.setDrawColor(139, 0, 0);
  doc.roundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 2, 2, "FD");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Gambar Realisasi ${progressStage}%`,
    buttonX + buttonWidth / 2,
    buttonY + 7,
    { align: "center" },
  );

  // Right side - Information Table
  const tableX = margin + photoSectionWidth + 10;
  const tableWidth = pageWidth - tableX - margin;

  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");

  const tableData = [
    ["OPD", paket.opd?.name || "-"],
    ["KEGIATAN", paket.kegiatan || "-"],
    ["LOKASI", paket.lokasi || "-"],
    ["Nomor Kontrak", paket.nomorKontrak || "-"],
    [
      "Tanggal",
      paket.tanggalMulai
        ? new Date(paket.tanggalMulai).toLocaleDateString("id-ID")
        : "00-00-0000",
    ],
    [
      "Nilai Kontrak",
      new Intl.NumberFormat("id-ID", {
        style: "decimal",
        minimumFractionDigits: 2,
      }).format((paket.nilai * progressStage) / 100 || 0),
    ],
    ["No SPMK", paket.noSPMK || "-"],
    [
      "Tgl Mulai Pekerjaan",
      paket.tanggalMulai
        ? new Date(paket.tanggalMulai).toLocaleDateString("id-ID")
        : "00-00-0000",
    ],
    [
      "Tanggal Akhir",
      paket.tanggalSelesai
        ? new Date(paket.tanggalSelesai).toLocaleDateString("id-ID")
        : "00-00-0000",
    ],
    [
      "Dana Pagu",
      new Intl.NumberFormat("id-ID", {
        style: "decimal",
        minimumFractionDigits: 2,
      }).format(paket.nilai || 0),
    ],
    ["Sumber Dana", paket.sumberDana || "BLUD"],
    ["Pelaksana", paket.pelaksana || "-"],
    ["Kode Rekening", paket.kodeRekening || paket.code || "-"],
  ];

  autoTable(doc, {
    startY: yPosition,
    startX: tableX,
    head: [],
    body: tableData.map((row) => [
      { content: row[0], styles: { fontStyle: "bold", cellWidth: 40 } },
      { content: row[1], styles: { cellWidth: tableWidth - 40 } },
    ]),
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [0, 0, 139],
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { fillColor: [255, 255, 255] },
      1: { fillColor: [255, 255, 255] },
    },
    margin: { left: tableX, right: margin },
    tableWidth: tableWidth,
  });

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(
    `Dicetak: ${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID")}`,
    pageWidth - margin,
    pageHeight - 5,
    { align: "right" },
  );

  const fileName = `Laporan_${paket.code}_${progressStage}persen_${new Date().getTime()}.pdf`;
  doc.save(fileName);

  return fileName;
};
