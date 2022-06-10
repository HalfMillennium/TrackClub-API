const clubRoutes = require('../clubs');
const generalRoutes = require('./general');

const constructorMethod = (app) => {
  app.use('/', generalRoutes);
  app.use('/club', clubRoutes);

  app.use('*', (req, res) => {
    res.sendStatus(404);
  });
};

module.exports = constructorMethod;