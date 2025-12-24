import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Alert, Platform } from "react-native";
import { getComparisonLogs } from "../database/queries";
import i18n from "../i18n"; // Import i18n instance

export interface ReportLesion {
  id: number;
  region: string;
  imageUri: string;
  date: string;
  createdAt?: string; // Added createdAt
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
  const lang = i18n.language === "tr" ? "tr-TR" : "en-US"; // Get current language for dates

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

  // Helper to safely parse date
  const safeDate = (dateStr: string | undefined, fallbackStr: string) => {
    try {
      // Prefer createdAt (ISO) if available, otherwise try parsing the fallback 'date' string
      const d = dateStr
        ? new Date(dateStr)
        : fallbackStr
          ? new Date(fallbackStr)
          : new Date();
      // Check for invalid date
      if (isNaN(d.getTime())) return fallbackStr || ""; // Return original string if parse failed
      return d.toLocaleDateString(lang);
    } catch (e) {
      return fallbackStr || "";
    }
  };

  // Date Formatting for Header (Report Date)
  const reportDate = new Date().toLocaleDateString(lang, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Translate Status helper
  const translateStatus = (status: string) => {
    // Assuming keys in i18n match status (IMPROVED, WORSENED, etc.)
    // But statuses are uppercase in DB usually?
    // Let's rely on compare_result translations which are lowercase keys mostly or implement mappings
    const key = status.toLowerCase();
    return i18n.exists(`compare_result.${key}`)
      ? i18n.t(`compare_result.${key}`)
      : status;
  };

  // Translate Risk Label
  const translateResultLabel = (label: string) => {
    const key = label.toLowerCase();
    return i18n.exists(`analysis_result.${key}`)
      ? i18n.t(`analysis_result.${key}`)
      : label;
  };

  // --- HTML HEADER ---
  const htmlHeader = `
    <div class="header-container">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 60%; vertical-align: top;">
             <h1 class="doc-title">${i18n.t("pdf_report.title")}</h1>
             <p class="doc-subtitle">${i18n.t("pdf_report.subtitle")}</p>
          </td>
          <td style="width: 40%; vertical-align: top; text-align: right;">
            <div class="meta-box">
               <p><strong>${i18n.t("pdf_report.date")}</strong> ${reportDate}</p>
               <p><strong>${i18n.t("pdf_report.patient_id")}</strong> GUEST-001</p>
               <p><strong>${i18n.t("pdf_report.region")}</strong> ${lesion.region}</p>
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
      <h3 class="section-header">${i18n.t("pdf_report.section_1_title")}</h3>
      
      <table class="assessment-table">
        <tr>
          <!-- Image Column -->
          <td style="width: 40%; padding-right: 20px; vertical-align: top;">
             <div class="img-frame">
               ${lesion.base64 ? `<img src="${lesion.base64}" class="clinical-image" />` : `<div class="no-image">${i18n.t("pdf_report.no_image")}</div>`}
               <p class="img-caption">${i18n.t("pdf_report.figure_1")} (${safeDate(lesion.createdAt, lesion.date)})</p>
             </div>
          </td>
          
          <!-- Data Column -->
          <td style="width: 60%; vertical-align: top;">
             <table class="data-table">
                <tr>
                   <td class="data-label">${i18n.t("pdf_report.ai_indication")}</td>
                   <td class="data-value ${isHighRisk ? "text-danger" : ""}">
                      ${translateResultLabel(lesion.resultLabel).toUpperCase()}
                   </td>
                </tr>
                <tr>
                   <td class="data-label">${i18n.t("pdf_report.confidence")}</td>
                   <td class="data-value">${(lesion.confidence * 100).toFixed(1)}%</td>
                </tr>
                 ${
                   lesion.diagnosis
                     ? `
                <tr>
                   <td class="data-label">${i18n.t("pdf_report.user_notes")}</td>
                   <td class="data-value">${lesion.diagnosis}</td>
                </tr>`
                     : ""
                 }
             </table>
             
             <div class="clinical-note">
               <strong>${i18n.t("pdf_report.note_label")}</strong> ${i18n.t("pdf_report.disclaimer_text")}
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
        <h3 class="section-header">${i18n.t("pdf_report.section_2_title")}</h3>
        <p class="section-intro">${i18n.t("pdf_report.section_2_intro")}</p>
        
        <table class="history-table">
          <thead>
            <tr>
              <th style="width: 20%">${i18n.t("pdf_report.table_date")}</th>
              <th style="width: 20%">${i18n.t("pdf_report.table_ref")}</th>
              <th style="width: 30%">${i18n.t("pdf_report.table_status")}</th>
              <th style="width: 30%">${i18n.t("pdf_report.table_score")}</th>
            </tr>
          </thead>
          <tbody>
            ${history
              .map(
                (log, index) => `
              <tr class="${index % 2 === 0 ? "row-even" : "row-odd"}">
                <td>${safeDate(log.createdAt, log.date)}</td>
                <td style="text-align: center;">
                  ${log.base64 ? `<img src="${log.base64}" class="history-thumb" />` : "N/A"}
                </td>
                <td>
                   <span class="status-text ${
                     log.status === "WORSENED"
                       ? "status-danger"
                       : "status-neutral"
                   }">
                     ${translateStatus(log.status)}
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
          ${i18n.t("pdf_report.footer")} <span class="page-number"></span>
        </div>
      </body>
    </html>
  `;
};
