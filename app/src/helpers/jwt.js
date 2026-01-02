const jwt = require('jsonwebtoken');


const generarJWT = (id) => {

    return new Promise((resolve, reject) => {
        const payload = { id };

        jwt.sign(payload, process.env.JWT_KEY, {
            expiresIn: '24h'
        }, (err, token) => {
            if (err) {
                //no se pudo crear el token
                reject('No se pudo generar el JWT');
            } else {
                //tenemos el Token
                resolve(token);
            }
        });
    });


}

const comprobarJWT = (token) => {
    try {
        const {valido, id } = jwt.verify(token, process.env.JWT_KEY); 
        console.log(`id del usuario es : ${id}  `);       
        return [true, id];
    } catch (error) {
        return [false, null];
    }
}


module.exports = {
    generarJWT,
    comprobarJWT
}
