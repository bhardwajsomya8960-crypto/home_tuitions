// Public, read-only catalogue endpoints. Only published content is returned.
const express = require('express')
const { asyncHandler } = require('../middleware/asyncHandler')

function createCataloguePublicRouter(service) {
  const router = express.Router()

  router.get('/categories', asyncHandler(async (req, res) => {
    res.json(await service.listPublicCategories(req.query))
  }))

  router.get('/categories/:slug', asyncHandler(async (req, res) => {
    res.json(await service.getPublicCategory(req.params.slug))
  }))

  router.get('/courses', asyncHandler(async (req, res) => {
    res.json(await service.listPublicCourses(req.query))
  }))

  router.get('/courses/:slug', asyncHandler(async (req, res) => {
    res.json(await service.getPublicCourse(req.params.slug))
  }))

  return router
}

module.exports = { createCataloguePublicRouter }
