import { Turno } from './../schemas/turno';
import * as express from 'express';
import { Ventanilla } from '../schemas/ventanilla';
import * as mongoose from 'mongoose';
import * as redisCache from 'express-redis-cache';

let router = express.Router();
// let cache = redisCache();

// Variable global para anunciar cambios desde el servidor
// Se puede setear dentro de cualquier ruta para anunciar cambios servidor ==> cliente

let cambio: any = { timestamp: new Date().getMilliseconds(), type: 'default', idVentanilla: null };

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

                    cambio.timestamp = (new Date().getMilliseconds());
                    cambio.idVentanilla = data._id;

                    res.json(data2);

                });
            });
            break;
        case 'siguiente':

            // ventanilla hace click en btn siguiente
            Ventanilla.findById(req.params.id, (err, ventanilla) => {
                // Turnero del mismo tipo
                Turno.findById(req.body.idTurno, (err, turno) => {

                    turno.isNew = false;
                    turno.set('ultimoNumero', turno.get('ultimoNumero') + 1);

                    turno.save((err, turnero) => {

                        ventanilla.isNew = false;
                        ventanilla.set('llamado', 0);

                        if (req.body.tipo === 'prioritario') {
                            ventanilla.set('ultimoPrioridad', ventanilla.get('ultimoPrioridad') + 1);
                        } else if (req.body.tipo === 'no-prioritario') {
                            ventanilla.set('ultimoComun', ventanilla.get('ultimoComun') + 1);
                        }

                        ventanilla.save((err, data2) => {
                            if (err) {
                                return next(err);
                            }

                            cambio.timestamp = (new Date().getMilliseconds());
                            cambio.type = 'default';
                            cambio.idVentanilla = ventanilla._id;

                            res.json(data2);
                        });

                    });
                });

            });
        break;
        case 'cambiar_turno':

            // ventanilla hace click en btn siguiente
            Ventanilla.findById(req.params.id, (err, ventanilla) => {

                ventanilla.isNew = false;

                if (req.body.tipo === 'prioritario') {
                    ventanilla.set('ultimoPrioridad', 0);
                } else if (req.body.tipo === 'no-prioritario') {
                    ventanilla.set('ultimoComun', 0);
                }

                ventanilla.set('llamado', 0);

                // Turnero del mismo tipo
                Turno.findById(req.body.idTurno, (err, turno) => {

                    turno.isNew = false;
                    turno.set('estado', 'finalizado');

                    turno.save((err, turnero) => {


                        ventanilla.save((err, data2: any) => {
                            if (err) {
                                return next(err);
                            }

                            cambio.timestamp = (new Date().getMilliseconds());
                            cambio.type = 'default';
                            cambio.idVentanilla = ventanilla._id;

                            res.json(data2);
                            /*
                            // buscamos la proxima 
                            Ventanilla.find({'numeroVentanilla': data2.numeroVentanilla, tipo: data2.tipo}, (err, data3) => {
                                if (err) {
                                    return next(err);
                                }

                                res.json(data3);
                            });*/
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

                    if (req.body.key === 'pausa') {
                        if (req.body.value === false) {
                            //cambio.type = 'reanudar';
                            cambio.type = 'default';
                        } else {
                            cambio.type = 'pausar';
                        }
                    } else {
                        cambio.type = 'default';
                    }

                    cambio.timestamp = (new Date().getMilliseconds());
                    cambio.idVentanilla = data._id;

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
