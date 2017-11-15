import { Turno } from './../schemas/turno';
import * as express from 'express';
import { Ventanilla } from '../schemas/ventanilla';
import * as mongoose from 'mongoose';
import * as redisCache from 'express-redis-cache';

let router = express.Router();
// let cache = redisCache();

// Variable global para anunciar cambios desde el servidor
// Se puede setear dentro de cualquier ruta para anunciar cambios servidor ==> cliente

let cambio: any = { timestamp: new Date().getMilliseconds(), type: 'default', idVentanilla: null, ventanilla: {}, turno: {} };

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
            ...(req.query.numeroVentanilla) && { 'numeroVentanilla': req.query.numeroVentanilla },
            ...(req.query.tipo) && { 'tipo': req.query.tipo }
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

    //insertVentanilla.ultimoComun = (insertVentanilla.ultimoComun) ? insertVentanilla.ultimoComun : 0;
    //insertVentanilla.ultimoPrioridad = (insertVentanilla.ultimoPrioridad) ? insertVentanilla.ultimoPrioridad : 0;
    insertVentanilla.ultimo = {
        prioritario: {
            numero: 0,
            tipo: null,
            letra: null,
            color: null,
            llamado: 1
        },
        noPrioritario: {
            numero: 0,
            tipo: null,
            letra: null,
            color: null,
            llamado: 1
        }
    };

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
// return object: ventanilla & turno
router.patch('/ventanillas/:id*?', function (req, res, next) {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next('ObjectID Inválido');
    }

    switch (req.body.accion) {
        case 'rellamar':
            Ventanilla.findById(req.params.id, (err, data: any) => {

                data.isNew = false;

                var tipo = (req.body.tipo === 'prioritario') ? 'prioritario' : 'noPrioritario';
                data.ultimo[tipo].llamado = parseInt(data.ultimo[tipo].llamado)+1;

                Turno.findById(req.body.idTurno, (errT, turno: any) => {
                    if (errT) {
                        return next(errT);
                    }

                    data.atendiendo = turno.tipo;

                    data.save((err, data2) => {
                        if (err) {
                            return next(err);
                        }


                        cambio.timestamp = (new Date().getMilliseconds());
                        cambio.type = 'default';
                        cambio.idVentanilla = data2._id;
                        cambio.ventanilla = data2;
                        cambio.turno = turno;

                        res.json(data2);
                    });
                });
            });
            break;
        case 'siguiente':

            // ventanilla hace click en btn siguiente
            Ventanilla.findById(req.params.id, (err, ventanilla: any) => {
                if (err) {
                    return next(err);
                }

                // Turnero del mismo tipo
                Turno.findById(req.body.idTurno, (err, turno: any) => {
                    if (err) {
                        return next(err);
                    }

                    if (turno.estado === 'activo') {
                        turno.isNew = false;

                        // si el ultimo numero llamado del turno es menor al de finalizacion, incrementamos
                        if (turno.ultimoNumero < turno.numeroFin) {
                            turno.set('ultimoNumero', turno.get('ultimoNumero') + 1);
                        }

                        // si son iguales y aun esta activo, entonces finalizamos el turno
                        if (turno.ultimoNumero === turno.numeroFin && turno.estado === 'activo') {
                            turno.set('estado', 'finalizado');
                        }

                        turno.save((err, turnero) => {

                            ventanilla.isNew = false;
                            ventanilla.set('llamado', 1);

                            var tipo = (req.body.tipo === 'prioritario') ? 'prioritario' : 'noPrioritario';
                            let ultimo: any = {};
                            ultimo[tipo] = {
                                numero: turno.ultimoNumero,
                                tipo: (req.body.tipo === 'prioritario') ? 'prioritario' : 'noPrioritario',
                                letra: turno.letraInicio,
                                color: turno.color,
                                llamado: 1
                            }

                            // seteamos el ultimo turno llamado desde la ventanilla
                            ventanilla.ultimo[tipo] = ultimo[tipo]

                            // indicamos que tipo de turno esta atendiendo
                            ventanilla.set('atendiendo', (req.body.tipo === 'prioritario') ? 'prioritario' : 'noPrioritario');

                            // guardamos la info de la ventanilla
                            ventanilla.save((err, data2: any) => {
                                if (err) {
                                    return next(err);
                                }

                                // if (turnero.estado === 'activo') {
                                // armamos el documento a devolver, que tendra la ventanilla
                                // y el turno en un mismo objeto
                                let dto = {
                                    ventanilla: data2,
                                    turno: turno
                                };

                                // seteamos la variable de cambio para enviar el SSE
                                cambio.timestamp = (new Date().getMilliseconds());
                                cambio.type = 'default';
                                cambio.idVentanilla = data2._id;
                                cambio.ventanilla = data2;
                                cambio.turno = turnero;

                                // devolvemos!
                                res.json(dto);

                            });

                        });
                    } else {

                        Turno.findOne({ 'estado': 'activo', tipo: req.body.tipo }, (errNuevo, turneroNuevo: any) => {
                            debugger;
                            if (errNuevo) {
                                return next(errNuevo);
                            }
                            if (!turneroNuevo) {
                                // seteamos la variable de cambio para enviar el SSE
                                cambio.timestamp = (new Date().getMilliseconds());
                                cambio.type = 'default';
                                cambio.idVentanilla = ventanilla._id;
                                cambio.ventanilla = ventanilla;
                                cambio.turno = null;

                                return res.json(cambio.ventanilla);
                            }

                            turneroNuevo.set('ultimoNumero', turneroNuevo.get('ultimoNumero') + 1);

                            // si son iguales y aun esta activo, entonces finalizamos el turno
                            if (turneroNuevo.ultimoNumero === turneroNuevo.numeroFin && turneroNuevo.estado === 'activo') {
                                turneroNuevo.set('estado', 'finalizado');
                            }

                            turneroNuevo.save((errNuevo, turneroNuevoSave: any) => {

                                var tipo = (req.body.tipo === 'prioritario') ? 'prioritario' : 'noPrioritario';
                                let ultimo: any = {};
                                ultimo[tipo] = {
                                    numero: turneroNuevoSave.ultimoNumero,
                                    tipo: (req.body.tipo === 'prioritario') ? 'prioritario' : 'noPrioritario',
                                    letra: turneroNuevoSave.letraInicio,
                                    color: turneroNuevoSave.color,
                                    llamado: 1
                                }

                                // seteamos el ultimo turno llamado desde la ventanilla
                                ventanilla.set('ultimo', ultimo);

                                ventanilla.save((err3, data3: any) => {
                                    if (err3) {
                                        return next(err3);
                                    }

                                    // armamos el documento a devolver, que tendra la ventanilla
                                    // y el turno en un mismo objeto
                                    let dto = {
                                        ventanilla: data3,
                                        turno: turneroNuevo
                                    };

                                    // seteamos la variable de cambio para enviar el SSE
                                    cambio.timestamp = (new Date().getMilliseconds());
                                    cambio.type = 'default';
                                    cambio.idVentanilla = data3._id;
                                    cambio.ventanilla = data3;
                                    cambio.turno = turneroNuevo;

                                    // devolvemos!
                                    res.json(dto);
                                });
                            });

                        });
                    }
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


                    cambio.ventanilla = data;
                    //cambio.ventanilla['turno'] = turnero;


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
