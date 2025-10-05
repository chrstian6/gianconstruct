import { Design } from "@/types/design";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PDFFormatterProps {
  design: Design;
  selectedTerm: number;
  loanSummary: {
    totalInterest: number;
    totalAmountPaid: number;
    monthlyPayment: number;
    loanAmount: number;
  } | null;
  paymentSchedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
  downpaymentAmount: number;
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

// Custom formatCurrency function for PDF - using PHP instead of ₱
const formatCurrency = (amount: number): string => {
  return `PHP ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

// Generate uniform quotation ID: Q + MONTH ABBREV + DAY + 3 RANDOM DIGITS
const generateQuotationId = (): string => {
  const now = new Date();
  const monthAbbrev = now
    .toLocaleString("en", { month: "short" })
    .toUpperCase();
  const day = now.getDate().toString().padStart(2, "0");
  const randomDigits = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `Q${monthAbbrev}${day}${randomDigits}`;
};

// Format date as "Month DD, YYYY"
const formatDate = (date: Date): string => {
  return date.toLocaleString("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export function PDFFormatter({
  design,
  selectedTerm,
  loanSummary,
  paymentSchedule,
  downpaymentAmount,
}: PDFFormatterProps) {
  const generatePDFFile = async (): Promise<Blob | null> => {
    if (paymentSchedule.length === 0 || !loanSummary) return null;

    // Generate quotation ID and dates
    const quotationId = generateQuotationId();
    const currentDate = new Date();
    const validUntilDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Calculate display term
    const displayTerm =
      selectedTerm > 0
        ? design.loanTermType === "years"
          ? `${Math.round(selectedTerm / 12)} years`
          : `${selectedTerm} months`
        : "N/A";

    // Calculate downpayment percentage
    const downpaymentPercentage =
      design.price > 0 ? (downpaymentAmount / design.price) * 100 : 0;

    // Calculate total cost
    const totalCost = loanSummary.totalAmountPaid + downpaymentAmount;

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

    // ===== LOAN QUOTATION TITLE - REGULAR FONT WEIGHT =====
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal"); // Changed from bold to normal
    doc.text("LOAN QUOTATION", pageWidth / 2, currentY, { align: "center" });
    currentY += 10;

    // Horizontal line separator
    doc.setLineWidth(0.5);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 15;

    // ===== PROJECT DETAILS =====
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Project Details", 14, currentY);
    currentY += 7;

    doc.setFont("helvetica", "normal");
    doc.text(`Project: ${design.name}`, 20, currentY);
    currentY += 5;
    doc.text(`Quotation Date: ${formatDate(currentDate)}`, 20, currentY);
    currentY += 5;
    doc.text(`Quotation ID: ${quotationId}`, 20, currentY);
    currentY += 10;

    // ===== FINANCIAL DETAILS =====
    doc.setFont("helvetica", "bold");
    doc.text("Financial Details", 14, currentY);
    currentY += 7;

    const financialDetails = [
      `Total Project Price: ${formatCurrency(design.price)}`,
      `Downpayment Amount: ${formatCurrency(downpaymentAmount)} (${downpaymentPercentage.toFixed(1)}%)`,
      `Loan Amount: ${formatCurrency(loanSummary.loanAmount || design.price - downpaymentAmount)}`,
      `Loan Term: ${displayTerm}`,
      `Interest Rate: ${design.interestRate}% (${design.interestRateType || "yearly"})`,
      `Monthly Payment: ${formatCurrency(loanSummary.monthlyPayment)}`,
      `Total Interest: ${formatCurrency(loanSummary.totalInterest)}`,
      `Total Loan Payments: ${formatCurrency(loanSummary.totalAmountPaid)}`,
      `Total Project Cost: ${formatCurrency(totalCost)}`,
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    financialDetails.forEach((detail, index) => {
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(detail, 20, currentY + index * 5);
    });

    currentY += financialDetails.length * 5 + 15;

    // ===== PAYMENT SCHEDULE TABLE =====
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Payment Schedule", 14, currentY);
    currentY += 8;

    // Prepare table data
    const tableData = paymentSchedule.map((payment) => [
      payment.month.toString(),
      formatCurrency(payment.payment),
      formatCurrency(payment.principal),
      formatCurrency(payment.interest),
      formatCurrency(payment.balance),
    ]);

    // Add table with clean black & white styling
    autoTable(doc, {
      startY: currentY,
      head: [
        [
          "Month",
          "Payment (PHP)",
          "Principal (PHP)",
          "Interest (PHP)",
          "Remaining Balance (PHP)",
        ],
      ],
      body: tableData,
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

    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // ===== FINANCIAL SUMMARY =====
    if (finalY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    } else {
      currentY = finalY;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Financial Summary", 14, currentY);
    currentY += 7;

    const summaryDetails = [
      `Downpayment Paid: ${formatCurrency(downpaymentAmount)}`,
      `Total Loan Payments: ${formatCurrency(loanSummary.totalAmountPaid)}`,
      `Total Interest Paid: ${formatCurrency(loanSummary.totalInterest)}`,
      `Total Project Cost: ${formatCurrency(totalCost)}`,
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    summaryDetails.forEach((detail, index) => {
      doc.text(detail, 20, currentY + index * 5);
    });

    currentY += summaryDetails.length * 5 + 15;

    // ===== CLEAN PROFESSIONAL FOOTER =====
    if (currentY > pageHeight - 30) {
      doc.addPage();
      currentY = 20;
    }

    // Horizontal line
    doc.setLineWidth(0.5);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Generated by GianConstruction Company", pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 5;
    doc.text(`Quotation ID: ${quotationId}`, pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 5;
    doc.text(
      `Valid Until: ${formatDate(validUntilDate)}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
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
      `GianConstruction-Loan-Quotation-${generateQuotationId()}.pdf`
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
