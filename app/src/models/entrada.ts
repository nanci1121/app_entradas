export class Entrada {
    id: number;
    nombreConductor: string;
    empresa: string;
    matricula: string;
    claseCarga?: string;
    fechaEntrada: Date;
    firma: string;
    fechaSalida?: Date;
    recepcio?: boolean;
    vigilancia?: boolean;
    usuario?: number;

    constructor(
        id: number,
        nombreConductor: string,
        empresa: string,
        matricula: string,
        claseCarga: string,
        fechaEntrada: Date,
        firma: string,
        fechaSalida?: Date,
        recepcio?: boolean,
        vigilancia?: boolean,
        usuario?: number
    ) {
        this.id = id;
        this.nombreConductor = nombreConductor;
        this.empresa = empresa;
        this.matricula = matricula;
        this.claseCarga = claseCarga;
        this.fechaEntrada = fechaEntrada;
        this.firma = firma;
        this.fechaSalida = fechaSalida;
        this.recepcio = recepcio;
        this.vigilancia = vigilancia;
        this.usuario = usuario;
    }
}

export default Entrada;
