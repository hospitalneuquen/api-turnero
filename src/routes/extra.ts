import * as express from 'express';

let router = express.Router();

router.get('/time', (req, res, next) => {
    res.json(new Date());
});

export = router;
