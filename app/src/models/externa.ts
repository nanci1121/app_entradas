export class Externa {
    id?: number;
    nombrePersona: string;
    empresaExterior: string;
    peticionario?: string;
    telefonoPersona?: string;
    firma?: string;
    recepcion?: boolean;
    fechaEntrada: Date;
    fechaSalida?: Date;
    nota?: string;
    usuario?: number;

    constructor(
        id: number,
        nombrePersona: string,
        empresaExterior: string,
        peticionario: string,
        telefonoPersona: string,
        firma: string,
        recepcion: boolean,
        fechaEntrada: Date,
        fechaSalida: Date,
        nota: string,
        usuario: number
    ) {
        this.id = id;
        this.nombrePersona = nombrePersona;
        this.empresaExterior = empresaExterior;
        this.peticionario = peticionario;
        this.telefonoPersona = telefonoPersona;
        this.firma = firma;
        this.recepcion = recepcion;
        this.fechaEntrada = fechaEntrada;
        this.fechaSalida = fechaSalida;
        this.nota = nota;
        this.usuario = usuario;
    }

    /**
     * @description Crea un objeto Externa a partir del cuerpo de una solicitud HTTP.
     * Mapea las propiedades de snake_case a camelCase.
     */
    static fromRequest(body: any): Externa {
        const externa = new Externa(
            body.id || 0,
            body.nombre_persona || body.nombrePersona,
            body.empresa_exterior || body.empresaExterior,
            body.peticionario || '',
            body.telefono_persona || body.telefonoPersona || '',
            body.firma || '',
            body.recepcion || false,
            body.fecha_entrada || body.fechaEntrada,
            body.fecha_entrada2 || body.fechaSalida,
            body.nota || '',
            body.usuario || 0
        );
        return externa;
    }
}

export default Externa;
