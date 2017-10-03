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

// Variable global para anunciar cambios desde el servidor
// Se puede setear dentro de cualquier ruta para anunciar cambios servidor ==> cliente
let cambio: any = { timestamp: new Date().getMilliseconds() };


// SSE
router.get('/update', (req, res, next) => {

    // Headers
    res.setHeader('Content-type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Message
    res.write('id: ' + (new Date().getMilliseconds()) + '\n');
    res.write('retry: 500\n');

    setInterval(() => {
        res.write('data:' + JSON.stringify({ result: cambio }) + '\n\n') // Note the extra newline
    }, 500);

});

/*
router.get('/ventanillas', (req, res, next) => {

    let query = {};
    if (req.query.numeroVentanilla) {
        query = { numeroVentanilla: req.query.numeroVentanilla }
    } else {
        query = { tipo: req.query.tipo };
    }

    Ventanilla.find(query, (err, data) => {
        if (err) {
            return next(err);
        }
        res.json(data);
    })
});
*/

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
        console.log(1);
        letras = LETRAS.filter((letra) => {
            return (letra.charCodeAt(0) <= letraFin.charCodeAt(0)) ? letra : null;
        });

        if (letras.length) {
            console.log(2);
            turno.ultimoNumeroFin = (turno.numeroFin - turno.numeroInicio) * letras.length;
        }
    } else {
        console.log(3);
        if (turno.numeroInicio == 0) {
            console.log(4);
            turno.ultimoNumeroFin = turno.numeroFin + 1;
        } else {
            console.log(5);
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
