import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Header, Footer, ImageRun, PageNumber, NumberFormat, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
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
    const lines = content.split('\n');
    const contentElements: (Paragraph | Table)[] = [];

    let i = 0;
    let inTable = false;
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
    const createTable = (lines: string[]): Table => {
        const rows: TableRow[] = [];

        lines.forEach((line, index) => {
            // Skip separator line (|:--|:--:|--:|)
            if (index === 1 && line.includes('--')) {
                return;
            }

            const cells = line.split('|')
                .filter(cell => cell.trim() !== '')
                .map(cell => cell.trim());

            const tableCells = cells.map(cellText =>
                new TableCell({
                    children: [new Paragraph({
                        children: parseInline(cellText),
                    })],
                    width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
                })
            );

            rows.push(new TableRow({
                children: tableCells,
            }));
        });

        return new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
        });
    };

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Detect table start
        if (trimmed.includes('|') && !inTable) {
            inTable = true;
            tableLines = [trimmed];
            i++;
            continue;
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
                contentElements.push(createTable(tableLines));
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

        // Code blocks
        if (text.startsWith('```')) {
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
        contentElements.push(createTable(tableLines));
    }

    // Convert to contentChildren
    contentElements.forEach(element => {
        contentChildren.push(element as any);
    });
    // --- Document Definition ---
    const doc = new Document({
        creator: 'LibreChat AI',
        title: documentTitle,
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
