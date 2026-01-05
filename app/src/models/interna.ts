export class Interna {
    id: number;
    codigoEmpleado: string;
    nombrePersona: string;
    fechaSalida?: Date;
    fechaEntrada?: Date;
    motivo?: string;

    constructor(
        id: number,
        codigoEmpleado: string,
        nombrePersona: string,
        fechaSalida: Date,
        fechaEntrada: Date,
        motivo?: string
    ) {
        this.id = id;
        this.codigoEmpleado = codigoEmpleado;
        this.nombrePersona = nombrePersona;
        this.fechaSalida = fechaSalida;
        this.fechaEntrada = fechaEntrada;
        this.motivo = motivo;
    }
}

export default Interna;
