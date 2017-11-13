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
        default: 0
    },
    numeroFin: {
        type: Number,
        default: 99
    },
    letraInicio: String,
    letraFin: String,
    color: String,
    ultimoNumero: Number,
    estado: {
        type: String,
        enum: ['activo', 'finalizado']
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
