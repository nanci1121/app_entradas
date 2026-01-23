module.exports = class Externa {
    constructor(id, nombrePersona, empresaExterior, peticionario, telefonoPersona, firma, recepcion,fechaEntrada, fechaSalida, nota, usuario) {
        this.id = id;
        this.nombrePersona = nombrePersona;
        this.empresaExterior = empresaExterior;
        this.peticionario = peticionario;
        this.telefonoPersona = telefonoPersona;
        this.firma = firma;
        this.recepcion = recepcion;
        this.fechaEntrada = fechaEntrada;
        this.nota = nota;
        this.fechaSalida = fechaSalida;
        this.usuario = usuario;
    }

    /**
     * @description Crea un objeto Externa a partir del cuerpo de una solicitud HTTP.
     * Mapea las propiedades de snake_case (p. ej., nombre_persona) a camelCase (p. ej., nombrePersona).
     * @param {object} body - El cuerpo de la solicitud (req.body).
     * @returns {Externa} Una instancia de Externa con los datos mapeados.
     */
    static fromRequest(body) {
        const externa = new Externa();
        externa.nombrePersona = body.nombre_persona || body.nombrePersona;
        externa.empresaExterior = body.empresa_exterior || body.empresaExterior;
        externa.peticionario = body.peticionario;
        externa.telefonoPersona = body.telefono_persona || body.telefonoPersona;
        externa.fechaEntrada = body.fecha_entrada || body.fechaEntrada;
        externa.fechaSalida = body.fecha_entrada2 || body.fecha_salida || body.fechaSalida;
        externa.firma = body.firma;
        externa.nota = body.nota;
        externa.recepcion = body.recepcion;
        return externa;
    }
};