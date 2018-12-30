var express = require('express'),
    app = module.exports.app = express();
var http = require('http');
var dragdrop = require('./dragdrop');
var session = require('cookie-session'); // Charge le middleware de sessions
var bodyParser = require('body-parser'); // Charge le middleware de gestion des paramètres
var urlencodedParser = bodyParser.urlencoded({
    extended: false
});
var fs = require('fs');

var server = http.createServer(app);

/* here we use sessions */
app.use(session({
        secret: 'todotopsecret'
    }))


    /* S'il n'y a pas de todolist dans la session,
    on en crée une vide sous forme d'array avant la suite */
    .use(function (req, res, next) {
        if (typeof (req.session.todolist) == 'undefined') {
            req.session.todolist = [];
        }
        next();
    })

    /* On affiche la todolist et le formulaire */
    .get('/todo', function (req, res) {
        res.render('todo.ejs', {
            todolist: req.session.todolist
        });
    })

    /* On ajoute un élément à la todolist */
    .post('/todo/ajouter/', urlencodedParser, function (req, res) {
        if (req.body.newtodo != '') {
            req.session.todolist.push(req.body.newtodo);
        }
        res.redirect('/todo');
    })

    /* Supprime un élément de la todolist */
    .get('/todo/supprimer/:id', function (req, res) {
        if (req.params.id != '') {
            console.log(req.session.todolist);
            req.session.todolist.splice(req.params.id, 1);
        }
        res.redirect('/todo');
    })

    /* modifie un élément de la todolist */
    .post('/todo/modifier/:id', urlencodedParser, function (req, res) {
        if (req.params.id != '') {
            console.log(req.session.todolist[req.params.id]);
            req.session.todolist[req.params.id] = req.body.newtodo;
        }
        res.redirect('/todo');
    })

    /* On redirige vers la todolist si la page demandée n'est pas trouvée */
    .use(function (req, res, next) {
        console.log(dragdrop.drop);
        res.redirect('/todo');
    });


// Chargement de socket.io
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket, pseudo) {
    // Quand un client se connecte, on lui envoie un message
    socket.emit('message', 'Vous êtes bien connecté !');
    // On signale aux autres clients qu'il y a un nouveau venu
    socket.broadcast.emit('message', 'Un autre client vient de se connecter ! ');

    // Dès qu'on nous donne un pseudo, on le stocke en variable de session
    socket.on('petit_nouveau', function (pseudo) {
        socket.pseudo = pseudo;
    });

    // Dès qu'on reçoit un "message" (clic sur le bouton), on le note dans la console
    socket.on('message', function (message) {
        // On récupère le pseudo de celui qui a cliqué dans les variables de session
        console.log(socket.pseudo + ' me parle ! Il me dit : ' + message);
    });
});

server.listen(8080);