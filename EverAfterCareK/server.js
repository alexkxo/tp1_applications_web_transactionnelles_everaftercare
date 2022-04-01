/**
 * Initialisation des modules
 */
const titreSite = "EverAfterCare";
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const moment = require("moment");
currentlyConnectedUser = null;
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const User = require("./models/client");
const Docteur = require("./models/docteur");
const Rdv = require("./models/rdv");
const methodOverride = require("method-override");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const {
	checkAuthenticated,
	checkNotAuthenticated,
} = require("./middlewares/auth");
const initializePassport = require("./passport-config");
initializePassport(
	passport,
	async (email) => {
		var userFound = await User.findOne({ email });
		console.log("Ici%");
		if(userFound){
			return userFound;
		}else{
			
		var userFound = await Docteur.findOne({ email });
		return userFound;
		}
		
	},
	async (id) => {
		const userFound = await User.findOne({ _id: id });
		return userFound;
	}
);

// pour activer le module ejs
app.set("view engine", "ejs");

// pour permettre le parsing des URLs
app.use(express.urlencoded({ extended: true }));

// pour l'acces au dossier "public"
app.use(express.static("public"));

// pour l'acces au dossier "images"
app.use(express.static("images"));

// pour activer le module express-flash
app.use(flash());

// pour activer le module session
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: true,
		saveUnitialized: true,
	})
);

// pour utiliser la fonction intialize() dans passport
app.use(passport.initialize());

// pour activer session du passport
app.use(passport.session());

app.use(methodOverride("_method"));

// pour charger la page d'accueil
app.get("/", (req, res) => {
	res.render("index", {
		titrePage: "Accueil",
		titreSite: titreSite,
	});
});

// pour charger la page de connexion
app.get("/connexion", checkNotAuthenticated, (req, res) => {
	res.render("connexion", {
		titrePage: "Connexion",
		titreSite: titreSite,
	});
	if(checkNotAuthenticated){
		currentlyConnectedUser = null;
	}
});

// pour charger la page d'inscription
app.get("/inscription", checkNotAuthenticated, (req, res) => {
	res.render("inscription", {
		titrePage: "Inscription",
		titreSite: titreSite,
	});
});


app.get("/rendezvous", checkAuthenticated, (req, res) => {


		
	
	
		Docteur.find({}, function(err, users) {
			res.render("rendezvous", {
				titrePage: "Prise de Rendez-Vous",
				titreSite: titreSite,
				ListDocteur : users,
			});
		console.log(currentlyConnectedUser.isDocteur);
	
});
});


app.post("/rendezvous", checkAuthenticated, async (req, res) => {
		d_id = req.body.nom_doc;
		const userFound = await Docteur.findOne({ _id : d_id});

		var canschedule = true;
		if(userFound){



		var startdate = req.body.tripstart;
		var time = req.body.time;


		
		var currentrdvtime = time;
		var array2 = currentrdvtime.split(":");
		var currentrdvseconds = (parseInt(array2[0], 10) * 60 * 60) + (parseInt(array2[1], 10) * 60)
		
		Rdv.find({date : startdate}, function(err, Rendezvous) {
			

			Rendezvous.forEach(rvd => {
				var thisrdvtime = rvd.heure;
				var array = thisrdvtime.split(":");
				var thisrdvseconds = (parseInt(array[0], 10) * 60 * 60) + (parseInt(array[1], 10) * 60)
				
				
				if(thisrdvseconds - currentrdvseconds > -3600 && thisrdvseconds - currentrdvseconds < 3600){
					
					canschedule = false;
					}
					
			console.log(canschedule);
			});



		});
		console.log(canschedule);
		if(canschedule === true){
			console.log(canschedule);
			try {
				const rdv = new Rdv({
					docteur_id : d_id,
					client_id : currentlyConnectedUser._id,
					type : req.body.type,
					date : startdate,
					heure : time
				});
	
				await rdv.save();

				console.log("RDV with docteur : " + userFound.first_name + " " + userFound.last_name + " | Client : " + currentlyConnectedUser.first_name + " " +  currentlyConnectedUser.last_name);
			
	
				res.redirect("/");
			} catch (error) {
				console.log(error);
				res.redirect("/rendezvous");
			}
		}

	

		/*	
			*/
		
		}

});

// pour verifier la connexion
/*
app.post(
	"/connexion",
	checkNotAuthenticated,
	passport.authenticate("local", {
		successRedirect: "/profil",
		failureRedirect: "/connexion",
		failureFlash: true,



	})



);
*/
app.post("/connexion", StoreUser, checkNotAuthenticated, 
passport.authenticate("local", {
	successRedirect: "/profil",
	failureRedirect: "/connexion",
	failureFlash: true,
}), async (req, res) => {
	

	

	
	
	
});

app.post("/connexiond", StoreUser, checkNotAuthenticated, 
passport.authenticate("local", {
	successRedirect: "/profil",
	failureRedirect: "/connexion",
	failureFlash: true,
}), async (req, res) => {
	

	

	
	
	
});

async function StoreUser(req, res, next) {
	var userFound = await User.findOne({ email: req.body.email});

	if (userFound) {
		currentlyConnectedUser = userFound;
		currentlyConnectedUser.isDocteur = false;
	} else {
	console.log("Lol t'existe pas en tant que client");
	}

	userFound = await Docteur.findOne({ email: req.body.email});

	if (userFound) {
		currentlyConnectedUser = userFound;
		currentlyConnectedUser.isDocteur = true;
	} else {
	console.log("Lol t'existe pas en tant que docteur");
	}

	
	next();
	
}

// pour faire l'inscription
app.post("/inscription", checkNotAuthenticated, async (req, res) => {
	var userFound = await User.findOne({ email: req.body.email });
	if(!userFound){
		userFound = await Docteur.findOne({email: req.body.email});
	}

	if (userFound) {
		req.flash(
			"error",
			"Il existe déjà un utilisateur avec cette adresse courriel."
		);
		res.redirect("/inscription");
	} else {
		try {
			const hashedPassword = await bcrypt.hash(req.body.password, 10);
			const user = new User({
				first_name: req.body.firstname,
				last_name: req.body.lastname,
				email: req.body.email,
				password: hashedPassword,
			});

			await user.save();
			res.redirect("/connexion");
		} catch (error) {
			console.log(error);
			res.redirect("/inscription");
		}
	}
});

// pour se deconnecter
app.delete("/deconnexion", (req, res) => {
	currentlyConnectedUser = null;
	req.logOut();
	res.redirect("/connexion");
});

// pour charger le profil de l'utilisateur apres une connexion reussie
app.get("/profil/", checkAuthenticated, (req, res) => {


	//const userFound = await User.findOne({ email });
	
	res.render("profil", {
		titrePage: "Votre profil",
		titreSite: titreSite,
		name: currentlyConnectedUser.first_name + " " + currentlyConnectedUser.last_name,
	});
});

// Connexion à MongoDB
mongoose
	.connect("mongodb://127.0.0.1:27017/eac", {
		useUnifiedTopology: true,
		useNewUrlParser: true,
	})
	.then(() => {
		app.listen(3000, () => {
			console.log("listening on port 3000");
		});
	});
