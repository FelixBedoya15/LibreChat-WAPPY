const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const CompanyInfo = require('~/models/CompanyInfo');
const PerfilSociodemograficoData = require('~/models/PerfilSociodemograficoData');
const { logger } = require('~/config');

const MAX_SYNC_SIGNATURE_CHARS = 1_500_000;
const MAX_CUSTOM_SIGNATURE_CHARS = 600_000;
const MAX_CUSTOM_SIGNATURES = 50;
const MAX_SIGNATURE_KEY_LENGTH = 160;

/**
 * Resolves ownerId (supporting sub-users via parentUser) and target CompanyInfo.
 * - Sub-users with `assignedCompany` are strictly restricted to that company.
 * - On GET (`strictRequestedMatch = false`), falls back to active company -> first company.
 * - On POST (`strictRequestedMatch = true`), if a valid `companyId` was explicitly provided
 *   and does not belong to `ownerId`, returns `info: null` rather than overwriting another company.
 */
async function resolveTargetCompany(req, rawCompanyId, { strictRequestedMatch = false } = {}) {
  const ownerId = String(req.user?.parentUser || req.user?.id || req.user?._id || '');
  if (!ownerId) {
    return { ownerId: '', info: null, forbidden: false };
  }

  const requestedId = typeof rawCompanyId === 'string' ? rawCompanyId.trim() : '';
  const hasValidRequestedId =
    Boolean(requestedId) && mongoose.Types.ObjectId.isValid(requestedId);

  if (req.user?.assignedCompany) {
    const assignedId = String(req.user.assignedCompany).trim();
    if (!mongoose.Types.ObjectId.isValid(assignedId)) {
      return { ownerId, info: null, forbidden: false };
    }
    if (strictRequestedMatch && hasValidRequestedId && requestedId !== assignedId) {
      return { ownerId, info: null, forbidden: true };
    }
    const assignedInfo = await CompanyInfo.findOne({
      _id: assignedId,
      user: ownerId,
    }).lean();
    return { ownerId, info: assignedInfo || null, forbidden: false };
  }

  if (hasValidRequestedId) {
    const requestedInfo = await CompanyInfo.findOne({
      _id: requestedId,
      user: ownerId,
    }).lean();
    if (requestedInfo || strictRequestedMatch) {
      return { ownerId, info: requestedInfo || null, forbidden: false };
    }
  }

  let info = await CompanyInfo.findOne({ user: ownerId, isActive: true }).lean();
  if (!info) {
    info = await CompanyInfo.findOne({ user: ownerId }).lean();
  }

  return { ownerId, info: info || null, forbidden: false };
}

/**
 * Fetches the PerfilSociodemograficoData document strictly scoped to `companyId`
 * (never mixing workers from other companies).
 */
async function findCompanySociodemografico(ownerId, companyId) {
  if (!PerfilSociodemograficoData) {
    return null;
  }
  if (companyId) {
    if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
      const byOwnerAndCompany = await PerfilSociodemograficoData.findOne({
        user: ownerId,
        companyId,
      }).lean();
      if (byOwnerAndCompany) {
        return byOwnerAndCompany;
      }
    }
    return PerfilSociodemograficoData.findOne({ companyId }).lean();
  }
  if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
    return PerfilSociodemograficoData.findOne({
      user: ownerId,
      $or: [{ companyId: null }, { companyId: { $exists: false } }],
    }).lean();
  }
  return null;
}

router.get('/', requireJwtAuth, async (req, res) => {
  try {
    const signatures = {};
    const { ownerId, info } = await resolveTargetCompany(req, req.query?.companyId, {
      strictRequestedMatch: false,
    });

    if (info) {
      // 1. Workers from PerfilSociodemograficoData strictly for this company
      const perfil = await findCompanySociodemografico(ownerId, info._id);
      if (perfil && Array.isArray(perfil.trabajadores)) {
        for (const worker of perfil.trabajadores) {
          if (
            worker &&
            worker.consentimientoFirmaDigital === 'Sí' &&
            typeof worker.firmaDigital === 'string' &&
            worker.firmaDigital &&
            typeof worker.nombre === 'string' &&
            worker.nombre.trim()
          ) {
            const workerKey = worker.nombre.trim().toUpperCase();
            if (worker.firmaDigital.length > MAX_SYNC_SIGNATURE_CHARS) {
              logger.warn(
                `[SGSST Signatures] Omitting oversized worker signature for "${workerKey}" (${worker.firmaDigital.length} chars) in company ${info._id}`,
              );
              continue;
            }
            signatures[workerKey] = worker.firmaDigital;
          }
        }
      }

      // 2. Official Legal Rep & SST Responsible signatures (with consent)
      if (
        info.legalRepConsent === 'Sí' &&
        typeof info.legalRepSignature === 'string' &&
        info.legalRepSignature &&
        typeof info.legalRepresentative === 'string' &&
        info.legalRepresentative.trim()
      ) {
        const repKey = info.legalRepresentative.trim().toUpperCase();
        if (info.legalRepSignature.length > MAX_SYNC_SIGNATURE_CHARS) {
          logger.warn(
            `[SGSST Signatures] Omitting oversized legalRepSignature (${info.legalRepSignature.length} chars) in company ${info._id}`,
          );
        } else {
          signatures[repKey] = info.legalRepSignature;
        }
      }

      if (
        info.sstRespConsent === 'Sí' &&
        typeof info.sstRespSignature === 'string' &&
        info.sstRespSignature &&
        typeof info.responsibleSST === 'string' &&
        info.responsibleSST.trim()
      ) {
        const sstKey = info.responsibleSST.trim().toUpperCase();
        if (info.sstRespSignature.length > MAX_SYNC_SIGNATURE_CHARS) {
          logger.warn(
            `[SGSST Signatures] Omitting oversized sstRespSignature (${info.sstRespSignature.length} chars) in company ${info._id}`,
          );
        } else {
          signatures[sstKey] = info.sstRespSignature;
        }
      }

      // 3. Custom signatures saved from LiveEditor for this company
      if (
        info.customSignatures &&
        typeof info.customSignatures === 'object' &&
        !Array.isArray(info.customSignatures)
      ) {
        for (const [rawKey, rawVal] of Object.entries(info.customSignatures)) {
          if (typeof rawKey !== 'string' || typeof rawVal !== 'string') {
            continue;
          }
          const cleanKey = rawKey.trim();
          if (!cleanKey || !rawVal.startsWith('data:image/')) {
            continue;
          }
          if (rawVal.length > MAX_SYNC_SIGNATURE_CHARS) {
            logger.warn(
              `[SGSST Signatures] Omitting oversized custom signature "${cleanKey}" (${rawVal.length} chars) in company ${info._id}`,
            );
            continue;
          }
          signatures[cleanKey] = rawVal;
        }
      }
    }

    return res.json({
      companyId: info?._id ? String(info._id) : null,
      signatures,
    });
  } catch (error) {
    logger.error('[SGSST Signatures] Fetch error:', error);
    return res.status(500).json({ error: 'Error fetching signatures' });
  }
});

router.post('/', requireJwtAuth, async (req, res) => {
  try {
    const incomingSignatures = req.body?.signatures;
    if (
      !incomingSignatures ||
      typeof incomingSignatures !== 'object' ||
      Array.isArray(incomingSignatures)
    ) {
      return res.status(400).json({ ok: false, error: 'Invalid signatures payload' });
    }

    const rawCompanyId = req.body?.companyId ?? req.query?.companyId;
    const { ownerId, info, forbidden } = await resolveTargetCompany(req, rawCompanyId, {
      strictRequestedMatch: true,
    });

    if (forbidden) {
      return res.status(403).json({ ok: false, persisted: false, error: 'Forbidden company scope' });
    }

    if (!info) {
      return res.json({ ok: true, persisted: false, companyId: null });
    }

    // Build canonical lookup for this company so we do not duplicate official/worker signatures into customSignatures
    const canonicalByUpperName = new Map();

    const perfil = await findCompanySociodemografico(ownerId, info._id);
    if (perfil && Array.isArray(perfil.trabajadores)) {
      for (const worker of perfil.trabajadores) {
        if (
          worker &&
          worker.consentimientoFirmaDigital === 'Sí' &&
          typeof worker.firmaDigital === 'string' &&
          worker.firmaDigital &&
          typeof worker.nombre === 'string' &&
          worker.nombre.trim()
        ) {
          canonicalByUpperName.set(worker.nombre.trim().toUpperCase(), worker.firmaDigital);
        }
      }
    }

    if (
      info.legalRepConsent === 'Sí' &&
      typeof info.legalRepSignature === 'string' &&
      info.legalRepSignature &&
      typeof info.legalRepresentative === 'string' &&
      info.legalRepresentative.trim()
    ) {
      canonicalByUpperName.set(info.legalRepresentative.trim().toUpperCase(), info.legalRepSignature);
    }

    if (
      info.sstRespConsent === 'Sí' &&
      typeof info.sstRespSignature === 'string' &&
      info.sstRespSignature &&
      typeof info.responsibleSST === 'string' &&
      info.responsibleSST.trim()
    ) {
      canonicalByUpperName.set(info.responsibleSST.trim().toUpperCase(), info.sstRespSignature);
    }

    const validCustomEntries = [];
    for (const [k, v] of Object.entries(incomingSignatures)) {
      if (typeof k !== 'string' || typeof v !== 'string') {
        continue;
      }
      const cleanKey = k.replace(/^\$+/, '').replace(/\0/g, '').trim();
      if (!cleanKey || cleanKey.length > MAX_SIGNATURE_KEY_LENGTH) {
        continue;
      }
      const trimmedVal = v.trim();
      if (!trimmedVal.startsWith('data:image/') || trimmedVal.length > MAX_CUSTOM_SIGNATURE_CHARS) {
        continue;
      }
      const canonicalVal = canonicalByUpperName.get(cleanKey.toUpperCase());
      if (canonicalVal && canonicalVal === trimmedVal) {
        continue;
      }
      validCustomEntries.push([cleanKey, trimmedVal]);
    }

    const cappedEntries =
      validCustomEntries.length > MAX_CUSTOM_SIGNATURES
        ? validCustomEntries.slice(-MAX_CUSTOM_SIGNATURES)
        : validCustomEntries;

    const sanitized = Object.fromEntries(cappedEntries);

    await CompanyInfo.updateOne(
      { _id: info._id, user: ownerId },
      { $set: { customSignatures: sanitized } },
    );

    return res.json({
      ok: true,
      persisted: true,
      companyId: String(info._id),
      savedCount: Object.keys(sanitized).length,
    });
  } catch (error) {
    logger.error('[SGSST Signatures] Save error:', error);
    return res.status(500).json({ error: 'Error saving signatures' });
  }
});

module.exports = router;
