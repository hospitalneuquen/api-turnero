import * as mongoose from 'mongoose';
// import * as EventEmitter from 'events';
// let updateEmitter = new EventEmitter();

export let ventanillaSchema = new mongoose.Schema({
    numero: {
        type: Number,
        required: true
    },
    // nombre: {
    //     type: String,  // TODO usar slug + orden
    //     required: true
    // },
    prioritaria: {
        type: Boolean,
        default: false
    },
    pausa: {
        type: Boolean,
        default: false
    },
    disponible: {
        type: Boolean,
        default: false
    },
});

export let Ventanilla = mongoose.model('ventanillas', ventanillaSchema, 'ventanillas');
