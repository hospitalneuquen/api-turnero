import { Ventanilla } from './ventanilla';
import * as mongoose from 'mongoose';


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
    }
});

/*
turnoSchema.pre('save', function(turno, next) {
    // algunas validaciones
    if (turno.numeroInicio < 0) {
        return res.status(500).send({status:500, message: 'El número de inicio debe ser mayor que 0 (cero)', type:'internal'});
    }

    if (turno.numeroFin < 0) {
        return res.status(500).send({status:500, message: 'El número final debe ser mayor que 0 (cero)', type:'internal'});
    }
    next();
});
*/

export let Turno = mongoose.model('turnos', turnoSchema, 'turnos');
