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
    const coverChildren: (Paragraph | Table)[] = [];

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
                            data: imageBuffer,
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

    // Parse Markdown Content (Simple Parser)
    const lines = content.split('\n');

    lines.forEach((line) => {
        let text = line.trim();
        let bold = false;
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

        // Bold (simple check for **text**)
        // Note: A robust parser would handle inline styles better, this is basic.
        // For now, we just treat the whole line as text.

        // Code blocks
        if (text.startsWith('```')) {
            return; // Skip code block markers for now, or handle them specially
        }

        if (text === '') {
            contentChildren.push(new Paragraph({ text: '' })); // Empty line
            return;
        }

        contentChildren.push(
            new Paragraph({
                text: text,
                heading: headingLevel,
                spacing: { after: 120 },
                run: {
                    font: fontFamily,
                    size: fontSize * 2,
                },
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
