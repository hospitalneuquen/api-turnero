import { Turno } from './../schemas/turno';
import * as express from 'express';
import { Ventanilla } from '../schemas/ventanilla';
import * as mongoose from 'mongoose';
import * as redisCache from 'express-redis-cache';

let router = express.Router();
// let cache = redisCache();

// variable para anunciar cambios desde el servidor
let cambio: any = (new Date().getMilliseconds());

//  cache.route(),

// SSE
router.get('/update', (req, res, next) => {

    // Headers
    res.setHeader('Content-type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Message
    res.write('id: ' + (new Date().getMilliseconds()) + '\n');
    res.write('retry: 1000\n');

    setInterval(() => {
        res.write('data:' + JSON.stringify({ result: cambio }) + '\n\n') // Note the extra newline
    }, 1000);

});

// Get 1
router.get('/ventanillas/:id*?', function (req, res, next) {
    if (req.params.id) {
        Ventanilla.findById(req.params.id, function (err, data) {
            if (err) {
                return next(err);
            }
            res.json(data);
        });
    } else {

        let query = {};
        query = {
            ...(req.query.numeroVentanilla) && {'numeroVentanilla': req.query.numeroVentanilla},
            ...(req.query.tipo) && {'tipo': req.query.tipo}
        }

        Ventanilla.find(query, (err, data) => {
            if (err) {
                return next(err);
            }

            res.json(data);
        });
    }
});
/*
// Get all
router.get('/ventanillas', function (req, res, next) {
    Ventanilla.find(function (err, data) {
        if (err) {
            return next(err);
        }
        res.json(data);
    });
});
*/

// Insert
router.post('/ventanillas', function (req, res, next) {

    let insertVentanilla: any = new Ventanilla(req.body);

    insertVentanilla.ultimoComun = (insertVentanilla.ultimoComun) ? insertVentanilla.ultimoComun : 0;
    insertVentanilla.ultimoPrioridad = (insertVentanilla.ultimoPrioridad) ? insertVentanilla.ultimoPrioridad : 0;

    insertVentanilla.save((err) => {
        if (err) {
            return next(err);
        }
        return res.json(insertVentanilla);
    });
});

// Update
router.put('/ventanillas/:id', function (req, res, next) {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next('ObjectID Inválido');
    }

    let updateVentanilla = new Ventanilla(req.body);

    updateVentanilla.isNew = false;

    updateVentanilla.save((errOnPut) => {
        if (errOnPut) {
            return next(errOnPut);
        }
        return res.json(updateVentanilla);
    });

});

router.patch('/ventanilla/:id', (req, res, next) => {



});

// Cambios únicos del tipo { key: value }
router.patch('/ventanillas/:id*?', function (req, res, next) {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next('ObjectID Inválido');
    }

    switch (req.body.accion) {
        case 'rellamar':
            Ventanilla.findById(req.params.id, (err, data) => {

                data.isNew = false;
                data.set('llamado', data.get('llamado') + 1);

                data.save((err, data2) => {
                    if (err) {
                        return next(err);
                    }
                    res.json(data2);

                });
            });
            break;
        case 'siguiente':

            // ventanilla hace click en btn siguiente
            Ventanilla.findById(req.params.id, (err, ventanilla) => {

                console.log('ventanilla', ventanilla);

                // Turnero del mismo tipo
                Turno.findOne({ tipo: req.body.tipo }, (err, turno) => {

                    let tipo = (req.body.tipo === 'prioritario' ? 'ultimoNumeroPrioridad' : 'ultimoNumeroComun');

                    turno.isNew = false;
                    turno.set(tipo, turno.get(tipo) + 1);

                    turno.save((err, turnero) => {

                        console.log('turnero', turnero);

                        ventanilla.isNew = false;
                        ventanilla.set('llamado', 0);

                        if (req.body.tipo === 'prioritario') {
                            console.log('ultimoPrioridad', turnero.get('ultimoNumeroPrioridad'));

                            ventanilla.set('ultimoPrioridad', ventanilla.get('ultimoPrioridad') + 1);
                            turno.set('ultimoNumeroPrioridad', ventanilla.get('ultimoPrioridad') + 1);
                        } else if (req.body.tipo === 'no-prioritario') {
                            ventanilla.set('ultimoComun', ventanilla.get('ultimoComun') + 1);
                            turno.set('ultimoNumeroComun', ventanilla.get('ultimoComun') + 1);
                        }

                        turno.save((err, data3) => {
                            console.log('data3', data3);
                        });

                        ventanilla.save((err, data2) => {
                            if (err) {
                                return next(err);
                            }
                            res.json(data2);
                        });

                    });
                });

            });
            break;
        default:
            Ventanilla.findById(req.params.id, (err, data) => {
                data.set(req.body.key, req.body.value);
                data.save((errOnPatch) => {
                    if (errOnPatch) {
                        return next(errOnPatch);
                    }

                    if (req.body.key === 'pausada') {
                        if (req.body.value === false) {
                            cambio = 'reanudar-' + (new Date().getMilliseconds());
                        } else {
                            cambio = 'pausar-' + (new Date().getMilliseconds());
                        }
                    } else {
                        cambio = (new Date().getMilliseconds());
                    }

                    return res.json(data);
                });
            });
            break;
    }


});

// Pum!
router.delete('/ventanillas/:id', function (req, res, next) {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next('ObjectID Inválido');
    }

    Ventanilla.findById(req.params.id, (err, data) => {
        data.remove((errOnDelete) => {
            if (errOnDelete) {
                return next(errOnDelete);
            }
            return res.json(data);
        });
    });

});

export = router;
