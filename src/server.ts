"use strict";

import * as bodyParser from "body-parser";
import * as express from "express";
import * as path from "path";
import * as mongoose from 'mongoose';
import * as config from './config';
import * as errorHandler from 'errorhandler';
import * as methodOverride from 'method-override';
// import * as requireDir from 'require-dir';

var requireDir = require('require-dir');
var helmet = require('helmet');


// import * as sseExpress from 'sse-express';


// import * as indexRoute from "./routes/index";

/**
 * The server.
 *
 * @class Server
 */
export class Server {

    public app: express.Application;
    public cache: any;

    /**
     * Bootstrap the application.
     *
     * @class Server
     * @method bootstrap
     * @static
     */

    public static bootstrap(): Server {
        return new Server();
    }

    /**
     * Constructor.
     *
     * @class Server
     * @constructor
     */
    constructor() {
        //create expressjs application
        this.app = express();
        // this.cache = cache();

        //configure db
        this.dbConnection();

        //configure application
        this.config();

        //configure routes
        this.routes();

        // middleware errores
        this.error();
    }

    /**
     * Configure application
     *
     * @class Server
     * @method config
     * @return void
     */
    private config() {

        //configure jade
        this.app.set("views", path.join(__dirname, "views"));
        this.app.set("view engine", "jade");

        //mount logger
        //this.app.use(logger("dev"));

        //mount json form parser
        this.app.use(bodyParser.json());

        //mount query string parser
        this.app.use(bodyParser.urlencoded({ extended: true }));

        //add static paths
        // this.app.use(express.static(path.join(__dirname, "public")));
        // this.app.use(express.static(path.join(__dirname, "bower_components")));

        //mount override
        this.app.use(methodOverride());
    
        this.app.all('*', function (req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            res.header('X-Content-Type-Options', 'nosniff');

            // Permitir que el método OPTIONS funcione sin autenticación
            if ('OPTIONS' === req.method) {
                res.sendStatus(200);
            } else {
                next();
            }
        });

        // security
        this.app.use(helmet());

        this.app.disable('x-powered-by');
    }

    /**
     * Configure application
     *
     * @class Server
     * @method dbConnection
     * @return void
     */
    private dbConnection() {
        // Configuración de Mongoose
        mongoose.set('debug', config.debugMode);
        mongoose.connect(config.db);

        mongoose.connection.on('connected', function () {
            console.log('[Mongoose] Conexión OK!');
        });
        mongoose.connection.on('error', function (err) {
            console.log('[Mongoose] No se pudo conectar al servidor');
        });
    }

    /**
     * Configure routes
     *
     * @class Server
     * @method routes
     * @return void
     */
    private routes() {
        //get router
        let router: express.Router;
        router = express.Router();


        let routes = requireDir('./routes/');
        for (var route in routes) {
            this.app.use('/api', routes[route]);
        }

        //use router middleware
        this.app.use(router);
    }

    public error() {
        // catch 404 and forward to error handler
        this.app.use(function (req, res, next) {
            let err: any = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        // Error handler
        this.app.use(function (err: any, req, res, next) {
            if (err) {
                //console.log(this.app.get('env'));
                // IMPORTANTE: Express app.get('env') returns 'development' if NODE_ENV is not defined.
                // O sea, la API está corriendo siempre en modo development

                // Send response
                res.status(err.status || 500);

                res.send({
                    message: err.message,
                    //error: (this.app.get('env') === 'development') ? err : null
                    error: err
                });

                //next(err);
            }
        });


        //error handling
        this.app.use(errorHandler());
    }
}

// let server = Server.bootstrap();
// export = server.app;