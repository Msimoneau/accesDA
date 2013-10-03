var express    = require('express'),
   http        = require('http'),
   dossiers    = require('./routes/etudiant'),
   path        = require('path'),
   app         = express(),
   MongoClient = require('mongodb').MongoClient,
   Server      = require('mongodb').Server,
   daConf      = require('nconf');

// Organiser les arguments de la ligne de commande, les varaiables d'environnement
// et les préférences de l'application dans un seul objet daConf.
daConf.argv()
      .env()
      .file('file', { file: 'configApp.json' });

var mongoClient = new MongoClient(new Server(daConf.get('dbHost') || '127.0.0.1', daConf.get('dbPort') || 27017)),
   db = mongoClient.db(daConf.get('db'));

mongoClient.open(function (err, mongoClient) {
   if (err) {
      console.log("Erreur à l'ouverture de mongodb via mongojs." + err);
   }
});


// Dans tout les environnements.
app.set('port', daConf.get('PORT') || 3000);

// Mise en place des composantes, les objets requête et réponse
// sont passés d'une composante à l'autre.
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express['static'](path.join(__dirname, 'public'))); // JSLint. Syntaxe différence parce que static est un mot réservé.
app.use(app.router);


// API pour l'accès au dossier académique.
app.get('/etudiants/:id', dossiers.chercherParId(db));
app.get('/etudiants', dossiers.chercher(db, 10));
app.post('/etudiants', dossiers.ajouterEtudiant(db));
app.put('/etudiants/:id', dossiers.majEtudiant(db));
app['delete']('/etudiants/:id', dossiers.effacerEtudiant(db));


// L'environnement de développement.
if ('development' === app.get('env')) {
   app.use(express.errorHandler({dumpExceptions : true, showStack : true}));
}

// L'environnement de production.
if ('production' === app.get('env')) {
   app.use(express.errorHandler());
}

http.createServer(app).listen(app.get('port'), function () {
   console.log('Express écoute sur le port ' + app.get('port') + '.');
});

