// Admin catalogue endpoints. Mounted behind requireAdmin in app.js.
const express = require('express')
const { asyncHandler } = require('../middleware/asyncHandler')

const LIFECYCLE_ACTIONS = ['publish', 'unpublish', 'archive', 'restore']

function createCatalogueAdminRouter(service) {
  const router = express.Router()

  router.get('/categories', asyncHandler(async (req, res) => {
    res.json(await service.listAdminCategories(req.query))
  }))
  router.post('/categories', asyncHandler(async (req, res) => {
    res.status(201).json(await service.createCategory(req.body, req.admin.id))
  }))
  router.get('/categories/:id', asyncHandler(async (req, res) => {
    res.json(await service.getAdminCategory(req.params.id))
  }))
  router.patch('/categories/:id', asyncHandler(async (req, res) => {
    res.json(await service.updateCategory(req.params.id, req.body, req.admin.id))
  }))
  for (const action of LIFECYCLE_ACTIONS) {
    router.post(`/categories/:id/${action}`, asyncHandler(async (req, res) => {
      res.json(await service.transitionCategory(req.params.id, action, req.admin.id))
    }))
  }

  router.get('/courses', asyncHandler(async (req, res) => {
    res.json(await service.listAdminCourses(req.query))
  }))
  router.post('/courses', asyncHandler(async (req, res) => {
    res.status(201).json(await service.createCourse(req.body, req.admin.id))
  }))
  router.get('/courses/:id', asyncHandler(async (req, res) => {
    res.json(await service.getAdminCourse(req.params.id))
  }))
  router.patch('/courses/:id', asyncHandler(async (req, res) => {
    res.json(await service.updateCourse(req.params.id, req.body, req.admin.id))
  }))
  for (const action of LIFECYCLE_ACTIONS) {
    router.post(`/courses/:id/${action}`, asyncHandler(async (req, res) => {
      res.json(await service.transitionCourse(req.params.id, action, req.admin.id))
    }))
  }

  return router
}

module.exports = { createCatalogueAdminRouter }
