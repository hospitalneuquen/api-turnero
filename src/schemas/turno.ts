import * as mongoose from 'mongoose';


export let turnoSchema = new mongoose.Schema({
    color: String,
    tipo: {
        type: String,
        enum: ['prioritario', 'no-prioritario']
    },

    letraInicio: String,
    letraFin: String,
    numeroInicio: {type: Number, default: 0},
    numeroFin: Number,

    numeros: [{
        letra: String,
        numero: Number,
        llamado: Number,
        ventanilla:  {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ventanilla'
        },
        ultimoEstado: String,
        estado: [{
            fecha: Date,
            valor: {
                type: String,
                // enum: ['libre', 'ocupado', 'finalizado', 'vacio', 'cancelado']
                enum: ['libre', 'llamado', 'cancelado']
            }
        }]
    }],

    ultimoEstado: String,
    estado: [{
        fecha: Date,
        valor: {
            type: String,
            enum: ['cancelado', 'uso', 'finalizado']
        }
    }]
});

export let Turno = mongoose.model('turnos', turnoSchema, 'turnos');
