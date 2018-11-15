// route query
const sql = (params, query) => {
    return `
    SELECT 
        initcap(prop_addr || ' '  || prop_city || ', '|| prop_state || ', '|| prop_zip5) AS address,
        a.id AS id,
        ts_rank_cd(a.ts, query) AS rank,
        ST_X(geom)::varchar AS lon,
        ST_Y(geom)::varchar AS lat,
        system,
        house,
        node,
        afn_flag
    FROM 
        ${params.table} AS a,
        to_tsquery_partial('${query.address}') AS query
    WHERE 
        ts @@ query
    ORDER BY 
        rank DESC
    -- Optional limit
    ${query.limit ? `LIMIT ${query.limit}` : '' }
    `
  }
  // route schema
  const schema = {
    description: 'Query a table or view.',
    tags: ['api'],
    summary: 'table query',
    params: {
      table: {
        type: 'string',
        description: 'The name of the table or view.'
      }
    },
    querystring: {
    //   columns: {
    //     type: 'string',
    //     description: 'Columns to return.',
    //     // default: '*'
    //   },
      address: {
        type: 'string',
        description: 'Optional filter parameters for a SQL WHERE statement.'
      },
    //   sort: {
    //     type: 'string',
    //     description: 'Optional sort by column(s).'
    //   },
      limit: {
        type: 'integer',
        description: 'Optional limit to the number of output features.'
      }
    }
  }
  // create route
  module.exports = function (fastify, opts, next) {
    fastify.route({
      method: 'GET',
      url: '/fulltextsearch/:table',
      schema: schema,
      handler: function (request, reply) {
        fastify.pg.connect(onConnect)
        function onConnect(err, client, release) {
          if (err) return reply.send({
            "statusCode": 500,
            "error": "Internal Server Error",
            "message": "unable to connect to database server"
          })
          client.query(
            sql(request.params, request.query),
            function onResult(err, result) {
            // console.log(sql(request.params, request.query))
            console.log('request sent to database')
              release()
              reply.send(err || result.rows)
            }
          )
        }
      }
    })
    next()
  }
  
  module.exports.autoPrefix = '/v1'