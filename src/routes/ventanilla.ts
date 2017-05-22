import * as express from 'express';
import { Ventanilla } from '../schemas/ventanilla';
import * as mongoose from 'mongoose';

let router = express.Router();

// variable para anunciar cambios desde el servidor
let cambio: any = (new Date().getMilliseconds());

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
        let query;
        query = Ventanilla.find();

        if (req.query.numero) {
            query.where('numero').equals(req.query.numero);
        }

        query.exec(function (err, data) {
            if (err) {
                return next(err);
            }
            res.json(data);
        });
    }
});

// Get all
router.get('/ventanillas', function (req, res, next) {
    Ventanilla.find(function (err, data) {
        if (err) {
            return next(err);
        }
        res.json(data);
    });
});

// Insert
router.post('/ventanillas', function (req, res, next) {

    let insertVentanilla = new Ventanilla(req.body);

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
