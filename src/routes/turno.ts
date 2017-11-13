import { Ventanilla } from './../schemas/ventanilla';
import * as express from 'express';
// import { Turnero } from '../models/turnero';
import { Turno } from '../schemas/turno';
import * as mongoose from 'mongoose';
// import * as redisCache from 'express-redis-cache';

// import * as utils from '../../../utils/utils';
// import { defaultLimit, maxLimit } from './../../../config';
var ObjectID = require('mongodb').ObjectID;

let router = express.Router();
// let cache = redisCache(null);

router.get('/turnero/:id?', (req, res, next) => {
    let query = {};

    if (req.params.id) {
        query = { _id: req.params.id };
    } else {
        query = {
            ...(req.query.tipo) && { 'tipo': req.query.tipo },
            // ...(req.query.noFinalizados) && {'$where' : 'this.ultimoNumero < this.numeroFin'}
            ...(req.query.estado) && { 'estado': req.query.estado }
        }

    }

    Turno.find(query, {}, { createdAt: 1 }, (err, data) => {
        if (err) {
            return next(err);
        }

        res.json(data);
    });
});

router.post('/turnero', (req, res, next) => {
    let turno: any = new Turno(req.body);

    turno.estado = (turno.estado) ? turno.estado : 'activo';

    turno.numeroInicio = parseInt(turno.numeroInicio);
    turno.numeroFin = parseInt(turno.numeroFin);
    // to lower
    if (req.body.letraInicio) {
        turno.letraInicio = req.body.letraInicio.toLowerCase();
    }

    // si no se le ha pasado el ultimo numero, lo inicializamos en -1 
    // y de esta forma sabemos que aun no ha comenzado
    if (!turno.ultimoNumero) {
        turno.ultimoNumero = turno.numeroInicio - 1;
    }
    /*
    if (req.body.letraFin) {
        turno.letraFin = req.body.letraFin.toLowerCase();
    }
    */

    // validaciones
    /*
    const validar = this.validar(turno);
    if (!validar.valid) {
        return res.status(500).send({ status: 500, message: validar.message, type: 'internal' });
    }
    */


    // filtramos las letras que vamos  utilizar
    /*
    if (letraInicio && letraFin) {
        letras = LETRAS.filter((letra) => {
            return (letra.charCodeAt(0) <= letraFin.charCodeAt(0)) ? letra : null;
        });

        if (letras.length) {
            turno.ultimoNumeroFin = (turno.numeroFin - turno.numeroInicio) * letras.length;
        }
    } else {
        if (turno.numeroInicio == 0) {
            turno.ultimoNumeroFin = turno.numeroFin + 1;
        } else {
            turno.ultimoNumeroFin = (turno.numeroFin - turno.numeroInicio);
        }
    }
    */

    /** COMIENZO DEL CALLBACK HELL :D :D :D */
    let conditions = {
        ...(req.params.id) && { _id: { $ne: new ObjectID(req.params.id) } },
        tipo: turno.tipo,
        estado: 'activo',
        letraInicio: turno.letraInicio,
        //{$and: [{numeroInicio: {$lte: 1}, numeroInicio: {$lte: 4}}, {numeroFin: {$lte: 1}, numeroFin: {$gte: 4} }]} // working on robomongo
        $and: [
            //
            {
                $or: [{
                    numeroInicio: { $lte: turno.numeroFin },
                }]
            }, // OK!

            {
                $or: [{
                    numeroFin: { $gte: turno.numeroInicio }
                },]
            },
            {
                $or: [{
                    numeroInicio: { $lte: turno.numeroInicio },
                },
                {
                    numeroInicio: { $lte: turno.numeroFin }
                },
                {
                    numeroFin: { $gte: turno.numeroInicio },
                },
                {
                    numeroFin: { $gte: turno.numeroFin }
                }
                ]
            }
        ]
    };


    // fin validaciones

    Turno.find(conditions, (err, exists) => {
        if (err) {
            return next(err);
        }

        if (exists.length > 0) {
            console.log('Ya existe el turno de este tipo y con esa letra y numeración');
            return res.status(500).send({ status: 500, message: 'Ya existe el turno de este tipo y con esa letra y numeración', type: 'internal' });
            //return next();
        }

        turno.save((err, data) => {
            if (err) {
                return next(err);
            }

            res.json(data);
        });

    });
});


router.put('/turnero/:id', (req, res, next) => {
    let turno: any = new Turno(req.body);

    turno.estado = (turno.estado) ? turno.estado : 'activo';

    turno.numeroInicio = parseInt(turno.numeroInicio);
    turno.numeroFin = parseInt(turno.numeroFin);
    // to lower
    if (req.body.letraInicio) {
        turno.letraInicio = req.body.letraInicio.toLowerCase();
    }

    // si no se le ha pasado el ultimo numero, lo inicializamos en -1 
    // y de esta forma sabemos que aun no ha comenzado
    turno.ultimoNumero = turno.numeroInicio - 1;

    /*
    if (req.body.letraFin) {
        turno.letraFin = req.body.letraFin.toLowerCase();
    }
    */

    turno.isNew = false;

    let conditions = {
        ...(req.params.id) && { _id: { $ne: new ObjectID(req.params.id) } },
        tipo: turno.tipo,
        estado: 'activo',
        letraInicio: turno.letraInicio,
        //{$and: [{numeroInicio: {$lte: 1}, numeroInicio: {$lte: 4}}, {numeroFin: {$lte: 1}, numeroFin: {$gte: 4} }]} // working on robomongo
        $and: [
            //
            {
                $or: [{
                    numeroInicio: { $lte: turno.numeroFin },
                }]
            }, // OK!

            {
                $or: [{
                    numeroFin: { $gte: turno.numeroInicio }
                },]
            },
            {
                $or: [{
                    numeroInicio: { $lte: turno.numeroInicio },
                },
                {
                    numeroInicio: { $lte: turno.numeroFin }
                },
                {
                    numeroFin: { $gte: turno.numeroInicio },
                },
                {
                    numeroFin: { $gte: turno.numeroFin }
                }
                ]
            }
        ]
    };


    // fin validaciones

    Turno.find(conditions, (err, exists) => {
        if (err) {
            return next(err);
        }

        if (exists.length > 0) {
            console.log('Ya existe el turno de este tipo y con esa letra y numeración');
            return res.status(500).send({ status: 500, message: 'Ya existe el turno de este tipo y con esa letra y numeración', type: 'internal' });
            //return next();
        }

        turno.save((err, data) => {
            if (err) {
                return next(err);
            }

            res.json(data);
        });
    });
});



router.delete('/turnero/:id', function (req, res, next) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next('ObjectID Inválido');
    }

    Turno.findById(req.params.id, (err, data) => {
        data.remove((errOnDelete) => {
            if (errOnDelete) {
                return next(errOnDelete);
            }
            return res.json(data);
        });
    });
});

export = router;
