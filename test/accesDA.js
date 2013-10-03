/*jslint */
/*global describe, it */

var app    = require('../app'),
   assert  = require('assert'),
   request = require('supertest');

describe('Test app', function () {

   'use strict';

   var url = 'http://localhost:3000',
      cId; // current id pour conserver le _id de l'étudiant qu'on manipule.


   /////////// ACCES WEB ///////////////////////////////////////////////////////////////////////
   describe('Accès Web', function () {
      it('GET /index.html devrait retourner le statut 200, le type de contenu html et «Bonjour Express!».', function (done) {
         request(url).get('/index.html')
            .expect('Content-Type', /html/)
            .expect(200)
            .expect(/Bonjour Express!/, done);
      });
   });


   /////////// API /////////////////////////////////////////////////////////////////////////////
   describe('Accès API', function () {

      it('GET /etudiants. Devrait retourner le statut 200 et un array de type json > 1.', function (done) {
         request(url).get('/etudiants/')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
               if (err) {
                  throw err;
               }
               assert(JSON.parse(res.text).length > 1);
               done();
            });
      });

      it('POST /etudiants. Test de la validation du code permanent. Ici le CP est invalide.', function (done) {
         var body = {
            codePerm : 'AA1=;&00gf000',
            nomComplet : 'Pas bon le CP',
            adresses : [{"rue" : "de l'erreur"}]
         };
         request(url).post('/etudiants').send(body)
            .expect(200)
            .end(function (err, res) {
               if (err) {
                  throw err;
               }
               assert(JSON.stringify(res.body) === '{}');
               done();
            });
      });

      it('POST /etudiants. Devrait ajouter un nouvel étudiant.', function (done) {
         var body = {
            codePerm : 'ZZZZ10000000',
            nomComplet : 'Joe',
            adresses : [{"rue" : "Berri"}]
         };
         request(url).post('/etudiants').send(body)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
               if (err) {
                  throw err;
               }
               assert(res.body._id.length === 24);
               cId = res.body._id;
               done();
            });
      });

      it('POST /etudiants. Tenter d\'ajouter un nouvel étudiant en double.', function (done) {
         var body = {
            codePerm : 'ZZZZ10000000',
            nomComplet : 'Joe',
            adresses : [{"rue" : "Berri"}]
         };
         request(url).post('/etudiants').send(body)
            .expect('Content-Type', /html/)
            .expect(200)
            .end(function (err, res) {
               if (err) {
                  throw err;
               }
               assert(JSON.stringify(res.body) === '{}');
               done();
            });
      });

      it('PUT /etudiants. Devrait modifier l\'étudiant nouvelement ajouté.', function (done) {
         var body = {
            codePerm : 'ZZZZ10000000',
            nomComplet : 'Joe Itel',
            adresses : [{"rue" : "Ste-Catherine"}]
         };
         request(url)
            .put('/etudiants/' + cId)
            .send(body)
            .expect(200)
            .end(function (err, res) {
               if (err) {
                  throw err;
               }
               done();
            });
      });

      it('GET /etudiants devrait récupérer l\'étudiant.', function (done) {
         request(url)
            .get('/etudiants/' + cId)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
               if (err) {
                  throw err;
               }
               assert(res.body.nomComplet === 'Joe Itel');
               done();
            });
      });

      it('DELETE /etudiants. Devrait effacer l\'étudiant.', function (done) {
         request(url)
            .del('/etudiants/' + cId)
            .expect(200)
            .end(function (err, res) {
               if (err) {
                  throw err;
               }
               done();
            });
      });

      it('GET /etudiants. Ne devrait pas récupérer l\'étudiant.', function (done) {
         request(url)
            .get('/etudiants/' + cId)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
               if (err) {
                  throw err;
               }
               assert(JSON.stringify(res.body) === '{}');
               done();
            });
      });
   }); // Accès API

});

