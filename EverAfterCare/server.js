/**
 * Importation des modules requis
 */
var express = require("express");
var http = require("http");
var mysql = require("mysql");
var app = express();
var bodyParser = require("body-parser");
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/eac');
const bcrypt = require('bcrypt');

/**
 * Parse all from data
 */
app.use(bodyParser.urlencoded({ extended: true }));

module.exports = app;

/**
 * Pour le formattage des dates
 */
var dateFormat = require("dateformat");
const { debug } = require("console");
const { use } = require("passport");
var now = new Date();

/**
 * Pour activer EJS
 */
app.set("view engine", "ejs");

/**
 * Importation de tous les fichiers JS et CSS en lien pour l'application
 */
app.use("/js", express.static(__dirname + "/node_modules/bootstrap/dist/js"));
app.use("/js", express.static(__dirname + "/node_modules/tether/dist/js"));
app.use("/js", express.static(__dirname + "/node_modules/jquery/dist"));
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));

/**
 * Pour que l'application puisse voir le dossier
 */
app.use(express.static("public"));

/**
 * Pour que l'application puisse accéder aux images
 */
app.use(express.static("images"));

/**
 * Connexion à la base de données "eac"
 */
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "eac",
});

/**
 * Connexion au serveur sur le port 4000
 */
var server = app.listen(4000, function() {
    console.log("serveur fonctionne sur 4000... ! ");
});

/**
 * Constantes pour le titre et l'URL du site
 */
const siteTitle = "EverAfterCare";
const baseURL = "http://localhost:4000/";

/**
 * Pour generer la page d'accueil
 */
app.get("/", function(req, res) {
    con.query("SELECT * FROM client ORDER BY id DESC", function(err, result) {
        res.render("pages/index", {
            siteTitle: siteTitle,
            pageTitle: "Accueil",
            items: result,
        });
    });
});

/**
 * Pour générer la page d'inscription
 */
app.get("/inscription", function(req, res) {
    con.query("SELECT * FROM client ORDER BY id DESC", function(err, result) {
        res.render("pages/inscription.ejs", {
            siteTitle: siteTitle,
            pageTitle: "Inscription",
            items: result,
        });
    });
});

/**
 * Pour générer la page d'inscription
 */
app.post("/inscription", function(req, res) {

    /* var user_exists = db.collection("client").find({ "email": req.body.email })*/

    const userFound = db.collection("client").findOne({ email: req.body.email });
    if (userFound) {

        console.log("Utilisateur existant")

    } else {
        const hashedPassword = bcrypt.hash(req.body.password, 10);

        var myobj = {
            id: getRandomString(3),
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: hashedPassword
        };

        try {
            db.collection("client").insert(myobj);
            res.redirect("/connexion");
        } catch (error) {
            console.log(error);
            res.redirect("/inscription")
        }
    }


});

/**
 * Pour générer la page de connexion
 */
app.get("/connexion", function(req, res) {
    con.query("SELECT * FROM client ORDER BY id DESC", function(err, result) {
        res.render("pages/connection.ejs", {
            siteTitle: siteTitle,
            pageTitle: "Connexion",
            items: result,
        });
    });
});

/**
 * Pour générer la page de connexion des docteurs
 */

/**
 * Pour générer la page apres la connexion d'un client
 */
app.post("/connected", function(req, res) {
    var query = "SELECT * FROM client WHERE ";
    query += "EMAIL = '" + req.body.email + "' AND ";
    query += "PASSWORD = '" + req.body.password + "';";

    con.query(query, function(err, result) {
        if (result.length < 1) {
            console.log("Utilisateur Introuvable");
            res.redirect(baseURL + "connexion");
        } else {
            var query2 =
                "SELECT * FROM rdv r join docteur d on d.id = r.docteur_id WHERE ";
            query2 += "client_id = " + result[0].id + ";";

            con.query(query2, function(err, result2) {
                if (err) {
                    console.log("Aucun Rendez Vous");
                }

                res.render("pages/confirmconnection.ejs", {
                    siteTitle: siteTitle,
                    pageTitle: "Compte",
                    items: result,
                    rdv: result2,
                });
            });
        }
    });
});

/**
 * Pour générer la page apres la connexion des docteurs
 */

/**
 * Pour générer la page apres la connexion des docteurs
 */
app.post("/connectedDoctor", function(req, res) {
    var query = "SELECT * FROM docteur WHERE ";
    query += "EMAIL = '" + req.body.email + "' AND ";
    query += "PASSWORD = '" + req.body.password + "';";

    con.query(query, function(err, result) {
        if (result.length < 1) {
            console.log("Utilisateur Introuvable");
            res.redirect(baseURL + "connexion");
        } else {
            var query2 =
                "SELECT * FROM rdv r join docteur d on d.id = r.docteur_id WHERE ";
            query2 += "client_id = " + result[0].id + ";";

            con.query(query2, function(err, result2) {
                if (err) {
                    console.log("Aucun Rendez Vous");
                }

                res.render("pages/confirmconnection.ejs", {
                    siteTitle: siteTitle,
                    pageTitle: "Compte",
                    items: result,
                    rdv: result2,
                });
            });
        }
    });
});

/**
 * Pour générer la page de services
 */
app.get("/services", (req, res) => {
    res.render("pages/services.ejs", {
        siteTitle: siteTitle,
        pageTitle: "Services",
    });
});

/**
 * Pour modifier les rendez-vous
 */
app.get("/account/edit/:id", function(req, res) {
    con.query(
        "SELECT * FROM client WHERE id = '" + req.params.id + "'",
        function(err, result) {
            res.render("pages/modifierClient.ejs", {
                siteTitle: siteTitle,
                pageTitle: "Modification Compte : " +
                    result[0].last_name +
                    " " +
                    result[0].first_name,
                items: result,
            });
        }
    );
});

/**
 * Pour supprimer un rendez-vous
 */
app.get("/account/delete/:id", function(req, res) {
    con.query(
        "DELETE FROM client WHERE id = '" + req.params.id + "'",
        function(err, result) {
            if (err) throw err;
            res.redirect(baseURL);
        }
    );
});

/**
 * Pour générer un ID aléatoire
 * @param {*} length
 * @returns un nombre aléatoire
 */
function getRandomString(length) {
    var randomChars = "0123456789";
    var result = "";
    for (var i = 0; i < length; i++) {
        result += randomChars.charAt(
            Math.floor(Math.random() * randomChars.length)
        );
    }
    return result;
}

/**
 * Pour modifier les informations personnelles du client
 */
app.post("/account/edit/:id", function(req, res) {
    var query = "UPDATE  client SET";
    query += " first_name = '" + req.body.first_name + "',";
    query += " last_name = '" + req.body.last_name + "',";
    query += " email = '" + req.body.email + "'";
    query += " WHERE id = " + req.body.id + "";

    con.query(query, function(err, result) {
        if (err) throw err;
        res.redirect(baseURL);
    });
});

/**
 * Pour debug l'application - affichage des clients
 */
app.get("/debug", function(req, res) {
    con.query("SELECT * FROM client ORDER BY id DESC", function(err, result) {
        res.render("pages/debug", {
            siteTitle: siteTitle,
            pageTitle: "Liste Client Debug",
            items: result,
        });
    });
});

/**
 * Pour debug l'application - affichage des docteurs
 */
app.get("/debugD", function(req, res) {
    con.query("SELECT * FROM docteur ORDER BY id DESC", function(err, result) {
        res.render("pages/debug", {
            siteTitle: siteTitle,
            pageTitle: "Liste Docteur Debug",
            items: result,
        });
    });
});


/**
 * Pour la rediction a la page de connexion
 */
app.get("/rendezvous", function(req, res) {
    res.redirect(baseURL + "connexion");
});

/**
 * Pour afficher la liste des rdv
 */
app.post("/rendezvous", function(req, res) {
    var id_docteur = "SELECT * FROM docteur;";
    con.query(id_docteur, function(err, result) {
        if (result.length < 1) {
            console.log("0 doctor");
        }
        if (err) throw err;

        console.log(req.body.id + " id client");

        if (req.body.id == undefined) {
            res.redirect(baseURL + "connexion");
        } else {
            res.render("pages/rendezvous", {
                siteTitle: siteTitle,
                pageTitle: "Docteur",
                liste: result,
                clientid: req.body.id,
            });
        }
    });
});

/**
 * Pour envoyer les donnees a la bdd pour les prises de rdv
 */
app.post("/RendezVousConfirmer", function(req, res) {
    /* get the record base on ID
     */
    var query =
        "INSERT INTO rdv (type, client_id, docteur_id, starttime, endtime) VALUES (";
    query += " '" + req.body.type + "',";
    query += req.body.id + ", ";
    query += " '" + req.body.nom_doc + "',";
    var endtime = req.body.time + 30 * 60000;
    var dateend = new Date(req.body.tripstart + " " + endtime);
    var dateObj = new Date(req.body.tripstart + " " + req.body.time);
    console.log(dateObj);
    query += " CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);";
    con.query(query, function(err, result) {
        if (err) throw err;
        res.redirect(baseURL);
    });
});