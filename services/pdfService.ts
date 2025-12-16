import { jsPDF } from "jspdf";
import { Activity, PictogramData } from "../types";
import { getArasaacImageUrl } from "./arasaacService";

// Helper to load image from URL and convert to Base64 (handling CORS)
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string | null> => {
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    const blob = await res.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading image for PDF:", error);
    return null;
  }
};

export const exportScheduleToPDF = async (
  title: string,
  activities: Activity[],
  pictograms: PictogramData[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // --- Header ---
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text(title, pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text("Mi Agenda Visual - Rutina Offline", pageWidth / 2, 28, { align: "center" });
  doc.line(10, 32, pageWidth - 10, 32);

  // --- Grid Configuration ---
  const startY = 40;
  const margin = 10;
  const colCount = 3; // 3 items per row
  const boxWidth = (pageWidth - (margin * 2) - ((colCount - 1) * 5)) / colCount;
  const boxHeight = 60; // Enough for image + text
  const gap = 5;

  let currentX = margin;
  let currentY = startY;

  // Pre-load all images in parallel
  const preparedActivities = await Promise.all(activities.map(async (act) => {
    const pic = pictograms.find(p => p.id === act.pictogramId);
    let imgData: string | null = null;
    let imgFormat = 'JPEG';

    if (pic) {
        let url = '';
        if (pic.customImageUrl) {
            url = pic.customImageUrl;
        } else if (pic.arasaacId) {
            url = getArasaacImageUrl(pic.arasaacId);
            imgFormat = 'PNG';
        }

        if (url) {
            imgData = await getBase64ImageFromUrl(url);
        }
    }

    return { ...act, pic, imgData, imgFormat };
  }));

  // --- Draw Items ---
  for (let i = 0; i < preparedActivities.length; i++) {
    const item = preparedActivities[i];
    
    // Check for new page
    if (currentY + boxHeight > doc.internal.pageSize.getHeight() - 10) {
      doc.addPage();
      currentY = 20; // Reset Y
    }

    // 1. Draw Container Box
    doc.setDrawColor(200); // Gray border
    doc.setLineWidth(0.5);
    // Determine background color based on period (light tint)
    let fillColor = [255, 255, 255]; // White default
    if (item.period === 'morning') fillColor = [255, 252, 235]; // Light Yellow
    else if (item.period === 'afternoon') fillColor = [255, 245, 235]; // Light Orange
    else if (item.period === 'evening') fillColor = [245, 240, 255]; // Light Purple

    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.rect(currentX, currentY, boxWidth, boxHeight, 'FD');

    // 2. Draw Checkbox (Circle) for offline tracking
    doc.circle(currentX + 8, currentY + 8, 3);
    doc.setDrawColor(150);

    // 3. Draw Time (Top Right)
    if (item.time) {
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.text(item.time, currentX + boxWidth - 5, currentY + 8, { align: "right" });
    }

    // 4. Draw Image (Centered)
    if (item.imgData) {
        const imgSize = 35;
        const imgX = currentX + (boxWidth - imgSize) / 2;
        const imgY = currentY + 12;
        try {
            doc.addImage(item.imgData, item.imgFormat, imgX, imgY, imgSize, imgSize);
        } catch (e) {
            // Fallback text if image fails
            doc.setFontSize(8);
            doc.text("(No Image)", currentX + boxWidth/2, currentY + 30, { align: 'center' });
        }
    }

    // 5. Draw Label (Bottom Center)
    const label = item.customLabel || item.pic?.label || "Actividad";
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    
    // Auto-split text if too long
    const splitTitle = doc.splitTextToSize(label.toUpperCase(), boxWidth - 6);
    // Center vertically in the bottom space
    doc.text(splitTitle, currentX + boxWidth / 2, currentY + 52, { align: "center" });
    doc.setFont("helvetica", "normal"); // Reset font

    // Move Cursor
    currentX += boxWidth + gap;
    
    // Check if row is full
    if ((i + 1) % colCount === 0) {
      currentX = margin;
      currentY += boxHeight + gap;
    }
  }

  // --- Save ---
  const safeFilename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`agenda_${safeFilename}.pdf`);
};
