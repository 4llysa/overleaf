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
const fse = require('fs-extra')
const path = require('path')

const templatePath = "/var/lib/overleaf/data/template_files/users/"

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
  },

  async getTemplateList(userId, callback) {
    const items = await fse.readdir(path.join(templatePath, userId))
    var names = {}
    for (const item in items){
      var project = TemplateGetter.getTemplate(item, {}, callback)
      if (project) {
            console.log("on a trouvé le nom ", project.name.toString())
            names[projectId] = project.name.toString();
          }
    }
    return names
  }
}
TemplateGetter.promises = promisifyAll(TemplateGetter, {})

module.exports = TemplateGetter