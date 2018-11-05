// route query
const sql = (params, body) => {
    var geomstring = JSON.stringify(body.geom)
    // console.log(geom)
    return `
    INSERT INTO 
    ${params.table} (name, geom) 
    VALUES('${body.name}', ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON('${geomstring}'),4326)))
    RETURNING id, name
    `;


}

// route schema
const schema = {
    description: 'Query a table or view.',
    tags: ['api'],
    summary: 'table query',
    params: {
        table: {
            type: 'string',
            description: 'The name of the table or view.',
            default: 'mypolygons'
        }
    },
    // querystring: {
    //     name: { type: 'string' },
    //     excitement: { type: 'integer' }
    //   },
    body: {
        type: 'object',
        description: 'Columns to insert.',
        properties: {
            name: {
                type: 'string',
                minLength: 3
            },
            geom: {
                type: 'object'
            },
        },
        // required: ['name']
    },
    // response: {
    //     '200': {
    //       type: 'object',
    //       properties: {
    //         rows: { type: 'string' }
    //       }
    //     },
    //   }
};

// create route
module.exports = function (fastify, opts, next) {

    fastify.route({
        method: 'POST',
        url: '/insertpolygon/:table',
        attachValidation: true,
        schema: schema,
        handler: function (request, reply) {
            // console.log(request.body)
            fastify.pg.connect(onConnect);


            function onConnect(err, client, release) {
                if (err) return reply.send({
                    "statusCode": 500,
                    "error": "Internal Server Error",
                    "message": "unable to connect to database server"
                });

                client.query(
                    sql(request.params, request.body),
                    function onResult(err, result) {
                        if (request.validation) {
                            // `req.validationError.validation` contains the raw validation error
                            reply.code(400).send(req.validationError)
                            console.log(err.detail)
                        }
                        console.log(request.params, request.body)
                        release()
                        reply.send(err || result)
                    });

            }

        }
    });
    next();
};

module.exports.autoPrefix = '/v1';