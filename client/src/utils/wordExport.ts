import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Header, Footer, ImageRun, PageNumber, NumberFormat, Table, TableRow, TableCell, WidthType, BorderStyle, TableLayoutType } from 'docx';
import { saveAs } from 'file-saver';
import { ExportConfig } from '~/hooks/useExportConfig';

export const exportToWord = async (content: string, config: ExportConfig) => {
    const {
        documentTitle,
        fontFamily,
        fontSize,
        margins,
        logoUrl,
        showPagination,
        coverTitle,
        messageTitle,
    } = config;

    // Convert margins from inches to twips (1 inch = 1440 twips)
    const marginTwips = margins * 1440;

    // --- Cover Page ---
    const coverChildren: Paragraph[] = [];

    // Add Logo if URL is provided
    if (logoUrl) {
        try {
            const imageResponse = await fetch(logoUrl);
            const imageBlob = await imageResponse.blob();
            const imageBuffer = await imageBlob.arrayBuffer();

            coverChildren.push(
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: new Uint8Array(imageBuffer),
                            transformation: {
                                width: 200,
                                height: 200,
                            },
                            type: 'png', // Assumed type for logo, required by types
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                })
            );
        } catch (error) {
            console.error('Error loading logo:', error);
        }
    }

    // Cover Title
    coverChildren.push(
        new Paragraph({
            text: coverTitle,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
            run: {
                font: fontFamily,
                size: fontSize * 2 * 2, // Half-points
                bold: true,
            },
        })
    );

    // Date
    coverChildren.push(
        new Paragraph({
            text: new Date().toLocaleDateString(),
            alignment: AlignmentType.CENTER,
            run: {
                font: fontFamily,
                size: fontSize * 2,
            },
        })
    );

    // --- Content Page ---
    const contentChildren: (Paragraph | Table)[] = [];

    // Message Title
    contentChildren.push(
        new Paragraph({
            text: messageTitle,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
            spacing: { after: 200 },
            run: {
                font: fontFamily,
                size: fontSize * 2 * 1.5,
                bold: true,
            },
        })
    );

    // Parse Markdown Content (Comprehensive parser)
    // Clean citation markers before processing
    const cleanCitations = content
        // Remove Unicode private use characters (citation markers) - actual characters
        .replace(/[\uE000-\uF8FF]/g, '')
        // Remove escaped unicode strings that might appear as text
        .replace(/\\ue2[0-9a-fA-F]{2}/g, '')
        // Remove standalone patterns like "turn0search7"
        .replace(/turn\d+(search|ref|image|news|video)\d+/g, '')
        // Clean up any remaining escaped unicode
        .replace(/\\u[eE][0-2][0-9a-fA-F]{2}/g, '');

    const lines = cleanCitations.split('\n');
    const contentElements: (Paragraph | Table)[] = [];

    let i = 0;
    let inTable = false;
    let inCodeBlock = false;
    let tableLines: string[] = [];

    // Helper function to parse inline formatting (bold, italic)
    const parseInline = (text: string): TextRun[] => {
        const runs: TextRun[] = [];
        const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                runs.push(new TextRun({
                    text: text.substring(lastIndex, match.index),
                    font: fontFamily,
                    size: fontSize * 2,
                }));
            }

            if (match[1]) {
                // **bold**
                runs.push(new TextRun({
                    text: match[2],
                    bold: true,
                    font: fontFamily,
                    size: fontSize * 2,
                }));
            } else if (match[3]) {
                // *italic*
                runs.push(new TextRun({
                    text: match[4],
                    italics: true,
                    font: fontFamily,
                    size: fontSize * 2,
                }));
            }

            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            runs.push(new TextRun({
                text: text.substring(lastIndex),
                font: fontFamily,
                size: fontSize * 2,
            }));
        }

        return runs.length > 0 ? runs : [new TextRun({ text, font: fontFamily, size: fontSize * 2 })];
    };

    // Helper to create table from markdown
    const createTable = (lines: string[]): Table | undefined => {
        const parsedRows: string[][] = [];
        let maxColumns = 0;

        // Identify separator line index if it exists
        const separatorIndex = lines.findIndex(line =>
            line.trim().match(/^\|?[\s\-:|]+\|?$/) && line.includes('-')
        );

        lines.forEach((line, index) => {
            // Skip separator line
            if (index === separatorIndex) {
                return;
            }

            // Remove outer pipes if present and split
            const cleanedLine = line.trim().replace(/^\||\|$/g, '');
            const cells = cleanedLine.split('|').map(cell => cell.trim());

            if (cells.length > 0) {
                if (cells.length > maxColumns) {
                    maxColumns = cells.length;
                }
                parsedRows.push(cells);
            }
        });

        if (parsedRows.length === 0 || maxColumns === 0) {
            return undefined;
        }

        const rows: TableRow[] = [];

        parsedRows.forEach(cells => {
            const rowCells: TableCell[] = [];

            // Add actual cells
            cells.forEach(cellText => {
                rowCells.push(new TableCell({
                    children: [new Paragraph({
                        children: parseInline(cellText),
                        alignment: AlignmentType.LEFT,
                    })],
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                }));
            });

            // Pad with empty cells if needed
            while (rowCells.length < maxColumns) {
                rowCells.push(new TableCell({
                    children: [new Paragraph({ text: '' })],
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                }));
            }

            rows.push(new TableRow({
                children: rowCells,
            }));
        });

        const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: "000000" };

        return new Table({
            rows,
            layout: TableLayoutType.FIXED,
            width: {
                size: 100,
                type: WidthType.PERCENTAGE,
            },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
        });
    };

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Check for Code Block toggle
        if (trimmed.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            // Finish table if we were in one
            if (inTable) {
                inTable = false;
                const table = createTable(tableLines);
                if (table) {
                    contentElements.push(table);
                }
                tableLines = [];
            }
            i++;
            continue;
        }

        // --- Code Block Processing ---
        if (inCodeBlock) {
            contentElements.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line, // Preserve indentation for code
                        font: 'Courier New',
                        size: fontSize * 2,
                    })
                ],
                spacing: { after: 0, before: 0 },
            }));
            i++;
            continue;
        }

        // --- Normal Markdown Processing ---

        // Detect table start
        if (trimmed.includes('|') && !inTable) {
            // Simple check: must look like a table row (has pipes)
            const pipeCount = (trimmed.match(/\|/g) || []).length;
            if (pipeCount >= 1) {
                inTable = true;
                tableLines = [trimmed];
                i++;
                continue;
            }
        }

        // Continue collecting table lines
        if (inTable) {
            if (trimmed.includes('|')) {
                tableLines.push(trimmed);
                i++;
                continue;
            } else {
                // Table ended
                inTable = false;
                const table = createTable(tableLines);
                if (table) {
                    contentElements.push(table);
                }
                tableLines = [];
                // Don't increment i, process this line normally
            }
        }

        // Process non-table lines
        let headingLevel: any = undefined;
        let text = trimmed;

        // Headings
        if (text.startsWith('# ')) {
            headingLevel = HeadingLevel.HEADING_1;
            text = text.substring(2);
        } else if (text.startsWith('## ')) {
            headingLevel = HeadingLevel.HEADING_2;
            text = text.substring(3);
        } else if (text.startsWith('### ')) {
            headingLevel = HeadingLevel.HEADING_3;
            text = text.substring(4);
        }

        // Horizontal separator
        if (text === '---' || text === '***' || text === '___') {
            contentElements.push(new Paragraph({
                text: '',
                border: {
                    bottom: {
                        color: '000000',
                        space: 1,
                        style: BorderStyle.SINGLE,
                        size: 6,
                    },
                },
                spacing: { before: 200, after: 200 },
            }));
            i++;
            continue;
        }

        // Empty line
        if (text === '') {
            contentElements.push(new Paragraph({ text: '' }));
            i++;
            continue;
        }

        // List items
        const bulletMatch = text.match(/^[-*+]\s+(.+)$/);
        const numberMatch = text.match(/^\d+\.\s+(.+)$/);

        if (bulletMatch) {
            contentElements.push(new Paragraph({
                children: parseInline(bulletMatch[1]),
                bullet: { level: 0 },
                spacing: { after: 100 },
            }));
            i++;
            continue;
        }

        if (numberMatch) {
            contentElements.push(new Paragraph({
                children: parseInline(numberMatch[1]),
                numbering: { reference: 'default-numbering', level: 0 },
                spacing: { after: 100 },
            }));
            i++;
            continue;
        }

        // Regular paragraph
        contentElements.push(new Paragraph({
            children: parseInline(text),
            heading: headingLevel,
            spacing: { after: 120 },
        }));

        i++;
    }

    // Add remaining table if any
    if (inTable && tableLines.length > 0) {
        const table = createTable(tableLines);
        if (table) {
            contentElements.push(table);
        }
    }

    // Convert to contentChildren
    contentElements.forEach(element => {
        contentChildren.push(element as any);
    });
    // --- Document Definition ---
    const doc = new Document({
        creator: 'LibreChat AI',
        title: documentTitle,
        numbering: {
            config: [
                {
                    reference: 'default-numbering',
                    levels: [
                        {
                            level: 0,
                            format: NumberFormat.DECIMAL,
                            text: '%1.',
                            alignment: AlignmentType.START,
                            style: {
                                paragraph: {
                                    indent: { left: 720, hanging: 360 },
                                },
                            },
                        },
                    ],
                },
            ],
        },
        sections: [
            // Section 1: Cover Page
            {
                properties: {
                    page: {
                        margin: {
                            top: marginTwips,
                            right: marginTwips,
                            bottom: marginTwips,
                            left: marginTwips,
                        },
                    },
                },
                children: coverChildren,
            },
            // Section 2: Content
            {
                properties: {
                    page: {
                        margin: {
                            top: marginTwips,
                            right: marginTwips,
                            bottom: marginTwips,
                            left: marginTwips,
                        },
                    },
                },
                headers: {
                    default: new Header({
                        children: [
                            new Paragraph({
                                text: documentTitle,
                                alignment: AlignmentType.RIGHT,
                                run: {
                                    font: fontFamily,
                                    size: 10 * 2,
                                    color: '888888',
                                },
                            }),
                        ],
                    }),
                },
                footers: showPagination
                    ? {
                        default: new Footer({
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({
                                            children: [PageNumber.CURRENT],
                                        }),
                                        new TextRun({
                                            text: ' / ',
                                        }),
                                        new TextRun({
                                            children: [PageNumber.TOTAL_PAGES],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    }
                    : undefined,
                children: contentChildren,
            },
        ],
    });

    // Generate and Download
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${documentTitle.replace(/\s+/g, '_')}.docx`);
};
