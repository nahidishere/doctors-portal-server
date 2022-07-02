const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// MiddleWare 
app.use(cors());
app.use(express.json())

// Mongodb 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0ysp6nw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("doctors_portal").collection("services");
    const bookingCollection = client.db("doctors_portal").collection("bookings");
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
    app.get("/booking",async(req,res) => {
    	const patient = req.query.patient;
    	const query = {patient:patient};
    	const bookings = await bookingCollection.find(query).toArray();
    	res.send(bookings);
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