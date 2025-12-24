import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Alert, Platform } from "react-native";
import { getComparisonLogs } from "../database/queries";

export interface ReportLesion {
  id: number;
  region: string;
  imageUri: string;
  date: string;
  confidence: number;
  resultLabel: string;
  diagnosis?: string;
  description?: string;
}

// 1. Helper to load image as Base64 to ensure PDF rendering
const loadBase64 = async (uri: string): Promise<string> => {
  try {
    if (!uri) return "";
    // If it's already base64, return it
    if (uri.startsWith("data:image")) return uri;

    // Read file
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });

    return `data:image/jpeg;base64,${base64}`;
  } catch (e) {
    console.error("Failed to load image for PDF:", uri, e);
    return ""; // Return empty string so PDF doesn't crash, just shows broken link icon
  }
};

export const generateAndShareReport = async (lesion: ReportLesion) => {
  try {
    // 1. Fetch History
    const history = await getComparisonLogs(lesion.id);

    // 2. Pre-process Images to Base64 (Parallel)
    const baselineImagePromise = loadBase64(lesion.imageUri);
    // Limit to latest 5 comparisons to fit on pages nicelly for MVP?
    // Or just all. Let's do all.
    const historyImagesPromises = history.map((log: any) =>
      loadBase64(log.newImageUri)
    );

    const [baselineBase64, ...historyBase64s] = await Promise.all([
      baselineImagePromise,
      ...historyImagesPromises,
    ]);

    // Attach base64 to history items
    const historyWithImages = history.map((log: any, index: number) => ({
      ...log,
      base64: historyBase64s[index],
    }));

    // 3. Generate HTML
    const html = await generateReportHTML(
      { ...lesion, base64: baselineBase64 },
      historyWithImages
    );

    // 4. Print to File (PDF)
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 612, // Standard Letter width (72dpi)
      height: 792, // Standard Letter height
    });

    // 5. Share
    await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    Alert.alert("Error", "Failed to generate report.");
  }
};

const generateReportHTML = async (
  lesion: ReportLesion & { base64: string },
  history: any[]
) => {
  const isTimeline = history.length > 0;

  // Medical Color Palette
  const colors = {
    primary: "#0056b3", // Medical Blue
    secondary: "#6c757d", // Grey
    text: "#333333", // Dark Grey for text
    border: "#dee2e6",
    white: "#ffffff",
    danger: "#dc3545",
    success: "#28a745",
    warning: "#ffc107",
    background: "#f8f9fa",
  };

  const isHighRisk =
    lesion.resultLabel?.toLowerCase().includes("malignant") ||
    lesion.resultLabel?.toLowerCase().includes("suspicious");

  // Date Formatting
  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // --- HTML HEADER ---
  const htmlHeader = `
    <div class="header-container">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 60%; vertical-align: top;">
             <h1 class="doc-title">COMPARISON REPORT</h1>
             <p class="doc-subtitle">Dermatological Image Analysis</p>
          </td>
          <td style="width: 40%; vertical-align: top; text-align: right;">
            <div class="meta-box">
               <p><strong>Date:</strong> ${reportDate}</p>
               <p><strong>Patient ID:</strong> GUEST-001</p>
               <p><strong>Region:</strong> ${lesion.region}</p>
            </div>
          </td>
        </tr>
      </table>
    </div>
    <div class="separator-thick"></div>
  `;

  // --- CONTENT SECTION ---
  let contentHtml = "";

  // 1. BASELINE ASSESSMENT (Formal Layout)
  contentHtml += `
    <div class="section">
      <h3 class="section-header">1. CURRENT ASSESSMENT</h3>
      
      <table class="assessment-table">
        <tr>
          <!-- Image Column -->
          <td style="width: 40%; padding-right: 20px; vertical-align: top;">
             <div class="img-frame">
               ${lesion.base64 ? `<img src="${lesion.base64}" class="clinical-image" />` : '<div class="no-image">No Image</div>'}
               <p class="img-caption">Figure 1: Current Presentation (${new Date(lesion.date).toLocaleDateString()})</p>
             </div>
          </td>
          
          <!-- Data Column -->
          <td style="width: 60%; vertical-align: top;">
             <table class="data-table">
                <tr>
                   <td class="data-label">AI Indication:</td>
                   <td class="data-value ${isHighRisk ? "text-danger" : ""}">
                      ${lesion.resultLabel.toUpperCase()}
                   </td>
                </tr>
                <tr>
                   <td class="data-label">Confidence Index:</td>
                   <td class="data-value">${(lesion.confidence * 100).toFixed(1)}%</td>
                </tr>
                 ${
                   lesion.diagnosis
                     ? `
                <tr>
                   <td class="data-label">User Notes:</td>
                   <td class="data-value">${lesion.diagnosis}</td>
                </tr>`
                     : ""
                 }
             </table>
             
             <div class="clinical-note">
               <strong>Note:</strong> This report is generated by an AI automated system. 
               The results presented here are for informational purposes only and do not constitute a definitive medical diagnosis.
             </div>
          </td>
        </tr>
      </table>
    </div>
  `;

  // 2. TIMELINE SECTION (Formal Table)
  if (isTimeline) {
    contentHtml += `
      <div class="section">
        <h3 class="section-header">2. EVOLUTION HISTORY</h3>
        <p class="section-intro">Historical comparison of the lesion over time.</p>
        
        <table class="history-table">
          <thead>
            <tr>
              <th style="width: 20%">Date</th>
              <th style="width: 20%">Image Reference</th>
              <th style="width: 30%">Status Change</th>
              <th style="width: 30%">Similarity Score</th>
            </tr>
          </thead>
          <tbody>
            ${history
              .map(
                (log, index) => `
              <tr class="${index % 2 === 0 ? "row-even" : "row-odd"}">
                <td>${new Date(log.date).toLocaleDateString()}</td>
                <td style="text-align: center;">
                  ${log.base64 ? `<img src="${log.base64}" class="history-thumb" />` : "N/A"}
                </td>
                <td>
                   <span class="status-text ${
                     log.status === "WORSENED"
                       ? "status-danger"
                       : "status-neutral"
                   }">
                     ${log.status}
                   </span>
                </td>
                <td>${log.score.toFixed(0)}%</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: 'Times New Roman', Times, serif; 
            padding: 40px; 
            color: ${colors.text}; 
            -webkit-print-color-adjust: exact; 
            font-size: 12pt;
            line-height: 1.5;
          }
          
          /* Typography */
          h1, h2, h3 { font-family: 'Helvetica', Arial, sans-serif; margin: 0; color: ${colors.primary}; }
          .doc-title { font-size: 24pt; font-weight: bold; letter-spacing: 1px; }
          .doc-subtitle { font-size: 14pt; color: ${colors.secondary}; margin-top: 5px; }
          
          .section-header { 
            font-size: 14pt; 
            border-bottom: 2px solid ${colors.primary}; 
            padding-bottom: 5px; 
            margin-bottom: 15px; 
            text-transform: uppercase;
          }
          .section-intro { font-style: italic; color: ${colors.secondary}; font-size: 10pt; margin-bottom: 10px; }

          /* Layout Components */
          .header-container { margin-bottom: 20px; }
          .meta-box p { margin: 2px 0; font-family: 'Helvetica', Arial, sans-serif; font-size: 10pt; }
          .separator-thick { border-bottom: 4px solid ${colors.primary}; margin-bottom: 40px; }
          .section { margin-bottom: 40px; page-break-inside: avoid; }

          /* Assessment Table */
          .assessment-table { width: 100%; border-collapse: collapse; }
          .img-frame { border: 1px solid ${colors.border}; padding: 5px; background: ${colors.white}; display: inline-block; }
          .clinical-image { width: 250px; height: auto; display: block; }
          .img-caption { margin-top: 5px; font-size: 9pt; color: ${colors.secondary}; text-align: center; }

          /* Data Table */
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .data-table td { padding: 8px 0; border-bottom: 1px solid ${colors.border}; }
          .data-label { font-weight: bold; color: ${colors.secondary}; width: 140px; }
          .data-value { font-family: 'Helvetica', Arial, sans-serif; font-weight: 600; }
          .text-danger { color: ${colors.danger}; }

          .clinical-note { 
            background-color: ${colors.background}; 
            border-left: 3px solid ${colors.secondary}; 
            padding: 10px; 
            font-size: 9pt; 
            color: ${colors.text};
          }

          /* History Table */
          .history-table { width: 100%; border-collapse: collapse; font-family: 'Helvetica', Arial, sans-serif; font-size: 10pt; }
          .history-table th { 
            background-color: ${colors.primary}; 
            color: white; 
            padding: 8px; 
            text-align: left; 
            font-weight: 600; 
            text-transform: uppercase;
            font-size: 9pt;
          }
          .history-table td { padding: 8px; border-bottom: 1px solid ${colors.border}; vertical-align: middle; }
          .history-thumb { width: 40px; height: 40px; object-fit: cover; border: 1px solid ${colors.border}; }
          
          .row-even { background-color: ${colors.background}; }
          
          .status-text { font-weight: bold; }
          .status-danger { color: ${colors.danger}; }
          .status-neutral { color: ${colors.secondary}; }

          /* Footer */
          .footer { 
            position: fixed; 
            bottom: 20px; 
            left: 0; 
            right: 0; 
            text-align: center; 
            font-size: 8pt; 
            color: ${colors.secondary}; 
            border-top: 1px solid ${colors.border}; 
            padding-top: 10px; 
          }
          
          .page-number:after { content: counter(page); }
        </style>
      </head>
      <body>
        ${htmlHeader}
        ${contentHtml}

        <div class="footer">
          MelanoScan System Generated Report | Page <span class="page-number"></span>
        </div>
      </body>
    </html>
  `;
};
