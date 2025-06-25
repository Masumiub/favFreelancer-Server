const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000

//https://fav-freelancer-server.vercel.app/

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.upsc470.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});


async function run() {
    try {
        await client.connect();
        const taskCollection = client.db('FavFreelancerDB').collection('tasks');

        console.log('Connected to MongoDB, OK.');

        //Task API 

        //All get tasks
        // app.get('/tasks', async (req, res) => {
        //     const cursor = taskCollection.find();
        //     const result = await cursor.toArray();
        //     res.send(result);
        // })

        app.get('/tasks', async (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 0;
                const sortByDeadline = req.query.sort === 'deadline';

                let cursor = taskCollection.find({});

                if (sortByDeadline) {
                    cursor = cursor.sort({ deadline: 1 });
                }

                if (limit > 0) {
                    cursor = cursor.limit(limit);
                }

                const tasks = await cursor.toArray();
                res.send(tasks);
            } catch (error) {
                res.status(500).send({ message: 'Failed to fetch tasks', error });
            }
        })

        //Get One tasks (tasksDetails/for updating tasks)
        app.get('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await taskCollection.findOne(query);
            res.send(result);
        })

        //Posting Task
        app.post('/tasks', async (req, res) => {
            const newTask = req.body;
            const result = await taskCollection.insertOne(newTask);
            console.log('New Tasked added to DB: ', result);
            res.json(result);
        })

        //delete Task using id
        app.delete('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await taskCollection.deleteOne(query);
            res.send(result);
        })

        //update task using id
        app.put('/tasks/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const options = { upsert: true };

                const updatedTask = req.body;
                const updatedDoc = {
                    $set: updatedTask
                }

                const result = await taskCollection.updateOne(query, updatedDoc, options)
                res.send(result);
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Update failed', error: error.message });
            }
        })

        //patch method to update bids only
        app.patch('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const { bidsCount } = req.body;

            const filter = { _id: new ObjectId(id) };

            const updateDoc = {
                $set: { bidsCount }
            };

            const result = await taskCollection.updateOne(filter, updateDoc);
            res.send(result);
        });



        app.get('/', (req, res) => {
            res.send('FavFreelancer server is running')
        })

        app.listen(port, () => {
            console.log(`FavFreelancer app listening on port ${port}`)
        })
    } catch (err) {
        console.error('MongoDB error:', err);
    }
}
run();

