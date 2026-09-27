import {
  createCampaign,
  listCampaigns,
  getCampaignById,
  updateCampaign,
  previewCampaignAudience,
  previewCampaignAudienceFilter,
  launchCampaign,
  cancelCampaign,
} from '../services/campaignService.js';

/**
 * Create campaign
 */
export async function create(req, res, next) {
  try {
    const campaign = await createCampaign(req.body);

    res.status(201).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List campaigns
 */
export async function list(req, res, next) {
  try {
    const result = await listCampaigns(req.query);

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get campaign by ID
 */
export async function getById(req, res, next) {
  try {
    const campaign = await getCampaignById(
      req.params.id
    );

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update campaign
 */
export async function update(req, res, next) {
  try {
    const campaign = await updateCampaign(
      req.params.id,
      req.body
    );

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Preview campaign audience
 */
export async function previewAudience(req, res, next) {
  try {
    const result = await previewCampaignAudience({
      audience: req.body?.audience || {},
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Preview audience for an unsaved campaign
 */
export async function previewAudienceFilter(
  req,
  res,
  next
) {
  try {
    console.log(
      '========== AUDIENCE PREVIEW DEBUG =========='
    );

    console.log(
      'RAW REQUEST BODY:',
      JSON.stringify(req.body, null, 2)
    );

    console.log(
      'AUDIENCE:',
      JSON.stringify(
        req.body?.audience || {},
        null,
        2
      )
    );

    const result =
      await previewCampaignAudienceFilter(
        req.body?.audience || {}
      );

    console.log(
      'AUDIENCE PREVIEW RESULT:',
      JSON.stringify(result, null, 2)
    );

    console.log(
      '============================================'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      'AUDIENCE PREVIEW ERROR:',
      error
    );

    next(error);
  }
}

/**
 * Launch campaign
 */
export async function launch(req, res, next) {
  try {
    const result = await launchCampaign(
      req.params.id
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel campaign
 */
export async function cancel(req, res, next) {
  try {
    const campaign = await cancelCampaign(
      req.params.id
    );

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
}