import { Ventanilla } from './ventanilla';
import * as mongoose from 'mongoose';


export let turnoSchema = new mongoose.Schema({
    tipo: {
        type: String,
        enum: ['prioritario', 'no-prioritario']
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

export let Turno = mongoose.model('turnos', turnoSchema, 'turnos');
