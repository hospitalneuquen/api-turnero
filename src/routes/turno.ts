import * as express from 'express';
import * as mongoose from 'mongoose';

import { Turno } from '../schemas/turno';
import { Ventanilla } from './../schemas/ventanilla';

var ObjectID = require('mongodb').ObjectID;

let router = express.Router();

router.get('/turnero/:id', (req, res, next) => {
    // verificamos que sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).send('Turno no encontrado');
    }

    Turno.findOne({_id: req.params.id}, (err, data) => {
        if (err) {
            return next(err);
        }

        if (!data) {
            return res.status(404).send('Turno no encontrado');
        }

        res.json(data);
    });
});

router.get('/turnero', (req, res, next) => {
    let query = {
        ...(req.query.tipo) && { 'tipo': req.query.tipo },
        // ...(req.query.noFinalizados) && {'$where' : 'this.ultimoNumero < this.numeroFin'}
        ...(req.query.estado) && { 'estado': req.query.estado },
        estado: { $ne: 'finalizado' }
    }

    Turno.find(query, {}, { createdAt: -1 }, (err, data) => {
        if (err) {
            return next(err);
        }

        res.json(data);
    });
});

router.post('/turnero', async (req, res, next) => {
    try {
        const data = await save(req.body);

        res.json(data);

    } catch (err) { 
        return next(err);
    }
    
    /*
    if (!data) {
        return next(data.err);
    }
    */

    /*
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
    
        // if (req.body.letraFin) {
        //     turno.letraFin = req.body.letraFin.toLowerCase();
        // }
    
        // validaciones
        // const validar = this.validar(turno);
        // if (!validar.valid) {
        //     return res.status(500).send({ status: 500, message: validar.message, type: 'internal' });
        // }
    
        // filtramos las letras que vamos  utilizar
        // if (letraInicio && letraFin) {
        //     letras = LETRAS.filter((letra) => {
        //         return (letra.charCodeAt(0) <= letraFin.charCodeAt(0)) ? letra : null;
        //     });
    
        //     if (letras.length) {
        //         turno.ultimoNumeroFin = (turno.numeroFin - turno.numeroInicio) * letras.length;
        //     }
        // } else {
        //     if (turno.numeroInicio == 0) {
        //         turno.ultimoNumeroFin = turno.numeroFin + 1;
        //     } else {
        //         turno.ultimoNumeroFin = (turno.numeroFin - turno.numeroInicio);
        //     }
        // }
    
        // COMIENZO DEL CALLBACK HELL :D :D :D
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
                //return res.status(500).send({ error: 'Ya existe el turno de este tipo y con esa letra y numeración' });
                return next(new Error('Ya existe el turno de este tipo y con esa letra y numeración'));
            }
    
            turno.save((err, data) => {
                if (err) {
                    return next(err);
                }
    
                res.json(data);
            });
    
        });
        */
});

router.post('/turnero/rollo', async (req, res, next) => {
    //const LETRAS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    const LETRAS = ['a', 'b', 'c', 'd', 'e'];

    let turnos: any[] = [];
    try {
        for (const letra of LETRAS) {
            //let turno: any = new Turno(req.body);
            // recorremos los numeros
            let turno = {
                letraInicio: letra,
                color: req.body.color,
                tipo: req.body.tipo,
                createdAt: new Date(),
                estado: 'activo',
                ultimoNumero: -1,
                numeroInicio: 0,
                numeroFin: 99
            };

            turnos.push(await save(turno));
        }

        return res.json(turnos);
        // if (turnos.length === LETRAS.length) {
        //     res.json(turnos);
        // }
        // await Promise.all(turnos).then(turnos => {
        //     console.log(turnos);
        //     res.json(turnos);
        // }).catch( err => {
        //     console.log(err);
        //     return next(err);
        // });
        

    } catch (err) { 
        return next(err);
    }

        // await Promise.all(turnos).then(turnos => {
        //     console.log(turnos);
        //     res.json(turnos);
        // }).catch( err => {
        //     console.log(err);
        //     return next(err);
        // })
        
        // try {
        //     console.log(data);
            
        //     res.json(data);
    
        // } catch (err) { 
        //     return next(err);
        // }

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
            //return res.status(500).send({ error: 'Ya existe el turno de este tipo y con esa letra y numeración' });
            return next(new Error('Ya existe el turno de este tipo y con esa letra y numeración'));
        }

        turno.save((err, data) => {
            if (err) {
                return next(err);
            }

            res.json(data);
        });
    });
});

/* TODO
router.patch('/turnero/:id', function (req, res, next) {
});
*/

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



/**
 * Guardamos un turno, si no existe lo creamos, si no lo actualizamos
 * 
 * @param {any} Req.body 
 * @returns Turno
 */
async function save(data) {
    let turno: any = new Turno(data);

    turno.estado = (turno.estado) ? turno.estado : 'activo';

    turno.numeroInicio = parseInt(turno.numeroInicio);
    turno.numeroFin = parseInt(turno.numeroFin);
    // to lower
    if (turno.letraInicio) {
        turno.letraInicio = turno.letraInicio.toLowerCase();
    }

    // si no se le ha pasado el ultimo numero, lo inicializamos en -1 
    // y de esta forma sabemos que aun no ha comenzado
    if (!turno.ultimoNumero) {
        turno.ultimoNumero = turno.numeroInicio - 1;
    }

    /*
        // if (req.body.letraFin) {
        //     turno.letraFin = req.body.letraFin.toLowerCase();
        // }

        // validaciones
        // const validar = this.validar(turno);
        // if (!validar.valid) {
        //     return res.status(500).send({ status: 500, message: validar.message, type: 'internal' });
        // }

        // filtramos las letras que vamos  utilizar
        // if (letraInicio && letraFin) {
        //     letras = LETRAS.filter((letra) => {
        //         return (letra.charCodeAt(0) <= letraFin.charCodeAt(0)) ? letra : null;
        //     });

        //     if (letras.length) {
        //         turno.ultimoNumeroFin = (turno.numeroFin - turno.numeroInicio) * letras.length;
        //     }
        // } else {
        //     if (turno.numeroInicio == 0) {
        //         turno.ultimoNumeroFin = turno.numeroFin + 1;
        //     } else {
        //         turno.ultimoNumeroFin = (turno.numeroFin - turno.numeroInicio);
        //     }
        // }
    */
    // COMIENZO DEL CALLBACK HELL :D :D :D
    let conditions = {
        //...(req.params.id) && { _id: { $ne: new ObjectID(req.params.id) } },
        ...(data.id) && { _id: { $ne: new ObjectID(data.id) } },
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


    let existeTurno = await Turno.find(conditions);

    return new Promise( (resolve, reject) => {
      
        if (existeTurno.length) {
            //return next(new Error('Ya existe el turno de este tipo y con esa letra y numeración'));
            return reject(new Error('Ya existe el turno del tipo <b>' + turno.tipo + '</b>, para la letra <b>' + turno.letraInicio.toUpperCase() + '</b> y numeración <b>' + turno.numeroInicio + '/' + turno.numeroFin + '</b>'));
        }

        turno.save((err, data) => {
            if (err) {
                //return next(err);
                return reject (new Error(err));
            }

            return resolve(data);
            //res.json(data);
        });
    });
}

export = router;
