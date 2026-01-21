import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

const swaggerOptions: Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Servidor App Entradas',
            version: '1.0.0',
            description: 'API para gestión de entradas y salidas de vehículos, personal y empresas externas',
            contact: {
                name: 'Soporte',
                email: 'soporte@example.com'
            }
        },
        servers: [
            {
                url: 'http://10.192.93.0:7302',
                description: 'Servidor de Desarrollo (10.192.93.0)'
            },
            {
                url: 'http://10.192.92.12:7202',
                description: 'Servidor de Producción (10.192.92.12)'
            },
            {
                url: 'http://localhost:7302',
                description: 'Localhost (si estás en el servidor)'
            }
        ],
        components: {
            securitySchemes: {
                xTokenAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-token',
                    description: 'JWT emitido por /api/login en header x-token'
                }
            },
            schemas: {
                Usuario: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Juan Pérez' },
                        email: { type: 'string', format: 'email', example: 'juan@example.com' },
                        online: { type: 'boolean', example: false },
                        type: { type: 'string', example: 'A' },
                        codigo_empleado: { type: 'string', example: '1234' },
                        date_creation: { type: 'string', format: 'date-time' }
                    }
                },
                Login: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'juan@example.com' },
                        password: { type: 'string', format: 'password', example: 'password123' }
                    }
                },
                EntradaVehiculo: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        empresa: { type: 'string', example: 'Transportes SA' },
                        nombre_conductor: { type: 'string', example: 'Pedro García' },
                        matricula: { type: 'string', example: 'ABC-1234' },
                        clase_carga: { type: 'string', example: 'Material de construcción' },
                        recepcion: { type: 'boolean', example: false },
                        vigilancia: { type: 'boolean', example: false },
                        firma: {
                            type: 'string',
                            description: 'Firma del conductor en formato base64',
                            example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
                        },
                        fecha_entrada: { type: 'string', format: 'date-time' },
                        fecha_salida: { type: 'string', format: 'date-time', nullable: true },
                        fecha_creacion: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Fecha de creación del registro'
                        }
                    }
                },
                EmpresaExterior: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        nombre_persona: { type: 'string', example: 'Ana López' },
                        empresa_exterior: { type: 'string', example: 'Consultores XYZ' },
                        peticionario: { type: 'string', example: 'Dept. RRHH' },
                        telefono_persona: { type: 'string', example: '600123456' },
                        nota: { type: 'string', example: 'Reunión programada' },
                        recepcion: { type: 'boolean', example: true },
                        fecha_entrada: { type: 'string', format: 'date-time' },
                        fecha_salida: { type: 'string', format: 'date-time' }
                    }
                },
                SalidaEmpleado: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        codigo_empleado: { type: 'string', example: '1234' },
                        nombre_persona: { type: 'string', example: 'María Rodríguez' },
                        motivo: { type: 'string', example: 'Cita médica' },
                        fecha_salida: { type: 'string', format: 'date-time' },
                        fecha_entrada: { type: 'string', format: 'date-time' }
                    }
                },
                SalidaTorno: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        codigo_empleado: { type: 'string', example: '1234' },
                        fecha_entrada: { type: 'string', format: 'date-time' },
                        fecha_salida: { type: 'string', format: 'date-time' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        ok: { type: 'boolean', example: false },
                        mensaje: { type: 'string', example: 'Descripción del error' },
                        msg: { type: 'string', example: 'Error en la operación' }
                    }
                }
            }
        },
        security: [
            {
                xTokenAuth: []
            }
        ]
    },
    apis: [
        `${__dirname}/../routes/*.ts`,
        `${__dirname}/../routes/*.js`,
        `${__dirname}/../controladores/*.ts`,
        `${__dirname}/../controladores/*.js`
    ]
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
