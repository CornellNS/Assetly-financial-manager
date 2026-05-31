import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const outputPath = resolve("docs/Assetly_Etsy_Download_Instructions.pdf");
const pageWidth = 612;
const pageHeight = 792;
const margin = 56;
const maxWidth = pageWidth - margin * 2;
const downloadChooserUrl = "https://assetlymanager.online/#download";
const recoveryUrl = "https://assetlymanager.online/checkout/recover";
const privacyUrl = "https://assetlymanager.online/privacy";
const supportEmail = "support@assetlymanager.online";

const content = [
  { text: "Assetly Financial Manager", size: 10, font: "bold", color: "green", gapAfter: 10, caps: true },
  { text: "Thank you for buying Assetly Financial Manager.", size: 26, font: "bold", gapAfter: 10 },
  {
    text: "Assetly Financial Manager is desktop finance software for Windows desktops and Mac OS.",
    size: 13,
    gapAfter: 18,
  },
  { text: "Choose your desktop version", size: 16, font: "bold", gapAfter: 8 },
  {
    text: "Your app download is hosted securely through Assetly. Start here, choose Windows or macOS, then continue to Stripe checkout:",
    size: 12,
    gapAfter: 6,
  },
  { text: downloadChooserUrl, size: 12, font: "mono", color: "green", gapAfter: 20, link: downloadChooserUrl },
  { text: "How your Etsy purchase is delivered", size: 16, font: "bold", gapAfter: 8 },
  {
    text: "1. We generate a private Stripe promo code for your Etsy order.",
    size: 12,
    gapAfter: 4,
  },
  {
    text: "2. Your promo code will be delivered within the next 24 hours, and usually within 1 hour.",
    size: 12,
    gapAfter: 4,
  },
  {
    text: `3. When you receive the code, go to ${downloadChooserUrl}, choose Windows or macOS, enter your promo code at Stripe checkout, and complete checkout for $0.`,
    size: 12,
    gapAfter: 4,
  },
  {
    text: "4. After checkout is complete, Assetly will open the secure download page for the desktop app.",
    size: 12,
    gapAfter: 4,
  },
  {
    text: "5. After Assetly opens successfully, you can delete the downloaded ZIP or EXE installer from your Downloads folder to save space. Deleting that installer file will not uninstall Assetly.",
    size: 12,
    gapAfter: 20,
  },
  { text: "Need the download again later?", size: 16, font: "bold", gapAfter: 8 },
  { text: "After checkout, you can recover your download here:", size: 12, gapAfter: 6 },
  {
    text: recoveryUrl,
    size: 12,
    font: "mono",
    color: "green",
    link: recoveryUrl,
    gapAfter: 10,
  },
  {
    text: `Use the same email you used at Stripe checkout. If your email does not work yet, email ${supportEmail} with your Etsy order number and we will send your private download link.`,
    size: 12,
    color: "muted",
    gapAfter: 24,
  },
  { text: `Support: ${supportEmail}`, size: 11, color: "muted", gapAfter: 4 },
  {
    text: `Privacy Policy: ${privacyUrl}`,
    size: 11,
    color: "muted",
    link: privacyUrl,
    gapAfter: 0,
  },
];

function wrapText(text, size, font) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  const averageCharWidth = (font === "mono" ? 0.6 : 0.52) * size;
  const maxChars = Math.floor(maxWidth / averageCharWidth);

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines;
}

function escapePdfText(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function escapePdfUri(uri) {
  return escapePdfText(uri);
}

function fontName(font) {
  if (font === "bold") return "F2";
  if (font === "mono") return "F3";
  return "F1";
}

function colorCommand(color) {
  if (color === "green") return "0.12 0.44 0.26 rg";
  if (color === "muted") return "0.43 0.40 0.36 rg";
  return "0.14 0.13 0.11 rg";
}

function buildContentStream() {
  const commands = [];
  const links = [];
  let y = pageHeight - margin;

  for (const block of content) {
    const text = block.caps ? block.text.toUpperCase() : block.text;
    const lines = wrapText(text, block.size, block.font);
    const lineHeight = Math.ceil(block.size * 1.45);

    commands.push(colorCommand(block.color));
    commands.push(`/${fontName(block.font)} ${block.size} Tf`);

    for (const line of lines) {
      commands.push(`BT ${margin} ${y} Td (${escapePdfText(line)}) Tj ET`);
      if (block.link) {
        links.push({
          href: block.link,
          rect: [
            margin,
            y - Math.ceil(block.size * 0.25),
            Math.min(margin + estimateTextWidth(line, block.size, block.font), pageWidth - margin),
            y + lineHeight,
          ],
        });
      }
      y -= lineHeight;
    }

    y -= block.gapAfter ?? 0;
  }

  return {
    links,
    stream: commands.join("\n"),
  };
}

function estimateTextWidth(text, size, font) {
  return String(text).length * (font === "mono" ? 0.6 : 0.52) * size;
}

function pdfObject(id, value) {
  return `${id} 0 obj\n${value}\nendobj\n`;
}

function buildPdf() {
  const { links, stream } = buildContentStream();
  const firstAnnotationId = 8;
  const annotationRefs = links
    .map((_, index) => `${firstAnnotationId + index} 0 R`)
    .join(" ");
  const objects = [
    pdfObject(1, "<< /Type /Catalog /Pages 2 0 R >>"),
    pdfObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    pdfObject(
      3,
      [
        "<< /Type /Page",
        "/Parent 2 0 R",
        `/MediaBox [0 0 ${pageWidth} ${pageHeight}]`,
        "/Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >>",
        "/Contents 7 0 R",
        annotationRefs ? `/Annots [${annotationRefs}]` : "",
        ">>",
      ].filter(Boolean).join(" "),
    ),
    pdfObject(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
    pdfObject(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"),
    pdfObject(6, "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>"),
    pdfObject(7, `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`),
    ...links.map((link, index) =>
      pdfObject(
        firstAnnotationId + index,
        `<< /Type /Annot /Subtype /Link /Rect [${link.rect.join(" ")}] /Border [0 0 0] /A << /S /URI /URI (${escapePdfUri(link.href)}) >> >>`,
      ),
    ),
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += object;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, buildPdf());
console.log(outputPath);
