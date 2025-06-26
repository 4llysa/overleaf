const { callbackify } = require('util')
const { db } = require('../../infrastructure/mongodb')
const moment = require('moment')
const settings = require('@overleaf/settings')
const { promisifyAll } = require('@overleaf/promise-utils')
const {
  promises: InstitutionsAPIPromises,
} = require('../Institutions/InstitutionsAPI')
const InstitutionsHelper = require('../Institutions/InstitutionsHelper')
const Errors = require('../Errors/Errors')
const Features = require('../../infrastructure/Features')
const { Template } = require('../../models/Template')
const { normalizeQuery } = require('../Helpers/Mongo')

const TemplateGetter = {
    getTemplate(query, projection, callback){
        try {
            query = normalizeQuery(query)
            return db.templates.findOne(query, {projection}, callback)
        } catch (err) {
            return callback(err)
        }
    },

    getTemplateFeatures(TemplateId, callback) {
        this.getTemplate(TemplateId, { features: 1 }, (error, Template) => {
          if (error) return callback(error)
          if (!Template) return callback(new Errors.NotFoundError('Template not found'))
          callback(null, Template.features)
        })
      }
}
TemplateGetter.promises = promisifyAll(TemplateGetter, {})

module.exports = TemplateGetter