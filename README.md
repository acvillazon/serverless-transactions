# [Serverless Transactions]

Serverless Transactions, es un servcio nodejs muy sencillo, que simula realizar compras y/o transferncias de dinero. Este pequeño servicio le permite al usuario funciones como recargar dinero en cuenta, enviar dinero a otro usuarios, registrar nuevos usuarios, validar su balance, validar el historico de transacciones entre algunos otros.

El software básicamente cumple con las siguientes tareas.

* Registrar usuarios.
* Iniciar sesión.
* Ver balance
* Recargar dinero en cuenta.
* Realizar compras de productos.
* Transferir dinero a otras cuentas
* Listar las transacciones/recargas/transferencias realizadas

## Construido con 🛠️

* [Nodejs: v14.17.3]
* [Mysql]

### Pre-requisitos 📋

Para poner en marcha el proyecto debemos tener instalado.

```
Nodejs
Serverless
Mysql o en su defecto tener algun servicio de mysql en la nube (gratuito o no)
```

### Ejecución 🔧
Luego de descargar el código fuente.
Lo ideal es crear una base de datos local y conectarse a ella. Gracias a prisma, solo necesitaremos ejecutar el siguiente comando y el se encargará de realizar la migración y posterior creación de nuestras tablas en DB.
```
npx prisma migrate dev --name init
```

Luego y antes de empezar necesitaremos instalar todas las dependencias necesarias para el correcto funcionamiento de nuestras funciones, por lo cual debemos ejecutar el comando 
```
npm install
```

Luego pasaremos a la ejecución, dado que para poder ejecutar funciones lamda necesitaremos una cuenta AWS, lo siguiente será instalar el plugin serverless-offline que basicamente nos ayudara a emular el ambiente AWS en local, de esta manera podremos ejecutar nuestras funciones lamdas y accederlas via http

**Andrés Villazon** - [acvillazon](https://github.com/acvillazon)