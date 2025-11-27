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

    // Parse Markdown Content (Simple parser with bold support)
    const lines = content.split('\n');

    // Helper function to parse bold text in a line
    const parseBoldText = (text: string): (TextRun | string)[] => {
        const parts: (TextRun | string)[] = [];
        const boldRegex = /\*\*(.+?)\*\*/g;
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(text)) !== null) {
            // Add text before bold
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }
            // Add bold text
            parts.push(
                new TextRun({
                    text: match[1],
                    bold: true,
                    font: fontFamily,
                    size: fontSize * 2,
                })
            );
            lastIndex = boldRegex.lastIndex;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return parts.length > 0 ? parts : [text];
    };

    lines.forEach((line) => {
        let text = line.trim();
        let headingLevel: any = undefined;

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

        // Code blocks
        if (text.startsWith('```')) {
            return; // Skip code block markers
        }

        if (text === '') {
            contentChildren.push(new Paragraph({ text: '' })); // Empty line
            return;
        }

        // Parse bold text
        const parsedParts = parseBoldText(text);

        // Convert to children array
        const children: (TextRun | string)[] = parsedParts.map(part => {
            if (typeof part === 'string') {
                return new TextRun({
                    text: part,
                    font: fontFamily,
                    size: fontSize * 2,
                });
            }
            return part;
        });

        contentChildren.push(
            new Paragraph({
                children: children as TextRun[],
                heading: headingLevel,
                spacing: { after: 120 },
            })
        );
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
