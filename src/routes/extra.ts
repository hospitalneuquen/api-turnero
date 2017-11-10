import * as express from 'express';

let router = express.Router();

const locale = 'es-ES';
const timeZone = 'America/Argentina/Buenos_Aires';

router.get('/time', (req, res, next) => {
    const date = new Date().toLocaleString('locale', {timeZone: timeZone});

    res.json(date);
});

export = router;
