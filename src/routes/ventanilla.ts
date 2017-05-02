import * as express from 'express';
// import { Turnero } from '../models/turnero';
import { Ventanilla } from '../schemas/ventanilla';
// import * as utils from '../../../utils/utils';
// import { defaultLimit, maxLimit } from './../../../config';

let router = express.Router();

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

        if (req.query.nombre) {
            query.where('nombre').equals(RegExp('^' + req.query.nombre + '$', "i"));
        }

        query.exec(function (err, data) {
            if (err) {
                return next(err);
            }
            res.json(data);
        });
    }
});

router.get('/ventanillas', function (req, res, next) {
    Ventanilla.find(function (err, data) {
        if (err) {
            return next(err);
        }
        res.json(data);
    });
});

router.post('/ventanillas', function (req, res, next) {
    let ventanilla = new Ventanilla(req.body);

    ventanilla.save((err) => {
        if (err) {
            return next(err);
        }

        res.json(ventanilla);
    });
});

router.put('/ventanillas/:id', function (req, res, next) {
    Ventanilla.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, data) {
        if (err) {
            return next(err);
        }

        res.json(data);
    });
});

// router.delete('/turnero/:id', function (req, res, next) {
//     Ventanilla.findByIdAndRemove(req.params._id, function (err, data) {
//         if (err) {
//             return next(err);
//         }

//         res.json(data);
//     });
// });

export = router;
