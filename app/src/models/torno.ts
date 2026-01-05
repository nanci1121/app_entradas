export class Torno {
    id: number;
    codigoEmpleado: string;
    nombrePersona: string;
    fechaSalida?: Date;
    fechaEntrada?: Date;

    constructor(
        id: number,
        codigoEmpleado: string,
        nombrePersona: string,
        fechaSalida: Date,
        fechaEntrada: Date
    ) {
        this.id = id;
        this.codigoEmpleado = codigoEmpleado;
        this.nombrePersona = nombrePersona;
        this.fechaSalida = fechaSalida;
        this.fechaEntrada = fechaEntrada;
    }
}

export default Torno;
