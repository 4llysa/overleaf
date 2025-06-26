const logger = require('@overleaf/logger')
const util = require('util')
const { AffiliationError } = require('../Errors/Errors')
const Features = require('../../infrastructure/Features')
const { Template } = require('../../models/Template')

async function createNewTemplate(attributes, options = {}) {
    let template = Template()

    Object.assign(template, attributes)
    template = template.save()// ?

    return template
}

const TemplateCreator = {
  createNewTemplate: util.callbackify(createNewTemplate),
  promises: {
    createNewTemplate,
  },
}

module.exports = TemplateCreator