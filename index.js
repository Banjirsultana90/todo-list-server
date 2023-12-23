const express = require("express")
const cors = require("cors")
const app = express()
const jwt = require('jsonwebtoken');
require('dotenv').config()
app.use(cors(
    {
        origin: [
            'http://localhost:5173',
           'https://todo-list-project-5716d.web.app/',
          'https://todo-list-project-5716d.firebaseapp.com/'

        ],
        credentials: true
    }
))
app.use(express.json())
const port = process.env.PORT || 5000



const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');

// const uri = "mongodb+srv://todolistUser:MOQD5If9Ip6zj4Ai@cluster0.fjczu0o.mongodb.net/?retryWrites=true&w=majority";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fjczu0o.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    const tasks = client.db('TODO').collection('tasks')
    const alluser = client.db('TODO').collection('alluser')

    const verifyToken = async (req, res, next) => {
        const token = req.cookies?.token
        // console.log('value of token', token)
        if (!token) {
            return res.status(401).send({ message: 'forbidden' })
        }
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).send({ message: 'unauthorized' })
            }
            req.decoded = decoded
            next()
        })
    }

    app.post('/jwt', async (req, res) => {
        const user = req.body
        // console.log('user for token', user);
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            // secure: true,
            // sameSite: 'none'
        })
        res.send({ success: true })
    })
    app.post('/logout', async (req, res) => {
        const user = req.body
        console.log('loging out', user);
        res.clearCookie('token', { maxAge: 0 }).send({ success: true })
    })

    app.post('/tasks', async (req, res) => {
        const formdata = req.body
        console.log(formdata);
        const result = await tasks.insertOne(formdata)
        res.send(result)
    })
    app.get('/tasks', async (req, res) => {
        const allTasks = await tasks.find({}).toArray();
        res.send(allTasks);
    });
    // app.get('/tasks/:email', async (req, res) => {
    //     const query = { email: req.params.email }
    //     console.log(query);
    //     // if (req.params.email !== req.decoded.email) {
    //     //     return req.status(403).send({ message: 'access forbidden' })
    //     // }
    //     const result = await tasks.find(query).toArray()
    //     res.send(result)

    // })
    app.get('/tasks/user/:email', async (req, res) => {
        const query = { email: req.params.email };
        console.log(query);
        const result = await tasks.find(query).toArray();
        res.send(result);
    });
    app.get('/alluser', async (req, res) => {
        const result = await alluser.find().toArray();
        res.send(result);
    });
    app.post('/alluser', async (req, res) => {
        const user = req.body;
        const query = { email: user.email }
        const existinguser = await alluser.findOne(query)
        if (existinguser) {
            return res.send({ message: 'user already exists', insertedId: null })
        }
        const result = await alluser.insertOne(user)
        res.send(result)
    })
    app.get('/tasks/:id', async (req, res) => {

        const id = req.params.id;
        console.log(id);
        const query = {
            _id: new ObjectId(id)
        };
        const result = await tasks.findOne(query);
        res.send(result);
    });
    app.put('/tasks/:id', async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true }
        const updatesurvey = req.body;
        const task = {
            $set: {
                title: updatesurvey.title,
                deadline: updatesurvey.deadline,
                description: updatesurvey.description,
                priority: updatesurvey.priority,

            },
        };

        const result = await tasks
            .updateOne(filter, task, options);
        res.send(result);
    });
    app.delete('/tasks/:id', async (req, res) => {
        const taskId = req.params.id;

        try {
            const result = await tasks.deleteOne({ _id: new ObjectId(taskId) });
            if (result.deletedCount === 1) {
                res.send('Task deleted successfully');
            } else {
                res.status(404).send('Task not found');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            res.status(500).send('Error deleting task');
        }
    });
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get("/", (req, res) => {
    res.send("Todo start....")
})

app.listen(port, () => {
    console.log(`port is running on ${port}`);
})