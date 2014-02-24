/*jslint indent:3     */
/*jshint strict: true */

'use strict';

var amqp = require('amqp');
var connection = amqp.createConnection('amqp://guest:guest@localhost:5672');

connection.on('ready', function (err) {
   console.log('près');
});

exports.reqrep = function (){
   return function (req, res) {

      connection.publish('releve_notes_requete9', 'ABDA01527605 3857');

      connection.queue('releve_notes_reponse9', {autoDelete: false}, function (queue) {
         queue.subscribe(function (messageReceived) {
            res.json(messageReceived.data);
            console.log('Réception du ALPHA:  \n' + messageReceived.data);
         });
      });
   
   };
};
