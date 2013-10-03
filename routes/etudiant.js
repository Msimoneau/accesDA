var ObjectId = require('mongodb').ObjectID,
   check = require('validator').check;


/* APIs */
exports.chercherParId = function (db) {
   return function (req, res) {
      var id = req.params.id.toString();
      db.collection('dossiers', function (err, collection) {
         collection.findOne({ '_id': new ObjectId(id) }, function (err, item) {
            res.json(item);
         });
      });
   };
};

exports.chercher = function (db, limit) {
   return function (req, res) {
      var limitDoc = limit || 10,
         name = req.query.nom;
      db.collection('dossiers', function (err, collection) {
         if (name) {
            collection.find({"nomComplet": new RegExp(name, "i")}, {"nomComplet": 1, "codePerm": 1}).limit(limitDoc).toArray(function (err, items) {
               res.json(items);
            });
         } else {
            collection.find().limit(limitDoc).toArray(function (err, items) {
               res.json(items);
            });
         }
      });
   };
};

exports.ajouterEtudiant = function (db) {
   return function (req, res) {
      var etudiant = req.body;

      // Validation du code permanent.
      try {
         check(etudiant.codePerm, 'Code permanent invalide.').regex(/[a-zA-Z]{4}\d{8}/);
      } catch (e) {
         console.log(e.message); //Please enter a valid integer
         res.send('Erreur:' + JSON.stringify(e.message));
         return;
      }

      // Todo vérifier si _id et créer un ObjectId pour l'ajout.
      // Servira principalement pour les tests.
      db.collection('dossiers', function (err, collection) {
         collection.insert(etudiant, {safe: true}, function (err, result) {
            if (err) {
               res.send('Erreur:' + JSON.stringify(err));
            } else {
               res.send(result[0]);
            }
         });
      });
   };
};

exports.majEtudiant = function (db) {
   return function (req, res) {
      var id = req.params.id.toString(),
         etudiant = req.body;
      db.collection('dossiers', function (err, collection) {
         collection.update({'_id': new ObjectId(id)}, etudiant, {safe: true}, function (err, result) {
            if (err) {
               console.log("Erreur lors de la mise à jour de l'étudiant: " + err);
               res.send('Erreur:' + JSON.stringify(err));
            } else {
               res.send(result[0]);
            }
         });
      });
   };
};

exports.effacerEtudiant = function (db) {
   return function (req, res) {
      var id = req.params.id.toString();
      res.send(id);
      db.collection('dossiers', function (err, collection) {
         collection.remove({'_id': new ObjectId(id)}, {safe: true}, function (err, result) {
            if (err) {
               console.log("Erreur lors de l'effacement de l'étudiant: " + err);
               res.send('Erreur:' + JSON.stringify(err));
            } else {
               res.send(result[0]);
            }
         });
      });
   };
};

