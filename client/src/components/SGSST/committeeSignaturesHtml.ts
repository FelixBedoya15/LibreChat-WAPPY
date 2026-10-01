/**
 * Client-side helper to dynamically build and replace the Committee Participants Signature section
 * inside an already-generated Official Acta Report HTML (COPASST / Convivencia),
 * so adding, removing, or signing participants updates the report immediately without regenerating AI content.
 */

export function buildCommitteeSignatureSectionClient(
  asistentes: any[] = [],
  tipoComite: 'copasst' | 'cocolab' | 'convivencia' = 'copasst',
): string {
  const list = Array.isArray(asistentes) ? asistentes.filter((a) => a.asistio !== false) : [];

  if (list.length === 0) {
    return `<!-- COMMITTEE_SIGNATURES_START -->
      <div data-committee-signatures="true" style="margin-top: 40px; padding: 20px; border: 1.5px dashed #cbd5e1; border-radius: 12px; text-align: center; color: #64748b; font-family: sans-serif;">
        <p style="margin: 0; font-size: 13px; font-weight: bold;">Sin participantes registrados o convocados en esta sesión.</p>
      </div>
    <!-- COMMITTEE_SIGNATURES_END -->`;
  }

  let cardsHtml = '';
  const cols = 2;

  for (let i = 0; i < list.length; i += cols) {
    const chunk = list.slice(i, i + cols);
    cardsHtml += '<tr>';
    for (let c = 0; c < cols; c++) {
      const a = chunk[c];
      if (a) {
        const hasSigned = Boolean(a.firma);
        const signedDate = a.firmadoEn ? new Date(a.firmadoEn).toLocaleDateString('es-CO') : '';
        const rolLabel = a.rol || 'Miembro del Comité';
        const signatureContent = hasSigned
          ? `<img src="${a.firma}" style="max-height: 65px; max-width: 90%; object-fit: contain; display: block; margin: 0 auto;" alt="Firma de ${a.nombre}" />`
          : `<div style="color: #94a3b8; font-size: 11px; font-style: italic; padding: 18px 0;">[ Pendiente de Firma Digital ]</div>`;

        const badgeHtml = hasSigned
          ? `<span style="display: inline-block; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">✓ Firmado Digitalmente ${signedDate ? `(${signedDate})` : ''}</span>`
          : `<span style="display: inline-block; background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">⏳ Firma Pendiente</span>`;

        cardsHtml += `
          <td style="width: 50%; vertical-align: top; padding: 8px; box-sizing: border-box;">
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.03); text-align: center; height: 100%; box-sizing: border-box;">
              <div style="min-height: 65px; display: flex; align-items: center; justify-content: center; border-bottom: 1.5px solid #0f766e; margin-bottom: 8px; background-color: #f8fafc; border-radius: 6px 6px 0 0; padding: 4px;">
                ${signatureContent}
              </div>
              <div>
                <div style="font-weight: 800; font-size: 12px; color: #0f172a; text-transform: uppercase; line-height: 1.2;">${a.nombre || 'Participante'}</div>
                <div style="font-weight: 700; font-size: 10.5px; color: #0f766e; margin-top: 3px;">${rolLabel}</div>
                <div style="font-size: 10px; color: #64748b; margin-top: 2px;">C.C. ${a.cedula || 'N/A'}${a.cargo ? ` • ${a.cargo}` : ''}</div>
                <div style="margin-top: 6px;">
                  ${badgeHtml}
                </div>
              </div>
            </div>
          </td>
        `;
      } else {
        cardsHtml += '<td style="width: 50%; padding: 8px;"></td>';
      }
    }
    cardsHtml += '</tr>';
  }

  const comiteNames: Record<string, string> = {
    copasst: 'Comité Paritario de Seguridad y Salud en el Trabajo (COPASST)',
    cocolab: 'Comité de Convivencia Laboral (COCOLAB)',
    convivencia: 'Comité de Convivencia Laboral (COCOLAB)',
    pesv: 'Comité de Seguridad Vial (CSV - PESV)',
    comite_pesv: 'Comité de Seguridad Vial (CSV - PESV)',
  };
  const nombreComiteFull = comiteNames[String(tipoComite).toLowerCase()] || 'Comité Paritario';

  return `<!-- COMMITTEE_SIGNATURES_START -->
<div data-committee-signatures="true" style="margin-top: 40px; font-family: sans-serif; page-break-inside: avoid;">
  <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f766e; padding-bottom: 8px; margin-bottom: 14px;">
    <div>
      <h3 style="margin: 0; font-size: 13px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px;">
        Firmas Digitales de los Miembros y Participantes Asistentes
      </h3>
      <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">
        ${nombreComiteFull}
      </p>
    </div>
    <div style="font-size: 10px; font-weight: 700; color: #0f766e; background-color: #f0fdfa; border: 1px solid #ccfbf1; padding: 4px 10px; border-radius: 9999px;">
      Total Convocados: ${list.length}
    </div>
  </div>

  <table style="width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed;">
    <tbody>
      ${cardsHtml}
    </tbody>
  </table>

  <div style="text-align: center; margin-top: 18px; font-size: 9.5px; color: #94a3b8; line-height: 1.4; border-top: 1px solid #f1f5f9; padding-top: 10px;">
    <strong>Certificación Electrónica:</strong> El presente documento y las firmas digitales de los asistentes estampadas desde sus portales personales gozan de plena validez conforme al <em>Decreto 1072 de 2015</em>. Los firmantes declaran haber revisado y aprobado el orden del día, los compromisos y el contenido íntegro del acta.
  </div>
</div>
<!-- COMMITTEE_SIGNATURES_END -->`;
}

export function syncCommitteeSignaturesInHtml(
  html: string,
  asistentes: any[] = [],
  tipoComite: 'copasst' | 'cocolab' | 'convivencia' | 'pesv' | 'comite_pesv' | string = 'copasst',
): string {
  if (!html || typeof html !== 'string') return html;
  const lower = String(tipoComite).toLowerCase();
  const normalizedTipo = lower.includes('pesv')
    ? 'pesv'
    : lower.includes('convivencia') || lower.includes('cocolab')
    ? 'convivencia'
    : 'copasst';
  const newSigHtml = buildCommitteeSignatureSectionClient(asistentes, normalizedTipo);

  // 1. Check explicit comment markers first
  if (/<!-- COMMITTEE_SIGNATURES_START -->[\s\S]*?<!-- COMMITTEE_SIGNATURES_END -->/.test(html)) {
    return html.replace(/<!-- COMMITTEE_SIGNATURES_START -->[\s\S]*?<!-- COMMITTEE_SIGNATURES_END -->/, newSigHtml);
  }

  // 2. Use DOMParser in browser to accurately locate and replace the signature container even after LiveEditor edits
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const placeholderToken = '___WAPPY_COMMITTEE_SIGNATURES_TOKEN___';
      const createTokenNode = () => {
        const marker = doc.createElement('div');
        marker.setAttribute('data-wappy-sig-token', placeholderToken);
        return marker;
      };
      const finalizeDoc = () => {
        const serialized = doc.body.innerHTML;
        return serialized.replace(
          /<div data-wappy-sig-token="___WAPPY_COMMITTEE_SIGNATURES_TOKEN___"><\/div>/,
          newSigHtml,
        );
      };

      // 2a. Explicit data attribute [data-committee-signatures="true"]
      const byAttr = doc.querySelector('[data-committee-signatures="true"]');
      if (byAttr && byAttr.parentNode) {
        byAttr.parentNode.replaceChild(createTokenNode(), byAttr);
        return finalizeDoc();
      }

      // 2b. Empty state ("Sin participantes registrados o convocados en esta sesión.")
      const allNodes = Array.from(doc.body.querySelectorAll('p, div, span'));
      const emptyLeaf = allNodes.find((el) => {
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text.includes('Sin participantes registrados o convocados')) return false;
        // Must be the innermost element containing this text
        const hasChildWithSameText = Array.from(el.children).some((c) =>
          (c.textContent || '').includes('Sin participantes registrados o convocados'),
        );
        return !hasChildWithSameText;
      });

      if (emptyLeaf) {
        let containerToReplace: Element = emptyLeaf;
        if (
          emptyLeaf.parentElement &&
          emptyLeaf.parentElement !== doc.body &&
          !emptyLeaf.parentElement.classList.contains('report-container') &&
          (emptyLeaf.parentElement.textContent || '').replace(/\s+/g, ' ').trim().length < 120
        ) {
          containerToReplace = emptyLeaf.parentElement;
        }
        if (containerToReplace.parentNode) {
          containerToReplace.parentNode.replaceChild(createTokenNode(), containerToReplace);
          return finalizeDoc();
        }
      }

      // 2c. Populated state ("Firmas Digitales de los Miembros y Participantes Asistentes")
      const sigHeading = allNodes.find((el) => {
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text.includes('Firmas Digitales de los Miembros y Participantes Asistentes')) return false;
        const hasChildWithSameText = Array.from(el.children).some((c) =>
          (c.textContent || '').includes('Firmas Digitales de los Miembros y Participantes Asistentes'),
        );
        return !hasChildWithSameText;
      });

      if (sigHeading) {
        let curr: HTMLElement | null = sigHeading.parentElement;
        let matchedBlock: HTMLElement | null = null;
        while (curr && curr !== doc.body) {
          const currText = curr.textContent || '';
          // Stop if we hit the outer report wrapper or main body sections
          if (
            curr.classList.contains('report-container') ||
            currText.includes('Constancia Reglamentaria de Aprobación y Cierre') ||
            currText.includes('Desarrollo de la Reunión')
          ) {
            break;
          }
          if (
            curr.tagName.toLowerCase() === 'div' &&
            (currText.includes('Certificación Electrónica') || curr.querySelector('table'))
          ) {
            matchedBlock = curr;
          }
          curr = curr.parentElement;
        }
        if (matchedBlock && matchedBlock.parentNode) {
          matchedBlock.parentNode.replaceChild(createTokenNode(), matchedBlock);
          return finalizeDoc();
        }
      }

      // 2d. If the report has "Constancia Reglamentaria de Aprobación y Cierre" but no signature block after it, append it
      const constanciaLeaf = allNodes.find((el) => {
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text.includes('Constancia Reglamentaria de Aprobación y Cierre')) return false;
        return !Array.from(el.children).some((c) =>
          (c.textContent || '').includes('Constancia Reglamentaria de Aprobación y Cierre'),
        );
      });
      if (constanciaLeaf) {
        let constanciaBox: HTMLElement | null = constanciaLeaf as HTMLElement;
        while (
          constanciaBox &&
          constanciaBox.parentElement &&
          constanciaBox.parentElement !== doc.body &&
          !constanciaBox.parentElement.classList.contains('report-container') &&
          (constanciaBox.parentElement.textContent || '').length < 700
        ) {
          constanciaBox = constanciaBox.parentElement;
        }
        if (constanciaBox && constanciaBox.parentNode) {
          const tokenNode = createTokenNode();
          if (constanciaBox.nextSibling) {
            constanciaBox.parentNode.insertBefore(tokenNode, constanciaBox.nextSibling);
          } else {
            constanciaBox.parentNode.appendChild(tokenNode);
          }
          return finalizeDoc();
        }
      }
    } catch (e) {
      console.warn('[syncCommitteeSignaturesInHtml] DOMParser fallback:', e);
    }
  }

  // 3. Regex fallbacks
  const emptyPattern = /<div[^>]*>\s*<p[^>]*>\s*Sin participantes registrados o convocados en esta sesi[oó]n\.?\s*<\/p>\s*<\/div>/i;
  if (emptyPattern.test(html)) {
    return html.replace(emptyPattern, newSigHtml);
  }

  return html;
}
