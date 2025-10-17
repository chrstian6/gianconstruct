import { IInventory } from "@/types/Inventory";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PDFFormatterProps {
  inventoryItems: IInventory[];
  categoryStats: Array<{
    category: string;
    count: number;
    totalValue: number;
  }>;
  totalItems: number;
  inStockCount: number;
  restockNeededCount: number;
}

// Add jsPDF autoTable types
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
    autoTable: (options: any) => void;
  }
}

// Custom formatCurrency function for PDF
const formatCurrency = (amount: number): string => {
  return `PHP ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

// Generate uniform report ID: INV + MONTH ABBREV + DAY + 3 RANDOM DIGITS
const generateReportId = (): string => {
  const now = new Date();
  const monthAbbrev = now
    .toLocaleString("en", { month: "short" })
    .toUpperCase();
  const day = now.getDate().toString().padStart(2, "0");
  const randomDigits = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `INV${monthAbbrev}${day}${randomDigits}`;
};

// Format date as "Month DD, YYYY"
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export function PDFFormatter({
  inventoryItems,
  categoryStats,
  totalItems,
  inStockCount,
  restockNeededCount,
}: PDFFormatterProps) {
  const generatePDFFile = async (): Promise<Blob | null> => {
    if (inventoryItems.length === 0) return null;

    // Generate report ID and dates
    const reportId = generateReportId();
    const currentDate = new Date();

    // Calculate totals
    const totalInventoryValue = inventoryItems.reduce(
      (sum, item) => sum + item.quantity * (item.unitCost || 0),
      0
    );

    // Create PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ===== PROFESSIONAL BLACK & WHITE HEADER =====
    let currentY = 20;

    // Company Name - Bold
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("GIANCONSTRUCTION COMPANY", pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 8;

    // Address - Regular
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      "JY PEREZ AVENUE, KABANKALAN, PHILIPPINES 6111",
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 5;

    // Contact Info
    doc.setFontSize(9);
    doc.text(
      "Tel: 0908 982 1649 | Email: info@gianconstruct.com",
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 5;

    // Website
    doc.text("Website: www.gianconstruct.com", pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 15;

    // ===== INVENTORY REPORT TITLE - REGULAR FONT WEIGHT =====
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("INVENTORY REPORT", pageWidth / 2, currentY, { align: "center" });
    currentY += 10;

    // Horizontal line separator
    doc.setLineWidth(0.5);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 15;

    // ===== REPORT DETAILS =====
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Report Details", 14, currentY);
    currentY += 7;

    doc.setFont("helvetica", "normal");
    doc.text(`Report Date: ${formatDate(currentDate)}`, 20, currentY);
    currentY += 5;
    doc.text(`Report ID: ${reportId}`, 20, currentY);
    currentY += 5;
    doc.text(`Total Items: ${totalItems}`, 20, currentY);
    currentY += 5;
    doc.text(`In Stock: ${inStockCount}`, 20, currentY);
    currentY += 5;
    doc.text(`Restock Needed: ${restockNeededCount}`, 20, currentY);
    currentY += 5;
    doc.text(
      `Total Inventory Value: ${formatCurrency(totalInventoryValue)}`,
      20,
      currentY
    );
    currentY += 15;

    // ===== CATEGORY SUMMARY =====
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Category Summary", 14, currentY);
    currentY += 7;

    // Prepare category table data
    const categoryTableData = categoryStats.map((stat) => [
      stat.category,
      stat.count.toString(),
      formatCurrency(stat.totalValue),
    ]);

    // Add category summary table
    autoTable(doc, {
      startY: currentY,
      head: [["Category", "Item Count", "Total Value"]],
      body: categoryTableData,
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 9,
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [0, 0, 0],
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      styles: {
        cellPadding: 3,
        fontSize: 8,
        valign: "middle",
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      margin: { left: 14, right: 14 },
      tableLineWidth: 0.3,
      tableLineColor: [0, 0, 0],
    });

    // Get the final Y position after the category table
    let finalY = (doc as any).lastAutoTable.finalY + 15;

    // ===== DETAILED INVENTORY ITEMS TABLE =====
    if (finalY > pageHeight - 100) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Detailed Inventory Items", 14, finalY);
    finalY += 8;

    // Prepare detailed table data
    const detailedTableData = inventoryItems.map((item) => {
      const unitCost = item.unitCost || 0;
      const totalCost = item.quantity * unitCost;
      const reorderPoint = item.reorderPoint || 0;

      // Determine status
      let status = "In Stock";
      if (item.quantity === 0) status = "Out of Stock";
      else if (item.quantity <= reorderPoint) status = "Low Stock";

      return [
        item.sku,
        item.name,
        item.category,
        item.quantity.toString(),
        item.unit,
        formatCurrency(unitCost),
        formatCurrency(totalCost),
        status,
        item.location || "N/A",
        item.supplier || "N/A",
      ];
    });

    // Add detailed inventory table
    autoTable(doc, {
      startY: finalY,
      head: [
        [
          "SKU",
          "Item Name",
          "Category",
          "Qty",
          "Unit",
          "Unit Cost",
          "Total Cost",
          "Status",
          "Location",
          "Supplier",
        ],
      ],
      body: detailedTableData,
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 7,
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fontSize: 6,
        textColor: [0, 0, 0],
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      styles: {
        cellPadding: 2,
        fontSize: 6,
        valign: "middle",
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
        cellWidth: "wrap",
      },
      margin: { left: 14, right: 14 },
      tableLineWidth: 0.3,
      tableLineColor: [0, 0, 0],
    });

    // Get the final Y position after the detailed table
    finalY = (doc as any).lastAutoTable.finalY + 10;

    // ===== CLEAN PROFESSIONAL FOOTER =====
    if (finalY > pageHeight - 30) {
      doc.addPage();
      finalY = 20;
    }

    // Horizontal line
    doc.setLineWidth(0.5);
    doc.line(14, finalY, pageWidth - 14, finalY);
    finalY += 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Generated by GianConstruction Company", pageWidth / 2, finalY, {
      align: "center",
    });
    finalY += 5;
    doc.text(`Report ID: ${reportId}`, pageWidth / 2, finalY, {
      align: "center",
    });
    finalY += 5;
    doc.text(
      `Total Items: ${totalItems} | Total Value: ${formatCurrency(totalInventoryValue)}`,
      pageWidth / 2,
      finalY,
      {
        align: "center",
      }
    );

    // Generate PDF blob
    const pdfBlob = doc.output("blob");
    return pdfBlob;
  };

  // Function to export to PDF
  const exportToPDF = async () => {
    const pdfBlob = await generatePDFFile();
    if (!pdfBlob) return;

    const link = document.createElement("a");
    const url = URL.createObjectURL(pdfBlob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `GianConstruction-Inventory-Report-${generateReportId()}.pdf`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    generatePDFFile,
    exportToPDF,
  };
}
