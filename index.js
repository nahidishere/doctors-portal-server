const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// MiddleWare 
app.use(cors());
app.use(express.json())
function verifyJWT(req,res,next)  {
	const authHeader = req.headers.authorization;
	if(!authHeader) {
		return res.status(401).send({message:"Unauthorized access"});
	}
	const token = authHeader.split(" ")[1];
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
		if(err) {
			res.status(403).send({message:"Forbidden access"})
		}
  		req.decoded = decoded;
  		next()
	});

}

// Mongodb 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0ysp6nw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("doctors_portal").collection("services");
    const bookingCollection = client.db("doctors_portal").collection("bookings");
    const userCollection = client.db("doctors_portal").collection("users");
    // Deal with users 
    app.get("/user",verifyJWT,async(req,res) => {
    	const users = await userCollection.find().toArray();
    	res.send(users);
    })

    app.get("/admin/:email",async(req,res) => {
    	const email = req.params.email;
    	const user = await userCollection.findOne({email:email});
    	const isAdmin = user.role === "admin";
    	res.send({admin:isAdmin})
    })

    app.put("/user/admin/:email",verifyJWT,async(req,res) => {
    	const email = req.params.email;
    	const requester = req.decoded.email;
    	const requesterAccount = await userCollection.findOne({email:requester});
    	if(requesterAccount.role === 'admin') {
    		const filter = {email:email};
    		const updateDoc = {
      			$set: {role: "admin"},
    		};
    		const result = await userCollection.updateOne(filter,updateDoc);
    		return res.send(result);
    	}
    	else {
    		res.status(403).send({message:"Forbidden"})
    	}
    })

    app.put("/user/:email",async(req,res) => {
    	const email = req.params.email;
    	const user = req.body;
    	const filter = {email:email};
    	const options = { upsert: true };
    	const updateDoc = {
      		$set: user,
    	};
    	const result = await userCollection.updateOne(filter,updateDoc,options);
    	const token = jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET)
    	res.send({result,token});
    })
    // Services Api 
    app.get("/services",async(req,res) => {
    	const query = {};
    	const cursor = serviceCollection.find(query);
    	const services = await cursor.toArray();
    	res.send(services);
    });
    // Available bookings
    app.get("/available",async(req,res) => {
    	const date = req.query.date;
    	// All services 
    	const services = await serviceCollection.find().toArray();
    	// Get the booking of the day
    	const query = {date:date};
    	const bookings = await bookingCollection.find(query).toArray();
    	services.forEach(service => {
    		const serviceBookings = bookings.filter(b => b.treatment === service.name);
    		const booked = serviceBookings.map(s => s.slot);
    		const available = service.slots.filter(s => !booked.includes(s))
    		service.slots = available;
    	})
    	res.send(services);
    })
    // User bookings
    app.get("/booking",verifyJWT,async(req,res) => {
    	const patient = req.query.patient;
    	const decoded = req.decoded?.email;
    	if(patient == decoded) {
    		const query = {patient:patient};
    		const bookings = await bookingCollection.find(query).toArray();
    		return res.send(bookings);
    	}
    	else {
    		return res.status(403).send({message:"Forbidden access"})
    	}
    	
    })
    // Post bookings 
    app.post("/booking",async(req,res) => {
    	const booking = req.body;
    	const query = {treatment: booking.treatment,patient: booking.patient,date: booking.date};
    	const exists = await bookingCollection.findOne(query);
    	if(exists) {
    		return res.send({success:false,booking:exists})
    	}
    	const result = await bookingCollection.insertOne(booking);
    	res.send({success:true});
    })
  } finally {

  }
}
run().catch(console.dir);

// Servers 
app.get("/",(req,res) => {
	res.send("Hola! this is Nahid.")
})

// Footer 
app.listen(port,() => {
	console.log("Express is running from port:",port)
})