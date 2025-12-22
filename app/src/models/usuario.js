


module.exports = class Usuario {
    constructor(id, name, email, password, online, type, codigo_empleado) {
        this.id = id,
            this.name = name,
            this.email = email,
            this.password = password,
            this.online = online,
            this.type = type,
            this.codigo_empleado = codigo_empleado
    }
};

