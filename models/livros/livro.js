var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var livrosSchema = new Schema({
	titulo: String,
	isbn: String,
	autor: String,
	editora: String,
	ano: Number,
	idioma: String,
	peso: Number,
	comprimento: Number,
	largura: Number,
	altura: Number,
	busca: String
});

var livros = mongoose.model('Livros', livrosSchema);

module.exports =
    {
        Livros: livros
    }