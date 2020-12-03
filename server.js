//import { Promise } from 'mongoose';
//import { resolve } from 'url';

// ---------------------------------------------------------
//Para Variables environment
require('dotenv').config()
require('newrelic');

// ---------------------------------------------------------

//Import packages
var express = require('express');
var cors = require('cors')
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var apicache = require('apicache');

// ---------------------------------------------------------

//Import models
var livrosModel = require('./models/livros/livro');

// ---------------------------------------------------------

//Mongo DB
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
var timeout = process.env.TIMEOUT; // 30 minute;

var options = {
	server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } },
	replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }
};

//Conexão
var mongodbUri = process.env.DATABASE_URI;
var conn = mongoose.connection;
conn.openUri(mongodbUri, {
	keepAlive: 30000,
	connectTimeoutMS: 30000
});
conn.on('error', console.error.bind(console, 'connection error:'));
conn.once('open', function () { console.log("Stabilizing"); });

// ---------------------------------------------------------

//Logs
var winston = require('winston');
var mongoLog = require('winston-mongodb').MongoDB;

var logger = new (winston.Logger)();
logger.add(mongoLog, {
	db: mongodbUri,
	collection: 'logs',
	name: 'mongo.mainLogs'
}
);

// ---------------------------------------------------------
//Config Timeout, Token, Cors
app.set('superSecret', process.env.SECRET_TOKEN); // secret variable
app.set('superSecretPassword', process.env.SECRET_PASSWORD); // secret variable for password reset
var timeout = eval(process.env.TIMEOUT);

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// Enable All Cors Requests
app.use(cors())

// ---------------------------------------------------------

// Cache

let cache = apicache.middleware
let cacheTime = cache('5 minutes');

// ---------------------------------------------------------
//Route
var apiRoutes = express.Router();
// ---------------------------------------------------------

//Criar livro
apiRoutes.post('/Livros', function (req, res) {

	if (!req.body['titulo']) {
		return res.status(200).send({ success: false, message: 'Título não informado' });
	}
	if (!req.body['isbn']) {
		return res.status(200).send({ success: false, message: 'ISBN não informado' });
	}
	if (!req.body['autor']) {
		return res.status(200).send({ success: false, message: 'Autor não informado' });
	}
	if (!req.body['editora']) {
		return res.status(200).send({ success: false, message: 'Editora não informada' });
	}
	if (!req.body['ano']) {
		return res.status(200).send({ success: false, message: 'Ano não informado' });
	}
	if (!req.body['idioma']) {
		return res.status(200).send({ success: false, message: 'Idioma não informado' });
	}
	if (!req.body['peso']) {
		return res.status(200).send({ success: false, message: 'Peso não informado' });
	}
	if (!req.body['comprimento']) {
		return res.status(200).send({ success: false, message: 'Comprimento não informado' });
	}
	if (!req.body['largura']) {
		return res.status(200).send({ success: false, message: 'Largura não informada' });
	}
	if (!req.body['altura']) {
		return res.status(200).send({ success: false, message: 'Altura não informada' });
	}

	//Create object
	var livro = new livrosModel.Livros({
		titulo: req.body['titulo'],
		isbn: req.body['isbn'],
		autor: req.body['autor'],
		editora: req.body['editora'],
		ano: req.body['ano'],
		idioma: req.body['idioma'],
		peso: req.body['peso'],
		comprimento: req.body['comprimento'],
		largura: req.body['largura'],
		altura: req.body['altura'],
		busca: req.body['titulo'] + " " + req.body['isbn'] + " " + req.body['autor']
	});

	//Save
	livro.save(function (err) {
		//Verifica se existe erro
		if (err) {
			//400 - Bad Request
			console.log(err);
			return res.status(400).send({
				success: false,
				message: 'Erro ao incluir'
			});
		}
		//200 - Success 
		return res.status(200).send({
			success: true,
			message: 'Livro incluído com sucesso',
			list: livro
		});		
	});
});

//Busca livro
apiRoutes.get('/Livros/:id', cacheTime, (req, res) => {
	var id = req.params.id;
	livrosModel.Livros.findById(id, function (err, result) {
		if (result) {
			var livro = {
				"titulo": result.titulo,
				"isbn": result.isbn,
				"autor": result.autor,
				"editora": result.editora,
				"ano": result.ano,
				"idioma": result.idioma,
				"peso": result.peso,
				"comprimento": result.comprimento,
				"largura": result.largura,
				"altura": result.altura,
				"busca": result.titulo + " " + result.isbn + " " + result.autor	
			}
		}

		if (!livro) {
			return res.status(200).send(
				{
					success: false,
					livro: livro
				});
		}
		else {
			return res.status(200).send(
				{
					success: true,
					livro: livro
				});
		}

	});
});

//Livro id - Delete
apiRoutes.delete('/Livros/:id', function (req, res) {
	var id = req.params.id;
	livrosModel.Livros.findByIdAndDelete(id, function (err, livro) {
			if (err) {
				//400 - Bad Request
				return res.status(400).send({
					success: false,
					message: 'Erro ao excluir'
				});
			};

			if (!id) {
				//200 - Parametro não enviado
				return res.status(200).send({
					success: false,
					message: 'Erro ao excluir'
				});
			}
		});

		return res.status(200).send({
			success: true,
			message: 'Livro excluido com sucesso'
		});			
});

//Livros - Update
apiRoutes.put('/Livros/:id', function (req, res) {

	if (!req.body['titulo']) {
		return res.status(200).send({ success: false, message: 'Título não informado' });
	}
	if (!req.body['isbn']) {
		return res.status(200).send({ success: false, message: 'ISBN não informado' });
	}
	if (!req.body['autor']) {
		return res.status(200).send({ success: false, message: 'Autor não informado' });
	}
	if (!req.body['editora']) {
		return res.status(200).send({ success: false, message: 'Editora não informada' });
	}
	if (!req.body['ano']) {
		return res.status(200).send({ success: false, message: 'Ano não informado' });
	}
	if (!req.body['idioma']) {
		return res.status(200).send({ success: false, message: 'Idioma não informado' });
	}
	if (!req.body['peso']) {
		return res.status(200).send({ success: false, message: 'Peso não informado' });
	}
	if (!req.body['comprimento']) {
		return res.status(200).send({ success: false, message: 'Comprimento não informado' });
	}
	if (!req.body['largura']) {
		return res.status(200).send({ success: false, message: 'Largura não informada' });
	}
	if (!req.body['altura']) {
		return res.status(200).send({ success: false, message: 'Altura não informada' });
	}

	var id = req.params.id;
	livrosModel.Livros.findById(id, function (err, livro) {
			if (err) {
				//400 - Bad Request
				logger.log('error', req.connection.remoteAddress, 'Livros/Edit', err, function () { });
				return res.status(400).send({
					success: false,
					message: "Erro ao carregar o livro"
				});
			};

			livro.titulo = req.body['titulo'];
			livro.isbn = req.body['isbn'];
			livro.autor = req.body['autor'];
			livro.editora = req.body['editora'];
			livro.ano = req.body['ano'];
			livro.idioma = req.body['idioma'];
			livro.peso = req.body['peso'];
			livro.comprimento = req.body['comprimento'];
			livro.largura = req.body['largura'];
			livro.altura = req.body['altura'];
			livro.busca = req.body['titulo'] + " " + req.body['isbn'] + " " + req.body['autor'];	
			//Salva objeto
			livro.save(function (err) {
				if (err) {
					//400 - Bad Request
					console.log(err);
					return res.status(400).send({
						success: false,
						message: 'Erro ao alterar'
					});
				}
				//200 - Success 
				return res.status(200).send({
					success: true,
					message: 'Livro alterado com sucesso',
					list: livro
				});
			});			
		});
});

//Livros Search
apiRoutes.get('/Livros', function (req, res) {

	//Paginação
	var skip = eval(req.query['skipcount']);
	var take = eval(req.query['maxresultcount']);

	//Outros parâmetros
	var busca = req.query['busca'];
	var anoinicial = req.query['anoinicial'];
	var anofinal = req.query['anofinal'];
	var sort = req.query['sorting'];
	var query = {};
	if (busca) {
		query["busca"] = { "$regex": busca, "$options": "i" };
	}

	if (!anoinicial) {
		anoinicial = 0;
	}

	if (!anofinal) {
		anofinal = 9999;
	}

	//Count Consulta
	var count = 0;
	livrosModel.Livros.find({busca : new RegExp(busca),  ano: {$gte: anoinicial, $lte: anofinal} }, function (err, docs) {	
	}).sort(setSort(sort)).limit(take).skip(skip).then((docs) => {
		//Count todos os registros		
		count = docs.length;
		return res.status(200).send({
			totalcount: count,
			items: docs
		});
	});
});

function setSort(sort) {

	var val = {};

	switch (sort) {
		case "titulo":
			val = { "titulo": 1 }
			break;
		case "tituloDesc":
			val = { "titulo": -1 }
			break;			
		case "autor":
			val = { "autor": 1 }
			break;
		case "autorDesc":
			val = { "autor": -1 }
			break;
		default:
			val = { "titulo": -1 }
			break
	}

	return val;

}


// ---------------------------------------------------------
// ApiRoutes
// ---------------------------------------------------------

app.use('/api', apiRoutes);

// ---------------------------------------------------------
//Start Server
app.listen(port);
console.log('Magic happens at http://localhost:' + port);