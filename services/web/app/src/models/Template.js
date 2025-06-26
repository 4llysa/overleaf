const mongoose = require('../infrastructure/Mongoose')

const { Schema } = mongoose

const TemplateSchema = new Schema(
  {
    id: {
        type: String,
        default: '',
    },
    templateName: {
      type: String,
      default: ''
    },
    owner: {
        type: String,
        default: ''
    },
    created: {
      type: Date,
      default() {
        return new Date()
      },
    },
    rev: { type: Number, default: 0 },
    linkedFileData: { type: Schema.Types.Mixed },
    hash: {
      type: String,
    },
  },
  { minimize: false }
)

exports.Template = mongoose.model('Template', TemplateSchema)
exports.TemplateSchema = TemplateSchema