import * as mongoose from 'mongoose';

export let ventanillaSchema = new mongoose.Schema({
    nombre: {
        type: String,  // TODO usar orden + slug
        required: true
    },
    prioritaria: {
        type: Boolean,
        default: false
    },
    disponible: {
        type: Boolean,
        default: false
    },
});

export let Ventanilla = mongoose.model('ventanillas', ventanillaSchema, 'ventanillas');
