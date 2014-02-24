/*jslint indent:3     */
/*jshint strict: true */
'use strict';

var express       = require('express'),
   http           = require('http'),
   dossiers       = require('./routes/etudiant'),
   amqp           = require('./modules/releves'),
   path           = require('path'),
   app            = express(),
   MongoClient    = require('mongodb').MongoClient,
   Server         = require('mongodb').Server,
   daConf         = require('nconf'),
   mongoClient,
   db,
   redisClient    = require('redis').createClient(),
   RedisStore     = require('connect-redis')(express),
   log            = require('npmlog'),
   passport       = require('passport'),
   GoogleStrategy = require('passport-google').Strategy,
   hostname       = 'localhost', //require('os').hostname(),
   port           = 3000;

// Organiser les arguments de la ligne de commande, les variables d'environnement
// et les préférences de l'application dans un seul objet daConf.
daConf.argv()
      .env()
      .file('file', { file: 'configApp.json' });

mongoClient = new MongoClient(new Server(daConf.get('dbHost') || '127.0.0.1', daConf.get('dbPort') || 27017));
db = mongoClient.db(daConf.get('db'));


passport.serializeUser(function (user, done) {
   done(null, user.identifier);
});
passport.deserializeUser(function (id, done) {
   done(null, { identifier: id });
});

passport.use(new GoogleStrategy({
   returnURL: 'http://' + hostname + ':' + port + '/auth/google/return',
   //returnURL: 'http://localhost:3000/auth/google/return',
   realm: 'http://' + hostname + ':' + port  + '/'
   //realm: 'http://localhost:3000/'
},
   function (identifier, profile, done) {
      profile.identifier = identifier;
      console.log(identifier);
      return done(null, profile);
   })
   );


//Cette ressource est essentielle pour l’exécution de l’application.
mongoClient.open(function (err) {
   if (err) {
      console.log('Erreur à l\'ouverture de mongodb via mongojs.' + err);
      process.exit(1);
   }
});

// Dans tout les environnements.
app.set('port', port);


app.use(express.cookieParser());
app.use(express.session({
   secret: 'la\'application est en route',
   store: new RedisStore({
      client: redisClient
   })
}));
app.use(passport.initialize());
app.use(passport.session());



// Mise en place des composantes, les objets requête et réponse
// sont passés d'une composante à l'autre.
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express['static'](path.join(__dirname, 'public'))); // JSLint. Syntaxe différence parce que static est un mot réservé.
app.use(app.router);



app.get('/auth/google/:return?', passport.authenticate('google', { successRedirect: '/index2.html' }));
app.get('/auth/logout', function (req, res) {
   req.logout();
   res.redirect('/');
});

const authed = function(req, res, next) {
   if (req.isAuthenticated()) {
     return next();
   } else if (redisClient.ready) {
      res.json(403, {
         error: "forbidden",
         reason: "not_authenticated"
      });
   } else {
      res.json(503, {
         error: "service_unavailable",
         reason: "authentication_unavailable"
      });
   }
};



// API pour l'accès au dossier.
app.get('/etudiants/:id', dossiers.chercherParId(db));
app.get('/etudiants', authed, dossiers.chercher(db, 10));
app.post('/etudiants', dossiers.ajouterEtudiant(db));
app.put('/etudiants/:id', dossiers.majEtudiant(db));
app['delete']('/etudiants/:id', dossiers.effacerEtudiant(db));

// Acces au relevé de notes
app.get('/etudiants/releve/:id', amqp.reqrep());


// L'environnement de développement.
if ('development' === app.get('env')) {
   app.use(express.errorHandler({dumpExceptions : true, showStack : true}));
}

// L'environnement de production.
if ('production' === app.get('env')) {
   app.use(express.errorHandler());
}

redisClient
   .on('ready', function () { log.info('REDIS', 'ready'); })
   .on('error', function (err) { log.error('REDIS', err.message); });


http.createServer(app).listen(app.get('port'), function () {
   console.log('Express écoute sur le port ' + app.get('port') + '.');
   console.log('hostname:' + hostname );
   console.log('port:' + port);

});

