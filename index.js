const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');
const JWTSecret = "7Aqqc&W3C!DAdnD2d@pGPX2Lw$mCEWUOqz"   //chave global
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());

function auth(req, res, next){
    const authToken = req.headers['authorization'];

    if(authToken != undefined){

        const bearer = authToken.split(' ');
        var token = bearer[1];

        jwt.verify(token,JWTSecret,(err, data) => {
            if(err){
                res.status(401);
                res.json({err:"Token inválido!"});
            }else{
                req.token = token;  //variavei que podem ser acessadas pela rota autenticada
                req.loggedUser = {id: data.id, email: data.email};                
                next();
            }
        });
    }else{
        res.status(401);
        res.json({err:"Token inválido!"});
    } 
}

var DB = {
    games: [
        {
            id: 1,
            title: "Call of duty MW"
        },
        {
            id: 2,
            title: "Sea of thieves"
        },
        {
            id: 3,
            title: "Minecraft",
        }
    ],

    users: [
        {
            id: 1,
            name: "WIllian",
            email: "willian@gmail.com",
            password: "NODE2021"
        },
        {
            id: 2,
            name: "João",
            email: "joao@gmail.com",
            password: "java123"
        }
    ]
}

app.get("/games", auth, (req, res) => {
    var HATEOAS = [
        {
            href: "http://localhost:9090/game/0",
            method: "DELETE",
            rel: "delete_game"
        },
        {
            href: "http://localhost:9090/game/0",
            method: "GET",
            rel: "get_game"
        },
        {
            href: "http://localhost:9090/game/0",
            method: "PUT",
            rel: "edit_game"
        },
        {
            href: "http://localhost:9090/auth",
            method: "POST",
            rel: "login"
        }
    ]

    res.statusCode = 200;
    res.json({games:DB.games, _links: HATEOAS});
});

app.get("/game/:id", auth, (req, res) => {
    if(isNaN(req.params.id)){
        res.sendStatus(400);
    }else{
        
        var id = parseInt(req.params.id);
        var HATEOAS = [
            {
                href: "http://localhost:9090/game/"+id,
                method: "DELETE",
                rel: "delete_game"
            },
            {
                href: "http://localhost:9090/game/"+id,
                method: "GET",
                rel: "get_game"
            },
            {
                href: "http://localhost:9090/game/"+id,
                method: "PUT",
                rel: "edit_game"
            },
            {
                href: "http://localhost:9090/games",
                method: "get",
                rel: "get_all_games"
            }
        ]

        var game = DB.games.find(g => g.id == id);

        if(game == undefined){
            res.sendStatus(404);
        }else{
            res.statusCode = 200;
            res.json({game: game, _links: HATEOAS});
        }
    }
});

app.post("/game", auth, (req, res) => { 
    var {title} = req.body;
    DB.games.push({
        id: 4,
        title
    });
    res.sendStatus(200);
})

app.delete("/game/:id", auth, (req, res) => {
    if(isNaN(req.params.id)){
        res.sendStatus(400);
    }else{
        var id = parseInt(req.params.id);
        var index = DB.games.findIndex(g => g.id == id);

        if(index == -1){
            res.sendStatus(404);
        }else{
            DB.games.splice(index,1);
            res.sendStatus(200);
        }
    }
});

app.put("/game/:id", auth, (req, res) => {

    if(isNaN(req.params.id)){
        res.sendStatus(400);
    }else{
        
        var id = parseInt(req.params.id);

        var game = DB.games.find(g => g.id == id);

        if(game != undefined){

            var {title} = req.body;

            
            if(title != undefined){
                game.title = title;
            }
            res.sendStatus(200);

        }else{
            res.sendStatus(404);
        }
    }

});

app.post("/auth",(req, res) => {

    var {email, password} = req.body;

    if(email != undefined){

        var user = DB.users.find(u => u.email == email);    //verifica se o email existe no banco

        if(user != undefined){    //se o usuário existir
            if(user.password == password){     //compara as senhas
                jwt.sign({id: user.id, email: user.email},JWTSecret,{expiresIn:'12h'},(err, token) => {
                    if(err){
                        res.status(400);
                        res.json({err:"Falha interna"});
                    }else{
                        res.status(200);
                        res.json({token: token});
                    }
                })
            }else{
                res.status(401); //autenticação necessária
                res.json({err: "Credenciais inválidas!"});
            }
        }else{
            res.status(404);  //o servidor não encontrou nenhum recurso
            res.json({err: "O E-mail enviado não existe na base de dados!"});
        }

    }else{
        res.status(400);  //sintaxe inválida na requisição
        res.send({err: "O E-mail enviado é inválido"});
    }
});

app.listen(9090,() => {
    console.log("API RODANDO!");
});