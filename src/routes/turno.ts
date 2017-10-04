import { Ventanilla } from './../schemas/ventanilla';
import * as express from 'express';
// import { Turnero } from '../models/turnero';
import { Turno } from '../schemas/turno';
import { Mongoose, Types } from "mongoose";
// import * as redisCache from 'express-redis-cache';

// import * as utils from '../../../utils/utils';
// import { defaultLimit, maxLimit } from './../../../config';
const LETRAS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

let router = express.Router();
// let cache = redisCache(null);

router.get('/turnero/:id?', (req, res, next) => {

    let query = {};

    if (req.params.id) {
        query = { _id: req.params.id }
    } else {
        query = { tipo: req.query.tipo }
    }

    Turno.find(query, (err, data) => {
        if (err) {
            return next(err);
        }
        res.json(data);
    })
});

router.post('/turnero', (req, res, next) => {
    let letras = [];
    let letraInicio = '', letraFin = '';

    let turno: any = new Turno(req.body);

    // to lower
    if (req.body.letraInicio) {
        turno.letraInicio = req.body.letraInicio.toLowerCase();
    }

    if (req.body.letraFin) {
        turno.letraFin = req.body.letraFin.toLowerCase();
    }

    // si no se le ha pasado el ultimo numero, lo inicializamos en 0
    if (!turno.ultimoNumero) {
        turno.ultimoNumero = 0;
    }

    // filtramos las letras que vamos  utilizar
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

    turno.save((err, data) => {
        if (err) {
            return next(err);
        }
        res.json(data);
    })
});

router.put('/turnero/:id', (req, res, next) => {

    let turno = new Turno(req.body);
    turno.isNew = false;

    turno.save((err, data) => {
        if (err) {
            return next(err);
        }
        res.json(data);

    });
});



// router.delete('/turnero/:id', function (req, res, next) {
//     Turnero.findByIdAndRemove(req.params._id, function (err, data) {
//         if (err) {
//             return next(err);
//         }

//         res.json(data);
//     });
// });

export = router;
