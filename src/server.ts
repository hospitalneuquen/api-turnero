"use strict";

import * as bodyParser from "body-parser";
import * as express from "express";
import * as path from "path";
import * as mongoose from 'mongoose';
import * as config from './config';
import * as errorHandler from 'errorhandler';
import * as methodOverride from 'method-override';
import * as requireDir from 'require-dir';


// import * as sseExpress from 'sse-express';


// import * as indexRoute from "./routes/index";

/**
 * The server.
 *
 * @class Server
 */
export class Server {

  public app: express.Application;

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

    //configure db
    this.dbConnection();

    //configure application
    this.config();

    //configure routes
    this.routes();



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

    //error handling
    this.app.use(errorHandler());



    this.app.all('*', function (req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

      // Permitir que el método OPTIONS funcione sin autenticación
      if ('OPTIONS' === req.method) {
        res.send(200);
      } else {
        next();
      }
    });



    // // catch 404 and forward to error handler
    // this.app.use(function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
    //   var error = new Error("Not Found");
    //   err.status = 404;
    //   next(err);
    // });
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
      console.log('[Mongoose] Conexión OK');
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

    //create routes
    // var index: indexRoute.Index = new indexRoute.Index();

    //home page
    // router.get("/", index.index.bind(index.index));
    // router.get("/",  function (req, res, next) {
    //   res.send("Hello");
    // });

    let routes = requireDir('./routes/');
    for (var route in routes) {
      this.app.use('/api', routes[route]);
    }
    console.log(routes);
    //use router middleware
    this.app.use(router);
  }
}

// let server = Server.bootstrap();
// export = server.app;