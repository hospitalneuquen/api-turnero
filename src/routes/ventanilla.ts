import * as express from 'express';
import * as mongoose from 'mongoose';

import { Ventanilla } from '../schemas/ventanilla';
import { Turno } from './../schemas/turno';

let router = express.Router();
// let cache = redisCache();

// Variable global para anunciar cambios desde el servidor
// Se puede setear dentro de cualquier ruta para anunciar cambios servidor ==> cliente

let cambio: any = { timestamp: new Date().getMilliseconds(), type: 'default', ventanilla: {}, turno: {} };

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
router.get('/ventanillas/:id', function (req, res, next) {

    // verificamos que sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).send('Ventanilla no encontrada');
    }

    Ventanilla.findOne({_id: req.params.id}, (err, data) => {
        if (err) {
            return next(err);
        }

        if (!data) {
            return res.status(404).send('Ventanilla no encontrada');
        }

        res.json(data);
    });

});


router.get('/ventanillas', function (req, res, next) {
    let query = {
        ...(req.query.numeroVentanilla) && { 'numeroVentanilla': req.query.numeroVentanilla },
        ...(req.query.tipo) && { 'tipo': req.query.tipo }
    }

    Ventanilla.find(query, (err, data) => {
        if (err) {
            return next(err);
        }

        res.json(data);
    });
});

// Insert
router.post('/ventanillas', function (req, res, next) {

    let ventanilla: any = new Ventanilla(req.body);

    const props = {
        numero: 0,
        tipo: null,
        letra: null,
        color: null,
        llamado: 1
    };

    ventanilla.ultimo = {
        prioritario: props,
        noPrioritario: props
    };

    ventanilla.save((err) => {
        if (err) {
            return next(err);
        }
        return res.json(ventanilla);
    });
});

// Update
router.put('/ventanillas/:id', function (req, res, next) {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).send('Ventanilla no encontrada');
    }

    let ventanilla = new Ventanilla(req.body);

    ventanilla.isNew = false;

    ventanilla.save((errOnPut) => {
        if (errOnPut) {
            return next(errOnPut);
        }
        return res.json(ventanilla);
    });

});

// Cambios únicos del tipo { key: value }
// return object: ventanilla & turno
router.patch('/ventanillas/:id*?', async function (req, res, next) {
    let ventanilla: any
    let turno: any;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).send('Ventanilla no encontrada');
    }

    ventanilla = await Ventanilla.findById(req.params.id);

    if (!ventanilla) {
        return res.status(404).send('Ventanilla no encontrada');
    }

    if (req.body.idTurno) {
        // buscamos el turno actual
        turno = await Turno.findById(req.body.idTurno);

        // if (!turno) {
        //     return res.status(404).send('Turno no encontrado');
        // }
    }

    switch (req.body.accion) {
        case 'rellamar':
            ventanilla.isNew = false;

            // aumentamos el ultimo llamado
            ventanilla.ultimo[turno.tipo].llamado = parseInt(ventanilla.ultimo[turno.tipo].llamado)+1;
            ventanilla.atendiendo = turno.tipo;

            ventanilla.save((err, data) => {
                if (err) {
                    return next(err);
                }

                // enviamos cambio SSE
                cambio = {timestamp: (new Date().getMilliseconds()), type: 'default', ventanilla: data, turno: turno};

                res.json(data);
            });
        break;

        case 'siguiente':
            // let turnoSiguiente: any = await Turno.findById(req.body.idTurno);
        
            // if (!turnoSiguiente) {
            if (!turno || (turno && turno.estado === 'finalizado')) {
                //return res.status(404).send('Turno no encontrado');
                // si el turno actual ya esta agotado, llamamos al siguiente
                try {
                    const proximoTurno: any = await getProximoTurno(ventanilla, req.body.tipo);
            
                    // si no hay proximo turno entonces devolvemos la ventanilla con el turno null
                    // asi al usuario le aparece que ya no hay mas turnos y debe cargar nuevos
                    if (!proximoTurno.turno) {
                        // seteamos la variable de cambio para enviar el SSE
                        cambio = {
                            timestamp: (new Date().getMilliseconds()), type: 'default', ventanilla: ventanilla, turno: null
                        };

                        ventanilla.turno = null;

                        return res.json(ventanilla);
                    }


                    // armamos el documento a devolver, que tendra la ventanilla
                    // y el turno en un mismo objeto
                    let dto = {
                        ventanilla: ventanilla,
                        turno: proximoTurno
                    };

                    // seteamos la variable de cambio para enviar el SSE
                    cambio = {
                        timestamp: (new Date().getMilliseconds()), type: 'default', ventanilla: ventanilla, turno: proximoTurno
                    };

                    // devolvemos!
                    return res.json(dto);
                 
            
                } catch (err) { 
                    return next(err);
                }
            }

            if (turno.estado === 'activo') {
                turno.isNew = false;

                // si el ultimo numero llamado del turno es menor al de finalizacion, incrementamos
                if (turno.ultimoNumero < turno.numeroFin) {
                    turno.set('ultimoNumero', turno.get('ultimoNumero') + 1);
                }

                // si son iguales (llego a su fin) y aun esta activo, entonces finalizamos el turno
                if (turno.ultimoNumero === turno.numeroFin && turno.estado === 'activo') {
                    turno.set('estado', 'finalizado');
                }

                turno.save((err, turnero) => {
                    // puede darse el caso de que el turno sea muy viejo e
                    // inclusive lo hayan borrado, para ese caso lo que haremos es buscar
                    // el siguiente activo
                    if (err) {
                       return next(err);
                    }

                    ventanilla.isNew = false;
                    ventanilla.set('llamado', 1);

                    let ultimo: any = {};
                    ultimo = {
                        numero: turno.ultimoNumero, tipo: turno.tipo, letra: turno.letraInicio, color: turno.color, llamado: 1
                    }

                    // seteamos el ultimo turno llamado desde la ventanilla
                    ventanilla.ultimo[turno.tipo] = ultimo;

                    // indicamos que tipo de turno esta atendiendo
                    ventanilla.set('atendiendo', turno.tipo);

                    // guardamos la info de la ventanilla
                    ventanilla.save((err, data2: any) => {
                        if (err) {
                            return next(err);
                        }

                        // armamos el documento a devolver, que tendra la ventanilla
                        // y el turno en un mismo objeto
                        let dto = {
                            ventanilla: data2,
                            turno: turno
                        };

                        // seteamos la variable de cambio para enviar el SSE
                        cambio = {
                            timestamp: (new Date().getMilliseconds()), type: 'default', ventanilla: data2, turno: turnero
                        }

                        // devolvemos!
                        res.json(dto);
                    });
                });
            } else {
                // si el turno actual ya esta agotado, llamamos al siguiente
                try {
                    let proximoTurno = getProximoTurno(ventanilla, req.body.tipo);
            
                    res.json(proximoTurno);
            
                } catch (err) { 
                    return next(err);
                }

            }


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
                    cambio.ventanilla = data;

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


/**
 * Buscamos el siguiente turno disponible cargado
 * 
 * @param {any} ventanilla Ventanilla desde la cual se está solicitando el turno
 * @param {any} tipoTurno Tipo de turno que se desea obtener (prioritario / noPrioritario)
 * @returns Promise
 */
async function getProximoTurno(ventanilla, tipoTurno) {
    return new Promise( (resolve, reject) => {
        
        Turno.findOne({ 'estado': 'activo', tipo: tipoTurno }, (errNuevo, turneroNuevo: any) => {
            if (errNuevo) {
                return reject(errNuevo);
            }
    
            // no hay proximo turno, devolvemos la ventanilla con el turno nulleado
            if (!turneroNuevo) {
                // seteamos la variable de cambio para enviar el SSE
                cambio = {timestamp: (new Date().getMilliseconds()), type: 'default', ventanilla: ventanilla, turno: null};
    
                return resolve(ventanilla);
            }
    
    
            turneroNuevo.set('ultimoNumero', turneroNuevo.get('ultimoNumero') + 1);
    
            // si son iguales y aun esta activo, entonces finalizamos el turno
            if (turneroNuevo.ultimoNumero === turneroNuevo.numeroFin && turneroNuevo.estado === 'activo') {
                turneroNuevo.set('estado', 'finalizado');
            }
    
            turneroNuevo.save((errNuevo, turneroNuevoSave: any) => {
    
                let ultimo: any = {};
                ultimo[turneroNuevoSave.tipo] = {
                    numero: turneroNuevoSave.ultimoNumero,
                    tipo: turneroNuevoSave.tipo,
                    letra: turneroNuevoSave.letraInicio,
                    color: turneroNuevoSave.color,
                    llamado: 1
                }
    
                // seteamos el ultimo turno llamado desde la ventanilla
                ventanilla.set('ultimo', ultimo);
    
                ventanilla.save((err3, data3: any) => {
                    if (err3) {
                        return reject(err3);
                    }
    
                    // armamos el documento a devolver, que tendra la ventanilla
                    // y el turno en un mismo objeto
                    let dto = {
                        ventanilla: data3,
                        turno: turneroNuevo
                    };
    
                    // seteamos la variable de cambio para enviar el SSE
                    cambio = {timestamp: (new Date().getMilliseconds()), type: 'default', ventanilla: data3, turno: turneroNuevo};
    
                    // devolvemos!
                    return resolve(dto);
                });
            });
    
        });
    });
}

export = router;
