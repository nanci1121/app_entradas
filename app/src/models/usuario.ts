export class Usuario {
    id: number;
    name: string;
    email: string;
    password: string;
    online: boolean;
    type: string;
    codigo_empleado?: string;

    constructor(
        id: number,
        name: string,
        email: string,
        password: string,
        online: boolean,
        type: string,
        codigo_empleado?: string
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.online = online;
        this.type = type;
        this.codigo_empleado = codigo_empleado;
    }
}

export default Usuario;
