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
    app.get("/services",async(req,res) => {
    	const query = {};
    	const cursor = serviceCollection.find(query);
    	const services = await cursor.toArray();
    	res.send(services)
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