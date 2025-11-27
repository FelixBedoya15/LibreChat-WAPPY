import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Header, Footer, ImageRun, PageNumber, NumberFormat } from 'docx';
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
    // TODO: Fix ImageRun type compatibility issue
    // Temporarily disabled to prevent document corruption
    /*
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
    */

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
    const contentChildren: Paragraph[] = [];

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

    // Parse Markdown Content (Enhanced Parser)
    const lines = content.split('\n');

    let inCodeBlock = false;
    let listItems: string[] = [];
    let currentListType: 'bullet' | 'number' | null = null;

    const flushList = () => {
        if (listItems.length > 0 && currentListType) {
            // Add list items as separate paragraphs
            listItems.forEach((item, index) => {
                contentChildren.push(
                    new Paragraph({
                        text: item,
                        bullet: currentListType === 'bullet' ? { level: 0 } : undefined,
                        numbering: currentListType === 'number' ? { reference: 'default-numbering', level: 0 } : undefined,
                        spacing: { after: 100 },
                        run: {
                            font: fontFamily,
                            size: fontSize * 2,
                        },
                    })
                );
            });
            listItems = [];
            currentListType = null;
        }
    };

    const parseInlineFormatting = (text: string): TextRun[] => {
        const runs: TextRun[] = [];

        // Split by bold/italic markers while preserving the structure
        const parts: { text: string; bold?: boolean; italic?: boolean }[] = [];
        let currentText = text;

        // Match **bold**, *italic*, __bold__, _italic_, `code`
        const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(__)(.+?)(__)|(_(.+?)_)|(`(.+?)`)/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(currentText)) !== null) {
            // Add text before match
            if (match.index > lastIndex) {
                parts.push({ text: currentText.substring(lastIndex, match.index) });
            }

            if (match[1]) {
                // **bold**
                parts.push({ text: match[2], bold: true });
            } else if (match[3]) {
                // *italic*
                parts.push({ text: match[4], italic: true });
            } else if (match[5]) {
                // __bold__
                parts.push({ text: match[6], bold: true });
            } else if (match[8]) {
                // _italic_
                parts.push({ text: match[9], italic: true });
            } else if (match[10]) {
                // `code`
                parts.push({ text: match[11], bold: false, italic: false });
            }

            lastIndex = regex.lastIndex;
        }

        // Add remaining text
        if (lastIndex < currentText.length) {
            parts.push({ text: currentText.substring(lastIndex) });
        }

        // Convert parts to TextRuns
        parts.forEach(part => {
            if (part.text) {
                runs.push(
                    new TextRun({
                        text: part.text,
                        bold: part.bold,
                        italics: part.italic,
                        font: fontFamily,
                        size: fontSize * 2,
                    })
                );
            }
        });

        return runs.length > 0 ? runs : [new TextRun({ text, font: fontFamily, size: fontSize * 2 })];
    };

    lines.forEach((line, index) => {
        let text = line.trim();

        // Code block markers
        if (text.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            return;
        }

        // Skip content inside code blocks
        if (inCodeBlock) {
            contentChildren.push(
                new Paragraph({
                    text: line, // Preserve formatting
                    style: 'CodeBlock',
                    spacing: { after: 80 },
                    run: {
                        font: 'Courier New',
                        size: (fontSize - 1) * 2,
                    },
                })
            );
            return;
        }

        // Horizontal separator
        if (text === '---' || text === '___' || text === '***') {
            flushList();
            contentChildren.push(
                new Paragraph({
                    text: '',
                    border: {
                        bottom: {
                            color: 'auto',
                            space: 1,
                            style: 'single',
                            size: 6,
                        },
                    },
                    spacing: { before: 200, after: 200 },
                })
            );
            return;
        }

        // Headers
        let headingLevel: any = undefined;
        if (text.startsWith('# ')) {
            headingLevel = HeadingLevel.HEADING_1;
            text = text.substring(2);
            flushList();
        } else if (text.startsWith('## ')) {
            headingLevel = HeadingLevel.HEADING_2;
            text = text.substring(3);
            flushList();
        } else if (text.startsWith('### ')) {
            headingLevel = HeadingLevel.HEADING_3;
            text = text.substring(4);
            flushList();
        }

        // Lists
        const bulletMatch = text.match(/^[-*+]\s+(.+)$/);
        const numberMatch = text.match(/^\d+\.\s+(.+)$/);

        if (bulletMatch) {
            if (currentListType !== 'bullet') {
                flushList();
                currentListType = 'bullet';
            }
            listItems.push(bulletMatch[1]);
            return;
        } else if (numberMatch) {
            if (currentListType !== 'number') {
                flushList();
                currentListType = 'number';
            }
            listItems.push(numberMatch[1]);
            return;
        } else {
            flushList();
        }

        // Empty line
        if (text === '') {
            contentChildren.push(new Paragraph({ text: '' }));
            return;
        }

        // Regular paragraph with inline formatting
        const runs = parseInlineFormatting(text);

        contentChildren.push(
            new Paragraph({
                children: runs,
                heading: headingLevel,
                spacing: { after: 120 },
            })
        );
    });

    // Flush any remaining list
    flushList();
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
