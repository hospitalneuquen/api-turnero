import { Types } from 'mongoose';
import * as mongoose from 'mongoose';
// import * as EventEmitter from 'events';
// let updateEmitter = new EventEmitter();

export let ventanillaSchema = new mongoose.Schema({
    numeroVentanilla: Number,
    // ultimoComun: Number,
    // ultimoPrioridad: Number,
    ultimo: {
        prioritario : {
            tipo: String,
            numero: Number,
            letra: String,
            color: String,
            llamado: Number
        },
        noPrioritario : {
            tipo: String,
            numero: Number,
            letra: String,
            color: String,
            llamado: Number
        }
    },
    atendiendo: {
        type: String,
        enum: ['prioritario', 'noPrioritario']
    },
    disponible: Boolean,
    pausa: Boolean
});

export let Ventanilla = mongoose.model('ventanillas', ventanillaSchema, 'ventanillas');
