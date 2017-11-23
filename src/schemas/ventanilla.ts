import { Types } from 'mongoose';
import * as mongoose from 'mongoose';
// import * as EventEmitter from 'events';
// let updateEmitter = new EventEmitter();

export let ventanillaSchema = new mongoose.Schema({
    numeroVentanilla: {
        type: Number,
        validate: {
            // agregamos la validacion de un solo caracter
            validator: function(v) {
              return /\d{1}/.test(v);
            },
            message: '{VALUE} no es un valor válido, ingrese un número.'
          },
        required: [true, 'El número de ventanilla es requerido']
    },
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
    pausa: Boolean,
    enUso: {
        type: Boolean,
        default: false
    }
});

export let Ventanilla = mongoose.model('ventanillas', ventanillaSchema, 'ventanillas');
