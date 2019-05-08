'use strict'

const fs = require('fs');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
var TokenVal = require('token-validator');
const port = 3000;


const app = express();
let tokenGlobal = '';

let corsOption = {
    origin:`http://127.0.0.1:${port}`
}

let productos = JSON.parse(fs.readFileSync('producto.json'));
let usuarios = JSON.parse(fs.readFileSync('usuario.json'));

//middlewares
app.use(bodyParser.json());
app.use(cors(corsOption));

//cargar rutas
app.route('/producto')
    .get((req, res) =>{
        if(req.query.marca){
            let marcaFiltro = productos.filter(p => p.marca == req.query.marca);
            res.json(marcaFiltro);
        }else{
            res.json(productos);
        }
    })
    .post((req, res) =>{
        let body = req.body;
        
        req.header({
            'x-auth':'1',
            'x-user':'1'
                  });
        if(body.nombre && body.marca && body.precio && body.descripcion && body.existencia){
            productos.push(body);
            fs.writeFileSync('producto.json', JSON.stringify(productos));
            console.log(JSON.stringify(req.body));
            console.log(req.body.nombre);
            res.status(201).send(body);
            return;
        }

        res.status(400).send({
            error: "Faltan atributos en el Producto"
        })
    })

app.route('/producto/:id')
    .get((req, res) =>{
        let id = req.params.id;
        let producto = productos.find(pro => pro.id == id);
        if(producto){
            res.json(producto);
        }else{
            res.json({ error: "No existe"});
        }
    })
    .patch((req,res)=>{
        let id = req.params.id;
        let body = req.body;
        if(partialUpdateProductos(id,body)){
            res.send();
        } else{
            res.status(400).send({error:"Faltan datos o id incorrecto"})
        }
    })

app.route('/usuario/login')
    .post((req, res) =>{
        
        let body = req.body;

        if(body.password.length >= 6){
            let existeUsuario = usuarios.find(us => us.usuario == body.usuario && us.password == body.password);
            if(existeUsuario){
                let geneToken = '';
                let validToken = '';
                tokenGlobal = crearToken(existeUsuario);
                geneToken = generarToken(tokenGlobal);
                validToken = validarToken(geneToken, tokenGlobal);
                res.header({ 'x-auth':`${geneToken}`});
                console.log("si se valido");
                console.log("validación del token:"+validToken);
                console.log("valicaión del header"+res.header('x-auth'));
                res.status(200).send(body.usuario);                
                
            }else{
                res.json({error: "No existe"});
                res.status(406);
                console.log("no se validó")
            }
        }else{
            res.json({ error: "Contraseña debe ser igual o mayor a 6"});
            res.status(406);
        }
    })

app.route('/usuario/logout')
    .post((req, res) =>{
        let geneToken = '';
        let validToken = '';
        tokenGlobal = crearToken(usuario);
        geneToken = generarToken(tokenGlobal);
        validToken = validarToken(geneToken, tokenGlobal);

        if(!validToken){
            tokenGlobal = '';         
            req.header({
                    'x-auth':'',
                    'x-user':''
            });
            res.status(200);
        }else{
            console.log("sigue logueado");
        }
       
    })

app.listen(port, () => console.log(`Example app listening on port http:/127.0.0.1:${port}!`))

function partialUpdateProductos(id, producto){
    let pos = productos.findIndex(al => al.id == id);
    
    productos[pos].id = producto.id; 
    productos[pos].nombre = (producto.nombre)? producto.nombre: productos[pos].nombre;    
    productos[pos].marca = (producto.marca)? producto.marca: productos[pos].marca;
    productos[pos].precio = (producto.precio)? producto.precio: productos[pos].precio;
    productos[pos].existencia = (producto.existencia)? producto.existencia: productos[pos].existencia;
    productos[pos].descripcion = (producto.descripcion)? producto.descripcion: productos[pos].descripcion;

    Object.assign(productos[pos],producto);
    fs.writeFileSync('producto.json', JSON.stringify(productos));
    return true;
 
}

function crearToken(usuario){
    var llaveSecreta = 'este usuario es'+usuario.nombre; 
    var duracion = 300  * 1000; // in ms
    var tamaño = 10; // the hash length
    var tokenVal = new TokenVal(llaveSecreta, duracion, tamaño);
    return tokenVal;
}
function generarToken(tokenFinal){
    
    var token = tokenFinal.generate(Date.now(), 'you cannot change this without invalidating the token');
    console.log("El token generado es:"+token);
    return token;
    
}

function validarToken(token,tokenFinal){

    var isValid = tokenFinal.verify(Date.now(), 'you cannot change this without invalidating the token', token);
    return isValid;
}