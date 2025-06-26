const AuthenticationController = require('../Authentication/AuthenticationController')
const TemplatesController = require('./TemplatesController')
const TemplatesMiddleware = require('./TemplatesMiddleware')
const { RateLimiter } = require('../../infrastructure/RateLimiter')
const RateLimiterMiddleware = require('../Security/RateLimiterMiddleware')
const AnalyticsRegistrationSourceMiddleware = require('../Analytics/AnalyticsRegistrationSourceMiddleware')

const rateLimiter = new RateLimiter('create-project-from-template', {
  points: 20,
  duration: 60,
})

module.exports = {
  rateLimiter,
  apply(app) {
    app.get(
      '/project/new/template/:Template_version_id',
      (req, res, next) =>
        AnalyticsRegistrationSourceMiddleware.setSource(
          'template',
          req.params.Template_version_id
        )(req, res, next),
      TemplatesMiddleware.saveTemplateDataInSession,
      AuthenticationController.requireLogin(),
      TemplatesController.getV1Template,
      AnalyticsRegistrationSourceMiddleware.clearSource()
    );

    app.post(
      '/project/new/template',
      AuthenticationController.requireLogin(),
      RateLimiterMiddleware.rateLimit(rateLimiter),
      TemplatesController.createProjectFromV1Template
    );
    const validateImportTemplateRequest = (req, res, next) => {
      const { templateUrl } = req.body;
      if (!templateUrl || typeof templateUrl !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid or missing templateUrl' });
      }
      next();
    };
    const logImportTemplateRequest = (req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
      console.log(`Body: ${JSON.stringify(req.body)}`);
      next(); // Passe au middleware suivant
    };

    app.post(
      '/api/project/template/import',
      logImportTemplateRequest, // Journalise la requête
      AuthenticationController.requireLogin(), //Vérifie si l'utilisateur est connecté
      RateLimiterMiddleware.rateLimit(rateLimiter), //Limite le nombre de requêtes
      validateImportTemplateRequest, //Valide la requête
      TemplatesController.importTemplate //exécute la fonction importTemplate
    );
  },
}
