import * as mongoose from 'mongoose';

export let ventanillaSchema = new mongoose.Schema({
    nombre: String,
    prioritaria: Boolean,
    disponible: Boolean
});

export let Ventanilla = mongoose.model('ventanillas', ventanillaSchema, 'ventanillas');
