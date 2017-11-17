import { Ventanilla } from './ventanilla';
import * as mongoose from 'mongoose';

const LETRAS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

export let turnoSchema = new mongoose.Schema({
    tipo: {
        type: String,
        enum: ['prioritario', 'noPrioritario']
    },

    numeroInicio: {
        type: Number,
        default: 0,
        validate: {
            // agregamos la validacion de un solo caracter
            validator: function(v) {
              return /\d{1}/.test(v);
            },
            message: '{VALUE} no es un valor válido, ingrese un número.'
          },
        required: [true, 'El número de inicio es requerido']
    },

    numeroFin: {
        type: Number,
        default: 99,
        validate: {
            // agregamos la validacion de un solo caracter
            validator: function(v) {
              return /\d{1}/.test(v);
            },
            message: '{VALUE} no es un valor válido, ingrese un número.'
          },
        required: [true, 'El número de fin es requerido']
    },

    letraInicio: {
        type: String,
        validate: {
            // agregamos la validacion de un solo caracter
            validator: function(v) {
              return /^[a-zA-Z]*$/.test(v);
              
            },
            message: '{VALUE} no es un valor válido, ingrese una letra.'
          },
        required: [true, 'La letra de inicio es requerido']
    },

    letraFin: {
        type: String,
        validate: {
            // agregamos la validacion de un solo caracter
            validator: function(v) {
              return /^[a-zA-Z]*$/.test(v);
              
            },
            message: '{VALUE} no es un valor válido, ingrese una letra.'
          },

    },

    color: String,

    ultimoNumero: {
        type: Number,
        default: 0,
        validate: {
            // agregamos la validacion de un solo caracter
            validator: function(v) {
              return /\d{1}/.test(v);
            },
            message: '{VALUE} no es un valor válido, ingrese un número.'
        }
    },

    estado: {
        type: String,
        enum: ['activo', 'finalizado'],
        default: 'activo'
    },

    createdAt: {
        type: Date,
        default: new Date()
    }
});


turnoSchema.pre('save', function(next) {
    // algunas validaciones
    /*
    if (turno.numeroInicio < 0) {
        return res.status(500).send({status:500, message: 'El número de inicio debe ser mayor que 0 (cero)', type:'internal'});
    }

    if (turno.numeroFin < 0) {
        return res.status(500).send({status:500, message: 'El número final debe ser mayor que 0 (cero)', type:'internal'});
    }
    next();
    */


    let res = {
        valid: true,
        message: ''
    }

    if (this.numeroInicio < 0) {
        res.valid = false;
        res.message = 'El número de inicio debe ser mayor que 0 (cero)';

    }

    if (this.numeroFin < 0) {
        res.valid = false;
        res.message = 'El número final debe ser mayor que 0 (cero)';
    }

    if (LETRAS.indexOf(this.letraInicio) === -1) {
        res.valid = false;
        res.message = 'Por favor ingrese una letra válida de la <b>a</b> a la <b>z</b>';
    }

    if (!res.valid) {
        return next(new Error(res.message));
    }

    // return res;
    next();

});

export let Turno = mongoose.model('turnos', turnoSchema, 'turnos');
