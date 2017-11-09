import { Turno } from './../schemas/turno';
import * as express from 'express';
import { Ventanilla } from '../schemas/ventanilla';
import * as mongoose from 'mongoose';
import * as redisCache from 'express-redis-cache';

let router = express.Router();
// let cache = redisCache();

// Variable global para anunciar cambios desde el servidor
// Se puede setear dentro de cualquier ruta para anunciar cambios servidor ==> cliente

let cambio: any = { timestamp: new Date().getMilliseconds(), type: 'default', idVentanilla: null, ventanilla: {} };

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

    //insertVentanilla.ultimoComun = (insertVentanilla.ultimoComun) ? insertVentanilla.ultimoComun : 0;
    //insertVentanilla.ultimoPrioridad = (insertVentanilla.ultimoPrioridad) ? insertVentanilla.ultimoPrioridad : 0;
    insertVentanilla.ultimo = {
        numero: 0,
        tipo: null,
        letra: null,
        color: null
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
            Ventanilla.findById(req.params.id, (err, data) => {

                data.isNew = false;
                data.set('llamado', data.get('llamado') + 1);

                data.save((err, data2) => {
                    if (err) {
                        return next(err);
                    }

                    cambio.timestamp = (new Date().getMilliseconds());
                    cambio.type = 'default';
                    cambio.idVentanilla = data2._id;
                    cambio.ventanilla = data2;


                    res.json(data2);

                });
            });
            break;
        case 'siguiente':

            // ventanilla hace click en btn siguiente
            Ventanilla.findById(req.params.id, (err, ventanilla) => {
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

                            const ultimo = {
                                numero: turno.ultimoNumero,
                                tipo: (req.body.tipo === 'prioritario') ? 'prioritario' : 'no-prioritario',
                                letra: turno.letraInicio,
                                color: turno.color
                            };
                            
                            // seteamos el ultimo turno llamado desde la ventanilla
                            ventanilla.set('ultimo', ultimo);

                            // indicamos que tipo de turno esta atendiendo
                            ventanilla.set('atendiendo', (req.body.tipo === 'prioritario') ? 'prioritario' : 'no-prioritario');

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
                                        turno: turnero
                                    };

                                    // seteamos la variable de cambio para enviar el SSE
                                    cambio.timestamp = (new Date().getMilliseconds());
                                    cambio.type = 'default';
                                    cambio.idVentanilla = ventanilla._id;
                                    cambio.ventanilla = data2;
                                    cambio.ventanilla['turno'] = turnero;

                                    console.log(cambio);

                                    // devolvemos!
                                    res.json(dto);
                                // } else {
                                    /*
                                    Turno.findOne({'estado': 'activo'}, (errNuevo, turneroNuevo) => {
                                        debugger;

                                        turneroNuevo.set('ultimoNumero', turno.get('ultimoNumero') + 1);

                                        turneroNuevo.save((errNuevo, turneroNuevoSave: any) => {

                                            const ultimo = {
                                                numero: turneroNuevoSave.ultimoNumero,
                                                tipo: (req.body.tipo === 'prioritario') ? 'prioritario' : 'no-prioritario',
                                                letra: turneroNuevoSave.letraInicio,
                                                color: turneroNuevoSave.color
                                            };
                                            // seteamos el ultimo turno llamado desde la ventanilla
                                            ventanilla.set('ultimo', ultimo);

                                            // armamos el documento a devolver, que tendra la ventanilla
                                            // y el turno en un mismo objeto
                                            let dto = {
                                                ventanilla: data2,
                                                turno: turneroNuevoSave
                                            };

                                            // seteamos la variable de cambio para enviar el SSE
                                            cambio.timestamp = (new Date().getMilliseconds());
                                            cambio.type = 'default';
                                            cambio.idVentanilla = ventanilla._id;
                                            cambio.ventanilla = data2;
                                            cambio.ventanilla['turno'] = turneroNuevoSave;

                                            console.log(cambio);

                                            data2.save((err3, data3: any) => {
                                                if (err3) {
                                                    return next(err3);
                                                }
                                                // devolvemos!
                                                res.json(dto);
                                            });
                                        });

                                    });
                                    */
                                // }

                                
                            });

                        });
                    } else {
                        /*
                        // si esta finalizado el turnero, buscamos el proximo en estado activo
                        Turno.findOne({'estado': 'activo'}, (err, turneroNuevo: any) => {
                            debugger;
                            if (err) {
                                return next(err);
                            }

                            ventanilla.isNew = false;
                            ventanilla.set('llamado', 1);
                            const ultimo = {
                                numero: turneroNuevo.ultimoNumero,
                                tipo: (req.body.tipo === 'prioritario') ? 'prioritario' : 'no-prioritario',
                                letra: turneroNuevo.letraInicio,
                                color: turneroNuevo.color
                            };
                            ventanilla.set('ultimo', ultimo);
                            ventanilla.set('atendiendo', (req.body.tipo === 'prioritario') ? 'prioritario' : 'no-prioritario');
    
                            ventanilla.save((err, data2) => {
                                if (err) {
                                    return next(err);
                                }

                                let dto = {
                                    ventanilla: data2,
                                    turno: turneroNuevo
                                };
                                cambio.timestamp = (new Date().getMilliseconds());
                                cambio.type = 'default';
                                cambio.idVentanilla = data2._id;
                                cambio.ventanilla = data2;
                                cambio.ventanilla['turno'] = turneroNuevo;


                                turneroNuevo.set('ultimoNumero', turneroNuevo.get('ultimoNumero') + 1);

                                res.json(dto);
                            });

                        }); 
                        */

                        Turno.findOne({'estado': 'activo'}, (errNuevo, turneroNuevo: any) => {
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
                                cambio.ventanilla['turno'] = null;

                                return res.json(cambio.ventanilla);
                            }

                            turneroNuevo.set('ultimoNumero', turneroNuevo.get('ultimoNumero') + 1);

                            turneroNuevo.save((errNuevo, turneroNuevoSave: any) => {

                                const ultimo = {
                                    numero: turneroNuevo.ultimoNumero,
                                    tipo: (req.body.tipo === 'prioritario') ? 'prioritario' : 'no-prioritario',
                                    letra: turneroNuevo.letraInicio,
                                    color: turneroNuevo.color
                                };

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
                                    cambio.idVentanilla = ventanilla._id;
                                    cambio.ventanilla = ventanilla;
                                    cambio.ventanilla['turno'] = turneroNuevo;
    
                                    console.log(cambio);
                                    // devolvemos!
                                    res.json(dto);
                                });
                            });

                        });
                    }
                });

            });
        break;
        case 'cambiar_turno':

            // ventanilla hace click en btn siguiente
            Ventanilla.findById(req.params.id, (err, ventanilla) => {
                if (err) {
                    return next(err);
                }

                ventanilla.isNew = false;

                /*
                if (req.body.tipo === 'prioritario') {
                    ventanilla.set('ultimoPrioridad', 0);
                } else if (req.body.tipo === 'no-prioritario') {
                    ventanilla.set('ultimoComun', 0);                   
                }
                */

                ventanilla.set('llamado', 1);

                // Turnero del mismo tipo
                /*
                Turno.findById(req.body.idTurno, (err, turno) => {

                    if (err || !turno) {
                        return next(err);
                    }


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
                            cambio.ventanilla = data2;
                            cambio.ventanilla['turno'] = turnero;


                            res.json(data2);
                        });

                    });
                });
                */

                 // si esta finalizado el turnero, buscamos el proximo en estado activo
                 Turno.findOne({'estado': 'activo'}, (err, turnero) => {
                    if (err) {
                        return next(err);
                    }

                    let dto = {
                        ventanilla: ventanilla,
                        turno: turnero
                    };

                    // seteamos la variable de cambio para enviar el SSE
                    cambio.timestamp = (new Date().getMilliseconds());
                    cambio.type = 'default';
                    cambio.idVentanilla = ventanilla._id;
                    cambio.ventanilla = ventanilla;
                    cambio.ventanilla['turno'] = turnero;

                    res.json(dto);
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
