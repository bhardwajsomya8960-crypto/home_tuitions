const { createContext } = require('../shared/context')
const { createRepository } = require('../db/repository')
const { createStorage } = require('../services/storage')
const geoService = require('../services/geo.service')
const { createLeadViews } = require('./leads/lead.views')
const { createLeadService } = require('./leads/lead.service')
const { createParentService } = require('./parents/parent.service')
const { createParentPortalService } = require('./parents/parentPortal.service')
const { createTutorService } = require('./tutors/tutor.service')
const { createTutorDocumentService } = require('./tutors/tutorDocument.service')
const { createTutorAdminService } = require('./tutors/tutorAdmin.service')
const { createTutorPortalService } = require('./tutors/tutorPortal.service')
const { createAssignmentService } = require('./assignments/assignment.service')
const { createDemoService } = require('./demos/demo.service')
const { createEnrolmentService } = require('./enrolments/enrolment.service')
const { createBillingService } = require('./billing/billing.service')
const { createReviewService } = require('./reviews/review.service')
const { createSettingsService } = require('./settings/settings.service')
const { createAuditService } = require('./audit/audit.service')
const { createDashboardService } = require('./dashboard/dashboard.service')
const { createCatalogueRepository } = require('./catalogue/catalogue.repository')
const { createCatalogueService } = require('./catalogue/catalogue.service')

// Builds every module service with its dependencies. Tests pass a fixed clock (`now`), a
// different storage driver or a stub geocoder; production uses the defaults.
function createServices({ repo = createRepository(), storage = createStorage(), geo = geoService, now, newId, catalogue } = {}) {
  const ctx = createContext({ repo, now, newId })
  const catalogueService = catalogue || createCatalogueService({ repo: createCatalogueRepository() })

  const views = createLeadViews(ctx)
  const leads = createLeadService(ctx, { views, geo })
  const parents = createParentService(ctx, { leads, catalogue: catalogueService })
  const tutors = createTutorService(ctx, { geo })
  const documents = createTutorDocumentService(ctx, { storage })
  const tutorAdmin = createTutorAdminService(ctx, { documents })
  const assignments = createAssignmentService(ctx)
  const billing = createBillingService(ctx)
  const enrolments = createEnrolmentService(ctx, { assignments, billing })
  const demos = createDemoService(ctx, { assignments })
  const reviews = createReviewService(ctx)
  const settings = createSettingsService(ctx)
  const audit = createAuditService(ctx)
  const dashboard = createDashboardService(ctx, { views })
  const parentPortal = createParentPortalService(ctx, { views, parents, assignments, enrolments, billing, demos })
  const tutorPortal = createTutorPortalService(ctx, { views, documents, assignments, enrolments })

  return {
    ctx, catalogue: catalogueService, views, leads, parents, parentPortal, tutors, documents, tutorAdmin, tutorPortal,
    assignments, demos, enrolments, billing, reviews, settings, audit, dashboard,
  }
}

module.exports = { createServices }
