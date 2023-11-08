const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kqcyimm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middlewares

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log('Token in middleware:', token);

  // if no token is available
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized Access' });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.send({ message: 'Unauthorized Access' });
    }
    req.user = decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const foodCollection = client.db('foodDonate').collection('foods');
    const foodRequestCollection = client.db('foodDonate').collection('foodRequests');


    // auth related API
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log('Token for user:', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });


      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
        .send({ success: true });
    })

    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('Logging Out', user);
      res.clearCookie('token', { maxAge: 0 })
        .send({ success: true })
    })


    // food related API

    app.get('/foods', async(req, res) =>{
      const cursor = foodCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/foods/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await foodCollection.findOne(query);
      res.send(result);
    })

    app.post('/foods', async(req, res) =>{
      const food = req.body;
      console.log(food);
      const result = await foodCollection.insertOne(food);
      res.send(result);
    })


    // food request API
    app.post('/foodRequests', async(req, res) =>{
      const foodRequest = req.body;
      console.log(foodRequest);
      const result = await foodRequestCollection.insertOne(foodRequest);
      res.send(result);
    })












    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('P2P server is running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
